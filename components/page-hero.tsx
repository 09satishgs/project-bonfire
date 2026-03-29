import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface PageHeroProps {
  badge: string;
  title: string;
  description: string;
  aside?: ReactNode;
}

export function PageHero({ badge, title, description, aside }: PageHeroProps) {
  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-white/60 bg-white/55 px-6 py-10 shadow-glow backdrop-blur md:px-10">
      <div className="absolute -right-8 top-8 h-28 w-28 rounded-full bg-primary/20 blur-2xl" />
      <div className="absolute bottom-0 left-0 h-32 w-32 rounded-full bg-sky-300/20 blur-2xl" />
      <div className="grid gap-8 lg:grid-cols-[1.2fr,0.8fr]">
        <div className="space-y-5">
          <Badge className="bg-white/75 text-foreground">{badge}</Badge>
          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">{title}</h1>
          <p className="max-w-2xl text-base text-muted-foreground sm:text-lg">{description}</p>
        </div>
        {aside ? <Card className="border-white/70 bg-white/80"><CardContent className="p-6">{aside}</CardContent></Card> : null}
      </div>
    </section>
  );
}
