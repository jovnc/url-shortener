'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { readError } from '@/lib/api';
import { warmCard, tallInput } from '@/lib/styles';
import { Topbar } from '@/components/topbar';
import { CreateLinkForm } from '@/components/links/create-link-form';
import { LinkList } from '@/components/links/link-list';
import type { User, Link } from '@/lib/types';

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [links, setLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const meResponse = await fetch('/api/auth/me', { credentials: 'include' });

        if (!meResponse.ok) {
          setUser(null);
          return;
        }

        const currentUser = (await meResponse.json()) as User;
        setUser(currentUser);

        const linksResponse = await fetch('/api/links', { credentials: 'include' });
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

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    setUser(null);
    setLinks([]);
  }

  if (loading) {
    return (
      <main className="shell">
        <header className="topbar">
          <div>
            <Skeleton className="h-3 w-24 bg-[var(--line)] mb-3" />
            <Skeleton className="h-14 w-32 bg-[var(--line)]" />
          </div>
          <Skeleton className="h-9 w-40 rounded-full bg-[var(--line)] self-start mt-2" />
        </header>

        <Card className={warmCard}>
          <CardContent className="pt-5 pb-5">
            <div className="grid grid-cols-[1fr_220px_auto] items-end gap-3.5 max-[760px]:grid-cols-1">
              <div className="grid gap-2">
                <Skeleton className="h-3 w-28 bg-[var(--line)]" />
                <Skeleton className={cn(tallInput, 'bg-[var(--line)]')} />
              </div>
              <div className="grid gap-2">
                <Skeleton className="h-3 w-24 bg-[var(--line)]" />
                <Skeleton className={cn(tallInput, 'bg-[var(--line)]')} />
              </div>
              <Skeleton className="h-[46px] w-[160px] rounded-full bg-[var(--line)]" />
            </div>
          </CardContent>
        </Card>

        <LinkList links={[]} loading onDisable={() => {}} />
      </main>
    );
  }

  if (!user) {
    return (
      <main className="shell auth-card">
        <p className="eyebrow">URL Shortener</p>
        <h1>
          Short links,
          <br />
          no clutter.
        </h1>
        <p className="muted">Sign in to create and manage your short links.</p>
        {error && <p className="error">{error}</p>}
        <form action="/api/auth/login" method="get">
          <Button type="submit" className="h-11 rounded-full px-6 text-base">
            Login with Singpass
          </Button>
        </form>
      </main>
    );
  }

  return (
    <main className="shell">
      <Topbar user={user} links={links} onLogout={logout} />
      {error && <p className="error mb-4 text-sm">{error}</p>}
      <CreateLinkForm
        onCreated={(link) => setLinks((current) => [link, ...current])}
      />
      <LinkList
        links={links}
        onDisable={(id) =>
          setLinks((current) =>
            current.map((l) => (l.id === id ? { ...l, isActive: false } : l)),
          )
        }
      />
    </main>
  );
}
