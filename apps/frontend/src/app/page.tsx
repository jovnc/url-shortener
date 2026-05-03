'use client';

import { useEffect, useState } from 'react';
import { ArrowRight, ShieldCheck, Link2 } from 'lucide-react';
import { readError } from '@/lib/api';
import { Topbar } from '@/components/topbar';
import { TraceMark } from '@/components/trace-mark';
import { SingpassLogo } from '@/components/singpass-logo';
import { QRBlock } from '@/components/qr-block';
import { CreateLinkForm } from '@/components/links/create-link-form';
import { LinkList } from '@/components/links/link-list';
import type { User, Link } from '@/lib/types';

// ─── Landing page ────────────────────────────────────────────────────────────

function LandingVisual() {
  return (
    <div style={{
      position: 'relative', height: 460,
      display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 14,
    }}>
      {/* Long URL */}
      <div style={{
        background: '#fff', border: '1px solid #EDE9E3', borderRadius: 12,
        padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10,
        boxShadow: '0 1px 0 rgba(0,0,0,0.02)', transform: 'rotate(-1.2deg)',
      }}>
        <Link2 size={15} color="#9A8E78" style={{ flexShrink: 0 }} />
        <span style={{
          flex: 1, fontFamily: 'ui-monospace, SFMono-Regular, monospace',
          fontSize: 12, color: '#7A6F5C',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          https://www.mof.gov.sg/singaporebudget/budget-2026/budget-statement-and-annexes
        </span>
      </div>

      {/* Arrow */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '4px 0' }}>
        <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, transparent, #E5DFD6)' }} />
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '4px 10px', borderRadius: 999,
          background: '#FFE9EA', color: '#8E1820',
          fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase',
        }}>
          <ShieldCheck size={11} color="#8E1820" /> Minting · Joanne Lim
        </div>
        <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, #E5DFD6, transparent)' }} />
      </div>

      {/* Short URL card */}
      <div style={{
        background: '#fff', border: '1.5px solid rgba(244,51,61,0.2)', borderRadius: 14,
        padding: 20, display: 'grid', gridTemplateColumns: '1fr auto', gap: 18,
        alignItems: 'center',
        boxShadow: '0 18px 60px rgba(244,51,61,0.13), 0 1px 0 rgba(0,0,0,0.03)',
        transform: 'rotate(0.6deg)',
      }}>
        <div>
          <div style={{
            fontSize: 11, fontWeight: 700, letterSpacing: '0.06em',
            color: '#9A8E78', textTransform: 'uppercase', marginBottom: 4,
          }}>
            Your verified short link
          </div>
          <div style={{
            fontSize: 22, fontWeight: 700, letterSpacing: '-0.015em',
            fontFamily: 'ui-monospace, SFMono-Regular, monospace',
          }}>
            <span style={{ color: '#9A8E78', fontWeight: 500 }}>trace.gov.sg/</span>
            <span style={{ color: '#F4333D' }}>budget-2026</span>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, marginTop: 12,
            fontSize: 12, color: '#7A6F5C',
          }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#C1242C', fontWeight: 600 }}>
              <ShieldCheck size={11} color="#C1242C" /> Verified by Singpass
            </span>
            <span>·</span>
            <span>Lifetime</span>
            <span>·</span>
            <span>12,847 clicks</span>
          </div>
        </div>
        <div style={{ padding: 6, background: '#fff', border: '1px solid #EDE9E3', borderRadius: 8 }}>
          <QRBlock value="https://trace.gov.sg/budget-2026" size={86} />
        </div>
      </div>

      {/* Verified callout */}
      <div style={{
        marginTop: 8, padding: 16, borderRadius: 12,
        background: '#FDFCF9', border: '1px dashed #E5DFD6',
        display: 'flex', alignItems: 'flex-start', gap: 12,
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8, background: '#F4333D',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <ShieldCheck size={16} color="#fff" />
        </div>
        <div style={{ fontSize: 13, lineHeight: 1.5, color: '#5C544A' }}>
          <strong style={{ color: '#1A1714' }}>No anonymous links.</strong>{' '}
          Every Trace URL is bound to a Singpass identity.
          Your name stays private — but if a link is misused, it can be traced and retired.
        </div>
      </div>
    </div>
  );
}

