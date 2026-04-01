import type { Metadata, Viewport } from "next";

import "./globals.css";

import { Analytics } from "@vercel/analytics/next";
import { AppChrome } from "@/components/app-chrome";
import { ServiceWorkerRegister } from "@/components/service-worker-register";

export const metadata: Metadata = {
  title: "PoGo-Bonfire",
  description: "A global Pokemon GO directory for finding contact paths for in-game friends.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "PoGo-Bonfire",
  },
};

export const viewport: Viewport = {
  themeColor: "#f97316",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <ServiceWorkerRegister />
        <AppChrome csvUrl={process.env.NEXT_PUBLIC_SHEET_CSV_URL}>{children}</AppChrome>
        <Analytics />
      </body>
    </html>
  );
}
