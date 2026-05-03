"use client";

import { useState } from "react";
import {
  Check,
  Copy,
  ExternalLink,
  QrCode,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { readError } from "@/lib/api";
import { QRBlock } from "@/components/qr-block";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Link } from "@/lib/types";

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
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

interface DeleteModalProps {
  link: Link;
  onConfirm: () => void;
  onCancel: () => void;
}

function DeleteModal({ link, onConfirm, onCancel }: DeleteModalProps) {
  return (
    <div
      onClick={onCancel}
      className="fixed inset-0 z-50 flex animate-[trace-fade-in_180ms_ease-out] items-center justify-center bg-[rgb(26_23_20/0.42)] p-4 backdrop-blur"
    >
      <Card
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[440px] animate-[trace-pop-in_240ms_cubic-bezier(0.2,0.8,0.2,1)] border-0 bg-white p-7 shadow-[0_30px_80px_rgb(0_0_0/0.25)]"
      >
        <div className="mb-4 flex size-11 items-center justify-center rounded-xl bg-(--red-tint) text-(--red-deeper)">
          <Trash2 className="size-5" />
        </div>
        <h3 className="mb-1.5 text-lg font-bold tracking-[-0.01em] text-(--app-foreground)">
          Disable this link?
        </h3>
        <p className="mb-5 text-sm leading-normal text-[#7A6F5C]">
          <span className="font-mono text-(--app-foreground)">
            {shortHost(link.shortUrl)}/{link.shortCode}
          </span>{" "}
          will stop redirecting immediately.
        </p>
        <div className="flex justify-end gap-2.5">
          <Button
            variant="outline"
            onClick={onCancel}
            className="h-10 border-(--line) bg-white px-4.5 text-sm font-semibold text-(--app-foreground)"
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            className="h-10 bg-(--red-primary) px-4.5 text-sm font-semibold text-white hover:bg-(--red-dark)"
          >
            Disable link
          </Button>
        </div>
      </Card>
    </div>
  );
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
          "rounded-xl border-(--line) bg-white p-6 transition-[border-color,box-shadow] hover:border-[#D9D2C5] hover:shadow-[0_8px_30px_rgb(31_27_20/0.06)]",
          isNew && "animate-[trace-slide-in_380ms_cubic-bezier(0.2,0.8,0.2,1)]",
        )}
      >
        <div className="grid grid-cols-[1fr_auto] items-center gap-5 max-sm:grid-cols-1 max-sm:items-stretch">
          <div className="min-w-0">
            <div className="mb-1.5 flex items-center gap-2">
              <span
                className={cn(
                  "truncate font-mono text-lg font-bold tracking-[-0.01em]",
                  status !== "active" && "line-through decoration-[#9A8E78]",
                )}
              >
                <span className="font-medium text-[#9A8E78]">{host}/</span>
                <span
                  className={cn(
                    status === "active"
                      ? "text-(--red-primary)"
                      : "text-[#9A8E78]",
                  )}
                >
                  {link.shortCode}
                </span>
              </span>
              {status === "expired" && (
                <Badge className="h-auto rounded bg-[#F5F1E8] px-1.5 py-0.5 text-[10px] font-bold tracking-[0.04em] text-[#7A6F5C] uppercase">
                  Expired
                </Badge>
              )}
              {status === "inactive" && (
                <Badge className="h-auto rounded bg-[#F5F1E8] px-1.5 py-0.5 text-[10px] font-bold tracking-[0.04em] text-[#7A6F5C] uppercase">
                  Disabled
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-1.5 truncate text-[13px] text-[#7A6F5C]">
              <ExternalLink className="size-3 shrink-0 text-[#9A8E78]" />
              <span className="truncate">{link.originalUrl}</span>
            </div>

            <div className="mt-2.5 flex flex-wrap items-center gap-3.5 text-xs text-[#9A8E78]">
              <span className="inline-flex items-center gap-1.5 font-semibold text-(--app-foreground)">
                <span
                  className={cn(
                    "size-1.5 rounded-full",
                    status === "active" ? "bg-[#3CA45E]" : "bg-[#C9C0AE]",
                  )}
                />
                {status === "active"
                  ? "Active"
                  : status === "expired"
                    ? "Expired"
                    : "Inactive"}
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
              <span className="flex-1" />
              <span className="inline-flex items-center gap-1 font-semibold text-(--red-dark)">
                <ShieldCheck className="size-3" />
                Verified
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon-lg"
              onClick={() => setQrOpen(!qrOpen)}
              title="QR code"
              className={cn(
                "size-10 border-(--line)",
                qrOpen
                  ? "bg-[#F5F1E8] text-(--app-foreground)"
                  : "bg-white text-[#7A6F5C]",
              )}
            >
              <QrCode className="size-4" />
            </Button>

            <Button
              variant="outline"
              onClick={handleCopy}
              className={cn(
                "h-10 gap-1.5 px-3.5 text-[13px] font-semibold",
                copied
                  ? "border-[#A9D5BC] bg-[#EAF6EE] text-[#1d6a38]"
                  : "border-(--line) bg-white text-(--app-foreground)",
              )}
            >
              {copied ? (
                <Check className="size-4" />
              ) : (
                <Copy className="size-4" />
              )}
              {copied ? "Copied" : "Copy"}
            </Button>

            {link.isActive && !expired && (
              <Button
                variant="outline"
                size="icon-lg"
                onClick={() => setConfirmDelete(true)}
                title="Disable"
                className="size-10 border-(--line) bg-white text-[#9A8E78] hover:border-[#E5A7A7] hover:bg-[#FFF0EE] hover:text-(--red-dark)"
              >
                <Trash2 className="size-4" />
              </Button>
            )}
          </div>
        </div>

        {qrOpen && (
          <div className="mt-4.5 flex animate-[trace-fade-in_240ms_ease-out] items-center gap-5 border-t border-dashed border-(--line-soft) pt-4.5 max-sm:flex-col max-sm:items-start">
            <div className="shrink-0 rounded-[10px] border border-(--line) bg-white p-2.5">
              <QRBlock value={link.shortUrl} size={108} />
            </div>
            <div className="flex-1">
              <div className="mb-1 text-[13px] font-semibold text-(--app-foreground)">
                Scan or share
              </div>
              <p className="max-w-[360px] text-[13px] leading-normal text-[#7A6F5C]">
                Embed this QR in posters or printed materials. Anyone scanning
                lands on the same verified short link.
              </p>
            </div>
          </div>
        )}
      </Card>

      {confirmDelete && (
        <DeleteModal
          link={link}
          onConfirm={() => void handleDisable()}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </>
  );
}
