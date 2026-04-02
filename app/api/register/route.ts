import { Redis } from "@upstash/redis";
import { google } from "googleapis";
import { NextResponse } from "next/server";

import {
  fetchRegistrationMetadata,
  getRegistrationMetadataUrl,
} from "@/lib/registration-metadata";
import { checkRateLimit } from "@/lib/rate-limit";
import { normalizeIgn } from "@/lib/utils";
import { validateRegistrationPayload } from "@/lib/validation";
import type {
  ApiErrorPayload,
  PlayerRecord,
  RegistrationPayload,
  RegistrationSuccess,
} from "@/lib/types";

const REGISTERED_IGNS_KEY = "pogo_registered_igns";
const QUEUE_KEY = "pogo_registration_queue";
const PROCESSING_QUEUE_KEY = "pogo_queue_processing";
const LAST_SHEET_SYNC_KEY = "last_sheet_sync";
const SYNC_LOCK_KEY = "sync_lock";
const SYNC_LOCK_TTL_SECONDS = 15;
const QUEUE_FLUSH_THRESHOLD = 50;
const TIME_FLUSH_THRESHOLD_MS = 5 * 60 * 1000;
const GOOGLE_SHEETS_APPEND_TIMEOUT_MS = 8_000;

const redis = Redis.fromEnv();
type NonEmptyStringTuple = [string, ...string[]];

function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() ?? "unknown";
  }

  return request.headers.get("x-real-ip") ?? "unknown";
}

function getSheetsClient() {
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!clientEmail || !privateKey) {
    throw new Error("Google service account credentials are missing.");
  }

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  return google.sheets({ version: "v4", auth });
}

function getSheetId(): string {
  const sheetId = process.env.GOOGLE_SHEET_ID;
  if (!sheetId) {
    throw new Error("GOOGLE_SHEET_ID is missing.");
  }

  return sheetId;
}

async function appendRowsToGoogleSheets(rows: string[][]): Promise<void> {
  const sheets = getSheetsClient();
  const controller = new AbortController();
  const timeoutId = globalThis.setTimeout(() => {
    controller.abort(
      new Error(
        `Google Sheets append timed out after ${GOOGLE_SHEETS_APPEND_TIMEOUT_MS}ms.`,
      ),
    );
  }, GOOGLE_SHEETS_APPEND_TIMEOUT_MS);

  try {
    await (sheets.spreadsheets.values.append as (...args: any[]) => Promise<unknown>)(
      {
        spreadsheetId: getSheetId(),
        range: "A:G",
        valueInputOption: "RAW",
        requestBody: {
          values: rows,
        },
      },
      {
        signal: controller.signal,
      },
    );
  } catch (error) {
    if (controller.signal.aborted) {
      throw new Error(
        `Google Sheets append timed out after ${GOOGLE_SHEETS_APPEND_TIMEOUT_MS}ms.`,
        { cause: error },
      );
    }

    throw error;
  } finally {
    globalThis.clearTimeout(timeoutId);
  }
}

function buildSheetRow(record: PlayerRecord): string[] {
  return [
    record.ign,
    record.friendCode,
    record.contactLink,
    record.contactMethod,
    record.contactKind,
    record.tags.join(","),
    record.createdAt ?? new Date().toISOString(),
  ];
}

function getNormalizedIgn(record: PlayerRecord): string {
  return normalizeIgn(record.ign);
}

function parseQueuedRecord(item: unknown): PlayerRecord {
  if (typeof item === "string") {
    return JSON.parse(item) as PlayerRecord;
  }

  if (item && typeof item === "object") {
    return item as PlayerRecord;
  }

  throw new Error("Invalid queued record payload.");
}

function toNonEmptyStringTuple(values: string[]): NonEmptyStringTuple | null {
  if (values.length === 0) {
    return null;
  }

  const [first, ...rest] = values;
  return [first, ...rest];
}

async function requeueProcessingItems(items: string[]): Promise<void> {
  if (items.length === 0) {
    return;
  }

  // LPUSH with reversed items preserves the original FIFO order in the queue.
  const tuple = toNonEmptyStringTuple([...items].reverse());
  if (!tuple) {
    return;
  }

  await redis.lpush(QUEUE_KEY, ...tuple);
}

async function recoverStaleProcessingQueue(): Promise<void> {
  const staleItems =
    (await redis.lrange<string | PlayerRecord>(PROCESSING_QUEUE_KEY, 0, -1)) ??
    [];

  if (staleItems.length === 0) {
    await redis.del(PROCESSING_QUEUE_KEY);
    return;
  }

  await requeueProcessingItems(
    staleItems.map((item) =>
      typeof item === "string" ? item : JSON.stringify(item),
    ),
  );
  await redis.del(PROCESSING_QUEUE_KEY);
}

