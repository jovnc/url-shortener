import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:3001";

type HeadersWithSetCookie = Headers & {
  getSetCookie?: () => string[];
};

export function backendUrl(path: string) {
  return new URL(path, BACKEND_URL).toString();
}

export function copySetCookies(from: Response, to: NextResponse) {
  const getSetCookie = (from.headers as HeadersWithSetCookie).getSetCookie;
  const cookies = getSetCookie?.call(from.headers) ?? [];
  const fallbackCookie = from.headers.get("set-cookie");

  for (const cookie of cookies.length > 0
    ? cookies
    : fallbackCookie
      ? [fallbackCookie]
      : []) {
    to.headers.append("Set-Cookie", cookie);
  }
}

export async function toNextResponse(response: Response) {
  const headers = new Headers();
  const contentType = response.headers.get("content-type");
  if (contentType) headers.set("Content-Type", contentType);

  const body = response.status === 204 ? null : await response.arrayBuffer();
  const nextResponse = new NextResponse(body, {
    status: response.status,
    headers,
  });
  copySetCookies(response, nextResponse);
  return nextResponse;
}

export async function proxyBackend(
  request: NextRequest,
  path: string,
  init: { body?: BodyInit; method?: string } = {},
) {
  const headers = new Headers();
  const cookie = request.headers.get("cookie");
  const contentType = request.headers.get("content-type");
  if (cookie) headers.set("Cookie", cookie);
  if (contentType) headers.set("Content-Type", contentType);

  const response = await fetch(backendUrl(path), {
    method: init.method ?? request.method,
    headers,
    body: init.body,
    cache: "no-store",
    redirect: "manual",
  });

  return toNextResponse(response);
}
