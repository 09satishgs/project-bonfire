"use client";

import { useEffect, useState } from "react";

import { PlayerCard } from "@/components/player-card";
import { Card, CardContent } from "@/components/ui/card";
import { useBonfireStore } from "@/stores/bonfire-store";

interface ResultsGridProps {
  adminEmail: string;
}

const PAGE_SIZE = 20;

export function ResultsGrid({ adminEmail }: ResultsGridProps) {
  const filteredRecords = useBonfireStore((state) => state.filteredRecords);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [filteredRecords]);

  useEffect(() => {
    function handleScroll() {
      const scrollTop = window.scrollY;
      const viewportHeight = window.innerHeight;
      const fullHeight = document.documentElement.scrollHeight;
      const scrollProgress = (scrollTop + viewportHeight) / fullHeight;

      if (scrollProgress >= 0.9) {
        setVisibleCount((current) =>
          current >= filteredRecords.length
            ? current
            : Math.min(current + PAGE_SIZE, filteredRecords.length),
        );
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [filteredRecords.length]);

  if (filteredRecords.length === 0) {
    return (
      <Card className="border-dashed border-border bg-white/60">
        <CardContent className="p-8 text-center text-sm text-muted-foreground">
          No matching trainers yet. Try a broader filter or add this IGN to your watchlist.
        </CardContent>
      </Card>
    );
  }

  const visibleRecords = filteredRecords.slice(0, visibleCount);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {visibleRecords.map((player) => (
          <PlayerCard adminEmail={adminEmail} key={`${player.ign}-${player.contactLink}`} player={player} />
        ))}
      </div>
      {visibleCount < filteredRecords.length ? (
        <Card className="border-white/70 bg-white/70">
          <CardContent className="p-4 text-center text-sm text-muted-foreground">
            Showing {visibleCount} of {filteredRecords.length} trainers. Scroll near the bottom to load more.
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
