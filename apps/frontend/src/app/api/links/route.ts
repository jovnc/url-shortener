import { NextRequest } from "next/server";
import { proxyBackend } from "@/lib/backend";

export function GET(request: NextRequest) {
  return proxyBackend(request, "/api/v1/links");
}

export async function POST(request: NextRequest) {
  return proxyBackend(request, "/api/v1/links", {
    body: await request.arrayBuffer(),
  });
}
