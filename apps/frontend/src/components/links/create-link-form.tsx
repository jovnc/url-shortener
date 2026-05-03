"use client";

import { FormEvent, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { readError } from "@/lib/api";
import { warmCard, tallInput } from "@/lib/styles";
import type { Link } from "@/lib/types";

interface CreateLinkFormProps {
  onCreated: (link: Link) => void;
}

export function CreateLinkForm({ onCreated }: CreateLinkFormProps) {
  const [originalUrl, setOriginalUrl] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const response = await fetch("/api/links", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originalUrl,
          ...(expiresAt
            ? { expiresAt: new Date(expiresAt).toISOString() }
            : {}),
        }),
      });

      if (!response.ok) throw new Error(await readError(response));

      const link = (await response.json()) as Link;
      onCreated(link);
      setOriginalUrl("");
      setExpiresAt("");
      toast.success("Short link created!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create link");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-3">
      <Card className={warmCard}>
        <CardContent className="pt-5 pb-5">
          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-[1fr_220px_auto] items-end gap-3.5 max-[760px]:grid-cols-1"
          >
            <div className="grid gap-2">
              <Label
                htmlFor="url"
                className="text-[13px] font-bold uppercase tracking-widest text-[--app-muted]"
              >
                Destination URL
              </Label>
              <Input
                id="url"
                required
                type="url"
                placeholder="https://example.com/long-url"
                value={originalUrl}
                onChange={(e) => setOriginalUrl(e.target.value)}
                className={cn(tallInput)}
              />
            </div>

            <div className="grid gap-2">
              <Label
                htmlFor="expires"
                className="text-[13px] font-bold uppercase tracking-widest text-[--app-muted]"
              >
                Expiry, optional
              </Label>
              <Input
                id="expires"
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className={cn(tallInput)}
              />
            </div>

            <Button
              type="submit"
              disabled={saving}
              className="h-11.5 gap-1.5 rounded-full px-5"
            >
              <Plus className="size-4" />
              {saving ? "Creating…" : "Create short link"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {error && <p className="error text-sm">{error}</p>}
    </div>
  );
}
