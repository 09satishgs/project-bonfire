import {
  computeFilteredRecords,
  computeMissingQuery,
} from "@/lib/directory-query";
import type { BonfireFilters, PlayerRecord, TagOption } from "@/lib/types";

interface DirectoryWorkerRequest {
  requestId: number;
  records: PlayerRecord[];
  filters: BonfireFilters;
  tagOptions: TagOption[];
}

interface DirectoryWorkerResponse {
  requestId: number;
  filteredRecords: PlayerRecord[];
  missingQuery: string | null;
}

self.onmessage = (event: MessageEvent<DirectoryWorkerRequest>) => {
  const { requestId, records, filters, tagOptions } = event.data;
  const filteredRecords = computeFilteredRecords(records, filters, tagOptions);
  const missingQuery = computeMissingQuery(filters, filteredRecords);

  const response: DirectoryWorkerResponse = {
    requestId,
    filteredRecords,
    missingQuery,
  };

  self.postMessage(response);
};
