"use client";

import { create } from "zustand";

import type { BonfireFilters, ContactPlatformOption, PlayerRecord, TagOption } from "@/lib/types";

interface BonfireState {
  records: PlayerRecord[];
  filteredRecords: PlayerRecord[];
  missingQuery: string | null;
  derivedLoading: boolean;
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
  setDerivedResults: (filteredRecords: PlayerRecord[], missingQuery: string | null) => void;
  setDerivedLoading: (loading: boolean) => void;
  setWatchlistIgns: (igns: string[]) => void;
  addWatchlistIgn: (ign: string) => void;
  removeWatchlistIgn: (ign: string) => void;
  setWatchlistMatches: (igns: string[]) => void;
  dismissWatchlistMatch: (ign: string) => void;
  setBootstrapStatus: (loading: boolean, error: string | null) => void;
  setRegistrationMetadata: (contactPlatforms: ContactPlatformOption[], tagOptions: TagOption[]) => void;
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
  derivedLoading: true,
  watchlistIgns: [],
  watchlistMatches: [],
  lastFetchedAt: null,
  bootstrapLoading: true,
  bootstrapError: null,
  contactPlatforms: [],
  tagOptions: [],
  filters: defaultFilters,
  setRecords: (records, lastFetchedAt) => {
    set({ records, lastFetchedAt, derivedLoading: true });
  },
  setFilters: (partial) => {
    const filters = { ...get().filters, ...partial };
    set({ filters, derivedLoading: true });
  },
  setDerivedResults: (filteredRecords, missingQuery) =>
    set({ filteredRecords, missingQuery, derivedLoading: false }),
  setDerivedLoading: (loading) => set({ derivedLoading: loading }),
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
      derivedLoading: true,
    })),
}));
