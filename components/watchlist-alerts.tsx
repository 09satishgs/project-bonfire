"use client";

import { useState } from "react";
import { useBonfireStore } from "@/stores/bonfire-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function WatchlistAlerts() {
  const matches = useBonfireStore((state) => state.watchlistMatches);
  const [showAlerts, setShowAlerts] = useState(true);

  if (matches.length === 0) {
    return null;
  }

  return (
    showAlerts && (
      <div className="space-y-3">
        {matches.map((ign) => (
          <Card className="border-primary/20 bg-primary/10" key={ign}>
            <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="font-medium">
                  {ign} just appeared in the latest sync.
                </div>
                <p className="text-sm text-muted-foreground">
                  Search again to jump straight to their public contact details.
                </p>
              </div>
              <Button
                onClick={async () => setShowAlerts(false)}
                type="button"
                variant="secondary"
              >
                Dismiss
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  );
}
