"use client";

import { PlayerCard } from "@/components/player-card";
import { Card, CardContent } from "@/components/ui/card";
import { useBonfireStore } from "@/stores/bonfire-store";

interface ResultsGridProps {
  adminEmail: string;
}

export function ResultsGrid({ adminEmail }: ResultsGridProps) {
  const filteredRecords = useBonfireStore((state) => state.filteredRecords);

  if (filteredRecords.length === 0) {
    return (
      <Card className="border-dashed border-border bg-white/60">
        <CardContent className="p-8 text-center text-sm text-muted-foreground">
          No matching trainers yet. Try a broader filter or add this IGN to your watchlist.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {filteredRecords.map((player) => (
        <PlayerCard adminEmail={adminEmail} key={`${player.ign}-${player.contactLink}`} player={player} />
      ))}
    </div>
  );
}
