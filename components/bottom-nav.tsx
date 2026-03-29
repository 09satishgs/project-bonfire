"use client";

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

export function BottomNav() {
  const pathname = usePathname();
  const watchlistMatchCount = useBonfireStore(
    (state) => state.watchlistMatches.length,
  );
  console.log("qwerty", watchlistMatchCount);

  return (
    <nav className="fixed inset-x-0 bottom-5 z-50 flex justify-center px-4">
      <div className="flex w-full max-w-md items-center justify-between rounded-full border border-white/70 bg-white/88 p-2 shadow-glow backdrop-blur-xl">
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
