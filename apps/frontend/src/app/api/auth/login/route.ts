import { NextResponse } from "next/server";
import { backendUrl, copySetCookies, toNextResponse } from "@/lib/backend";

export async function GET() {
  const response = await fetch(backendUrl("/api/v1/auth/login"), {
    cache: "no-store",
    redirect: "manual",
  });

  const location = response.headers.get("location");
  if (!location || response.status < 300 || response.status >= 400) {
    return toNextResponse(response);
  }

  const nextResponse = NextResponse.redirect(location, response.status);
  copySetCookies(response, nextResponse);
  return nextResponse;
}
