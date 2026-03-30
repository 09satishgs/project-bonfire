export type ContactMethod = string;

export interface ContactPlatformOption {
  key: string;
  label: string;
  pattern: string;
}

export interface TagOption {
  index: number;
  label: string;
}

export interface PlayerRecord {
  ign: string;
  friendCode: string;
  contactLink: string;
  contactMethod: ContactMethod;
  tags: string[];
  createdAt?: string;
}

export interface RegistrationPayload {
  ign: string;
  friendCode: string;
  contactLink: string;
  contactMethod: string;
  tagIndexes: string;
  honeypot?: string;
}

export interface RegistrationSuccess {
  message: string;
  record: PlayerRecord;
}

export interface ApiErrorPayload {
  error: string;
}

export type SearchSort = "az" | "za" | "recent" | "oldest";

export interface BonfireFilters {
  query: string;
  contactMethod: ContactMethod | "all";
  tag: string;
  selectedTags: string[];
  sort: SearchSort;
}

export interface BonfireSnapshot {
  records: PlayerRecord[];
  lastFetchedAt: number | null;
}

export interface WatchlistMatch {
  ign: string;
  matchedAt: number;
}

export interface RegistrationMetadata {
  contactPlatforms: ContactPlatformOption[];
  tagOptions: TagOption[];
}
