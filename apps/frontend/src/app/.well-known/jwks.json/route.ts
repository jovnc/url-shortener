import { backendUrl } from "@/lib/backend";
import { NextResponse } from "next/server";

export async function GET() {
  const res = await fetch(backendUrl("/.well-known/jwks.json"), {
    cache: "no-store",
  });
  const data = await res.json();
  return NextResponse.json(data);
}
