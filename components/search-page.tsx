"use client";

import { PageHero } from "@/components/page-hero";
import { ResultsGrid } from "@/components/results-grid";
import { SearchPanel } from "@/components/search-panel";
import { Card, CardContent } from "@/components/ui/card";
import { useBonfireStore } from "@/stores/bonfire-store";

interface SearchPageProps {
  adminEmail: string;
}

export function SearchPage({ adminEmail }: SearchPageProps) {
  const bootstrapLoading = useBonfireStore((state) => state.bootstrapLoading);
  const records = useBonfireStore((state) => state.records);

  return (
    <>
      <PageHero
        badge="Search route"
        description="Look up trainers by IGN, filter by contact method or tags, and report or correct entries from the result cards."
        title="Find the friend behind the IGN."
      />

      <section className="space-y-6">
        <SearchPanel />
        <Card className="border-white/70 bg-white/80">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm text-muted-foreground">
            <span>{records.length} total trainers loaded into local memory.</span>
            <span>Everything below runs against the cached roster in your browser.</span>
          </CardContent>
        </Card>
        {bootstrapLoading ? (
          <Card className="border-white/70 bg-white/75">
            <CardContent className="p-8 text-sm text-muted-foreground">Syncing trainer directory...</CardContent>
          </Card>
        ) : (
          <ResultsGrid adminEmail={adminEmail} />
        )}
      </section>
    </>
  );
}
