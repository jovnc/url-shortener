"use client";

import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { LinkCard } from "./link-card";
import { LinkCardSkeleton } from "./link-card-skeleton";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { pillControl } from "@/lib/styles";
import { cn } from "@/lib/utils";
import type { Link } from "@/lib/types";

interface LinkListProps {
  links: Link[];
  newLinkId?: string;
  loading?: boolean;
  onDisable: (id: string) => void;
}

type StatusFilter = "all" | "active" | "inactive";

const FILTERS: { id: StatusFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "active", label: "Active" },
  { id: "inactive", label: "Inactive" },
];

function isInactive(link: Link): boolean {
  return (
    !link.isActive ||
    Boolean(link.expiresAt && new Date(link.expiresAt) < new Date())
  );
}

export function LinkList({
  links,
  newLinkId,
  loading,
  onDisable,
}: LinkListProps) {
  const [filter, setFilter] = useState<StatusFilter>("all");

  const filteredLinks = links.filter((link) => {
    if (filter === "all") return true;
    return filter === "inactive" ? isInactive(link) : !isInactive(link);
  });

  return (
    <section className="mt-5 grid gap-3" aria-label="Short links">
      <div className="flex items-center justify-between gap-3 max-sm:flex-col max-sm:items-stretch">
        <div className={cn("flex w-fit max-sm:w-full", pillControl)}>
          {FILTERS.map((item) => (
            <Button
              key={item.id}
              type="button"
              variant="ghost"
              onClick={() => setFilter(item.id)}
              className={cn(
                "h-8 flex-1 rounded-full px-3 text-xs font-semibold hover:bg-white",
                filter === item.id
                  ? "bg-white text-ink shadow-[0_1px_2px_rgb(0_0_0/0.06)]"
                  : "text-[#7A6F5C]",
              )}
            >
              {item.label}
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <>
          <LinkCardSkeleton />
          <LinkCardSkeleton />
          <LinkCardSkeleton />
        </>
      ) : filteredLinks.length === 0 ? (
        <Card className="items-center gap-3 rounded-xl border-line bg-white px-6 py-14 text-center">
          <div className="flex size-13 items-center justify-center rounded-xl bg-brand-tint">
            <ShieldCheck className="size-6 text-brand" />
          </div>
          <div>
            <p className="font-semibold text-ink">
              {links.length === 0 ? "No links yet" : `No ${filter} links`}
            </p>
            <p className="mt-1 text-[13px] text-[#7A6F5C]">
              {links.length === 0
                ? "Create your first verified short link above."
                : "Try another status filter."}
            </p>
          </div>
        </Card>
      ) : (
        filteredLinks.map((link) => (
          <LinkCard
            key={link.id}
            link={link}
            isNew={link.id === newLinkId}
            onDisable={onDisable}
          />
        ))
      )}
    </section>
  );
}
