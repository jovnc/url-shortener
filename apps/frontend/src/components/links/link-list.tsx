import { Link2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { warmCard } from "@/lib/styles";
import { LinkCard } from "./link-card";
import { LinkCardSkeleton } from "./link-card-skeleton";
import type { Link } from "@/lib/types";

interface LinkListProps {
  links: Link[];
  loading?: boolean;
  onDisable: (id: string) => void;
}

export function LinkList({ links, loading, onDisable }: LinkListProps) {
  return (
    <section className="list" aria-label="Short links">
      {loading ? (
        <>
          <LinkCardSkeleton />
          <LinkCardSkeleton />
          <LinkCardSkeleton />
        </>
      ) : links.length === 0 ? (
        <Card className={cn(warmCard)}>
          <CardContent className="py-14 flex flex-col items-center gap-4 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-[--accent-soft]">
              <Link2 className="size-6 text-[--app-muted]" />
            </div>
            <div>
              <p className="font-semibold text-[--app-foreground]">
                No links yet
              </p>
              <p className="mt-1 text-sm text-[--app-muted]">
                Create your first short link above.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        links.map((link) => (
          <LinkCard key={link.id} link={link} onDisable={onDisable} />
        ))
      )}
    </section>
  );
}
