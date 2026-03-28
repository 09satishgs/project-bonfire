"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getContactMethod, isValidFriendCode, isValidIgn } from "@/lib/validation";
import type { ApiErrorPayload, RegistrationPayload, RegistrationSuccess } from "@/lib/types";

const initialForm: RegistrationPayload = {
  ign: "",
  friendCode: "",
  contactLink: "",
  honeypot: "",
};

export function RegisterForm() {
  const [form, setForm] = useState<RegistrationPayload>(initialForm);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const clientValid =
    isValidIgn(form.ign) &&
    isValidFriendCode(form.friendCode) &&
    Boolean(getContactMethod(form.contactLink)) &&
    !form.honeypot;

  return (
    <Card className="border-white/70 bg-white/85 backdrop-blur">
      <CardHeader>
        <CardTitle>Add Your Contact Beacon</CardTitle>
        <CardDescription>Secure writes go through a serverless gateway and append only after validation.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();

            if (form.honeypot) {
              return;
            }

            startTransition(() => {
              void (async () => {
                setError(null);
                setMessage(null);

                try {
                  const response = await fetch("/api/register", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(form),
                  });

                  if (!response.ok) {
                    const payload = (await response.json()) as ApiErrorPayload;
                    setError(payload.error);
                    return;
                  }

                  const payload = (await response.json()) as RegistrationSuccess;
                  setMessage(payload.message);
                  setForm(initialForm);
                } catch {
                  setError("Registration failed. Please try again shortly.");
                }
              })();
            });
          }}
        >
          <div className="grid gap-4 md:grid-cols-3">
            <Input
              onChange={(event) => setForm((current) => ({ ...current, ign: event.target.value }))}
              placeholder="IGN"
              required
              value={form.ign}
            />
            <Input
              onChange={(event) => setForm((current) => ({ ...current, friendCode: event.target.value }))}
              placeholder="Friend Code"
              required
              value={form.friendCode}
            />
            <Input
              onChange={(event) => setForm((current) => ({ ...current, contactLink: event.target.value }))}
              placeholder="Reddit URL, Discord handle, or email"
              required
              value={form.contactLink}
            />
          </div>
          <Input
            aria-hidden="true"
            autoComplete="off"
            className="hidden"
            onChange={(event) => setForm((current) => ({ ...current, honeypot: event.target.value }))}
            tabIndex={-1}
            value={form.honeypot}
          />
          <div className="flex flex-wrap items-center gap-3">
            <Button disabled={!clientValid || isPending} type="submit">
              {isPending ? "Submitting..." : "Register"}
            </Button>
            <span className="text-sm text-muted-foreground">
              IGN must be 3-15 chars. Friend code must be 12 digits.
            </span>
          </div>
          {message ? <p className="text-sm font-medium text-emerald-700">{message}</p> : null}
          {error ? <p className="text-sm font-medium text-danger">{error}</p> : null}
        </form>
      </CardContent>
    </Card>
  );
}
