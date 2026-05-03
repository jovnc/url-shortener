import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { warmCard } from "@/lib/styles";

export function LinkCardSkeleton() {
  return (
    <Card className={cn(warmCard, "flex-row items-center gap-4.5 p-4")}>
      <div className="flex-1 space-y-2 min-w-0">
        <div className="flex items-center gap-1.5">
          <Skeleton className="size-3.5 shrink-0 rounded bg-[--line]" />
          <Skeleton className="h-4 w-36 bg-[--line]" />
        </div>
        <Skeleton className="h-3.5 w-64 max-w-full bg-[--line]" />
      </div>
      <div className="meta shrink-0">
        <Skeleton className="h-6 w-14 rounded-full bg-[--line] justify-self-end" />
        <Skeleton className="h-3 w-20 bg-[--line]" />
      </div>
      <div className="actions shrink-0">
        <Skeleton className="h-7 w-16 rounded-full bg-[--line]" />
      </div>
    </Card>
  );
}
