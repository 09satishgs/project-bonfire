"use client";

import { useState } from "react";

import { addWatchlistIgn, removeWatchlistIgn } from "@/lib/idb";
import { isValidIgn } from "@/lib/validation";
import { normalizeIgn } from "@/lib/utils";
import { PageHero } from "@/components/page-hero";
import { PlayerCard } from "@/components/player-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useBonfireStore } from "@/stores/bonfire-store";

interface WishlistPageProps {
  adminEmail: string;
}

export function WishlistPage({ adminEmail }: WishlistPageProps) {
  const [newIgn, setNewIgn] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const records = useBonfireStore((state) => state.records);
  const watchlistIgns = useBonfireStore((state) => state.watchlistIgns);
  const watchlistMatches = useBonfireStore((state) => state.watchlistMatches);
  const addWatchlistIgnToStore = useBonfireStore((state) => state.addWatchlistIgn);
  const removeWatchlistIgnFromStore = useBonfireStore((state) => state.removeWatchlistIgn);

  const matchedPlayers = records.filter((record) => watchlistIgns.includes(normalizeIgn(record.ign)));
  const normalizedNewIgn = normalizeIgn(newIgn);

  return (
    <>
      <PageHero
        badge="Wishlist route"
        description="Keep a local watchlist of missing trainers and come back to see who has finally appeared in the synced roster."
        title="Your local wishlist and matches."
      />

      <section className="grid gap-6 xl:grid-cols-[0.8fr,1.2fr]">
        <div className="space-y-6">
          <Card className="border-white/70 bg-white/82">
            <CardHeader>
              <CardTitle>Add A Wishlist IGN</CardTitle>
              <CardDescription>Save a trainer name here without going through the Search tab.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-3">
                <Input
                  onChange={(event) => {
                    setNewIgn(event.target.value);
                    setMessage(null);
                  }}
                  placeholder="Trainer IGN"
                  value={newIgn}
                />
                <Button
                  disabled={!isValidIgn(newIgn) || watchlistIgns.includes(normalizedNewIgn)}
                  onClick={async () => {
                    await addWatchlistIgn(newIgn);
                    addWatchlistIgnToStore(normalizedNewIgn);
                    setMessage(`${newIgn.trim()} added to your wishlist.`);
                    setNewIgn("");
                  }}
                  type="button"
                >
                  Add
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">IGN must be 3-15 valid characters.</p>
              {message ? <p className="text-sm font-medium text-emerald-700">{message}</p> : null}
            </CardContent>
          </Card>

          <Card className="border-white/70 bg-white/82">
            <CardHeader>
              <CardTitle>Saved Wishlist IGNs</CardTitle>
              <CardDescription>Stored in IndexedDB on this device.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {watchlistIgns.length > 0 ? (
                watchlistIgns.map((ign) => (
                  <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-background/80 px-4 py-3" key={ign}>
                    <div>
                      <div className="font-medium">{ign}</div>
                      <div className="text-xs text-muted-foreground">
                        {watchlistMatches.includes(ign) ? "Matched in latest sync" : "Waiting for a match"}
                      </div>
                    </div>
                    <Button
                      onClick={async () => {
                        await removeWatchlistIgn(ign);
                        removeWatchlistIgnFromStore(ign);
                      }}
                      type="button"
                      variant="outline"
                    >
                      Remove
                    </Button>
                  </div>
                ))
              ) : (
                <div className="text-sm text-muted-foreground">Your wishlist is empty. Add missing IGNs here or from the Search tab.</div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="border-white/70 bg-white/82">
          <CardHeader>
            <CardTitle>Wishlist Matches</CardTitle>
            <CardDescription>Newly found trainers from the wishlist are highlighted here.</CardDescription>
          </CardHeader>
          <CardContent>
            {matchedPlayers.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {matchedPlayers.map((player) => (
                  <PlayerCard adminEmail={adminEmail} key={`${player.ign}-${player.contactLink}`} player={player} />
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">No wishlist matches yet. When a watched IGN appears after a fresh sync, it will show up here.</div>
            )}
          </CardContent>
        </Card>
      </section>
    </>
  );
}
