import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { User, Link } from "@/lib/types";

interface TopbarProps {
  user: User;
  links: Link[];
  onLogout: () => void;
}

export function Topbar({ user, links, onLogout }: TopbarProps) {
  const activeCount = links.filter((l) => l.isActive).length;

  return (
    <header className="topbar">
      <div>
        <p className="eyebrow">URL Shortener</p>
        <h1>Links</h1>
        {links.length > 0 && (
          <p className="mt-2 text-sm text-[--app-muted]">
            {activeCount} active · {links.length} total
          </p>
        )}
      </div>
      <div className="account">
        <span className="text-sm">{user.name ?? user.sub}</span>
        <Button
          variant="outline"
          size="sm"
          onClick={onLogout}
          className="gap-1.5 rounded-full border-[--line]"
        >
          <LogOut className="size-3.5" />
          Logout
        </Button>
      </div>
    </header>
  );
}
