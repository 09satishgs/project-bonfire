"use client";

import { useEffect, useState } from "react";

import { CACHE_TTL_MS } from "@/lib/constants";
import {
  addWatchlistIgn,
  getCachedRecords,
  getLastFetchedAt,
  getWatchlistIgns,
  getWatchlistMatches,
  setCachedRecords,
  setLastFetchedAt,
  setWatchlistMatches,
} from "@/lib/idb";
import { fetchAndParseCsv } from "@/lib/csv";
import { normalizeIgn } from "@/lib/utils";
import { useBonfireStore } from "@/stores/bonfire-store";

export function useBonfireBootstrap(csvUrl: string | undefined) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const setRecords = useBonfireStore((state) => state.setRecords);
  const setWatchlistIgns = useBonfireStore((state) => state.setWatchlistIgns);
  const setStoreWatchlistMatches = useBonfireStore((state) => state.setWatchlistMatches);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        const [cachedRecords, cachedFetchedAt, watchlistIgns, persistedMatches] = await Promise.all([
          getCachedRecords(),
          getLastFetchedAt(),
          getWatchlistIgns(),
          getWatchlistMatches(),
        ]);

        if (cancelled) {
          return;
        }

        setWatchlistIgns(watchlistIgns);
        setStoreWatchlistMatches(persistedMatches.map((match) => match.ign));

        if (cachedRecords && cachedFetchedAt && Date.now() - cachedFetchedAt < CACHE_TTL_MS) {
          setRecords(cachedRecords, cachedFetchedAt);
          setIsLoading(false);
          return;
        }

        if (!csvUrl) {
          if (cachedRecords) {
            setRecords(cachedRecords, cachedFetchedAt);
          }

          setError("Set NEXT_PUBLIC_SHEET_CSV_URL to enable live sync.");
          setIsLoading(false);
          return;
        }

        const freshRecords = await fetchAndParseCsv(csvUrl);
        const fetchedAt = Date.now();
        const watchlistSet = new Set(watchlistIgns.map(normalizeIgn));
        const newMatches = freshRecords
          .filter((record) => watchlistSet.has(normalizeIgn(record.ign)))
          .map((record) => ({
            ign: normalizeIgn(record.ign),
            matchedAt: fetchedAt,
          }));

        await Promise.all([
          setCachedRecords(freshRecords),
          setLastFetchedAt(fetchedAt),
          setWatchlistMatches(newMatches),
        ]);

        if (!cancelled) {
          setRecords(freshRecords, fetchedAt);
          setStoreWatchlistMatches(newMatches.map((match) => match.ign));
        }
      } catch (caughtError) {
        const message =
          caughtError instanceof Error ? caughtError.message : "Unable to load the player directory.";
        const cachedRecords = await getCachedRecords();
        const cachedFetchedAt = await getLastFetchedAt();

        if (!cancelled) {
          if (cachedRecords) {
            setRecords(cachedRecords, cachedFetchedAt);
          }

          setError(message);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [csvUrl, setRecords, setStoreWatchlistMatches, setWatchlistIgns]);

  return { isLoading, error };
}

export async function watchIgn(ign: string): Promise<void> {
  await addWatchlistIgn(ign);
}
