"use client";

import { useState, useTransition } from "react";

import { watchIgn } from "@/hooks/use-bonfire-bootstrap";
import { useBonfireStore } from "@/stores/bonfire-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export function SearchPanel() {
  const [watchMessage, setWatchMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const filters = useBonfireStore((state) => state.filters);
  const missingQuery = useBonfireStore((state) => state.missingQuery);
  const watchlistIgns = useBonfireStore((state) => state.watchlistIgns);
  const contactPlatforms = useBonfireStore((state) => state.contactPlatforms);
  const addWatchlist = useBonfireStore((state) => state.addWatchlistIgn);
  const setFilters = useBonfireStore((state) => state.setFilters);

  const alreadyWatching = missingQuery ? watchlistIgns.includes(missingQuery.trim().toLowerCase()) : false;

  return (
    <Card className="border-white/70 bg-white/80 backdrop-blur">
      <CardHeader>
        <CardTitle>Search The Bonfire</CardTitle>
        <CardDescription>Everything filters instantly from local memory after sync. No search-time network calls.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-[2fr,1fr,1fr]">
          <Input
            onChange={(event) => setFilters({ query: event.target.value })}
            placeholder="Search IGN or contact"
            value={filters.query}
          />
          <Select
            onChange={(event) =>
              setFilters({ contactMethod: event.target.value as typeof filters.contactMethod })
            }
            value={filters.contactMethod}
          >
            <option value="all">All contact methods</option>
            {contactPlatforms.map((platform) => (
              <option key={platform.key} value={platform.key}>
                {platform.label}
              </option>
            ))}
          </Select>
          <Input
            onChange={(event) => setFilters({ tag: event.target.value })}
            placeholder="Search within tag labels"
            value={filters.tag}
          />
        </div>

        {missingQuery ? (
          <div className="rounded-2xl border border-dashed border-border bg-secondary/60 p-4">
            <div className="text-sm font-medium">No match for "{missingQuery}" yet.</div>
            <p className="mt-1 text-sm text-muted-foreground">
              Save this IGN locally and we&apos;ll notify you after the next fresh sheet sync if they appear.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <Button
                disabled={alreadyWatching || isPending}
                onClick={() =>
                  startTransition(() => {
                    void (async () => {
                      await watchIgn(missingQuery);
                      addWatchlist(missingQuery.trim().toLowerCase());
                      setWatchMessage(`${missingQuery} added to your watchlist.`);
                    })();
                  })
                }
                type="button"
              >
                {alreadyWatching ? "Already watching" : "Notify if this person joins"}
              </Button>
              {watchMessage ? <span className="text-sm text-muted-foreground">{watchMessage}</span> : null}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
