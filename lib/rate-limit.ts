import { MAX_REGISTRATIONS_PER_HOUR, RATE_LIMIT_WINDOW_MS } from "@/lib/constants";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const requestsByIp = new Map<string, RateLimitEntry>();

export function checkRateLimit(ip: string): { allowed: true } | { allowed: false; retryAfterMs: number } {
  const now = Date.now();
  const current = requestsByIp.get(ip);

  if (!current || current.resetAt <= now) {
    requestsByIp.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true };
  }

  if (current.count >= MAX_REGISTRATIONS_PER_HOUR) {
    return { allowed: false, retryAfterMs: current.resetAt - now };
  }

  current.count += 1;
  requestsByIp.set(ip, current);
  return { allowed: true };
}
