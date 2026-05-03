import { LogOut, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TraceMark } from "@/components/trace-mark";
import type { User } from "@/lib/types";

interface TopbarProps {
  user: User;
  onLogout: () => void;
}

function initials(name: string | null, sub: string): string {
  if (name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2)
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return parts[0].slice(0, 2).toUpperCase();
  }
  return sub.slice(0, 2).toUpperCase();
}

export function Topbar({ user, onLogout }: TopbarProps) {
  return (
    <div className="sticky top-0 z-5 mb-8 flex items-center justify-between border-b border-(--line) bg-(--app-background) py-5 max-[760px]:flex-col max-[760px]:items-stretch max-[760px]:gap-4">
      <div className="flex items-center gap-2.5">
        <TraceMark size={26} color="#F4333D" />
        <span className="text-lg font-bold tracking-[-0.01em] text-(--app-foreground)">
          Trace
        </span>
        <Badge className="ml-2 h-auto rounded bg-[#F5F1E8] px-2 py-[3px] text-[11px] font-semibold tracking-[0.04em] text-[#7A6F5C] uppercase">
          Beta
        </Badge>
      </div>

      <div className="flex items-center gap-3 max-[760px]:items-stretch max-[760px]:flex-col">
        <div className="flex items-center gap-2.5 rounded-full border border-(--line) bg-[#FAFAF7] py-1.5 pr-3.5 pl-1.5">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-(--red-primary) to-(--red-deeper) text-xs font-bold text-white">
            {initials(user.name, user.sub)}
          </div>
          <div className="flex min-w-0 flex-col leading-[1.15]">
            <span className="truncate text-[12.5px] font-semibold text-(--app-foreground)">
              {user.name ?? user.sub}
            </span>
            <span className="flex items-center gap-1 text-[10.5px] text-[#9A8E78]">
              <ShieldCheck className="size-2.5 shrink-0 text-(--red-primary)" />
              Singpass-verified
            </span>
          </div>
        </div>

        <Button
          variant="outline"
          size="icon-lg"
          onClick={onLogout}
          title="Sign out"
          className="border-(--line) bg-white text-[#7A6F5C] hover:text-(--app-foreground)"
        >
          <LogOut className="size-4" />
        </Button>
      </div>
    </div>
  );
}
