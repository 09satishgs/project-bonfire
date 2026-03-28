"use client";

import { create } from "zustand";

import { normalizeIgn } from "@/lib/utils";
import type { BonfireFilters, PlayerRecord } from "@/lib/types";

interface BonfireState {
  records: PlayerRecord[];
  filteredRecords: PlayerRecord[];
  missingQuery: string | null;
  watchlistIgns: string[];
  watchlistMatches: string[];
  lastFetchedAt: number | null;
  filters: BonfireFilters;
  setRecords: (records: PlayerRecord[], lastFetchedAt: number | null) => void;
  setFilters: (partial: Partial<BonfireFilters>) => void;
  setWatchlistIgns: (igns: string[]) => void;
  addWatchlistIgn: (ign: string) => void;
  setWatchlistMatches: (igns: string[]) => void;
  dismissWatchlistMatch: (ign: string) => void;
}

function applyFilters(records: PlayerRecord[], filters: BonfireFilters): PlayerRecord[] {
  const normalizedQuery = normalizeIgn(filters.query);
  const normalizedTag = filters.tag.trim().toLowerCase();

  return records.filter((record) => {
    const matchesQuery =
      !normalizedQuery ||
      normalizeIgn(record.ign).includes(normalizedQuery) ||
      record.contactLink.toLowerCase().includes(normalizedQuery);

    const matchesMethod =
      filters.contactMethod === "all" || record.contactMethod === filters.contactMethod;

    const matchesTag =
      !normalizedTag ||
      record.tags.some((tag) => tag.toLowerCase().includes(normalizedTag));

    return matchesQuery && matchesMethod && matchesTag;
  });
}

const defaultFilters: BonfireFilters = {
  query: "",
  contactMethod: "all",
  tag: "",
};

export const useBonfireStore = create<BonfireState>((set, get) => ({
  records: [],
  filteredRecords: [],
  missingQuery: null,
  watchlistIgns: [],
  watchlistMatches: [],
  lastFetchedAt: null,
  filters: defaultFilters,
  setRecords: (records, lastFetchedAt) => {
    const filters = get().filters;
    const filteredRecords = applyFilters(records, filters);
    const normalizedQuery = normalizeIgn(filters.query);
    const missingQuery =
      normalizedQuery.length >= 3 && filteredRecords.length === 0 ? filters.query.trim() : null;

    set({ records, filteredRecords, lastFetchedAt, missingQuery });
  },
  setFilters: (partial) => {
    const filters = { ...get().filters, ...partial };
    const filteredRecords = applyFilters(get().records, filters);
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
  setWatchlistMatches: (igns) => set({ watchlistMatches: igns }),
  dismissWatchlistMatch: (ign) =>
    set((state) => ({
      watchlistMatches: state.watchlistMatches.filter((entry) => entry !== ign),
    })),
}));
