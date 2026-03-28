import { del, get, set } from "idb-keyval";

import {
  LAST_FETCH_KEY,
  MASTER_LIST_KEY,
  WATCHLIST_KEY,
  WATCHLIST_MATCHES_KEY,
} from "@/lib/constants";
import type { PlayerRecord, WatchlistMatch } from "@/lib/types";

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
