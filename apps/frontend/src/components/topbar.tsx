"use client";

import { ChevronDown, LogOut } from "lucide-react";
import type { User } from "@/lib/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

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

const triggerClassName =
  "flex cursor-pointer items-center gap-2 rounded-full border border-line bg-white/60 py-1.5 pr-3 pl-1.5 text-sm backdrop-blur-md transition-colors hover:bg-white/80";

function TriggerContent({ user }: { user: User }) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-brand to-brand-deep text-xs font-bold text-white">
        {initials(user.name, user.sub)}
      </span>
      <span className="flex min-w-0 flex-col leading-tight">
        <span className="truncate text-xs font-semibold text-ink">
          {user.name ?? user.sub}
        </span>
      </span>
      <ChevronDown className="ml-1 size-3.5 text-muted-ink" />
    </div>
  );
}

export function Topbar({ user, onLogout }: TopbarProps) {
  return (
    <nav className="sticky top-0 z-10 mx-auto flex w-[min(920px,calc(100%-32px))] justify-end py-3 backdrop-blur-xl bg-surface/70">
      {/* Desktop: dropdown menu (sm and above) */}
      <div className="hidden sm:block">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                type="button"
                aria-label="Account menu"
                className={triggerClassName}
              />
            }
          >
            <TriggerContent user={user} />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-44 rounded-xl border border-line bg-white/80 p-1 shadow-lg backdrop-blur-xl"
          >
            <DropdownMenuItem
              onClick={onLogout}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-ink hover:bg-brand-tint hover:text-brand-dark hover:cursor-pointer"
            >
              <LogOut className="size-3.5" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Mobile: bottom sheet (below sm) */}
      <div className="block sm:hidden">
        <Sheet>
          <SheetTrigger
            render={
              <button
                type="button"
                aria-label="Account menu"
                className={triggerClassName}
              />
            }
          >
            <TriggerContent user={user} />
          </SheetTrigger>
          <SheetContent
            side="bottom"
            className="rounded-t-2xl border-line bg-white pb-[calc(env(safe-area-inset-bottom)+1rem)]"
          >
            <SheetHeader className="text-left">
              <SheetTitle className="text-base">
                {user.name ?? user.sub}
              </SheetTitle>
              <SheetDescription className="text-xs text-muted-ink">
                Singpass-verified account
              </SheetDescription>
            </SheetHeader>
            <div className="mt-4 grid gap-2 px-4 pb-2">
              <Button
                variant="ghost"
                onClick={onLogout}
                className="h-12 w-full justify-start gap-3 px-3 text-sm font-medium text-ink hover:bg-brand-tint hover:text-brand-dark"
              >
                <LogOut className="size-4" />
                Sign out
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
