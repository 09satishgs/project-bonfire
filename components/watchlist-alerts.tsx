"use client";

import { useEffect } from "react";

import { removeWatchlistIgn, setWatchlistMatches } from "@/lib/idb";
import { useBonfireStore } from "@/stores/bonfire-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function WatchlistAlerts() {
  const matches = useBonfireStore((state) => state.watchlistMatches);
  const dismissWatchlistMatch = useBonfireStore((state) => state.dismissWatchlistMatch);

  useEffect(() => {
    async function syncMatches() {
      await setWatchlistMatches(matches.map((ign) => ({ ign, matchedAt: Date.now() })));
    }

    void syncMatches();
  }, [matches]);

  if (matches.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {matches.map((ign) => (
        <Card className="border-primary/20 bg-primary/10" key={ign}>
          <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="font-medium">{ign} just appeared in the latest sync.</div>
              <p className="text-sm text-muted-foreground">Search again to jump straight to their public contact details.</p>
            </div>
            <Button
              onClick={async () => {
                dismissWatchlistMatch(ign);
                await removeWatchlistIgn(ign);
              }}
              type="button"
              variant="secondary"
            >
              Dismiss
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
