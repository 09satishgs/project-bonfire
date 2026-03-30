import Papa from "papaparse";

import { splitTags } from "@/lib/utils";
import { getContactMethod } from "@/lib/validation";
import type {
  ContactPlatformOption,
  ContactMethod,
  PlayerRecord,
} from "@/lib/types";

const GOOGLE_FETCH_TIMEOUT_MS = 2000;
const GVIZ_PREFIX_LENGTH = 47;
const GVIZ_SUFFIX_LENGTH = 2;
const FALLBACK_DIRECTORY_CDN_URL =
  process.env.NEXT_PUBLIC_SHEET_FALLBACK_CSV_URL || "";

interface CsvRow {
  IGN?: string;
  "Friend Code"?: string;
  "Contact Link"?: string;
  "Contact Method"?: string;
  Tags?: string;
  "Created At"?: string;
}

interface GvizCell {
  v?: string | number | null;
  f?: string | null;
}

interface GvizRow {
  c: Array<GvizCell | null>;
}

interface GvizColumn {
  label?: string;
}

interface GvizResponse {
  table?: {
    cols?: GvizColumn[];
    rows?: GvizRow[];
  };
}

function normalizeContactMethod(
  value: string | undefined,
  contactLink: string,
  contactPlatforms: ContactPlatformOption[],
): ContactMethod | null {
  const lowerValue = value?.trim().toLowerCase();
  const metadataMatch = getContactMethod(contactLink, contactPlatforms);

  if (metadataMatch) {
    return metadataMatch;
  }

  if (
    lowerValue &&
    contactPlatforms.some((platform) => platform.key === lowerValue)
  ) {
    return lowerValue;
  }

  return null;
}

function mapRowToPlayerRecord(
  row: CsvRow,
  contactPlatforms: ContactPlatformOption[],
): PlayerRecord | null {
  const ign = row.IGN?.trim() ?? "";
  const friendCode = row["Friend Code"]?.replace(/\s+/g, "") ?? "";
  const contactLink = row["Contact Link"]?.trim() ?? "";
  const contactMethod = normalizeContactMethod(
    row["Contact Method"],
    contactLink,
    contactPlatforms,
  );

  if (!ign || !contactLink || !contactMethod) {
    return null;
  }

  return {
    ign,
    friendCode,
    contactLink,
    contactMethod,
    tags: splitTags(row.Tags ?? ""),
    createdAt: row["Created At"]?.trim() || undefined,
  };
}

function parseCsvText(
  csvText: string,
  contactPlatforms: ContactPlatformOption[],
): PlayerRecord[] {
  const parsed = Papa.parse<CsvRow>(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  if (parsed.errors.length > 0) {
    throw new Error(
      parsed.errors[0]?.message ?? "Unable to parse fallback CSV.",
    );
  }

  const records: PlayerRecord[] = [];

  for (const row of parsed.data) {
    const mappedRecord = mapRowToPlayerRecord(row, contactPlatforms);
    if (mappedRecord) {
      records.push(mappedRecord);
    }
  }

  return records;
}

function parseSheetId(directorySource: string): string {
  const matchedSheetId = directorySource.match(/\/d\/([a-zA-Z0-9-_]+)/);
  if (!matchedSheetId?.[1]) {
    throw new Error(
      "Unable to determine Google Sheet ID from the configured directory source.",
    );
  }

  return matchedSheetId[1];
}

function parseGvizPayload(rawText: string): GvizResponse {
  if (rawText.length <= GVIZ_PREFIX_LENGTH + GVIZ_SUFFIX_LENGTH) {
    throw new Error("GViz response payload was unexpectedly short.");
  }

  const jsonText = rawText.slice(
    GVIZ_PREFIX_LENGTH,
    rawText.length - GVIZ_SUFFIX_LENGTH,
  );

  return JSON.parse(jsonText) as GvizResponse;
}

function mapGvizToPlayerRecords(
  payload: GvizResponse,
  contactPlatforms: ContactPlatformOption[],
): PlayerRecord[] {
  const columns = payload.table?.cols ?? [];
  const rows = payload.table?.rows ?? [];

  if (columns.length === 0) {
    throw new Error("GViz response did not contain any columns.");
  }

  const columnIndexes = new Map(
    columns.map((column, index) => [column.label?.trim() ?? "", index]),
  );

  const records: PlayerRecord[] = [];

  for (const row of rows) {
    const cells = row.c ?? [];
    const mappedRecord = mapRowToPlayerRecord(
      {
        IGN: readCell(cells, columnIndexes.get("IGN")),
        "Friend Code": readCell(cells, columnIndexes.get("Friend Code")),
        "Contact Link": readCell(cells, columnIndexes.get("Contact Link")),
        "Contact Method": readCell(cells, columnIndexes.get("Contact Method")),
        Tags: readCell(cells, columnIndexes.get("Tags")),
        "Created At": readCell(cells, columnIndexes.get("Created At")),
      },
      contactPlatforms,
    );

    if (mappedRecord) {
      records.push(mappedRecord);
    }
  }

  return records;
}

function readCell(
  cells: Array<GvizCell | null>,
  index: number | undefined,
): string | undefined {
  if (index === undefined) {
    return undefined;
  }

  const cell = cells[index];
  if (!cell) {
    return undefined;
  }

  if (typeof cell.f === "string" && cell.f.trim()) {
    return cell.f;
  }

  if (cell.v === null || cell.v === undefined) {
    return undefined;
  }

  return String(cell.v);
}

async function fetchPrimaryDirectory(
  sheetId: string,
  contactPlatforms: ContactPlatformOption[],
): Promise<PlayerRecord[]> {
  const controller = new AbortController();
  const timeoutId = globalThis.setTimeout(
    () => controller.abort(),
    GOOGLE_FETCH_TIMEOUT_MS,
  );

  try {
    const response = await fetch(
      `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tq=SELECT *`,
      {
        cache: "no-store",
        signal: controller.signal,
      },
    );

    if (!response.ok) {
      throw new Error(
        `Primary Google fetch failed with status ${response.status}`,
      );
    }

    const rawText = await response.text();
    const parsedPayload = parseGvizPayload(rawText);
    return mapGvizToPlayerRecords(parsedPayload, contactPlatforms);
  } finally {
    globalThis.clearTimeout(timeoutId);
  }
}

async function fetchFallbackDirectory(
  contactPlatforms: ContactPlatformOption[],
): Promise<PlayerRecord[]> {
  const response = await fetch(FALLBACK_DIRECTORY_CDN_URL, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Fallback CDN fetch failed with status ${response.status}`);
  }

  const csvText = await response.text();
  return parseCsvText(csvText, contactPlatforms);
}

export async function fetchDirectoryData(
  directorySource: string,
  contactPlatforms: ContactPlatformOption[],
): Promise<PlayerRecord[]> {
  const sheetId = parseSheetId(directorySource);

  try {
    return await fetchPrimaryDirectory(sheetId, contactPlatforms);
  } catch {
    return fetchFallbackDirectory(contactPlatforms);
  }
}
