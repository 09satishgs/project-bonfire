"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { PlayerRecord } from "@/lib/types";

interface PlayerCardProps {
  player: PlayerRecord;
  adminEmail: string;
}

export function PlayerCard({ player, adminEmail }: PlayerCardProps) {
  const reportHref = `mailto:${adminEmail}?subject=${encodeURIComponent(`Correction:${player.ign}`)}&body=${encodeURIComponent(
    `Please review the PoGo-Bonfire entry for ${player.ign}.`,
  )}`;
  const contactHref =
    player.contactMethod === "email"
      ? `mailto:${player.contactLink}`
      : player.contactMethod === "reddit"
        ? player.contactLink
        : null;

  return (
    <Card className="h-full border-white/60 bg-white/85 backdrop-blur">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="space-y-2">
          <CardTitle className="text-xl">{player.ign}</CardTitle>
          <div className="flex flex-wrap gap-2">
            <Badge>{player.contactMethod}</Badge>
            {player.tags.map((tag) => (
              <Badge className="bg-accent/80" key={tag}>
                #{tag}
              </Badge>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div>
          <div className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
            Friend Code
          </div>
          <div className="mt-1 font-mono text-base">
            {player.friendCode || "Not listed"}
          </div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
            Contact
          </div>
          {contactHref ? (
            <a
              className="mt-1 block font-medium text-primary underline-offset-4 hover:underline max-w-full overflow-x-hidden"
              href={contactHref}
              rel="noreferrer"
              target={player.contactMethod === "email" ? undefined : "_blank"}
            >
              {player.contactLink}
            </a>
          ) : (
            <div className="mt-1 font-medium">{player.contactLink}</div>
          )}
        </div>
        <a
          className={cn(
            "inline-flex h-10 w-full items-center justify-center rounded-md border border-border bg-background px-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
          )}
          href={reportHref}
        >
          Report / Correct
        </a>
      </CardContent>
    </Card>
  );
}
