"use client";

import { useEffect } from "react";

import { CACHE_TTL_MS, METADATA_CACHE_TTL_MS } from "@/lib/constants";
import {
  addWatchlistIgn,
  getCachedRecords,
  getCachedRegistrationMetadata,
  getLastFetchedAt,
  getRegistrationMetadataFetchedAt,
  getStoredSearchSort,
  getWatchlistIgns,
  getWatchlistMatches,
  setCachedRecords,
  setCachedRegistrationMetadata,
  setLastFetchedAt,
  setRegistrationMetadataFetchedAt,
  setWatchlistMatches,
} from "@/lib/idb";
import { defaultRegistrationMetadata } from "@/lib/registration-metadata";
import { fetchAndParseCsv } from "@/lib/csv";
import { fetchRegistrationMetadata, getRegistrationMetadataUrl } from "@/lib/registration-metadata";
import { normalizeIgn } from "@/lib/utils";
import { useBonfireStore } from "@/stores/bonfire-store";

export function useBonfireBootstrap(csvUrl: string | undefined) {
  const setRecords = useBonfireStore((state) => state.setRecords);
  const setFilters = useBonfireStore((state) => state.setFilters);
  const setWatchlistIgns = useBonfireStore((state) => state.setWatchlistIgns);
  const setStoreWatchlistMatches = useBonfireStore((state) => state.setWatchlistMatches);
  const setBootstrapStatus = useBonfireStore((state) => state.setBootstrapStatus);
  const setRegistrationMetadata = useBonfireStore((state) => state.setRegistrationMetadata);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      let nextError: string | null = null;

      try {
        const [
          cachedMetadata,
          cachedMetadataFetchedAt,
          cachedRecords,
          cachedFetchedAt,
          storedSort,
          watchlistIgns,
          persistedMatches,
        ] = await Promise.all([
          getCachedRegistrationMetadata(),
          getRegistrationMetadataFetchedAt(),
          getCachedRecords(),
          getLastFetchedAt(),
          getStoredSearchSort(),
          getWatchlistIgns(),
          getWatchlistMatches(),
        ]);

        if (cancelled) {
          return;
        }

        if (storedSort) {
          setFilters({ sort: storedSort });
        }

        let registrationMetadata = cachedMetadata ?? defaultRegistrationMetadata;
        const shouldRefreshMetadata =
          !cachedMetadata ||
          !cachedMetadataFetchedAt ||
          Date.now() - cachedMetadataFetchedAt >= METADATA_CACHE_TTL_MS;

        if (shouldRefreshMetadata) {
          registrationMetadata = await fetchRegistrationMetadata(getRegistrationMetadataUrl());
          await Promise.all([
            setCachedRegistrationMetadata(registrationMetadata),
            setRegistrationMetadataFetchedAt(Date.now()),
          ]);
        }

        setRegistrationMetadata(registrationMetadata.contactPlatforms, registrationMetadata.tagOptions);
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

        const freshRecords = await fetchAndParseCsv(
          csvUrl,
          registrationMetadata.contactPlatforms,
        );
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
  }, [csvUrl, setBootstrapStatus, setFilters, setRecords, setRegistrationMetadata, setStoreWatchlistMatches, setWatchlistIgns]);
}

export async function watchIgn(ign: string): Promise<void> {
  await addWatchlistIgn(ign);
}
