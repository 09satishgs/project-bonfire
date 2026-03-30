import Papa from "papaparse";

import { splitTags } from "@/lib/utils";
import { getContactMethod } from "@/lib/validation";
import type {
  ContactPlatformOption,
  ContactMethod,
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
  Tags?: string;
  "Created At"?: string;
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
    throw new Error(parsed.errors[0]?.message ?? "Unable to parse CSV.");
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
