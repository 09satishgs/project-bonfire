"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { setMyRegistration } from "@/lib/idb";
import {
  getContactMethod,
  isValidFriendCode,
  isValidIgn,
} from "@/lib/validation";
import { useBonfireStore } from "@/stores/bonfire-store";
import type {
  ApiErrorPayload,
  RegistrationPayload,
  RegistrationSuccess,
} from "@/lib/types";

const initialForm: RegistrationPayload = {
  ign: "",
  friendCode: "",
  contactLink: "",
  contactMethod: "",
  tagIndexes: "",
  honeypot: "",
};

interface RegisterFormProps {
  onRegistered?: (record: RegistrationSuccess["record"]) => void;
}

export function RegisterForm({ onRegistered }: RegisterFormProps) {
  const [form, setForm] = useState<RegistrationPayload>(initialForm);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const contactPlatforms = useBonfireStore((state) => state.contactPlatforms);
  const tagOptions = useBonfireStore((state) => state.tagOptions);

  const clientValid =
    isValidIgn(form.ign) &&
    (!form.friendCode.trim() || isValidFriendCode(form.friendCode)) &&
    Boolean(form.contactMethod) &&
    !form.honeypot;

  return (
    <Card className="border-white/70 bg-white/85 backdrop-blur">
      <CardHeader>
        <CardTitle>Add Your Contact Beacon</CardTitle>
        <CardDescription>
          Secure writes go through a serverless gateway and append only after
          validation.
        </CardDescription>
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

                  const payload =
                    (await response.json()) as RegistrationSuccess;
                  await setMyRegistration(payload.record);
                  onRegistered?.(payload.record);
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
              onChange={(event) =>
                setForm((current) => ({ ...current, ign: event.target.value }))
              }
              placeholder="IGN"
              required
              value={form.ign}
            />
            <Input
              inputMode="numeric"
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  friendCode: event.target.value.replace(/[^\d\s]/g, ""),
                }))
              }
              placeholder="Friend Code (Optional)"
              value={form.friendCode}
            />
            <Input
              onChange={(event) => {
                const contactLink = event.target.value;
                const detectedMethod =
                  getContactMethod(contactLink, contactPlatforms) ?? "";
                setForm((current) => ({
                  ...current,
                  contactLink,
                  contactMethod: detectedMethod,
                }));
              }}
              placeholder={`Paste a ${contactPlatforms?.map(({ label }) => label).join("/ ")} profile link`}
              required
              value={form.contactLink}
            />
          </div>
          <div className="grid gap-4 md:grid-cols-[1fr,1.4fr]">
            <div className="space-y-2">
              <label
                className="text-sm font-medium text-foreground"
                htmlFor="contact-method"
              >
                Contact Type
              </label>
              <Select
                className="bg-muted text-muted-foreground"
                disabled
                id="contact-method"
                value={form.contactMethod}
              >
                <option value="">Auto-detected from link</option>
                {contactPlatforms.map((platform) => (
                  <option key={platform.key} value={platform.key}>
                    {platform.label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium text-foreground">Tags</div>
              <div className="flex flex-wrap gap-2">
                {tagOptions.map((tag) => {
                  const selectedValues = form.tagIndexes
                    ? form.tagIndexes.split(",").filter(Boolean)
                    : [];
                  const isSelected = selectedValues.includes(String(tag.index));

                  return (
                    <button
                      className={[
                        "rounded-full border px-3 py-2 text-sm transition-colors",
                        isSelected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background text-foreground hover:bg-secondary",
                      ].join(" ")}
                      key={tag.index}
                      onClick={() => {
                        const currentIndexes = form.tagIndexes
                          ? form.tagIndexes.split(",").filter(Boolean)
                          : [];
                        const nextIndexes = isSelected
                          ? currentIndexes.filter(
                              (entry) => entry !== String(tag.index),
                            )
                          : currentIndexes.length < 3
                            ? [...currentIndexes, String(tag.index)]
                            : currentIndexes;

                        setForm((current) => ({
                          ...current,
                          tagIndexes: nextIndexes.join(","),
                        }));
                      }}
                      type="button"
                    >
                      {tag.label}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                Select up to 3 tags. Stored as index values like `0,2,3`.
              </p>
            </div>
          </div>
          <Input
            aria-hidden="true"
            autoComplete="off"
            className="hidden"
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                honeypot: event.target.value,
              }))
            }
            tabIndex={-1}
            value={form.honeypot}
          />
          <div className="flex flex-wrap items-center gap-3">
            <Button disabled={!clientValid || isPending} type="submit">
              {isPending ? "Submitting..." : "Register"}
            </Button>
            <span className="text-sm text-muted-foreground">
              IGN is required. Friend Code is optional but must be 12 digits if
              included.
            </span>
          </div>
          {message ? (
            <p className="text-sm font-medium text-emerald-700">{message}</p>
          ) : null}
          {error ? (
            <p className="text-sm font-medium text-danger">{error}</p>
          ) : null}
        </form>
      </CardContent>
    </Card>
  );
}
