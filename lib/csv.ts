import Papa from "papaparse";

import { splitTags } from "@/lib/utils";
import { getContactMethod } from "@/lib/validation";
import type {
  ContactPlatformOption,
  ContactMethod,
  PlayerRecord,
} from "@/lib/types";

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

export async function fetchAndParseCsv(
  csvUrl: string,
  contactPlatforms: ContactPlatformOption[],
): Promise<PlayerRecord[]> {
  const response = await fetch(csvUrl, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`CSV fetch failed with status ${response.status}`);
  }

  const csvText = await response.text();

  const parsed = Papa.parse<CsvRow>(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  if (parsed.errors.length > 0) {
    throw new Error(parsed.errors[0]?.message ?? "Unable to parse CSV");
  }

  const records: PlayerRecord[] = [];

  for (const row of parsed.data) {
    const ign = row.IGN?.trim() ?? "";
    const friendCode = row["Friend Code"]?.replace(/\s+/g, "") ?? "";
    const contactLink = row["Contact Link"]?.trim() ?? "";
    const contactMethod = normalizeContactMethod(
      row["Contact Method"],
      contactLink,
      contactPlatforms,
    );

    if (!ign || !contactLink || !contactMethod) {
      continue;
    }

    records.push({
      ign,
      friendCode,
      contactLink,
      contactMethod,
      tags: splitTags(row.Tags ?? ""),
      createdAt: row["Created At"]?.trim() || undefined,
    });
  }

  return records;
}
