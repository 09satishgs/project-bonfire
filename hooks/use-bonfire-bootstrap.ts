"use client";

import { useEffect } from "react";

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
  const setRecords = useBonfireStore((state) => state.setRecords);
  const setWatchlistIgns = useBonfireStore((state) => state.setWatchlistIgns);
  const setStoreWatchlistMatches = useBonfireStore((state) => state.setWatchlistMatches);
  const setBootstrapStatus = useBonfireStore((state) => state.setBootstrapStatus);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      let nextError: string | null = null;

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
          setBootstrapStatus(false, null);
          return;
        }

        if (!csvUrl) {
          if (cachedRecords) {
            setRecords(cachedRecords, cachedFetchedAt);
          }

          nextError = "Set NEXT_PUBLIC_SHEET_CSV_URL to enable live sync.";
          setBootstrapStatus(false, nextError);
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
          setBootstrapStatus(false, null);
        }
      } catch (caughtError) {
        const message =
          caughtError instanceof Error ? caughtError.message : "Unable to load the player directory.";
        const cachedRecords = await getCachedRecords();
        const cachedFetchedAt = await getLastFetchedAt();
        nextError = message;

        if (!cancelled) {
          if (cachedRecords) {
            setRecords(cachedRecords, cachedFetchedAt);
          }

          setBootstrapStatus(false, nextError);
        }
      } finally {
        if (!cancelled) {
          setBootstrapStatus(false, nextError);
        }
      }
    }

    setBootstrapStatus(true, null);
    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [csvUrl, setBootstrapStatus, setRecords, setStoreWatchlistMatches, setWatchlistIgns]);
}

export async function watchIgn(ign: string): Promise<void> {
  await addWatchlistIgn(ign);
}
