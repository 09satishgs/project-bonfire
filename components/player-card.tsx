"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTagLabel } from "@/lib/registration-metadata";
import { cn, getLocalTimestamp } from "@/lib/utils";
import type { PlayerRecord } from "@/lib/types";
import { useBonfireStore } from "@/stores/bonfire-store";
import { Input } from "./ui/input";

interface PlayerCardProps {
  player: PlayerRecord;
  adminEmail: string;
  titleSuffix?: string;
}

type ModerationMode = "correct" | "report";

interface ModerationDraft {
  reporterName: string;
  reporterContact: string;
  summary: string;
  details: string;
  expectedFix: string;
  evidenceNames: string[];
}

const initialDraft: ModerationDraft = {
  reporterName: "",
  reporterContact: "",
  summary: "",
  details: "",
  expectedFix: "",
  evidenceNames: [],
};

export function PlayerCard({
  player,
  adminEmail,
  titleSuffix,
}: PlayerCardProps) {
  const [copied, setCopied] = useState(false);
  const [contactCopied, setContactCopied] = useState(false);
  const [openModal, setOpenModal] = useState<ModerationMode | null>(null);
  const [draft, setDraft] = useState<ModerationDraft>(initialDraft);
  const [mounted, setMounted] = useState(false);
  const contactPlatforms = useBonfireStore((state) => state.contactPlatforms);
  const tagOptions = useBonfireStore((state) => state.tagOptions);
  const contactHref =
    player.contactKind === "link_contact" ? player.contactLink : null;
  const contactLabel =
    contactPlatforms.find((platform) => platform.key === player.contactMethod)
      ?.label ?? player.contactMethod;

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  function openDialog(mode: ModerationMode) {
    setDraft(initialDraft);
    setOpenModal(mode);
  }

  function closeDialog() {
    setOpenModal(null);
    setDraft(initialDraft);
  }

  function buildMailto(mode: ModerationMode): string {
    const subjectPrefix = mode === "correct" ? "Correction" : "Report";
    const headline =
      mode === "correct"
        ? "A user noticed something wrong in this player card."
        : "A user reported this player card as invalid, misleading, or unrelated.";
    const attachmentReminder =
      "Please attach the image or video evidence(s) manually before sending.";
    const body = [
      `PoGo-Bonfire ${subjectPrefix} Request`,
      "",
      headline,
      "",
      "Player Card Snapshot",
      `IGN: ${player.ign}`,
      `Friend Code: ${player.friendCode || "Not listed"}`,
      `Contact Type: ${contactLabel}`,
      `Contact Link: ${player.contactLink}`,
      `Tags: ${player.tags.map((tag) => getTagLabel(tag, tagOptions)).join(", ") || "None"}`,
      "",
      "Issue Summary",
      draft.summary || "Not provided",
      "",
      mode === "correct"
        ? "Suggested Correction"
        : "Why This Should Be Reviewed",
      draft.expectedFix || "Not provided",
      "",
      "Additional Details",
      draft.details || "Not provided",
      "",
      attachmentReminder,
    ].join("\n");

    return `mailto:${adminEmail}?subject=${encodeURIComponent(`${subjectPrefix}:${player.ign}`)}&body=${encodeURIComponent(body)}`;
  }
  const formatFriendCode = (code:string):string=>{
    if(code?.length===12){
      return code.match(/.{1,4}/g).join(' ');
    }
    return "";
  }
  return (
    <>
      <Card className="flex h-full flex-col border-border/80 bg-card/85 backdrop-blur">
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div className="space-y-2">
            <CardTitle className="text-xl">
              {player.ign}
              {titleSuffix ? (
                <span className="ml-2 rounded-full border border-border/70 bg-background/80 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {titleSuffix}
                </span>
              ) : null}
            </CardTitle>
            <div className="flex flex-wrap gap-2">
              <Badge>{contactLabel}</Badge>
              {player.tags.map((tag) => (
                <Badge className="bg-accent/80" key={tag}>
                  {getTagLabel(tag, tagOptions)}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs">Created on:</label>
            <div className="text-xs">
              {getLocalTimestamp(player.createdAt ?? "")}
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col gap-4 text-sm">
          <div>
            <div className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
              Friend Code
            </div>
            {player.friendCode ? (
              <button
                className="mt-1 inline-flex w-full items-center justify-between rounded-md border border-border bg-background px-3 py-2 font-mono text-base transition-colors hover:bg-accent"
                onClick={async () => {
                  await navigator.clipboard.writeText(player.friendCode);
                  setCopied(true);
                  window.setTimeout(() => setCopied(false), 1500);
                }}
                type="button"
              >
                <span>{formatFriendCode(player.friendCode)}</span>
                <span className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  {copied ? "Copied" : "Copy"}
                  <CopyIcon className="h-4 w-4" />
                </span>
              </button>
            ) : (
              <div className="mt-1 font-mono text-base">Not listed</div>
            )}
          </div>
          <div>
            <div className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
              Contact ({contactLabel}
              {player.contactKind !== "link_contact" ? "ID" : "Link"})
            </div>
            {player.contactKind === "link_contact" && contactHref ? (
              <a
                className="mt-1 block break-all font-medium text-primary underline-offset-4 hover:underline"
                href={contactHref}
                rel="noreferrer"
                target="_blank"
              >
                {player.contactLink}
              </a>
            ) : (
              <div className="mt-1 space-y-2">
                <button
                  className="inline-flex min-h-10 w-full items-center justify-between gap-2 rounded-md border border-border bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
                  onClick={async () => {
                    await navigator.clipboard.writeText(player.contactLink);
                    setContactCopied(true);
                    window.setTimeout(() => setContactCopied(false), 1500);
                  }}
                  type="button"
                >
                  <span className="break-all text-left">
                    {player.contactLink}
                  </span>
                  <span className="flex shrink-0 items-center gap-2 text-muted-foreground">
                    {contactCopied ? "Copied" : "Copy"}
                    <CopyIcon className="h-4 w-4" />
                  </span>
                </button>
              </div>
            )}
          </div>
          <div className="mt-auto grid grid-cols-2 gap-3 pt-2">
            <button
              className={cn(
                "inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-orange-500/30 bg-orange-500/50 px-4 text-sm font-medium text-orange-700 transition-colors hover:bg-orange-500 hover:text-white",
                "dark:text-orange-100",
              )}
              onClick={() => openDialog("correct")}
              type="button"
            >
              <CorrectIcon className="h-4 w-4" />
              Correct
            </button>
            <button
              className={cn(
                "inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-danger/30 bg-danger/50 px-4 text-sm font-medium text-red-700 transition-colors hover:bg-danger hover:text-white",
                "dark:text-red-100",
              )}
              onClick={() => openDialog("report")}
              type="button"
            >
              <FlagIcon className="h-4 w-4" />
              Report
            </button>
          </div>
        </CardContent>
      </Card>

      {mounted && openModal
        ? createPortal(
            <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4">
              <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[1.5rem] border border-border/80 bg-card p-6 shadow-glow">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-semibold">
                      {openModal === "correct"
                        ? "Correct This Player Card"
                        : "Report This Player Card"}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Fill this out and we&apos;ll open your mail app with a
                      polished draft. Attach any image or video evidence
                      manually before sending.
                    </p>
                  </div>
                  <Button onClick={closeDialog} type="button" variant="ghost">
                    Close
                  </Button>
                </div>

                <div className="mt-6 grid gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Issue Summary</label>
                    <Input
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          summary: event.target.value,
                        }))
                      }
                      placeholder={
                        openModal === "correct"
                          ? "Example: Friend code has one wrong digit"
                          : "Example: Contact link redirects to an unrelated page"
                      }
                      value={draft.summary}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      {openModal === "correct"
                        ? "Suggested Correction"
                        : "Why This Should Be Reviewed"}
                    </label>
                    <Input
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          expectedFix: event.target.value,
                        }))
                      }
                      placeholder={
                        openModal === "correct"
                          ? "Example: Replace 1234 with 1284"
                          : "Example: The listed profile belongs to a different person"
                      }
                      value={draft.expectedFix}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Additional Details
                    </label>
                    <textarea
                      className="min-h-32 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          details: event.target.value,
                        }))
                      }
                      placeholder="Describe what you noticed and any context that will help admin review it quickly."
                      value={draft.details}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Evidence Files
                    </label>
                    <p className="text-xs text-muted-foreground">
                      Please attach any necessary video / image evidences
                      supporting the report with the mail.
                    </p>
                  </div>

                  <div className="flex flex-wrap justify-end gap-3 pt-2">
                    <Button
                      onClick={closeDialog}
                      type="button"
                      variant="outline"
                    >
                      Cancel
                    </Button>
                    <a href={buildMailto(openModal)}>
                      <Button type="button">Open Email Draft</Button>
                    </a>
                  </div>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24">
      <rect
        height="13"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.8"
        width="11"
        x="9"
        y="7"
      />
      <path
        d="M15 7V5a2 2 0 0 0-2-2H6A2 2 0 0 0 4 5v9a2 2 0 0 0 2 2h3"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function CorrectIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24">
      <path
        d="m4 16 4.5 4.5L20 9"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="M20 15v4a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h11"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function FlagIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24">
      <path
        d="M6 21V5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
      <path
        d="M6 5c4-2.5 8 2.5 12 0v9c-4 2.5-8-2.5-12 0"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}
