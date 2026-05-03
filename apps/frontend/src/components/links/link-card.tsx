"use client";

import { useState } from "react";
import { Check, Copy, ExternalLink, QrCode, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { readError } from "@/lib/api";
import { QRBlock } from "@/components/qr-block";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Link } from "@/lib/types";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface LinkCardProps {
  link: Link;
  isNew?: boolean;
  onDisable: (id: string) => void;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-SG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function fmtRelative(iso: string): string {
  const now = Date.now();
  const diff = (now - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}d ago`;
  return fmtDate(iso);
}

function shortHost(url: string): string {
  try {
    return new URL(url).host.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function LinkCard({ link, isNew, onDisable }: LinkCardProps) {
  const [copied, setCopied] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const expired = link.expiresAt && new Date(link.expiresAt) < new Date();
  const status: "active" | "expired" | "inactive" = !link.isActive
    ? "inactive"
    : expired
      ? "expired"
      : "active";
  const canShare = status === "active";
  const statusLabel =
    status === "active"
      ? "Active"
      : status === "expired"
        ? "Expired"
        : "Disabled";

  const host = shortHost(link.shortUrl);

  function handleCopy() {
    void navigator.clipboard.writeText(link.shortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  async function handleDisable() {
    try {
      const response = await fetch(`/api/links/${link.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) throw new Error(await readError(response));
      onDisable(link.id);
      toast.success("Link disabled");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Unable to disable link",
      );
    } finally {
      setConfirmDelete(false);
    }
  }

  return (
    <>
      <Card
        className={cn(
          "overflow-hidden rounded-2xl border-line bg-white p-0 transition-[border-color,box-shadow,transform] hover:-translate-y-0.5 hover:border-stone-300 hover:shadow-[0_18px_50px_rgb(31_27_20/0.08)]",
          status !== "active" && "bg-stone-50",
          isNew && "animate-[trace-slide-in_380ms_cubic-bezier(0.2,0.8,0.2,1)]",
        )}
      >
        <div
          className={cn(
            "grid items-stretch",
            canShare
              ? "grid-cols-[4px_1fr_auto] max-sm:grid-cols-[4px_1fr]"
              : "grid-cols-[4px_1fr]",
          )}
        >
          <div
            className={cn(
              "w-full",
              status === "active" ? "bg-green-600" : "bg-stone-300",
            )}
            aria-hidden="true"
          />

          <div className="min-w-0 px-5 py-4.5 sm:px-6 sm:py-5">
            <div className="mb-2 flex min-w-0 flex-wrap items-center gap-2">
              <a
                href={link.shortUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "min-w-0 truncate font-mono text-lg font-bold tracking-ui hover:underline sm:text-xl",
                  status !== "active" && "line-through decoration-stone-400",
                )}
              >
                <span className="font-medium text-stone-400">{host}/</span>
                <span
                  className={cn(
                    status === "active" ? "text-green-800" : "text-stone-400",
                  )}
                >
                  {link.shortCode}
                </span>
              </a>
            </div>

            <div className="flex items-center gap-1.5 truncate rounded-lg bg-stone-50 px-2.5 py-2 text-sm text-stone-500">
              <ExternalLink className="size-3 shrink-0 text-stone-400" />
              <span className="truncate">{link.originalUrl}</span>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-x-3.5 gap-y-1.5 text-xs text-stone-400">
              <span className="inline-flex items-center gap-1.5 font-semibold text-stone-500">
                <span
                  className={cn(
                    "size-1.5 rounded-full",
                    status === "active" ? "bg-green-600" : "bg-stone-300",
                  )}
                />
                {statusLabel}
              </span>
              <span>·</span>
              <span>Created {fmtRelative(link.createdAt)}</span>
              {link.expiresAt && (
                <>
                  <span>·</span>
                  <span>
                    {expired ? "Expired" : "Expires"} {fmtDate(link.expiresAt)}
                  </span>
                </>
              )}
            </div>
          </div>

          {canShare && (
            <div className="flex items-center gap-2 px-5 py-4.5 max-sm:col-start-2 max-sm:pt-0 sm:px-6 sm:py-5">
              <Button
                variant="outline"
                size="icon-lg"
                onClick={() => setQrOpen(!qrOpen)}
                aria-label="Show QR code"
                title="QR code"
                className={cn(
                  "size-10 border-line shadow-[0_1px_0_rgb(31_27_20/0.04)]",
                  qrOpen
                    ? "bg-stone-100 text-ink"
                    : "bg-white text-stone-500 hover:text-ink",
                )}
              >
                <QrCode className="size-4" />
              </Button>

              <Button
                variant="outline"
                onClick={handleCopy}
                className={cn(
                  "h-10 gap-1.5 border-line px-3.5 text-sm font-semibold shadow-[0_1px_0_rgb(31_27_20/0.04)]",
                  copied
                    ? "border-green-200 bg-green-50 text-green-800"
                    : "bg-white text-ink",
                )}
              >
                {copied ? (
                  <Check className="size-4" />
                ) : (
                  <Copy className="size-4" />
                )}
              </Button>

              <Button
                variant="outline"
                size="icon-lg"
                onClick={() => setConfirmDelete(true)}
                aria-label="Disable link"
                title="Disable"
                className="size-10 border-line bg-white text-stone-400 hover:border-red-300 hover:bg-red-50 hover:text-brand-dark"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          )}
        </div>

        {canShare && qrOpen && (
          <div className="mx-5 mb-5 flex animate-[trace-fade-in_240ms_ease-out] items-center gap-5 border-t border-dashed border-line-soft pt-4.5 max-sm:flex-col max-sm:items-start sm:mx-6">
            <div className="shrink-0 rounded-lg border border-line bg-white p-2.5">
              <QRBlock value={link.shortUrl} size={108} />
            </div>
            <div className="flex-1">
              <div className="mb-1 text-sm font-semibold text-ink">
                Scan or share
              </div>
              <p className="max-w-[360px] text-sm leading-normal text-stone-500">
                Embed this QR in posters or printed materials. Anyone scanning
                lands on the same verified short link.
              </p>
            </div>
          </div>
        )}
      </Card>

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent
          showCloseButton={false}
          className="max-w-110 bg-white p-7 ring-0 shadow-[0_30px_80px_rgb(0_0_0/0.25)]"
        >
          <DialogHeader>
            <DialogTitle className="text-lg font-bold tracking-ui text-ink">
              Disable this link?
            </DialogTitle>
            <DialogDescription className="text-sm leading-normal text-stone-500">
              <span className="font-mono text-ink">
                {host}/{link.shortCode}
              </span>{" "}
              will stop redirecting immediately.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
            <DialogClose
              render={
                <Button
                  variant="outline"
                  className="h-10 border-line bg-white px-4.5 text-sm font-semibold text-ink"
                />
              }
            >
              Cancel
            </DialogClose>
            <Button
              onClick={() => void handleDisable()}
              className="h-10 bg-brand px-4.5 text-sm font-semibold text-white hover:bg-brand-dark"
            >
              Disable link
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
