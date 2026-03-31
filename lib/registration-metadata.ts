import Papa from "papaparse";

import type { ContactPlatformOption, RegistrationMetadata, TagOption } from "@/lib/types";

interface MetadataRow {
  kind?: string;
  key?: string;
  label?: string;
  pattern?: string;
  index?: string;
}

export const defaultRegistrationMetadata: RegistrationMetadata = {
  contactPlatforms: [
    {
      kind: "link_contact",
      key: "reddit",
      label: "Reddit",
      pattern: "https://www.reddit.com/u/{USERNAME}",
    },
    {
      kind: "id_contact",
      key: "discord",
      label: "Discord",
      pattern: "{USERNAME}",
    },
    {
      kind: "link_contact",
      key: "twitch",
      label: "Twitch",
      pattern: "https://www.twitch.tv/{USERNAME}",
    },
    {
      kind: "link_contact",
      key: "guilded",
      label: "Guilded",
      pattern: "https://www.guilded.gg/{USERNAME}",
    },
    {
      kind: "id_contact",
      key: "campfire",
      label: "Campfire",
      pattern: "@{USERNAME}",
    },
  ],
  tagOptions: [
    { index: 0, label: "#SendGiftsEveryday" },
    { index: 1, label: "#OpenGiftsEveryday" },
    { index: 2, label: "#WantForeverFriends" },
    { index: 3, label: "#DoWeeklyChallenges" },
  ],
};

export function getRegistrationMetadataUrl(): string | undefined {
  return process.env.NEXT_PUBLIC_REGISTRATION_META_CSV_URL;
}

export async function fetchRegistrationMetadata(csvUrl?: string): Promise<RegistrationMetadata> {
  if (!csvUrl) {
    return defaultRegistrationMetadata;
  }

  try {
    const response = await fetch(csvUrl, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Metadata fetch failed with status ${response.status}`);
    }

    const csvText = await response.text();
    const parsed = Papa.parse<MetadataRow>(csvText, { header: true, skipEmptyLines: true });

    if (parsed.errors.length > 0) {
      throw new Error(parsed.errors[0]?.message ?? "Unable to parse registration metadata.");
    }

    const contactPlatforms: ContactPlatformOption[] = [];
    const tagOptions: TagOption[] = [];

    for (const row of parsed.data) {
      const kind = row.kind?.trim().toLowerCase();

      if (kind === "link_contact" || kind === "id_contact") {
        const key = row.key?.trim().toLowerCase();
        const label = row.label?.trim();
        const pattern = row.pattern?.trim();

        if (key && label && pattern) {
          contactPlatforms.push({ kind, key, label, pattern });
        }
      }

      if (kind === "tag") {
        const index = Number(row.index);
        const label = row.label?.trim();

        if (!Number.isNaN(index) && label) {
          tagOptions.push({ index, label });
        }
      }
    }

    return {
      contactPlatforms: contactPlatforms.length > 0 ? contactPlatforms : defaultRegistrationMetadata.contactPlatforms,
      tagOptions:
        tagOptions.length > 0
          ? [...tagOptions].sort((left, right) => left.index - right.index)
          : defaultRegistrationMetadata.tagOptions,
    };
  } catch {
    return defaultRegistrationMetadata;
  }
}

export function getTagLabel(tagValue: string, tagOptions: TagOption[]): string {
  const tagIndex = Number(tagValue);
  if (Number.isNaN(tagIndex)) {
    return tagValue;
  }

  return tagOptions.find((tag) => tag.index === tagIndex)?.label ?? `#Tag${tagIndex}`;
}

export function getContactPlatform(
  key: string,
  contactPlatforms: ContactPlatformOption[],
): ContactPlatformOption | undefined {
  return contactPlatforms.find((platform) => platform.key === key);
}
