"use client";

import { useEffect, useState } from "react";
import { ArrowRight, ShieldCheck, Link2 } from "lucide-react";
import { readError } from "@/lib/api";
import { Topbar } from "@/components/topbar";
import { SingpassLogo } from "@/components/singpass-logo";
import { QRBlock } from "@/components/qr-block";
import { CreateLinkForm } from "@/components/links/create-link-form";
import { LinkList } from "@/components/links/link-list";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { User, Link } from "@/lib/types";

// ─── Landing page ────────────────────────────────────────────────────────────

function LandingVisual() {
  return (
    <div className="relative flex min-h-[460px] flex-col justify-center gap-3.5">
      <Card className="rotate-[-1.2deg] border-(--line) bg-white py-0 shadow-[0_1px_0_rgb(0_0_0/0.02)]">
        <CardContent className="flex items-center gap-2.5 p-3.5 px-4">
          <Link2 className="size-[15px] shrink-0 text-[#9A8E78]" />
          <span className="min-w-0 flex-1 truncate font-mono text-xs text-[#7A6F5C]">
            https://www.mof.gov.sg/singaporebudget/budget-2026/budget-statement-and-annexes
          </span>
        </CardContent>
      </Card>

      <div className="flex items-center justify-center gap-3 py-1">
        <div className="h-px flex-1 bg-linear-to-r from-transparent to-(--line-soft)" />
        <Badge className="h-auto gap-1.5 bg-(--red-tint) px-2.5 py-1 text-[11px] font-bold tracking-[0.04em] text-(--red-deeper) uppercase">
          <ShieldCheck className="size-[11px]" /> Verified creator
        </Badge>
        <div className="h-px flex-1 bg-linear-to-r from-(--line-soft) to-transparent" />
      </div>

      <Card className="rotate-[0.6deg] border-[1.5px] border-[rgb(244_51_61/0.2)] bg-white py-0 shadow-[0_18px_60px_rgb(244_51_61/0.13),0_1px_0_rgb(0_0_0/0.03)]">
        <CardContent className="grid grid-cols-[1fr_auto] items-center gap-4.5 p-5 max-sm:grid-cols-1">
          <div className="min-w-0">
            <div className="mb-1 text-[11px] font-bold tracking-[0.06em] text-[#9A8E78] uppercase">
              Your verified short link
            </div>
            <div className="truncate font-mono text-[22px] font-bold tracking-[-0.015em]">
              <span className="font-medium text-[#9A8E78]">trace.gov.sg/</span>
              <span className="text-(--red-primary)">budget-2026</span>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2.5 text-xs text-[#7A6F5C]">
              <span className="inline-flex items-center gap-1 font-semibold text-(--red-dark)">
                <ShieldCheck className="size-[11px]" /> Created with Singpass
              </span>
              <span>·</span>
              <span>Lifetime</span>
              <span>·</span>
              <span>12,847 clicks</span>
            </div>
          </div>
          <div className="w-fit rounded-lg border border-(--line) bg-white p-1.5">
            <QRBlock value="https://trace.gov.sg/budget-2026" size={86} />
          </div>
        </CardContent>
      </Card>

      <Card className="mt-2 border-dashed border-(--line-soft) bg-(--app-background) py-0 shadow-none">
        <CardContent className="flex items-start gap-3 p-4">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-(--red-primary)">
            <ShieldCheck className="size-4 text-white" />
          </div>
          <div className="text-[13px] leading-5 text-(--app-muted)">
            <strong className="text-(--app-foreground)">
              No anonymous creators.
            </strong>{" "}
            Every Trace link starts from a Singpass-verified account, making
            scam links easier to trace and stop.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-(--app-background)">
      <div className="mx-auto grid w-full max-w-[1200px] flex-1 grid-cols-[1.15fr_1fr] items-center gap-[60px] px-6 py-16 sm:px-12 lg:pb-20 max-lg:grid-cols-1">
        <div>
          <Badge className="mb-6 h-auto gap-2 rounded-full bg-(--red-tint) py-1.5 pr-3 pl-2 text-xs font-semibold text-(--red-deeper)">
            <span className="flex size-4.5 items-center justify-center rounded-full bg-(--red-primary) text-white">
              <ShieldCheck className="size-[11px]" />
            </span>
            Singpass-verified link creation
          </Badge>

          <h1 className="m-0 text-[clamp(52px,6vw,76px)] leading-[0.98] font-extrabold tracking-[-0.04em] text-(--app-foreground)">
            Short links
            <br />
            <span className="font-bold text-(--red-primary) italic">
              with a real creator.
            </span>
          </h1>

          <p className="mt-6 mb-8 max-w-[480px] text-[17px] leading-[1.55] text-(--app-muted)">
            Anyone can open a Trace link. Only Singpass-verified users can
            create one, so every short URL starts with accountability.
          </p>

          <form action="/api/auth/login" method="get">
            <Button
              type="submit"
              className="h-14 gap-3 rounded-xl bg-(--red-primary) py-0 pr-5 pl-2 text-[15px] font-semibold text-white shadow-[0_1px_0_var(--red-dark),0_12px_30px_rgb(244_51_61/0.2)] hover:bg-(--red-dark)"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white">
                <SingpassLogo size={26} />
              </span>
              Sign in with Singpass
              <ArrowRight className="size-4 text-white" />
            </Button>
          </form>
        </div>

        <div className="relative">
          <LandingVisual />
        </div>
      </div>
    </div>
  );
}

// ─── Loading skeleton ────────────────────────────────────────────────────────

function LoadingShell() {
  return (
    <div className="min-h-screen bg-(--app-background)">
      <div className="flex items-center gap-2.5 border-b border-(--line) px-10 py-5">
        <Skeleton className="size-6.5 rounded bg-(--line)" />
        <Skeleton className="h-4.5 w-15 rounded bg-(--line)" />
      </div>
    </div>
  );
}

// ─── Main app ────────────────────────────────────────────────────────────────

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [links, setLinks] = useState<Link[]>([]);
  const [newLinkId, setNewLinkId] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const meRes = await fetch("/api/auth/me", { credentials: "include" });
        if (!meRes.ok) {
          setUser(null);
          return;
        }

        const currentUser = (await meRes.json()) as User;
        setUser(currentUser);

        const linksRes = await fetch("/api/links", { credentials: "include" });
        if (!linksRes.ok) throw new Error(await readError(linksRes));
        setLinks((await linksRes.json()) as Link[]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load app");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    setUser(null);
    setLinks([]);
  }

  if (loading) return <LoadingShell />;

  if (!user) return <LandingPage />;

  return (
    <div className="min-h-screen bg-(--app-background)">
      <div className="mx-auto w-[min(920px,calc(100%-32px))] py-10 pb-20 max-[760px]:py-8">
        <Topbar user={user} onLogout={() => void logout()} />
        {error && <p className="mb-4 text-[13px] text-(--red-dark)">{error}</p>}
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
              current.map((l) => (l.id === id ? { ...l, isActive: false } : l)),
            )
          }
        />
      </div>
    </div>
  );
}
