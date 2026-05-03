"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { readError } from "@/lib/api";
import { Topbar } from "@/components/topbar";
import { CreateLinkForm } from "@/components/links/create-link-form";
import { LinkList } from "@/components/links/link-list";
import { Skeleton } from "@/components/ui/skeleton";
import { pageShell } from "@/lib/styles";
import type { Link, User } from "@/lib/types";

function LoadingShell() {
  return (
    <div className="min-h-screen bg-surface">
      <div className="flex items-center gap-2.5 px-6 py-3">
        <Skeleton className="size-6.5 rounded bg-line" />
        <Skeleton className="h-4.5 w-15 rounded bg-line" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [links, setLinks] = useState<Link[]>([]);
  const [newLinkId, setNewLinkId] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      let currentUser: User | null = null;

      try {
        const meRes = await fetch("/api/auth/me", { credentials: "include" });
        if (!meRes.ok) {
          router.replace("/");
          return;
        }

        currentUser = (await meRes.json()) as User;
        setUser(currentUser);

        const linksRes = await fetch("/api/links", { credentials: "include" });
        if (!linksRes.ok) throw new Error(await readError(linksRes));
        setLinks((await linksRes.json()) as Link[]);
      } catch (err) {
        if (!currentUser) {
          router.replace("/");
          return;
        }

        setError(err instanceof Error ? err.message : "Unable to load app");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [router]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    router.replace("/");
  }

  if (loading || !user) return <LoadingShell />;

  return (
    <div className="min-h-screen bg-surface">
      <Topbar user={user} onLogout={() => void logout()} />
      <div className={pageShell}>
        {error && <p className="mb-4 text-[13px] text-brand-dark">{error}</p>}
        <CreateLinkForm
          onCreated={(link) => {
            setLinks((current) => [link, ...current]);
            setNewLinkId(link.id);
          }}
        />
        <LinkList
          links={links}
          newLinkId={newLinkId}
          onDisable={(id) =>
            setLinks((current) =>
              current.map((link) =>
                link.id === id ? { ...link, isActive: false } : link,
              ),
            )
          }
        />
      </div>
    </div>
  );
}
