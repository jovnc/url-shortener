'use client';

import { FormEvent, useEffect, useState } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

interface User {
  id: string;
  sub: string;
  name: string | null;
}

interface Link {
  id: string;
  shortCode: string;
  shortUrl: string;
  originalUrl: string;
  isActive: boolean;
  expiresAt: string | null;
  createdAt: string;
}

async function readError(response: Response) {
  try {
    const data = (await response.json()) as { message?: string | string[] };
    if (Array.isArray(data.message)) return data.message.join(', ');
    if (data.message) return data.message;
  } catch {
    // Fall back to the status text below.
  }

  return response.statusText || 'Something went wrong';
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [links, setLinks] = useState<Link[]>([]);
  const [originalUrl, setOriginalUrl] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const meResponse = await fetch(`${API}/api/v1/auth/me`, {
          credentials: 'include',
        });

        if (!meResponse.ok) {
          setUser(null);
          return;
        }

        const currentUser = (await meResponse.json()) as User;
        setUser(currentUser);

        const linksResponse = await fetch(`${API}/api/v1/links`, {
          credentials: 'include',
        });

        if (!linksResponse.ok) throw new Error(await readError(linksResponse));

        setLinks((await linksResponse.json()) as Link[]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load app');
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  async function createLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError('');

    try {
      const response = await fetch(`${API}/api/v1/links`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalUrl,
          ...(expiresAt ? { expiresAt: new Date(expiresAt).toISOString() } : {}),
        }),
      });

      if (!response.ok) throw new Error(await readError(response));

      const link = (await response.json()) as Link;
      setLinks((current) => [link, ...current]);
      setOriginalUrl('');
      setExpiresAt('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create link');
    } finally {
      setSaving(false);
    }
  }

  async function deleteLink(id: string) {
    setError('');

    try {
      const response = await fetch(`${API}/api/v1/links/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) throw new Error(await readError(response));

      setLinks((current) =>
        current.map((link) =>
          link.id === id ? { ...link, isActive: false } : link,
        ),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete link');
    }
  }

  async function logout() {
    await fetch(`${API}/api/v1/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });
    setUser(null);
    setLinks([]);
  }

  if (loading) {
    return <main className="shell">Loading...</main>;
  }

  if (!user) {
    return (
      <main className="shell auth-card">
        <p className="eyebrow">URL Shortener</p>
        <h1>Short links, no clutter.</h1>
        <p className="muted">Sign in to create and manage your short links.</p>
        {error ? <p className="error">{error}</p> : null}
        <a className="button primary" href={`${API}/api/v1/auth/login`}>
          Login with Singpass
        </a>
      </main>
    );
  }

  return (
    <main className="shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">URL Shortener</p>
          <h1>Links</h1>
        </div>
        <div className="account">
          <span>{user.name ?? user.sub}</span>
          <button className="button" type="button" onClick={logout}>
            Logout
          </button>
        </div>
      </header>

      <form className="card form" onSubmit={createLink}>
        <label>
          Destination URL
          <input
            required
            type="url"
            placeholder="https://example.com/long-url"
            value={originalUrl}
            onChange={(event) => setOriginalUrl(event.target.value)}
          />
        </label>
        <label>
          Expiry, optional
          <input
            type="datetime-local"
            value={expiresAt}
            onChange={(event) => setExpiresAt(event.target.value)}
          />
        </label>
        <button className="button primary" disabled={saving} type="submit">
          {saving ? 'Creating...' : 'Create short link'}
        </button>
      </form>

      {error ? <p className="error">{error}</p> : null}

      <section className="list" aria-label="Short links">
        {links.length === 0 ? (
          <div className="card empty">No links yet.</div>
        ) : (
          links.map((link) => (
            <article className="card link-card" key={link.id}>
              <div className="link-main">
                <a href={link.shortUrl} target="_blank" rel="noreferrer">
                  {link.shortUrl}
                </a>
                <p>{link.originalUrl}</p>
              </div>
              <div className="meta">
                <span className={link.isActive ? 'status' : 'status inactive'}>
                  {link.isActive ? 'Active' : 'Inactive'}
                </span>
                {link.expiresAt ? (
                  <span>Expires {new Date(link.expiresAt).toLocaleString()}</span>
                ) : null}
              </div>
              <div className="actions">
                <button
                  className="button"
                  type="button"
                  onClick={() => navigator.clipboard.writeText(link.shortUrl)}
                >
                  Copy
                </button>
                {link.isActive ? (
                  <button
                    className="button danger"
                    type="button"
                    onClick={() => deleteLink(link.id)}
                  >
                    Disable
                  </button>
                ) : null}
              </div>
            </article>
          ))
        )}
      </section>
    </main>
  );
}
