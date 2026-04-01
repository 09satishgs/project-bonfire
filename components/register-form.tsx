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
  isValidFriendCode,
  isValidIgn,
  buildContactValue,
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
  contactId: "",
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
    Boolean(form.contactId.trim()) &&
    !form.honeypot;
  const selectedContactPlatform = contactPlatforms.find(
    (platform) => platform.key === form.contactMethod,
  );
  const contactPreview = selectedContactPlatform
    ? buildContactValue(selectedContactPlatform.pattern, form.contactId)
    : "";

  return (
    <Card className="border-border/80 bg-card/85 backdrop-blur">
      <CardHeader>
        <CardTitle>Add Your Contact Beacon</CardTitle>
        <CardDescription>
          Securely updates to database. Please note it can take upto 12 hours to
          reflect your registration in global directory.
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
            <Select
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  contactMethod: event.target.value,
                }))
              }
              value={form.contactMethod}
            >
              <option value="">Select contact method</option>
              {contactPlatforms.map((platform) => (
                <option key={platform.key} value={platform.key}>
                  {platform.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="grid gap-4 md:grid-cols-[1fr,1.4fr]">
            <div className="space-y-2">
              <label
                className="text-sm font-medium text-foreground"
                htmlFor="contact-id"
              >
                Contact ID
              </label>
              <Input
                id="contact-id"
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    contactId: event.target.value,
                  }))
                }
                placeholder="Username, profile name, or ID"
                value={form.contactId}
              />
              {contactPreview ? (
                <p className="text-xs text-muted-foreground">
                  Stored as: {contactPreview}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Choose a contact method and enter the matching username or ID.
                </p>
              )}
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
