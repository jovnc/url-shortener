'use client';

import { FormEvent, useState } from 'react';
import { Link2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { readError } from '@/lib/api';
import type { Link } from '@/lib/types';

const EXPIRY_PRESETS = [
  { id: 'never', label: 'Never' },
  { id: '24h',   label: '24 hours' },
  { id: '7d',    label: '7 days' },
  { id: '30d',   label: '30 days' },
] as const;

type ExpiryPreset = typeof EXPIRY_PRESETS[number]['id'];

function expiryToDate(preset: ExpiryPreset): string | undefined {
  if (preset === 'never') return undefined;
  const now = new Date();
  if (preset === '24h') now.setHours(now.getHours() + 24);
  else if (preset === '7d') now.setDate(now.getDate() + 7);
  else if (preset === '30d') now.setDate(now.getDate() + 30);
  return now.toISOString();
}

interface CreateLinkFormProps {
  onCreated: (link: Link) => void;
}

export function CreateLinkForm({ onCreated }: CreateLinkFormProps) {
  const [url, setUrl] = useState('');
  const [expiry, setExpiry] = useState<ExpiryPreset>('never');
  const [advanced, setAdvanced] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const validUrl = /^https?:\/\/.+/.test(url);
  const canSubmit = validUrl && !saving;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;
    setSaving(true);
    setError('');

    try {
      const expiresAt = expiryToDate(expiry);
      const response = await fetch('/api/links', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ originalUrl: url, ...(expiresAt ? { expiresAt } : {}) }),
      });

      if (!response.ok) throw new Error(await readError(response));

      const link = (await response.json()) as Link;
      onCreated(link);
      setUrl('');
      setExpiry('never');
      setAdvanced(false);
      toast.success('Short link created!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create link');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <form
        onSubmit={handleSubmit}
        style={{
          background: '#fff', border: '1px solid #EDE9E3', borderRadius: 16,
          padding: 28, boxShadow: '0 1px 0 rgba(0,0,0,0.02), 0 12px 32px rgba(31,27,20,0.04)',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
          marginBottom: 20,
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, letterSpacing: '-0.015em', color: '#1A1714' }}>
              New short link
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#7A6F5C' }}>
              Paste a long URL. Customise the alias if you want.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setAdvanced(!advanced)}
            style={{
              background: 'transparent', border: 'none', color: '#F4333D',
              fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: '4px 0',
              flexShrink: 0,
            }}
          >
            {advanced ? 'Hide options' : 'Advanced options'}
          </button>
        </div>

        {/* URL input */}
        <div style={{ marginBottom: advanced ? 14 : 20 }}>
          <div style={{
            fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
            textTransform: 'uppercase', color: '#9A8E78', marginBottom: 7,
          }}>
            Destination URL
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '0 14px', height: 52, borderRadius: 10,
            border: `1.5px solid ${url && !validUrl ? '#E5A7A7' : '#E5DFD6'}`,
            background: '#FDFCF9',
            transition: 'border-color 160ms',
          }}>
            <Link2 size={18} color="#9A8E78" style={{ flexShrink: 0 }} />
            <input
              type="url"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://example.com/very-long-url"
              required
              style={{
                flex: 1, border: 'none', outline: 'none', background: 'transparent',
                fontSize: 15, color: '#1A1714', fontFamily: 'inherit',
              }}
            />
          </div>
        </div>

        {/* Advanced options */}
        {advanced && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
            {/* Expiry presets */}
            <div>
              <div style={{
                fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
                textTransform: 'uppercase', color: '#9A8E78', marginBottom: 7,
              }}>
                Expires after
              </div>
              <div style={{
                display: 'flex', gap: 6, height: 52, padding: 6,
                background: '#F5F1E8', borderRadius: 10,
              }}>
                {EXPIRY_PRESETS.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setExpiry(p.id)}
                    style={{
                      flex: 1, border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 600,
                      background: expiry === p.id ? '#fff' : 'transparent',
                      color: expiry === p.id ? '#1A1714' : '#7A6F5C',
                      boxShadow: expiry === p.id ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                      cursor: 'pointer', transition: 'all 120ms',
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={!canSubmit}
          style={{
            width: '100%', height: 52, borderRadius: 10, border: 'none',
            background: canSubmit ? '#F4333D' : '#E5DFD6',
            color: '#fff', fontSize: 15, fontWeight: 600, letterSpacing: '-0.005em',
            cursor: canSubmit ? 'pointer' : 'not-allowed',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            transition: 'background 160ms',
          }}
        >
          {saving ? (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" style={{ animation: 'trace-spin 0.8s linear infinite' }}>
                <circle cx="12" cy="12" r="9" fill="none" stroke="#fff" strokeWidth="2.5" strokeOpacity="0.3" />
                <path d="M21 12a9 9 0 0 0-9-9" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
              Minting your link…
            </>
          ) : (
            <>
              Shorten link
              <ArrowRight size={16} color="#fff" />
            </>
          )}
        </button>
      </form>

      {error && (
        <p style={{ margin: 0, color: '#C1242C', fontSize: 13 }}>{error}</p>
      )}
    </div>
  );
}
