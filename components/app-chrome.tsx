"use client";

import type { ReactNode } from "react";
import { useBonfireBootstrap } from "@/hooks/use-bonfire-bootstrap";
import { BottomNav } from "@/components/bottom-nav";
import { Card, CardContent } from "@/components/ui/card";
import { useBonfireStore } from "@/stores/bonfire-store";

interface AppChromeProps {
  children: ReactNode;
  csvUrl?: string;
}

export function AppChrome({ children, csvUrl }: AppChromeProps) {
  useBonfireBootstrap(csvUrl);

  const bootstrapError = useBonfireStore((state) => state.bootstrapError);

  return (
    <>
      <div className="pb-28">
        <div className="mx-auto flex min-h-screen max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
          {bootstrapError ? (
            <Card className="border-danger/30 bg-danger/10">
              <CardContent className="p-4 text-sm text-red-200">
                {bootstrapError}
              </CardContent>
            </Card>
          ) : null}
          {children}
        </div>
      </div>
      <BottomNav />
    </>
  );
}
