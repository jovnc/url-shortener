import { LogOut, ShieldCheck } from 'lucide-react';
import { TraceMark } from '@/components/trace-mark';
import type { User } from '@/lib/types';

interface TopbarProps {
  user: User;
  onLogout: () => void;
}

function initials(name: string | null, sub: string): string {
  if (name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return parts[0].slice(0, 2).toUpperCase();
  }
  return sub.slice(0, 2).toUpperCase();
}

export function Topbar({ user, onLogout }: TopbarProps) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '20px 0 20px',
      borderBottom: '1px solid #EDE9E3',
      background: '#FDFCF9',
      position: 'sticky', top: 0, zIndex: 5,
      marginBottom: 32,
    }}>
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <TraceMark size={26} color="#F4333D" />
        <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.01em', color: '#1A1714' }}>
          Trace
        </span>
        <span style={{
          marginLeft: 8, padding: '3px 8px', borderRadius: 4,
          background: '#F5F1E8', fontSize: 11, fontWeight: 600, color: '#7A6F5C',
          letterSpacing: '0.04em', textTransform: 'uppercase',
        }}>
          Beta
        </span>
      </div>

      {/* User + logout */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '6px 14px 6px 6px', borderRadius: 999,
          border: '1px solid #EDE9E3', background: '#FAFAF7',
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: 'linear-gradient(135deg, #F4333D, #8E1820)',
            color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 700, flexShrink: 0,
          }}>
            {initials(user.name, user.sub)}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: '#1A1714' }}>
              {user.name ?? user.sub}
            </span>
            <span style={{
              fontSize: 10.5, color: '#9A8E78',
              display: 'flex', alignItems: 'center', gap: 4,
            }}>
              <ShieldCheck size={10} color="#F4333D" style={{ flexShrink: 0 }} />
              Singpass-verified
            </span>
          </div>
        </div>

        <button
          onClick={onLogout}
          title="Sign out"
          style={{
            width: 36, height: 36, borderRadius: 8, border: '1px solid #EDE9E3',
            background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#7A6F5C', cursor: 'pointer',
          }}
        >
          <LogOut size={16} />
        </button>
      </div>
    </div>
  );
}
