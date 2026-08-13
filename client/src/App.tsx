import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthModal } from './components/auth/AuthModal';
import { WorkspaceSwitcher } from './components/auth/WorkspaceSwitcher';
import { LogOut, Sparkles, LayoutDashboard } from 'lucide-react';

const DashboardContent: React.FC = () => {
  const { user, activeWorkspace, logout } = useAuth();

  if (!user) {
    return <AuthModal />;
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header Bar */}
      <header className="glass-panel" style={{ borderRadius: 0, padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, var(--primary-500), var(--secondary-500))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={18} color="#fff" />
            </div>
            <span style={{ fontWeight: 700, fontSize: '1.1rem', letterSpacing: '-0.02em' }}>LiveOps</span>
          </div>
          <div style={{ height: '20px', width: '1px', background: 'var(--border-color)' }} />
          <WorkspaceSwitcher />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{user.fullName}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user.email}</div>
          </div>
          <button className="btn btn-secondary" onClick={logout} style={{ padding: '8px 12px' }}>
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </header>

      {/* Main Workspace Stage */}
      <main style={{ flex: 1, padding: '24px', maxWidth: '1400px', width: '100%', margin: '0 auto' }}>
        <div className="glass-panel" style={{ padding: '32px', textAlign: 'center', margin: '40px auto', maxWidth: '600px' }}>
          <LayoutDashboard size={48} color="var(--primary-500)" style={{ marginBottom: '16px' }} />
          <h2 style={{ fontSize: '1.3rem', fontWeight: 600, marginBottom: '8px' }}>
            Workspace: {activeWorkspace?.name}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '20px' }}>
            Authenticated with role: <strong style={{ color: 'var(--primary-500)' }}>{activeWorkspace?.role.toUpperCase()}</strong>. Workspace query-level scoping active.
          </p>
        </div>
      </main>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <DashboardContent />
    </AuthProvider>
  );
};

export default App;
