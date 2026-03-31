"use client";

import { useEffect, useRef } from "react";

import {
  computeFilteredRecords,
  computeMissingQuery,
} from "@/lib/directory-query";
import { useBonfireStore } from "@/stores/bonfire-store";
import type { BonfireFilters, PlayerRecord, TagOption } from "@/lib/types";

interface DirectoryWorkerResponse {
  requestId: number;
  filteredRecords: PlayerRecord[];
  missingQuery: string | null;
}

export function useDirectoryWorker() {
  const records = useBonfireStore((state) => state.records);
  const filters = useBonfireStore((state) => state.filters);
  const tagOptions = useBonfireStore((state) => state.tagOptions);
  const setDerivedResults = useBonfireStore((state) => state.setDerivedResults);
  const setDerivedLoading = useBonfireStore((state) => state.setDerivedLoading);

  const workerRef = useRef<Worker | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (typeof Worker === "undefined") {
      return;
    }

    const worker = new Worker(
      new URL("../workers/directory-worker.ts", import.meta.url),
      { type: "module" },
    );

    worker.onmessage = (event: MessageEvent<DirectoryWorkerResponse>) => {
      if (event.data.requestId !== requestIdRef.current) {
        return;
      }

      setDerivedResults(event.data.filteredRecords, event.data.missingQuery);
    };

    workerRef.current = worker;

    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, [setDerivedResults]);

  useEffect(() => {
    const worker = workerRef.current;
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setDerivedLoading(true);

    if (!worker) {
      const filteredRecords = computeFilteredRecords(records, filters, tagOptions);
      const missingQuery = computeMissingQuery(filters, filteredRecords);
      setDerivedResults(filteredRecords, missingQuery);
      return;
    }

    worker.postMessage({
      requestId,
      records,
      filters,
      tagOptions,
    } satisfies {
      requestId: number;
      records: PlayerRecord[];
      filters: BonfireFilters;
      tagOptions: TagOption[];
    });
  }, [filters, records, setDerivedLoading, setDerivedResults, tagOptions]);
}
