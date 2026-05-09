export interface RedirectCachePayload {
  originalUrl: string;
  isActive: boolean;
  expiresAt: string | null;
}

export abstract class RedirectCache {
  abstract get(shortCode: string): Promise<RedirectCachePayload | null>;
  abstract set(shortCode: string, payload: RedirectCachePayload): Promise<void>;
  abstract del(shortCode: string): Promise<void>;
}
