"use client";

import { createContext, type ReactNode, useCallback, useContext } from "react";

const CsrfContext = createContext<string>("");

export function CsrfProvider({
  token,
  children,
}: {
  token: string;
  children: ReactNode;
}) {
  return <CsrfContext.Provider value={token}>{children}</CsrfContext.Provider>;
}

export function useCsrfFetch() {
  const token = useContext(CsrfContext);
  return useCallback(
    (input: RequestInfo | URL, init: RequestInit = {}) => {
      const headers = new Headers(init.headers);
      if (token) headers.set("X-CSRF-TOKEN", token);
      return fetch(input, { ...init, credentials: "include", headers });
    },
    [token],
  );
}