async function flushQueueToGoogleSheets(): Promise<boolean> {
  await recoverStaleProcessingQueue();

  const renamed = await attemptAtomicQueueHandoff();
  if (!renamed) {
    return false;
  }

  let processingItems: Array<string | PlayerRecord> = [];

  try {
    processingItems =
      (await redis.lrange<string | PlayerRecord>(
        PROCESSING_QUEUE_KEY,
        0,
        -1,
      )) ?? [];

    if (processingItems.length === 0) {
      await Promise.all([
        redis.del(PROCESSING_QUEUE_KEY),
        redis.set(LAST_SHEET_SYNC_KEY, Date.now()),
      ]);
      return false;
    }

    const queuedRecords = processingItems.map(parseQueuedRecord);

    const seenInBatch = new Set<string>();
    const uniqueRecords = queuedRecords.filter((record) => {
      const normalizedIgn = getNormalizedIgn(record);
      if (seenInBatch.has(normalizedIgn)) {
        return false;
      }

      seenInBatch.add(normalizedIgn);
      return true;
    });

    const uniqueRows = uniqueRecords.map(buildSheetRow);

    if (uniqueRows.length > 0) {
      await appendRowsToGoogleSheets(uniqueRows);
    }

    await Promise.all([
      redis.del(PROCESSING_QUEUE_KEY),
      redis.set(LAST_SHEET_SYNC_KEY, Date.now()),
    ]);
    return true;
  } catch (error) {
    if (processingItems.length === 0) {
      processingItems =
        (await redis.lrange<string | PlayerRecord>(
          PROCESSING_QUEUE_KEY,
          0,
          -1,
        )) ?? [];
    }

    await requeueProcessingItems(
      processingItems.map((item) =>
        typeof item === "string" ? item : JSON.stringify(item),
      ),
    );
    console.error("Lazy batch Google Sheets flush failed", error);
    return false;
  }
}

async function attemptAtomicQueueHandoff(): Promise<boolean> {
  try {
    await redis.rename(QUEUE_KEY, PROCESSING_QUEUE_KEY);
    return true;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  let payload: RegistrationPayload;

  try {
    payload = (await request.json()) as RegistrationPayload;
  } catch {
    return NextResponse.json<ApiErrorPayload>(
      { error: "Invalid JSON payload." },
      { status: 400 },
    );
  }

  if (payload.honeypot) {
    return NextResponse.json<ApiErrorPayload>(
      { error: "Bad Request" },
      { status: 400 },
    );
  }

  const rateLimit = checkRateLimit(getClientIp(request));
  if (!rateLimit.allowed) {
    return NextResponse.json<ApiErrorPayload>(
      { error: "Rate limit exceeded. Try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil(rateLimit.retryAfterMs / 1000)),
        },
      },
    );
  }

  try {
    const registrationMetadata = await fetchRegistrationMetadata(
      getRegistrationMetadataUrl(),
    );
    const validatedPayload = validateRegistrationPayload(
      payload,
      registrationMetadata.contactPlatforms,
      registrationMetadata.tagOptions,
    );

    if (!validatedPayload.ok) {
      return NextResponse.json<ApiErrorPayload>(
        { error: validatedPayload.error },
        { status: 400 },
      );
    }

    const record = validatedPayload.normalized;
    const normalizedIgn = getNormalizedIgn(record);

    const addedToSet = await redis.sadd(REGISTERED_IGNS_KEY, normalizedIgn);

    if (addedToSet === 0) {
      return NextResponse.json<ApiErrorPayload>(
        { error: "This IGN is already registered." },
        { status: 409 },
      );
    }

    await redis.rpush(QUEUE_KEY, JSON.stringify(record));

    const [queueLengthRaw, lastSheetSyncRaw] = await Promise.all([
      redis.llen(QUEUE_KEY),
      redis.get<number | string>(LAST_SHEET_SYNC_KEY),
    ]);

    const queueLength =
      typeof queueLengthRaw === "number"
        ? queueLengthRaw
        : Number(queueLengthRaw ?? 0);
    const lastSheetSync =
      typeof lastSheetSyncRaw === "number"
        ? lastSheetSyncRaw
        : Number(lastSheetSyncRaw ?? 0);
    const shouldFlush =
      queueLength > QUEUE_FLUSH_THRESHOLD ||
      Date.now() - lastSheetSync > TIME_FLUSH_THRESHOLD_MS;

    if (!shouldFlush) {
      return NextResponse.json<RegistrationSuccess>(
        {
          message: "Registration safely queued.",
          record,
        },
        { status: 200 },
      );
    }

    const lockAcquired = await redis.set(SYNC_LOCK_KEY, "true", {
      nx: true,
      ex: SYNC_LOCK_TTL_SECONDS,
    });

    if (lockAcquired === null) {
      return NextResponse.json<RegistrationSuccess>(
        {
          message: "Registration safely queued.",
          record,
        },
        { status: 200 },
      );
    }

    try {
      const synced = await flushQueueToGoogleSheets();

      return NextResponse.json<RegistrationSuccess>(
        {
          message: synced
            ? "Registration queued and batch synced."
            : "Registration safely queued.",
          record,
        },
        { status: 200 },
      );
    } finally {
      await redis.del(SYNC_LOCK_KEY);
    }
  } catch (error) {
    console.error("Registration queueing failed", error);
    return NextResponse.json<ApiErrorPayload>(
      { error: "Unable to queue registration right now." },
      { status: 500 },
    );
  }
}
