"use client";

import { create } from "zustand";

import { normalizeIgn } from "@/lib/utils";
import { getTagLabel } from "@/lib/registration-metadata";
import type { BonfireFilters, ContactPlatformOption, PlayerRecord, TagOption } from "@/lib/types";

interface BonfireState {
  records: PlayerRecord[];
  filteredRecords: PlayerRecord[];
  missingQuery: string | null;
  watchlistIgns: string[];
  watchlistMatches: string[];
  lastFetchedAt: number | null;
  bootstrapLoading: boolean;
  bootstrapError: string | null;
  contactPlatforms: ContactPlatformOption[];
  tagOptions: TagOption[];
  filters: BonfireFilters;
  setRecords: (records: PlayerRecord[], lastFetchedAt: number | null) => void;
  setFilters: (partial: Partial<BonfireFilters>) => void;
  setWatchlistIgns: (igns: string[]) => void;
  addWatchlistIgn: (ign: string) => void;
  removeWatchlistIgn: (ign: string) => void;
  setWatchlistMatches: (igns: string[]) => void;
  dismissWatchlistMatch: (ign: string) => void;
  setBootstrapStatus: (loading: boolean, error: string | null) => void;
  setRegistrationMetadata: (contactPlatforms: ContactPlatformOption[], tagOptions: TagOption[]) => void;
}

function applyFilters(records: PlayerRecord[], filters: BonfireFilters, tagOptions: TagOption[]): PlayerRecord[] {
  const normalizedQuery = normalizeIgn(filters.query);
  const normalizedTag = filters.tag.trim().toLowerCase();
  const selectedTags = filters.selectedTags.map((tag) => tag.toLowerCase());

  return [...records].filter((record) => {
    const resolvedTags = record.tags.map((tag) => getTagLabel(tag, tagOptions).toLowerCase());
    const matchesQuery =
      !normalizedQuery ||
      normalizeIgn(record.ign).includes(normalizedQuery) ||
      record.contactLink.toLowerCase().includes(normalizedQuery);

    const matchesMethod =
      filters.contactMethod === "all" || record.contactMethod === filters.contactMethod;

    const matchesTag =
      !normalizedTag ||
      resolvedTags.some((tag) => tag.includes(normalizedTag));

    const matchesSelectedTags =
      selectedTags.length === 0 ||
      selectedTags.every((selectedTag) => resolvedTags.includes(selectedTag));

    return matchesQuery && matchesMethod && matchesTag && matchesSelectedTags;
  }).sort((left, right) => {
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

function getCreatedAt(record: PlayerRecord): number {
  return record.createdAt ? new Date(record.createdAt).getTime() || 0 : 0;
}

const defaultFilters: BonfireFilters = {
  query: "",
  contactMethod: "all",
  tag: "",
  selectedTags: [],
  sort: "recent",
};

export const useBonfireStore = create<BonfireState>((set, get) => ({
  records: [],
  filteredRecords: [],
  missingQuery: null,
  watchlistIgns: [],
  watchlistMatches: [],
  lastFetchedAt: null,
  bootstrapLoading: true,
  bootstrapError: null,
  contactPlatforms: [],
  tagOptions: [],
  filters: defaultFilters,
  setRecords: (records, lastFetchedAt) => {
    const filters = get().filters;
    const filteredRecords = applyFilters(records, filters, get().tagOptions);
    const normalizedQuery = normalizeIgn(filters.query);
    const missingQuery =
      normalizedQuery.length >= 3 && filteredRecords.length === 0 ? filters.query.trim() : null;

    set({ records, filteredRecords, lastFetchedAt, missingQuery });
  },
  setFilters: (partial) => {
    const filters = { ...get().filters, ...partial };
    const filteredRecords = applyFilters(get().records, filters, get().tagOptions);
    const normalizedQuery = normalizeIgn(filters.query);
    const missingQuery =
      normalizedQuery.length >= 3 && filteredRecords.length === 0 ? filters.query.trim() : null;

    set({ filters, filteredRecords, missingQuery });
  },
  setWatchlistIgns: (igns) => set({ watchlistIgns: igns }),
  addWatchlistIgn: (ign) =>
    set((state) => ({
      watchlistIgns: state.watchlistIgns.includes(ign) ? state.watchlistIgns : [...state.watchlistIgns, ign],
    })),
  removeWatchlistIgn: (ign) =>
    set((state) => ({
      watchlistIgns: state.watchlistIgns.filter((entry) => entry !== ign),
    })),
  setWatchlistMatches: (igns) => set({ watchlistMatches: igns }),
  dismissWatchlistMatch: (ign) =>
    set((state) => ({
      watchlistMatches: state.watchlistMatches.filter((entry) => entry !== ign),
    })),
  setBootstrapStatus: (loading, error) => set({ bootstrapLoading: loading, bootstrapError: error }),
  setRegistrationMetadata: (contactPlatforms, tagOptions) =>
    set((state) => ({
      contactPlatforms,
      tagOptions,
      filteredRecords: applyFilters(state.records, state.filters, tagOptions),
    })),
}));
