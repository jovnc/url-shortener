import { ShieldCheck } from 'lucide-react';
import { LinkCard } from './link-card';
import { LinkCardSkeleton } from './link-card-skeleton';
import type { Link } from '@/lib/types';

interface LinkListProps {
  links: Link[];
  newLinkId?: string;
  loading?: boolean;
  onDisable: (id: string) => void;
}

export function LinkList({ links, newLinkId, loading, onDisable }: LinkListProps) {
  return (
    <section style={{ display: 'grid', gap: 12, marginTop: 20 }} aria-label="Short links">
      {loading ? (
        <>
          <LinkCardSkeleton />
          <LinkCardSkeleton />
          <LinkCardSkeleton />
        </>
      ) : links.length === 0 ? (
        <div style={{
          background: '#fff', border: '1px solid #EDE9E3', borderRadius: 14,
          padding: '56px 24px', display: 'flex', flexDirection: 'column',
          alignItems: 'center', gap: 12, textAlign: 'center',
        }}>
          <div style={{
            width: 52, height: 52, borderRadius: 12, background: '#FFE9EA',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <ShieldCheck size={24} color="#F4333D" />
          </div>
          <div>
            <p style={{ margin: 0, fontWeight: 600, color: '#1A1714' }}>No links yet</p>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#7A6F5C' }}>
              Create your first verified short link above.
            </p>
          </div>
        </div>
      ) : (
        links.map(link => (
          <LinkCard
            key={link.id}
            link={link}
            isNew={link.id === newLinkId}
            onDisable={onDisable}
          />
        ))
      )}
    </section>
  );
}
