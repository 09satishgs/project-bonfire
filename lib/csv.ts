import Papa from "papaparse";

import { splitTags } from "@/lib/utils";
import type {
  ContactPlatformOption,
  ContactKind,
  PlayerRecord,
} from "@/lib/types";

const GOOGLE_FETCH_TIMEOUT_MS = 2000;
const FALLBACK_DIRECTORY_CDN_URL =
  process.env.NEXT_PUBLIC_SHEET_FALLBACK_CSV_URL || "";

interface CsvRow {
  IGN?: string;
  "Friend Code"?: string;
  "Contact Link"?: string;
  "Contact Method"?: string;
  "Contact Kind"?: string;
  Tags?: string;
  "Created At"?: string;
}

function normalizeContact(
  methodValue: string | undefined,
  kindValue: string | undefined,
  value: string | undefined,
  contactPlatforms: ContactPlatformOption[],
): { contactMethod: string; contactKind: ContactKind } | null {
  const lowerMethod = methodValue?.trim().toLowerCase();
  const lowerKind = kindValue?.trim().toLowerCase() as ContactKind | undefined;

  if (!lowerMethod || !value?.trim()) {
    return null;
  }

  const metadataMatch = contactPlatforms.find(
    (platform) =>
      platform.key.trim().toLowerCase() === lowerMethod ||
      platform.label.trim().toLowerCase() === lowerMethod,
  );

  if (!metadataMatch) {
    return null;
  }

  return {
    contactMethod: metadataMatch.key,
    contactKind:
      lowerKind === "link_contact" || lowerKind === "id_contact"
        ? lowerKind
        : metadataMatch.kind,
  };
}

function mapRowToPlayerRecord(
  row: CsvRow,
  contactPlatforms: ContactPlatformOption[],
  rowIndex: number,
): PlayerRecord | null {
  const ign = row.IGN?.trim() ?? "";
  const friendCode = row["Friend Code"]?.replace(/\s+/g, "") ?? "";
  const contactLink = row["Contact Link"]?.trim() ?? "";
  const contactConfig = normalizeContact(
    row["Contact Method"],
    row["Contact Kind"],
    contactLink,
    contactPlatforms,
  );

  if (!ign || !contactLink || !contactConfig) {
    console.warn("[directory:parse] row dropped", {
      rowIndex,
      reason: !ign
        ? "missing_ign"
        : !contactLink
          ? "missing_contact_link"
          : "missing_contact_config",
      row,
    });
    return null;
  }

  return {
    ign,
    friendCode,
    contactLink,
    contactMethod: contactConfig.contactMethod,
    contactKind: contactConfig.contactKind,
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
    console.error("[directory:parse] csv parse errors", parsed.errors);
    throw new Error(parsed.errors[0]?.message ?? "Unable to parse CSV.");
  }

  const records: PlayerRecord[] = [];

  for (const [rowIndex, row] of parsed.data.entries()) {
    const mappedRecord = mapRowToPlayerRecord(row, contactPlatforms, rowIndex);
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

function parseGid(directorySource: string): string | null {
  const matchedGid = directorySource.match(/[?&]gid=([0-9]+)/);
  return matchedGid?.[1] ?? null;
}

async function fetchPrimaryDirectoryCsv(
  directorySource: string,
): Promise<string> {
  const sheetId = parseSheetId(directorySource);
  const gid = parseGid(directorySource);
  const controller = new AbortController();
  const timeoutId = globalThis.setTimeout(
    () => controller.abort(),
    GOOGLE_FETCH_TIMEOUT_MS,
  );

  try {
    const primaryUrl = process.env.NEXT_PUBLIC_SHEET_CSV_URL || "";

    const response = await fetch(primaryUrl, {
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(
        `Primary Google fetch failed with status ${response.status}`,
      );
    }

    return await response.text();
  } finally {
    globalThis.clearTimeout(timeoutId);
  }
}

async function fetchFallbackDirectoryCsv(): Promise<string> {
  const response = await fetch(FALLBACK_DIRECTORY_CDN_URL, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Fallback CDN fetch failed with status ${response.status}`);
  }

  return await response.text();
}

export async function fetchDirectoryData(
  directorySource: string,
  contactPlatforms: ContactPlatformOption[],
): Promise<PlayerRecord[]> {
  try {
    const csvText = await fetchPrimaryDirectoryCsv(directorySource);
    return parseCsvText(csvText, contactPlatforms);
  } catch {
    const fallbackCsvText = await fetchFallbackDirectoryCsv();
    return parseCsvText(fallbackCsvText, contactPlatforms);
  }
}
