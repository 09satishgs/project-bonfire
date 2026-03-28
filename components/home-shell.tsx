"use client";

import { useMemo } from "react";

import { useBonfireBootstrap } from "@/hooks/use-bonfire-bootstrap";
import { ResultsGrid } from "@/components/results-grid";
import { RegisterForm } from "@/components/register-form";
import { SearchPanel } from "@/components/search-panel";
import { WatchlistAlerts } from "@/components/watchlist-alerts";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useBonfireStore } from "@/stores/bonfire-store";

interface HomeShellProps {
  csvUrl?: string;
  adminEmail: string;
}

export function HomeShell({ csvUrl, adminEmail }: HomeShellProps) {
  const { isLoading, error } = useBonfireBootstrap(csvUrl);
  const records = useBonfireStore((state) => state.records);
  const lastFetchedAt = useBonfireStore((state) => state.lastFetchedAt);
  console.log(records);

  const stats = useMemo(() => {
    const tags = new Set(
      records.flatMap((record) => record.tags.map((tag) => tag.toLowerCase())),
    );
    return {
      players: records.length,
      tags: tags.size,
      lastFetched: lastFetchedAt
        ? new Date(lastFetchedAt).toLocaleString()
        : "Not synced yet",
    };
  }, [lastFetchedAt, records]);

  return (
    <main className="relative overflow-hidden">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
        <section className="relative overflow-hidden rounded-[2rem] border border-white/60 bg-white/50 px-6 py-10 shadow-glow backdrop-blur md:px-10">
          <div className="absolute -right-8 top-8 h-28 w-28 rounded-full bg-primary/20 blur-2xl" />
          <div className="absolute bottom-0 left-0 h-32 w-32 rounded-full bg-sky-300/20 blur-2xl" />
          <div className="grid gap-8 lg:grid-cols-[1.2fr,0.8fr]">
            <div className="space-y-5">
              <Badge className="bg-white/75 text-foreground">
                Offline-first global trainer directory
              </Badge>
              <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
                PoGo-Bonfire helps Pokemon GO friends find a safe public contact
                path by IGN.
              </h1>
              <p className="max-w-2xl text-base text-muted-foreground sm:text-lg">
                The directory reads from a public Google Sheet, syncs into
                IndexedDB, and searches instantly in memory. Writes are handled
                separately through a Vercel serverless gateway.
              </p>
            </div>
            <Card className="border-white/70 bg-white/80">
              <CardContent className="grid gap-4 p-6 sm:grid-cols-3 sm:gap-6">
                <div>
                  <div className="text-sm uppercase tracking-[0.28em] text-muted-foreground">
                    Players
                  </div>
                  <div className="mt-2 text-3xl font-semibold">
                    {stats.players}
                  </div>
                </div>
                <div>
                  <div className="text-sm uppercase tracking-[0.28em] text-muted-foreground">
                    Tags
                  </div>
                  <div className="mt-2 text-3xl font-semibold">
                    {stats.tags}
                  </div>
                </div>
                <div>
                  <div className="text-sm uppercase tracking-[0.28em] text-muted-foreground">
                    Last Sync
                  </div>
                  <div className="mt-2 text-sm font-medium">
                    {stats.lastFetched}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <WatchlistAlerts />

        {error ? (
          <Card className="border-danger/20 bg-red-50">
            <CardContent className="p-4 text-sm text-red-800">
              {error}
            </CardContent>
          </Card>
        ) : null}

        <RegisterForm />
        <section>
          <div className="space-y-6">
            <SearchPanel />
            {isLoading ? (
              <Card className="border-white/70 bg-white/75">
                <CardContent className="p-8 text-sm text-muted-foreground">
                  Syncing trainer directory...
                </CardContent>
              </Card>
            ) : (
              <ResultsGrid adminEmail={adminEmail} />
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
