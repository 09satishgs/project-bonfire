import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function normalizeIgn(value: string): string {
  return value.trim().toLowerCase();
}

export function splitTags(input: string): string[] {
  return input
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}
export const getLocalTimestamp = (date: string | number) => {
  return new Date(date).toLocaleString(undefined, {
    timeZoneName: "short",
    day: "numeric",
    month: "short",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};
