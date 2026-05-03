'use client';

import { useState } from 'react';
import { Copy, Check, QrCode, Trash2, ExternalLink, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { readError } from '@/lib/api';
import { QRBlock } from '@/components/qr-block';
import type { Link } from '@/lib/types';

interface LinkCardProps {
  link: Link;
  isNew?: boolean;
  onDisable: (id: string) => void;
}

function fmtClicks(n: number): string {
  if (n < 1000) return String(n);
  if (n < 10000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  return Math.round(n / 1000) + 'k';
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-SG', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function fmtRelative(iso: string): string {
  const now = Date.now();
  const diff = (now - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}d ago`;
  return fmtDate(iso);
}

function shortHost(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, ''); }
  catch { return url; }
}

// ─── Delete confirmation modal ───────────────────────────────────────────────
interface DeleteModalProps {
  link: Link;
  onConfirm: () => void;
  onCancel: () => void;
}

function DeleteModal({ link, onConfirm, onCancel }: DeleteModalProps) {
  return (
    <div
      onClick={onCancel}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(26,23,20,0.42)',
        backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 50, animation: 'trace-fade-in 180ms ease-out',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: 'min(440px, 90vw)', background: '#fff', borderRadius: 16,
          padding: 28, boxShadow: '0 30px 80px rgba(0,0,0,0.25)',
          animation: 'trace-pop-in 240ms cubic-bezier(0.2, 0.8, 0.2, 1)',
        }}
      >
        <div style={{
          width: 44, height: 44, borderRadius: 12, background: '#FFE9EA',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#8E1820', marginBottom: 16,
        }}>
          <Trash2 size={20} color="#8E1820" />
        </div>
        <h3 style={{ margin: '0 0 6px', fontSize: 19, fontWeight: 700, letterSpacing: '-0.01em', color: '#1A1714' }}>
          Disable this link?
        </h3>
        <p style={{ margin: '0 0 20px', fontSize: 14, color: '#7A6F5C', lineHeight: 1.5 }}>
          <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, monospace', color: '#1A1714' }}>
            {shortHost(link.shortUrl)}/{link.shortCode}
          </span>{' '}
          will stop redirecting immediately.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            style={{
              height: 42, padding: '0 18px', borderRadius: 10, border: '1px solid #EDE9E3',
              background: '#fff', color: '#1A1714', fontSize: 14, fontWeight: 600, cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              height: 42, padding: '0 18px', borderRadius: 10, border: 'none',
              background: '#F4333D', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer',
            }}
          >
            Disable link
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main link card ──────────────────────────────────────────────────────────
export function LinkCard({ link, isNew, onDisable }: LinkCardProps) {
  const [copied, setCopied] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const expired = link.expiresAt && new Date(link.expiresAt) < new Date();
  const status: 'active' | 'expired' | 'inactive' =
    !link.isActive ? 'inactive' : expired ? 'expired' : 'active';

  const host = shortHost(link.shortUrl);

  function handleCopy() {
    void navigator.clipboard.writeText(link.shortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  async function handleDisable() {
    try {
      const response = await fetch(`/api/links/${link.id}`, {
        method: 'DELETE', credentials: 'include',
      });
      if (!response.ok) throw new Error(await readError(response));
      onDisable(link.id);
      toast.success('Link disabled');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Unable to disable link');
    } finally {
      setConfirmDelete(false);
    }
  }

  return (
    <>
      <article
        style={{
          background: '#fff', border: '1px solid #EDE9E3', borderRadius: 14,
          padding: '22px 24px',
          transition: 'border-color 200ms, box-shadow 200ms',
          animation: isNew ? 'trace-slide-in 380ms cubic-bezier(0.2, 0.8, 0.2, 1)' : undefined,
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.borderColor = '#D9D2C5';
          (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 30px rgba(31,27,20,0.06)';
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.borderColor = '#EDE9E3';
          (e.currentTarget as HTMLElement).style.boxShadow = 'none';
        }}
      >
        {/* Top row: info + actions */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr auto',
          gap: 20, alignItems: 'center',
        }}>
          {/* Info */}
          <div style={{ minWidth: 0 }}>
            {/* Short link */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{
                fontSize: 18, fontWeight: 700, letterSpacing: '-0.01em',
                fontFamily: 'ui-monospace, SFMono-Regular, monospace',
              }}>
                <span style={{ color: '#9A8E78', fontWeight: 500 }}>{host}/</span>
                <span style={{
                  color: status === 'active' ? '#F4333D' : '#9A8E78',
                  textDecoration: status !== 'active' ? 'line-through' : 'none',
                }}>
                  {link.shortCode}
                </span>
              </span>
              {status === 'expired' && (
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
                  background: '#F5F1E8', color: '#7A6F5C', letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                }}>Expired</span>
              )}
              {status === 'inactive' && (
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
                  background: '#F5F1E8', color: '#7A6F5C', letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                }}>Disabled</span>
              )}
            </div>

            {/* Destination */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              color: '#7A6F5C', fontSize: 13,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              <ExternalLink size={12} color="#9A8E78" style={{ flexShrink: 0 }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {link.originalUrl}
              </span>
            </div>

            {/* Meta row */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 14, marginTop: 10,
              fontSize: 12, color: '#9A8E78', flexWrap: 'wrap',
            }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontWeight: 600, color: '#1A1714' }}>
                <span style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: status === 'active' ? '#3CA45E' : '#C9C0AE',
                  display: 'inline-block',
                }} />
                {status === 'active' ? 'Active' : status === 'expired' ? 'Expired' : 'Inactive'}
              </span>
              <span>·</span>
              <span>Created {fmtRelative(link.createdAt)}</span>
              {link.expiresAt && (
                <>
                  <span>·</span>
                  <span>{expired ? 'Expired' : 'Expires'} {fmtDate(link.expiresAt)}</span>
                </>
              )}
              <span style={{ flex: 1 }} />
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#C1242C', fontWeight: 600 }}>
                <ShieldCheck size={11} color="#C1242C" />
                Verified
              </span>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={() => setQrOpen(!qrOpen)}
              title="QR code"
              style={{
                width: 40, height: 40, borderRadius: 10, border: '1px solid #EDE9E3',
                background: qrOpen ? '#F5F1E8' : '#fff', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: qrOpen ? '#1A1714' : '#7A6F5C', transition: 'all 160ms',
              }}
            >
              <QrCode size={16} />
            </button>

            <button
              onClick={handleCopy}
              style={{
                height: 40, padding: '0 14px', borderRadius: 10,
                border: `1px solid ${copied ? '#A9D5BC' : '#EDE9E3'}`,
                background: copied ? '#EAF6EE' : '#fff',
                color: copied ? '#1d6a38' : '#1A1714',
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6,
                transition: 'all 160ms',
              }}
            >
              {copied ? <Check size={15} color="#1d6a38" /> : <Copy size={15} />}
              {copied ? 'Copied' : 'Copy'}
            </button>

            {link.isActive && !expired && (
              <button
                onClick={() => setConfirmDelete(true)}
                title="Disable"
                style={{
                  width: 40, height: 40, borderRadius: 10, border: '1px solid #EDE9E3',
                  background: '#fff', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#9A8E78', transition: 'all 160ms',
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLButtonElement;
                  el.style.background = '#FFF0EE';
                  el.style.borderColor = '#E5A7A7';
                  el.style.color = '#C1242C';
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLButtonElement;
                  el.style.background = '#fff';
                  el.style.borderColor = '#EDE9E3';
                  el.style.color = '#9A8E78';
                }}
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </div>

        {/* QR drawer */}
        {qrOpen && (
          <div style={{
            marginTop: 18, paddingTop: 18, borderTop: '1px dashed #E5DFD6',
            display: 'flex', alignItems: 'center', gap: 20,
            animation: 'trace-fade-in 240ms ease-out',
          }}>
            <div style={{
              padding: 10, background: '#fff', border: '1px solid #EDE9E3', borderRadius: 10,
              flexShrink: 0,
            }}>
              <QRBlock value={link.shortUrl} size={108} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#1A1714', marginBottom: 4 }}>
                Scan or share
              </div>
              <p style={{ margin: 0, fontSize: 13, color: '#7A6F5C', lineHeight: 1.5, maxWidth: 360 }}>
                Embed this QR in posters or printed materials. Anyone scanning lands on the same verified short link.
              </p>
            </div>
          </div>
        )}
      </article>

      {confirmDelete && (
        <DeleteModal
          link={link}
          onConfirm={() => void handleDisable()}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </>
  );
}
