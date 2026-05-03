"use client";

import { FormEvent, useState } from "react";
import { ArrowRight, Link2 } from "lucide-react";
import { toast } from "sonner";
import { readError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { panelCard } from "@/lib/styles";
import { cn } from "@/lib/utils";
import type { Link } from "@/lib/types";

const EXPIRY_PRESETS = [
  { id: "never", label: "Never", shortLabel: "Never" },
  { id: "24h", label: "24 hours", shortLabel: "24 h" },
  { id: "7d", label: "7 days", shortLabel: "7 d" },
  { id: "30d", label: "30 days", shortLabel: "30 d" },
] as const;

type ExpiryPreset = (typeof EXPIRY_PRESETS)[number]["id"];

function expiryToDate(preset: ExpiryPreset): string | undefined {
  if (preset === "never") return undefined;
  const now = new Date();
  if (preset === "24h") now.setHours(now.getHours() + 24);
  else if (preset === "7d") now.setDate(now.getDate() + 7);
  else if (preset === "30d") now.setDate(now.getDate() + 30);
  return now.toISOString();
}

interface CreateLinkFormProps {
  onCreated: (link: Link) => void;
}

export function CreateLinkForm({ onCreated }: CreateLinkFormProps) {
  const [url, setUrl] = useState("");
  const [expiry, setExpiry] = useState<ExpiryPreset>("never");
  const [customCode, setCustomCode] = useState("");
  const [saving, setSaving] = useState(false);

  const validUrl = /^https?:\/\/.+/.test(url);
  const validCustomCode =
    customCode === "" ||
    (/^[0-9a-zA-Z-]+$/.test(customCode) && customCode.length >= 3);
  const canSubmit = validUrl && validCustomCode && !saving;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;
    setSaving(true);

    try {
      const expiresAt = expiryToDate(expiry);
      const response = await fetch("/api/links", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originalUrl: url,
          ...(expiresAt ? { expiresAt } : {}),
          ...(customCode ? { customShortCode: customCode } : {}),
        }),
      });

      if (!response.ok) throw new Error(await readError(response));

      const link = (await response.json()) as Link;
      onCreated(link);
      setUrl("");
      setExpiry("never");
      setCustomCode("");
      toast.success("Short link created!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to create link");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-2">
      <Card className={cn(panelCard, "p-7")}>
        <form onSubmit={handleSubmit}>
          <div className="mb-5">
            <h2 className="text-xl font-bold tracking-heading text-ink">
              New short link
            </h2>
            <p className="mt-1 text-sm text-stone-500">
              Paste a long URL. Customise the alias if you want.
            </p>
          </div>

          <div className="mb-3.5">
            <Label className="mb-2 text-2xs font-bold tracking-micro text-stone-400 uppercase">
              Destination URL
            </Label>
            <div
              className={cn(
                "flex h-13 items-center gap-2.5 rounded-lg border-[1.5px] bg-surface px-3.5 transition-colors",
                url && !validUrl ? "border-red-300" : "border-line-soft",
              )}
            >
              <Link2 className="size-4.5 shrink-0 text-stone-400" />
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/very-long-url"
                required
                className="h-full min-w-0 flex-1 border-0 bg-transparent p-0 text-base text-ink outline-none placeholder:text-stone-400 focus:ring-0"
              />
            </div>
          </div>

          <div className="mb-5 grid grid-cols-2 gap-3.5 max-sm:grid-cols-1">
            <div>
              <Label className="mb-2 text-2xs font-bold tracking-micro text-stone-400 uppercase">
                Expires after
              </Label>
              <Tabs
                value={expiry}
                onValueChange={(v) => setExpiry(v as ExpiryPreset)}
              >
                <TabsList className="!h-13 w-full gap-1 rounded-lg bg-stone-100 p-1 sm:gap-1.5 sm:p-1.5">
                  {EXPIRY_PRESETS.map((p) => (
                    <TabsTrigger
                      key={p.id}
                      value={p.id}
                      className="text-xs sm:text-sm"
                    >
                      <span className="hidden sm:inline">{p.label}</span>
                      <span className="sm:hidden">{p.shortLabel}</span>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>

            <div>
              <Label className="mb-2 text-2xs font-bold tracking-micro text-stone-400 uppercase">
                Custom alias{" "}
                <span className="font-normal tracking-normal normal-case">
                  (optional)
                </span>
              </Label>
              <Input
                type="text"
                value={customCode}
                onChange={(e) => setCustomCode(e.target.value)}
                placeholder="my-link"
                maxLength={50}
                className={cn(
                  "h-13 rounded-lg border-[1.5px] bg-surface px-3.5 text-base text-ink placeholder:text-stone-400",
                  customCode && !validCustomCode
                    ? "border-red-300"
                    : "border-line-soft",
                )}
              />
              {customCode && !validCustomCode && (
                <p className="mt-1 text-xs text-brand-dark">
                  Min 3 chars, letters, numbers, and hyphens only
                </p>
              )}
            </div>
          </div>

          <Button
            type="submit"
            disabled={!canSubmit}
            className="h-13 w-full rounded-lg bg-brand text-base font-semibold tracking-dense text-white hover:bg-brand-dark"
          >
            {saving ? (
              <>
                <svg className="size-4 animate-spin" viewBox="0 0 24 24">
                  <circle
                    cx="12"
                    cy="12"
                    r="9"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeOpacity="0.3"
                  />
                  <path
                    d="M21 12a9 9 0 0 0-9-9"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </svg>
                Minting your link...
              </>
            ) : (
              <>
                Shorten link
                <ArrowRight className="size-4" />
              </>
            )}
          </Button>
        </form>
      </Card>
    </div>
  );
}
