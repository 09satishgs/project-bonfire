import { type ContactMethod, type PlayerRecord, type RegistrationPayload } from "@/lib/types";

const ignRegex = /^[A-Za-z0-9 _-]{3,15}$/;
const friendCodeRegex = /^\d{4}\s?\d{4}\s?\d{4}$/;
const redditUrlRegex = /^https:\/\/(www\.)?reddit\.com\/user\/[A-Za-z0-9_-]+\/?$/i;
const discordHandleRegex = /^(?:@[a-z0-9_.]{2,32}|[a-z0-9_.]{2,32})$/i;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function getContactMethod(contactLink: string): ContactMethod | null {
  if (redditUrlRegex.test(contactLink)) {
    return "reddit";
  }

  if (discordHandleRegex.test(contactLink)) {
    return "discord";
  }

  if (emailRegex.test(contactLink)) {
    return "email";
  }

  return null;
}

export function isValidIgn(ign: string): boolean {
  return ignRegex.test(ign.trim());
}

export function isValidFriendCode(friendCode: string): boolean {
  return friendCodeRegex.test(friendCode.trim());
}

export function validateRegistrationPayload(
  payload: RegistrationPayload,
): { ok: true; normalized: PlayerRecord } | { ok: false; error: string } {
  const ign = payload.ign.trim();
  const friendCode = payload.friendCode.replace(/\s+/g, "");
  const contactLink = payload.contactLink.trim();

  if (!isValidIgn(ign)) {
    return { ok: false, error: "IGN must be 3-15 characters and use letters, numbers, spaces, underscores, or hyphens." };
  }

  if (!isValidFriendCode(friendCode)) {
    return { ok: false, error: "Friend Code must be 12 digits." };
  }

  const contactMethod = getContactMethod(contactLink);
  if (!contactMethod) {
    return { ok: false, error: "Contact Link must be a Reddit profile URL, Discord handle, or email." };
  }

  return {
    ok: true,
    normalized: {
      ign,
      friendCode,
      contactLink,
      contactMethod,
      tags: [],
      createdAt: new Date().toISOString(),
    },
  };
}
