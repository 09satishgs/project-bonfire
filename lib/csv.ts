import Papa from "papaparse";

import { splitTags } from "@/lib/utils";
import type { ContactMethod, PlayerRecord } from "@/lib/types";

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
): ContactMethod {
  const lowerValue = value?.trim().toLowerCase();

  if (lowerValue === "reddit" || contactLink.includes("reddit.com")) {
    return "reddit";
  }

  if (lowerValue === "email" || contactLink.includes("@")) {
    return "email";
  }

  return "discord";
}

export async function fetchAndParseCsv(
  csvUrl: string,
): Promise<PlayerRecord[]> {
  console.log(999, csvUrl);

  const response = await fetch(csvUrl, {
    cache: "no-store",
  });
  console.log(998, response);

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

    if (!ign || !contactLink) {
      continue;
    }

    records.push({
      ign,
      friendCode,
      contactLink,
      contactMethod: normalizeContactMethod(row["Contact Method"], contactLink),
      tags: splitTags(row.Tags ?? ""),
      createdAt: row["Created At"]?.trim() || undefined,
    });
  }

  return records;
}
