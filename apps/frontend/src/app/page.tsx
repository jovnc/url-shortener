"use client";

import { useEffect, useState } from "react";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { QRBlock } from "@/components/qr-block";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type AuthState = "checking" | "authenticated" | "anonymous";

function LandingVisual() {
  return (
    <div className="relative flex min-h-115 flex-col justify-center gap-3.5">
      <div className="flex items-center justify-center gap-3 py-1">
        <div className="h-px flex-1 bg-linear-to-r from-transparent to-line-soft" />
        <Badge className="h-auto gap-1.5 bg-brand-tint px-2.5 py-1 text-2xs font-bold tracking-badge text-brand-deep uppercase">
          <ShieldCheck className="size-2.75" /> Verified creator
        </Badge>
        <div className="h-px flex-1 bg-linear-to-r from-line-soft to-transparent" />
      </div>

      <Card className="rotate-[0.6deg] border-[1.5px] border-brand/20 bg-white py-0 shadow-[0_18px_60px_rgb(244_51_61/0.13),0_1px_0_rgb(0_0_0/0.03)]">
        <CardContent className="grid grid-cols-[1fr_auto] items-center gap-4.5 p-5 max-sm:grid-cols-1">
          <div className="min-w-0">
            <div className="mb-1 text-2xs font-bold tracking-label text-stone-400 uppercase">
              Your verified short link
            </div>
            <div className="truncate font-mono text-2xl font-bold tracking-heading">
              <span className="font-medium text-stone-400">trace.gov.sg/</span>
              <span className="text-brand">budget-2026</span>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2.5 text-xs text-stone-500">
              <span className="inline-flex items-center gap-1 font-semibold text-brand-dark">
                <ShieldCheck className="size-2.75" /> Created with Singpass
              </span>
              <span>·</span>
              <span>Lifetime</span>
              <span>·</span>
              <span>12,847 clicks</span>
            </div>
          </div>
          <div className="w-fit rounded-lg border border-line bg-white p-1.5">
            <QRBlock value="https://trace.gov.sg/budget-2026" size={86} />
          </div>
        </CardContent>
      </Card>

      <Card className="mt-2 border-dashed border-line-soft bg-surface py-0 shadow-none">
        <CardContent className="flex items-start gap-3 p-4">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand">
            <ShieldCheck className="size-4 text-white" />
          </div>
          <div className="text-sm leading-5 text-muted-ink">
            <strong className="text-ink">No anonymous creators.</strong> Every
            link starts from a Singpass-verified account, making scam links
            easier to trace and stop.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function Home() {
  const [authState, setAuthState] = useState<AuthState>("checking");

  useEffect(() => {
    async function checkSession() {
      try {
        const response = await fetch("/api/auth/me", {
          credentials: "include",
        });
        setAuthState(response.ok ? "authenticated" : "anonymous");
      } catch {
        setAuthState("anonymous");
      }
    }

    void checkSession();
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <div className="mx-auto grid w-full max-w-300 flex-1 grid-cols-[1.15fr_1fr] items-center gap-15 px-6 py-16 sm:px-12 lg:pb-20 max-lg:grid-cols-1">
        <div>
          <Badge className="mb-6 h-auto gap-2 rounded-full bg-brand-tint py-1.5 pr-3 pl-2 text-xs font-semibold text-brand-deep">
            <span className="flex size-4.5 items-center justify-center rounded-full bg-brand text-white">
              <ShieldCheck className="size-2.75" />
            </span>
            Singpass-verified link creation
          </Badge>

          <h1 className="m-0 text-[clamp(52px,6vw,76px)] leading-[0.98] font-extrabold tracking-tightest text-ink">
            Short links.
            <br />
            <span className="font-bold text-brand italic">Verified.</span>
          </h1>

          <p className="mt-6 mb-8 max-w-120 text-lg leading-[1.55] text-muted-ink">
            Only Singpass-verified users can create short links. Start today
            with your Singpass account.
          </p>

          <form
            action={
              authState === "authenticated" ? "/dashboard" : "/api/auth/login"
            }
            method="get"
          >
            <Button
              type="submit"
              variant="brand"
              size="xl"
              disabled={authState === "checking"}
            >
              {authState === "authenticated"
                ? "Go to dashboard"
                : authState === "checking"
                  ? "Checking session"
                  : "Sign in with Singpass"}
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
