"use client";

import { useEffect } from "react";

import { SEARCH_SORT_STORAGE_KEY } from "@/lib/constants";
import { getStoredSearchSort, setStoredSearchSort } from "@/lib/idb";
import { getTagLabel } from "@/lib/registration-metadata";
import { PageHero } from "@/components/page-hero";
import { ResultsGrid } from "@/components/results-grid";
import { SearchPanel } from "@/components/search-panel";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { useBonfireStore } from "@/stores/bonfire-store";

interface SearchPageProps {
  adminEmail: string;
}

export function SearchPage({ adminEmail }: SearchPageProps) {
  const bootstrapLoading = useBonfireStore((state) => state.bootstrapLoading);
  const records = useBonfireStore((state) => state.records);
  const filters = useBonfireStore((state) => state.filters);
  const tagOptions = useBonfireStore((state) => state.tagOptions);
  const setFilters = useBonfireStore((state) => state.setFilters);

  const visibleTags = tagOptions.filter((tag) =>
    records.some((record) => record.tags.includes(String(tag.index))),
  );

  useEffect(() => {
    void (async () => {
      const storedSort =
        (await getStoredSearchSort()) ??
        window.localStorage.getItem(SEARCH_SORT_STORAGE_KEY);

      if (
        storedSort === "az" ||
        storedSort === "za" ||
        storedSort === "recent" ||
        storedSort === "oldest"
      ) {
        setFilters({ sort: storedSort });
      }
    })();
  }, [setFilters]);

  useEffect(() => {
    window.localStorage.setItem(SEARCH_SORT_STORAGE_KEY, filters.sort);
    void setStoredSearchSort(filters.sort);
  }, [filters.sort]);

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
            <span>
              {records.length} total trainers loaded into local memory.
            </span>
            <span>
              Everything below runs against the cached roster in your browser.
            </span>
          </CardContent>
        </Card>
        <Card className="border-white/70 bg-white/82">
          <CardContent className="space-y-4 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-sm font-medium text-foreground">
                  Browse By Tags
                </div>
                <p className="text-sm text-muted-foreground">
                  Tap one or more tags to narrow the directory instantly.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="min-w-44">
                  <Select
                    onChange={(event) =>
                      setFilters({
                        sort: event.target.value as typeof filters.sort,
                      })
                    }
                    value={filters.sort}
                  >
                    <option value="az">A to Z</option>
                    <option value="za">Z to A</option>
                    <option value="recent">Recent first</option>
                    <option value="oldest">Oldest first</option>
                  </Select>
                </div>
                {filters.tag || filters.selectedTags.length > 0 ? (
                  <button
                    className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                    onClick={() => setFilters({ tag: "", selectedTags: [] })}
                    type="button"
                  >
                    Clear tag filters
                  </button>
                ) : null}
              </div>
            </div>
            {visibleTags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {visibleTags.map((tag) => {
                  const label = getTagLabel(String(tag.index), tagOptions);
                  const active = filters.selectedTags.includes(label);

                  return (
                    <button
                      className="text-left"
                      key={tag.index}
                      onClick={() =>
                        setFilters({
                          selectedTags: active
                            ? filters.selectedTags.filter(
                                (entry) => entry !== label,
                              )
                            : [...filters.selectedTags, label],
                        })
                      }
                      type="button"
                    >
                      <Badge
                        className={
                          active
                            ? "bg-primary text-primary-foreground"
                            : "bg-accent/80 text-accent-foreground"
                        }
                      >
                        {label}
                      </Badge>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No tag metadata has been loaded yet.
              </p>
            )}
          </CardContent>
        </Card>
        {bootstrapLoading ? (
          <Card className="border-white/70 bg-white/75">
            <CardContent className="p-8 text-sm text-muted-foreground">
              Syncing trainer directory...
            </CardContent>
          </Card>
        ) : (
          <ResultsGrid adminEmail={adminEmail} />
        )}
      </section>
    </>
  );
}
