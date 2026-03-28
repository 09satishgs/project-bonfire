export type ContactMethod = "reddit" | "discord" | "email";

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
  honeypot?: string;
}

export interface RegistrationSuccess {
  message: string;
  record: PlayerRecord;
}

export interface ApiErrorPayload {
  error: string;
}

export interface BonfireFilters {
  query: string;
  contactMethod: ContactMethod | "all";
  tag: string;
}

export interface BonfireSnapshot {
  records: PlayerRecord[];
  lastFetchedAt: number | null;
}

export interface WatchlistMatch {
  ign: string;
  matchedAt: number;
}
