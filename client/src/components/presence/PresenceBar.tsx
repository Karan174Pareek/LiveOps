import React from 'react';
import { useSocket } from '../../context/SocketContext';
import { Users, Wifi, WifiOff } from 'lucide-react';

export const PresenceBar: React.FC = () => {
  const { onlineUsers, connected } = useSocket();

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      {/* Connection Indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: connected ? 'var(--success-500)' : 'var(--text-muted)' }}>
        {connected ? <Wifi size={14} /> : <WifiOff size={14} />}
        <span style={{ fontWeight: 600 }}>{connected ? 'LIVE' : 'RECONNECTING'}</span>
      </div>

      <div style={{ height: '16px', width: '1px', background: 'var(--border-color)' }} />

      {/* Online Users Avatars */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '-6px' }}>
        {onlineUsers.slice(0, 5).map((u, idx) => (
          <div
            key={u.userId + idx}
            title={`${u.fullName} (${u.email}) - Online`}
            style={{
              position: 'relative',
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--primary-500), var(--secondary-500))',
              border: '2px solid var(--bg-dark)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.75rem',
              fontWeight: 700,
              color: '#fff',
              marginLeft: idx > 0 ? '-8px' : '0',
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
            }}
          >
            {u.fullName.charAt(0).toUpperCase()}
            <span
              style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: 'var(--success-500)',
                border: '1.5px solid var(--bg-dark)'
              }}
            />
          </div>
        ))}

        {onlineUsers.length > 5 && (
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: 'var(--bg-input)',
              border: '2px solid var(--bg-dark)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.7rem',
              fontWeight: 600,
              color: 'var(--text-muted)',
              marginLeft: '-8px'
            }}
          >
            +{onlineUsers.length - 5}
          </div>
        )}
      </div>
    </div>
  );
};
