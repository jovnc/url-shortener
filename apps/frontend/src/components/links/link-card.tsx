"use client";

import { Copy, ExternalLink, Link2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { readError } from "@/lib/api";
import { warmCard } from "@/lib/styles";
import type { Link } from "@/lib/types";

interface LinkCardProps {
  link: Link;
  onDisable: (id: string) => void;
}

export function LinkCard({ link, onDisable }: LinkCardProps) {
  async function copyLink() {
    await navigator.clipboard.writeText(link.shortUrl);
    toast.success("Copied to clipboard!");
  }

  async function disableLink() {
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
    }
  }

  return (
    <Card
      className={cn(
        warmCard,
        "flex-row items-center gap-4.5 p-4",
        "transition-[border-color,box-shadow,transform]",
        "hover:border-[#cfc4b4] hover:-translate-y-px hover:shadow-[0_22px_70px_rgb(31_27_20/0.11)]",
      )}
    >
      <div className="link-main flex-1">
        <a
          href={link.shortUrl}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5"
        >
          <Link2 className="size-3.5 shrink-0" />
          <span className="truncate font-bold">{link.shortUrl}</span>
          <ExternalLink className="size-3 shrink-0 opacity-40" />
        </a>
        <p>{link.originalUrl}</p>
      </div>

      <div className="meta shrink-0">
        <Badge
          className={cn(
            "h-6 justify-self-end rounded-full px-2.5 max-[760px]:justify-self-start",
            link.isActive
              ? "border-transparent bg-[#e7f4df] text-[#1d6a38]"
              : "border-transparent bg-[#eee9df] text-[--app-muted]",
          )}
        >
          {link.isActive ? "Active" : "Inactive"}
        </Badge>
        {link.expiresAt && (
          <span>Expires {new Date(link.expiresAt).toLocaleString()}</span>
        )}
        <span className="text-xs opacity-70">
          {new Date(link.createdAt).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </span>
      </div>

      <div className="actions shrink-0">
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="outline"
                size="sm"
                onClick={() => void copyLink()}
                className="gap-1.5 rounded-full border-[--line]"
              >
                <Copy className="size-3.5" />
                Copy
              </Button>
            }
          />
          <TooltipContent>Copy to clipboard</TooltipContent>
        </Tooltip>
        {link.isActive && (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => void disableLink()}
            className="gap-1.5 rounded-full"
          >
            <X className="size-3.5" />
            Disable
          </Button>
        )}
      </div>
    </Card>
  );
}
