import { defaultRegistrationMetadata } from "@/lib/registration-metadata";
import {
  type ContactPlatformOption,
  type PlayerRecord,
  type RegistrationPayload,
  type TagOption,
} from "@/lib/types";

const ignRegex = /^[A-Za-z0-9 _-]{3,15}$/;
const friendCodeRegex = /^\d{4}\s?\d{4}\s?\d{4}$/;

export function isValidIgn(ign: string): boolean {
  return ignRegex.test(ign.trim());
}

export function isValidFriendCode(friendCode: string): boolean {
  return friendCodeRegex.test(friendCode.trim());
}

export function buildContactValue(
  pattern: string,
  contactId: string,
): string {
  return pattern.replace("{USERNAME}", contactId.trim());
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
  const contactId = payload.contactId.trim();
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

  const contactPlatform = contactPlatforms.find(
    (platform) => platform.key === payload.contactMethod,
  );
  if (!contactPlatform) {
    return {
      ok: false,
      error: "Choose a valid contact method.",
    };
  }

  if (!contactId) {
    return {
      ok: false,
      error: "Contact ID is required.",
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
      contactLink: buildContactValue(contactPlatform.pattern, contactId),
      contactMethod: contactPlatform.key,
      contactKind: contactPlatform.kind,
      tags: tagIndexes,
      createdAt: new Date().toISOString(),
    },
  };
}
