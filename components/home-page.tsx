"use client";

import { useMemo } from "react";

import { PageHero } from "@/components/page-hero";
import { PlayerCard } from "@/components/player-card";
import { RegisterForm } from "@/components/register-form";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useBonfireStore } from "@/stores/bonfire-store";
import { WatchlistAlerts } from "./watchlist-alerts";

interface HomePageProps {
  adminEmail: string;
}

export function HomePage({ adminEmail }: HomePageProps) {
  const records = useBonfireStore((state) => state.records);
  const bootstrapLoading = useBonfireStore((state) => state.bootstrapLoading);
  const lastFetchedAt = useBonfireStore((state) => state.lastFetchedAt);

  const stats = useMemo(() => {
    const tags = new Set(
      records.flatMap((record) => record.tags.map((tag) => tag.toLowerCase())),
    );
    const newest = [...records].sort((left, right) => {
      const leftTime = left.createdAt ? new Date(left.createdAt).getTime() : 0;
      const rightTime = right.createdAt
        ? new Date(right.createdAt).getTime()
        : 0;
      return rightTime - leftTime;
    });

    return {
      players: records.length,
      tags: tags.size,
      lastFetched: lastFetchedAt
        ? new Date(lastFetchedAt).toLocaleString()
        : "Not synced yet",
      newest: newest.slice(0, 3),
    };
  }, [lastFetchedAt, records]);

  return (
    <>
      <PageHero
        aside={
          <div className="grid gap-4 sm:grid-cols-3">
            <Stat label="Players" value={String(stats.players)} />
            <Stat label="Tags" value={String(stats.tags)} />
            <Stat label="Last Sync" value={stats.lastFetched} />
          </div>
        }
        badge="Home base"
        description="Track the latest trainer beacons, register your own contact trail, and keep a pulse on the size of the bonfire."
        title="A fast global directory for reconnecting with Pokemon GO friends by IGN."
      />
      <WatchlistAlerts />
      <RegisterForm />
      <section>
        <Card className="border-white/70 bg-white/82">
          <CardHeader>
            <CardTitle>Newly Added Trainers</CardTitle>
            <CardDescription>
              Fresh arrivals from the synced roster. Search remains a dedicated
              tab.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {bootstrapLoading ? (
              <div className="text-sm text-muted-foreground">
                Syncing latest trainers...
              </div>
            ) : stats.newest.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                {stats.newest.map((player) => (
                  <PlayerCard
                    adminEmail={adminEmail}
                    key={`${player.ign}-${player.contactLink}`}
                    player={player}
                  />
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                No players synced yet.
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-sm uppercase tracking-[0.28em] text-muted-foreground">
        {label}
      </div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
    </div>
  );
}
