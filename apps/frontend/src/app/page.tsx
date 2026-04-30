'use client';

import { useState, useEffect } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

interface User {
  id: string;
  sub: string;
  name: string | null;
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/api/v1/auth/me`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setUser(data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading…</p>;

  if (!user) return <a href={`${API}/api/v1/auth/login`}>Login with Singpass</a>;

  return (
    <div>
      <p>Logged in as {user.name ?? user.sub}</p>
      <button
        onClick={() =>
          fetch(`${API}/api/v1/auth/logout`, { method: 'POST', credentials: 'include' }).then(
            () => setUser(null),
          )
        }
      >
        Logout
      </button>
    </div>
  );
}
