import { del, get, set } from "idb-keyval";

import {
  LAST_FETCH_KEY,
  MASTER_LIST_KEY,
  MY_REGISTRATION_KEY,
  REGISTRATION_METADATA_FETCHED_AT_KEY,
  REGISTRATION_METADATA_KEY,
  SEARCH_SORT_STORAGE_KEY,
  WATCHLIST_KEY,
  WATCHLIST_MATCHES_KEY,
} from "@/lib/constants";
import type { PlayerRecord, RegistrationMetadata, SearchSort, WatchlistMatch } from "@/lib/types";

export async function getCachedRecords(): Promise<PlayerRecord[] | null> {
  return (await get<PlayerRecord[]>(MASTER_LIST_KEY)) ?? null;
}

export async function setCachedRecords(records: PlayerRecord[]): Promise<void> {
  await set(MASTER_LIST_KEY, records);
}

export async function getLastFetchedAt(): Promise<number | null> {
  return (await get<number>(LAST_FETCH_KEY)) ?? null;
}

export async function setLastFetchedAt(timestamp: number): Promise<void> {
  await set(LAST_FETCH_KEY, timestamp);
}

export async function getMyRegistration(): Promise<PlayerRecord | null> {
  return (await get<PlayerRecord>(MY_REGISTRATION_KEY)) ?? null;
}

export async function setMyRegistration(record: PlayerRecord): Promise<void> {
  await set(MY_REGISTRATION_KEY, record);
}

export async function getWatchlistIgns(): Promise<string[]> {
  return (await get<string[]>(WATCHLIST_KEY)) ?? [];
}

export async function addWatchlistIgn(ign: string): Promise<void> {
  const current = await getWatchlistIgns();
  const normalized = ign.trim().toLowerCase();

  if (current.includes(normalized)) {
    return;
  }

  await set(WATCHLIST_KEY, [...current, normalized]);
}

export async function removeWatchlistIgn(ign: string): Promise<void> {
  const current = await getWatchlistIgns();
  const normalized = ign.trim().toLowerCase();
  await set(
    WATCHLIST_KEY,
    current.filter((entry) => entry !== normalized),
  );
}

export async function getWatchlistMatches(): Promise<WatchlistMatch[]> {
  return (await get<WatchlistMatch[]>(WATCHLIST_MATCHES_KEY)) ?? [];
}

export async function setWatchlistMatches(matches: WatchlistMatch[]): Promise<void> {
  await set(WATCHLIST_MATCHES_KEY, matches);
}

export async function clearWatchlistMatches(): Promise<void> {
  await del(WATCHLIST_MATCHES_KEY);
}

export async function getCachedRegistrationMetadata(): Promise<RegistrationMetadata | null> {
  return (await get<RegistrationMetadata>(REGISTRATION_METADATA_KEY)) ?? null;
}

export async function setCachedRegistrationMetadata(metadata: RegistrationMetadata): Promise<void> {
  await set(REGISTRATION_METADATA_KEY, metadata);
}

export async function getRegistrationMetadataFetchedAt(): Promise<number | null> {
  return (await get<number>(REGISTRATION_METADATA_FETCHED_AT_KEY)) ?? null;
}

export async function setRegistrationMetadataFetchedAt(timestamp: number): Promise<void> {
  await set(REGISTRATION_METADATA_FETCHED_AT_KEY, timestamp);
}

export async function getStoredSearchSort(): Promise<SearchSort | null> {
  return (await get<SearchSort>(SEARCH_SORT_STORAGE_KEY)) ?? null;
}

export async function setStoredSearchSort(sort: SearchSort): Promise<void> {
  await set(SEARCH_SORT_STORAGE_KEY, sort);
}
