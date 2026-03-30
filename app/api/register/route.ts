import { NextResponse } from "next/server";

import { appendRegistration, getExistingIgns } from "@/lib/google-sheets";
import { fetchRegistrationMetadata, getRegistrationMetadataUrl } from "@/lib/registration-metadata";
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

  try {
    const registrationMetadata = await fetchRegistrationMetadata(getRegistrationMetadataUrl());
    const validatedPayload = validateRegistrationPayload(
      payload,
      registrationMetadata.contactPlatforms,
      registrationMetadata.tagOptions,
    );

    if (!validatedPayload.ok) {
      return NextResponse.json<ApiErrorPayload>({ error: validatedPayload.error }, { status: 400 });
    }

    const existingIgns = await getExistingIgns();
    const exists = existingIgns.some((ign) => normalizeIgn(ign) === normalizeIgn(validatedPayload.normalized.ign));

    if (exists) {
      return NextResponse.json<ApiErrorPayload>({ error: "That IGN is already registered." }, { status: 409 });
    }

    await appendRegistration(validatedPayload.normalized);

    return NextResponse.json<RegistrationSuccess>(
      {
        message: "Registration created. Your entry will appear after the next CSV refresh.",
        record: validatedPayload.normalized,
      },
      { status: 201 },
    );
  } catch (caughtError) {
    const message = caughtError instanceof Error ? caughtError.message : "Unable to register right now.";
    return NextResponse.json<ApiErrorPayload>({ error: message }, { status: 500 });
  }
}