function LandingPage({ onLogin }: { onLogin: () => void }) {
  return (
    <div style={{ minHeight: '100vh', background: '#FDFCF9', display: 'flex', flexDirection: 'column' }}>
      {/* Brand bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '24px 48px 0' }}>
        <TraceMark size={26} color="#F4333D" />
        <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.01em', color: '#1A1714' }}>Trace</span>
        <span style={{
          marginLeft: 12, padding: '3px 8px', borderRadius: 4,
          background: '#F5F1E8', fontSize: 11, fontWeight: 600, color: '#7A6F5C',
          letterSpacing: '0.04em', textTransform: 'uppercase',
        }}>Beta</span>
      </div>

      {/* Hero */}
      <div style={{
        flex: 1, padding: '64px 48px 80px',
        display: 'grid', gridTemplateColumns: '1.15fr 1fr', gap: 60, alignItems: 'center',
        maxWidth: 1200, width: '100%', margin: '0 auto', boxSizing: 'border-box',
      }}>
        <div>
          {/* Eyebrow */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '6px 12px 6px 8px', borderRadius: 999,
            background: '#FFE9EA', color: '#8E1820',
            fontSize: 12, fontWeight: 600, marginBottom: 24,
          }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 18, height: 18, borderRadius: '50%', background: '#F4333D', color: '#fff',
            }}>
              <ShieldCheck size={11} color="#fff" />
            </span>
            A Singpass-verified URL shortener
          </div>

          {/* Headline */}
          <h1 style={{
            margin: 0, fontSize: 'clamp(52px, 6vw, 76px)', fontWeight: 800, lineHeight: 0.98,
            letterSpacing: '-0.04em', color: '#1A1714',
          }}>
            Every link,<br />
            <span style={{ color: '#F4333D', fontStyle: 'italic', fontWeight: 700 }}>traceable.</span>
          </h1>

          <p style={{
            margin: '24px 0 32px', fontSize: 17, lineHeight: 1.55, color: '#5C544A', maxWidth: 480,
          }}>
            Trace turns long links into short ones — and ties every shortened URL to a verified Singapore identity.
            No anonymous spam, no phishing chains.
          </p>

          {/* CTA */}
          <form action="/api/auth/login" method="get">
            <button type="submit" style={{
              height: 56, padding: '0 22px 0 8px', borderRadius: 12, border: 'none',
              background: '#F4333D', color: '#fff',
              fontSize: 15, fontWeight: 600, cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: 12,
              boxShadow: '0 1px 0 #C1242C, 0 12px 30px rgba(244,51,61,0.2)',
            }}>
              <span style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 40, height: 40, borderRadius: 8, background: '#fff', flexShrink: 0,
              }}>
                <SingpassLogo size={26} />
              </span>
              Sign in with Singpass
              <ArrowRight size={16} color="#fff" />
            </button>
          </form>
        </div>

        {/* Right visual */}
        <div style={{ position: 'relative' }}>
          <LandingVisual />
        </div>
      </div>
    </div>
  );
}

// ─── Loading skeleton ────────────────────────────────────────────────────────

function LoadingShell() {
  return (
    <div style={{ minHeight: '100vh', background: '#FDFCF9' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '20px 40px', borderBottom: '1px solid #EDE9E3',
      }}>
        <div style={{ width: 26, height: 26, borderRadius: 4, background: '#EDE9E3' }} />
        <div style={{ width: 60, height: 18, borderRadius: 4, background: '#EDE9E3' }} />
      </div>
    </div>
  );
}

// ─── Main app ────────────────────────────────────────────────────────────────

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [links, setLinks] = useState<Link[]>([]);
  const [newLinkId, setNewLinkId] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const meRes = await fetch('/api/auth/me', { credentials: 'include' });
        if (!meRes.ok) { setUser(null); return; }

        const currentUser = (await meRes.json()) as User;
        setUser(currentUser);

        const linksRes = await fetch('/api/links', { credentials: 'include' });
        if (!linksRes.ok) throw new Error(await readError(linksRes));
        setLinks((await linksRes.json()) as Link[]);
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

  if (loading) return <LoadingShell />;

  if (!user) return <LandingPage onLogin={() => {}} />;

  return (
    <div style={{ minHeight: '100vh', background: '#FDFCF9' }}>
      <div className="shell">
        <Topbar user={user} onLogout={() => void logout()} />
        {error && (
          <p style={{ margin: '0 0 16px', color: '#C1242C', fontSize: 13 }}>{error}</p>
        )}
        <CreateLinkForm
          onCreated={link => {
            setLinks(current => [link, ...current]);
            setNewLinkId(link.id);
          }}
        />
        <LinkList
          links={links}
          newLinkId={newLinkId}
          onDisable={id => setLinks(current => current.map(l => l.id === id ? { ...l, isActive: false } : l))}
        />
      </div>
    </div>
  );
}
