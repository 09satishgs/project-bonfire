import { NextResponse } from "next/server";

import { appendRegistration, getExistingIgns } from "@/lib/google-sheets";
import { checkRateLimit } from "@/lib/rate-limit";
import { normalizeIgn } from "@/lib/utils";
import { validateRegistrationPayload } from "@/lib/validation";
import type { ApiErrorPayload, RegistrationPayload, RegistrationSuccess } from "@/lib/types";

function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() ?? "unknown";
  }

  return request.headers.get("x-real-ip") ?? "unknown";
}

export async function POST(request: Request) {
  let payload: RegistrationPayload;

  try {
    payload = (await request.json()) as RegistrationPayload;
  } catch {
    return NextResponse.json<ApiErrorPayload>({ error: "Invalid JSON payload." }, { status: 400 });
  }

  if (payload.honeypot) {
    return NextResponse.json<ApiErrorPayload>({ error: "Bad Request" }, { status: 400 });
  }

  const rateLimit = checkRateLimit(getClientIp(request));
  if (!rateLimit.allowed) {
    return NextResponse.json<ApiErrorPayload>(
      { error: "Rate limit exceeded. Try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil(rateLimit.retryAfterMs / 1000)),
        },
      },
    );
  }

  const validation = validateRegistrationPayload(payload);
  if (!validation.ok) {
    return NextResponse.json<ApiErrorPayload>({ error: validation.error }, { status: 400 });
  }

  try {
    const existingIgns = await getExistingIgns();
    const exists = existingIgns.some((ign) => normalizeIgn(ign) === normalizeIgn(validation.normalized.ign));

    if (exists) {
      return NextResponse.json<ApiErrorPayload>({ error: "That IGN is already registered." }, { status: 409 });
    }

    await appendRegistration(validation.normalized);

    return NextResponse.json<RegistrationSuccess>(
      {
        message: "Registration created. Your entry will appear after the next CSV refresh.",
        record: validation.normalized,
      },
      { status: 201 },
    );
  } catch (caughtError) {
    const message = caughtError instanceof Error ? caughtError.message : "Unable to register right now.";
    return NextResponse.json<ApiErrorPayload>({ error: message }, { status: 500 });
  }
}
