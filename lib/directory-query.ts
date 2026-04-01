import { getTagLabel } from "@/lib/registration-metadata";
import { normalizeIgn } from "@/lib/utils";
import type { BonfireFilters, PlayerRecord, TagOption } from "@/lib/types";

export function computeFilteredRecords(
  records: PlayerRecord[],
  filters: BonfireFilters,
  tagOptions: TagOption[],
): PlayerRecord[] {
  const normalizedQuery = normalizeIgn(filters.query);
  const normalizedTag = filters.tag.trim().toLowerCase();
  const selectedTags = filters.selectedTags.map((tag) => tag.toLowerCase());

  return [...records]
    .filter((record) => {
      const resolvedTags = record.tags.map((tag) =>
        getTagLabel(tag, tagOptions).toLowerCase(),
      );
      const matchesQuery =
        !normalizedQuery ||
        normalizeIgn(record.ign).includes(normalizedQuery) ||
        record.contactLink.toLowerCase().includes(normalizedQuery);

      const matchesMethod =
        filters.contactMethod === "all" ||
        record.contactMethod === filters.contactMethod;

      const matchesTag =
        !normalizedTag || resolvedTags.some((tag) => tag.includes(normalizedTag));

      const matchesSelectedTags =
        selectedTags.length === 0 ||
        selectedTags.every((selectedTag) => resolvedTags.includes(selectedTag));

      return matchesQuery && matchesMethod && matchesTag && matchesSelectedTags;
    })
    .sort((left, right) => {
      switch (filters.sort) {
        case "az":
          return left.ign.localeCompare(right.ign);
        case "za":
          return right.ign.localeCompare(left.ign);
        case "oldest":
          return getCreatedAt(left) - getCreatedAt(right);
        case "recent":
        default:
          return getCreatedAt(right) - getCreatedAt(left);
      }
    });
}

export function computeMissingQuery(
  filters: BonfireFilters,
  filteredRecords: PlayerRecord[],
): string | null {
  const normalizedQuery = normalizeIgn(filters.query);
  return normalizedQuery.length >= 3 && filteredRecords.length === 0
    ? filters.query.trim()
    : null;
}

function getCreatedAt(record: PlayerRecord): number {
  return record.createdAt ? new Date(record.createdAt).getTime() || 0 : 0;
}
