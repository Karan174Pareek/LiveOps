import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { AuthModal } from './components/auth/AuthModal';
import { WorkspaceSwitcher } from './components/auth/WorkspaceSwitcher';
import { PresenceBar } from './components/presence/PresenceBar';
import { KanbanBoard } from './components/board/KanbanBoard';
import { AiPanel } from './components/ai/AiPanel';
import { Board, Task } from './types';
import { api } from './services/api';
import { LogOut, Sparkles, Plus, FolderKanban, Bot } from 'lucide-react';

const DashboardContent: React.FC = () => {
  const { user, activeWorkspace, logout } = useAuth();
  const [boards, setBoards] = useState<Board[]>([]);
  const [activeBoard, setActiveBoard] = useState<Board | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [creatingBoard, setCreatingBoard] = useState(false);
  const [newBoardName, setNewBoardName] = useState('');
  const [isAiPanelOpen, setIsAiPanelOpen] = useState(false);

  // Fetch workspace boards whenever active workspace changes
  useEffect(() => {
    if (!activeWorkspace) return;

    const fetchBoards = async () => {
      setLoading(true);
      try {
        const { data } = await api.get('/boards');
        setBoards(data);
        if (data.length > 0) {
          setActiveBoard(data[0]);
        } else {
          setActiveBoard(null);
          setTasks([]);
        }
      } catch (err) {
        console.error('Failed to fetch workspace boards:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBoards();
  }, [activeWorkspace?.id]);

  // Fetch tasks when active board changes
  useEffect(() => {
    if (!activeBoard || !activeWorkspace) return;

    const fetchBoardTasks = async () => {
      try {
        const { data } = await api.get(`/boards/${activeBoard._id}`);
        setTasks(data.tasks || []);
      } catch (err) {
        console.error('Failed to fetch board tasks:', err);
      }
    };

    fetchBoardTasks();
  }, [activeBoard?._id, activeWorkspace?.id]);

  const handleCreateBoard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBoardName.trim()) return;

    try {
      const { data } = await api.post('/boards', { name: newBoardName });
      setBoards([...boards, data]);
      setActiveBoard(data);
      setNewBoardName('');
      setCreatingBoard(false);
    } catch (err) {
      console.error('Failed to create board:', err);
    }
  };

  if (!user) {
    return <AuthModal />;
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Header Navigation */}
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
          <div style={{ height: '20px', width: '1px', background: 'var(--border-color)' }} />
          <PresenceBar />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            className="btn btn-secondary"
            onClick={() => setIsAiPanelOpen(!isAiPanelOpen)}
            style={{
              borderColor: isAiPanelOpen ? 'var(--primary-500)' : 'var(--border-color)',
              background: isAiPanelOpen ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.05)'
            }}
          >
            <Bot size={16} color="var(--primary-500)" /> AI Copilot
          </button>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{user.fullName}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user.email}</div>
          </div>
          <button className="btn btn-secondary" onClick={logout} style={{ padding: '8px 12px' }}>
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </header>

      {/* Main Workspace Area */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Left Sidebar Board List */}
        <aside className="glass-panel" style={{ width: '260px', borderRadius: 0, borderTop: 0, borderBottom: 0, borderLeft: 0, padding: '20px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
              Workspace Boards
            </span>
            {activeWorkspace?.role !== 'guest' && (
              <button
                onClick={() => setCreatingBoard(true)}
                style={{ background: 'none', border: 'none', color: 'var(--primary-500)', cursor: 'pointer', padding: '2px' }}
                title="Create Board"
              >
                <Plus size={16} />
              </button>
            )}
          </div>

          {creatingBoard && (
            <form onSubmit={handleCreateBoard} style={{ marginBottom: '16px' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Board title..."
                value={newBoardName}
                onChange={(e) => setNewBoardName(e.target.value)}
                autoFocus
                required
                style={{ marginBottom: '8px' }}
              />
              <div style={{ display: 'flex', gap: '6px' }}>
                <button type="submit" className="btn btn-primary" style={{ padding: '4px 10px', fontSize: '0.75rem' }}>
                  Save
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setCreatingBoard(false)} style={{ padding: '4px 10px', fontSize: '0.75rem' }}>
                  Cancel
                </button>
              </div>
            </form>
          )}

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {boards.length === 0 ? (
              <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', textAlign: 'center', padding: '20px 0' }}>
                No boards in this workspace. Create one to get started!
              </div>
            ) : (
              boards.map((b) => {
                const isActive = activeBoard?._id === b._id;
                return (
                  <button
                    key={b._id}
                    onClick={() => setActiveBoard(b)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 12px',
                      marginBottom: '6px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid',
                      borderColor: isActive ? 'var(--primary-500)' : 'transparent',
                      background: isActive ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                      color: isActive ? '#fff' : 'var(--text-muted)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontWeight: isActive ? 600 : 400
                    }}
                  >
                    <FolderKanban size={16} color={isActive ? 'var(--primary-500)' : 'var(--text-muted)'} />
                    <span style={{ fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.name}</span>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* Board Main Stage */}
        <main style={{ flex: 1, padding: '24px', overflowY: 'auto', position: 'relative' }}>
          {activeBoard ? (
            <KanbanBoard board={activeBoard} tasks={tasks} onTasksChange={setTasks} />
          ) : (
            <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', maxWidth: '500px', margin: '60px auto' }}>
              <FolderKanban size={48} color="var(--primary-500)" style={{ marginBottom: '16px' }} />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '8px' }}>No Board Selected</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                Select a board from the left sidebar or create a new board to start collaborating with your team.
              </p>
            </div>
          )}

          <AiPanel boardId={activeBoard?._id} isOpen={isAiPanelOpen} onClose={() => setIsAiPanelOpen(false)} />
        </main>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <SocketProvider>
        <DashboardContent />
      </SocketProvider>
    </AuthProvider>
  );
};

export default App;
