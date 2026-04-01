"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { useBonfireStore } from "@/stores/bonfire-store";

const items = [
  { href: "/", label: "Home", icon: HomeIcon },
  { href: "/search", label: "Search", icon: SearchIcon },
  { href: "/wishlist", label: "Wishlist", icon: HeartIcon },
  { href: "/faq", label: "FAQ", icon: HelpIcon },
];
const THEME_STORAGE_KEY = "pogobonfire-theme";
type ThemeMode = "dark" | "light";

export function BottomNav() {
  const pathname = usePathname();
  const watchlistMatchCount = useBonfireStore(
    (state) => state.watchlistMatches.length,
  );
  const [theme, setTheme] = useState<ThemeMode>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    const nextTheme: ThemeMode = storedTheme === "light" ? "light" : "dark";
    document.documentElement.dataset.theme = nextTheme;
    setTheme(nextTheme);
    setMounted(true);
  }, []);

  function toggleTheme() {
    const nextTheme: ThemeMode = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = nextTheme;
    window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    setTheme(nextTheme);
  }

  return (
    <nav className="fixed inset-x-0 bottom-5 z-50 flex justify-center px-4">
      <div className="flex w-full max-w-2xl items-center justify-between rounded-full border border-border/80 bg-card/90 p-2 shadow-glow backdrop-blur-xl">
        {items.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          const showBadge =
            item.href === "/wishlist" && watchlistMatchCount > 0;

          return (
            <Link
              className={cn(
                "relative flex min-w-[72px] flex-col items-center justify-center rounded-full px-4 py-2 text-xs font-medium transition-all",
                active
                  ? "bg-primary text-white"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground",
              )}
              href={item.href}
              key={item.href}
            >
              {showBadge ? (
                <span className="absolute right-2 top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1.5 text-[10px] font-semibold text-white">
                  {watchlistMatchCount}
                </span>
              ) : null}
              <Icon className="mb-1 h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
        <button
          className={cn(
            "relative flex min-w-[72px] flex-col items-center justify-center rounded-full px-4 py-2 text-xs font-medium transition-all",
            mounted
              ? "text-muted-foreground hover:bg-secondary hover:text-foreground"
              : "text-muted-foreground",
          )}
          onClick={toggleTheme}
          type="button"
        >
          {theme === "dark" ? (
            <SunIcon className="mb-1 h-5 w-5" />
          ) : (
            <MoonIcon className="mb-1 h-5 w-5" />
          )}
          {theme === "dark" ? "Light" : "Dark"}
        </button>
      </div>
    </nav>
  );
}

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24">
      <path
        d="M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3v-10.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24">
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="m16 16 5 5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function HeartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24">
      <path
        d="M12 20.5 4.7 13.8a4.9 4.9 0 0 1 6.9-7l.4.4.4-.4a4.9 4.9 0 0 1 6.9 7L12 20.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function HelpIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24">
      <path
        d="M9.3 9a2.7 2.7 0 1 1 5.4 0c0 1.5-1.3 2.1-2.1 2.7-.8.5-1.1.9-1.1 1.8"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
      <circle cx="12" cy="17.5" r=".9" fill="currentColor" />
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function SunIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 2.5v2.2M12 19.3v2.2M21.5 12h-2.2M4.7 12H2.5M18.7 5.3l-1.6 1.6M6.9 17.1l-1.6 1.6M18.7 18.7l-1.6-1.6M6.9 6.9 5.3 5.3" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  );
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24">
      <path
        d="M20 14.2A7.8 7.8 0 1 1 9.8 4a6.4 6.4 0 0 0 10.2 10.2Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}
