import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Building2, ChevronDown, ShieldCheck, UserCheck } from 'lucide-react';

export const WorkspaceSwitcher: React.FC = () => {
  const { workspaces, activeWorkspace, switchWorkspace } = useAuth();

  if (!activeWorkspace || workspaces.length === 0) return null;

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <select
        value={activeWorkspace.id}
        onChange={(e) => switchWorkspace(e.target.value)}
        className="form-input"
        style={{
          paddingLeft: '36px',
          paddingRight: '32px',
          fontWeight: 600,
          cursor: 'pointer',
          appearance: 'none',
          background: 'rgba(255, 255, 255, 0.05)',
          borderColor: 'var(--border-color)'
        }}
      >
        {workspaces.map((ws) => (
          <option key={ws.id} value={ws.id} style={{ background: '#0f1420', color: '#fff' }}>
            {ws.name} ({ws.role.toUpperCase()})
          </option>
        ))}
      </select>
      <Building2 size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary-500)', pointerEvents: 'none' }} />
      <ChevronDown size={14} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
    </div>
  );
};
