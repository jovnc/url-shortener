export interface User {
  id: string;
  sub: string;
  name: string | null;
}

export interface Link {
  id: string;
  shortCode: string;
  shortUrl: string;
  originalUrl: string;
  isActive: boolean;
  expiresAt: string | null;
  createdAt: string;
}
