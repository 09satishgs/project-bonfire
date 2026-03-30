import { defaultRegistrationMetadata } from "@/lib/registration-metadata";
import {
  type ContactPlatformOption,
  type ContactMethod,
  type PlayerRecord,
  type RegistrationPayload,
  type TagOption,
} from "@/lib/types";

const ignRegex = /^[A-Za-z0-9 _-]{3,15}$/;
const friendCodeRegex = /^\d{4}\s?\d{4}\s?\d{4}$/;

export function getContactMethod(
  contactLink: string,
  contactPlatforms: ContactPlatformOption[] = defaultRegistrationMetadata.contactPlatforms,
): ContactMethod | null {
  const trimmedLink = contactLink.trim();

  for (const option of contactPlatforms) {
    try {
      const regex = new RegExp(option.pattern, "i");
      if (regex.test(trimmedLink)) {
        return option.key;
      }
    } catch {
      continue;
    }
  }

  return null;
}

export function isValidIgn(ign: string): boolean {
  return ignRegex.test(ign.trim());
}

export function isValidFriendCode(friendCode: string): boolean {
  return friendCodeRegex.test(friendCode.trim());
}

function normalizeTagIndexes(
  tagIndexes: string,
  tagOptions: TagOption[],
): string[] | null {
  if (!tagIndexes.trim()) {
    return [];
  }

  const allowedIndexes = new Set(tagOptions.map((tag) => String(tag.index)));
  const normalized = tagIndexes
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

  if (normalized.length > 3) {
    return null;
  }

  if (new Set(normalized).size !== normalized.length) {
    return null;
  }

  if (!normalized.every((entry) => allowedIndexes.has(entry))) {
    return null;
  }

  return normalized;
}

export function validateRegistrationPayload(
  payload: RegistrationPayload,
  contactPlatforms: ContactPlatformOption[] = defaultRegistrationMetadata.contactPlatforms,
  tagOptions: TagOption[] = defaultRegistrationMetadata.tagOptions,
): { ok: true; normalized: PlayerRecord } | { ok: false; error: string } {
  const ign = payload.ign.trim();
  const friendCode = payload.friendCode.replace(/\s+/g, "");
  const contactLink = payload.contactLink.trim();
  const tagIndexes = normalizeTagIndexes(payload.tagIndexes, tagOptions);

  if (!isValidIgn(ign)) {
    return {
      ok: false,
      error:
        "IGN must be 3-15 characters and use letters, numbers, spaces, underscores, or hyphens.",
    };
  }

  if (friendCode && !isValidFriendCode(friendCode)) {
    return {
      ok: false,
      error: "Friend Code must be a 12 digit number when provided.",
    };
  }

  const contactMethod = getContactMethod(contactLink, contactPlatforms);
  if (!contactMethod) {
    return {
      ok: false,
      error: "Contact Link must match one of the supported social platforms.",
    };
  }

  if (payload.contactMethod !== contactMethod) {
    return {
      ok: false,
      error: "Contact type does not match the supplied link.",
    };
  }

  if (!tagIndexes) {
    return { ok: false, error: "Choose up to 3 valid tags." };
  }

  return {
    ok: true,
    normalized: {
      ign,
      friendCode,
      contactLink,
      contactMethod,
      tags: tagIndexes,
      createdAt: new Date().toISOString(),
    },
  };
}
