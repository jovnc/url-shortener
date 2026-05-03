"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, LogOut, ShieldCheck } from "lucide-react";
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
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function closeOnPointer(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    }
    function closeOnEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", closeOnPointer);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnPointer);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return (
    <nav className="sticky top-0 z-10 mx-auto flex w-[min(920px,calc(100%-32px))] justify-end py-3 backdrop-blur-xl bg-surface/70">
      <div ref={ref} className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-haspopup="menu"
          aria-label="Account menu"
          className="flex cursor-pointer items-center gap-2 rounded-full border border-line bg-white/60 py-1.5 pr-3 pl-1.5 text-sm backdrop-blur-md transition-colors hover:bg-white/80"
        >
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-brand to-brand-deep text-xs font-bold text-white">
            {initials(user.name, user.sub)}
          </span>
          <span className="flex min-w-0 flex-col leading-tight">
            <span className="truncate text-xs font-semibold text-ink">
              {user.name ?? user.sub}
            </span>
          </span>
          <ChevronDown
            className={`ml-1 size-3.5 text-muted-ink transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>

        {open && (
          <div
            role="menu"
            className="absolute right-0 mt-1.5 w-44 rounded-xl border border-line bg-white/80 p-1 shadow-lg backdrop-blur-xl"
          >
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onLogout();
              }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-ink transition-colors hover:bg-brand-tint hover:text-brand-dark hover:cursor-pointer"
            >
              <LogOut className="size-3.5" />
              Sign out
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
