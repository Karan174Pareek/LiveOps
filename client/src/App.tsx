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
import { LogOut, Sparkles, Plus, FolderKanban, Bot, Layers, History, Users, GitBranch } from 'lucide-react';

const DashboardContent: React.FC = () => {
  const { user, activeWorkspace, logout } = useAuth();
  const [boards, setBoards] = useState<Board[]>([]);
  const [activeBoard, setActiveBoard] = useState<Board | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [creatingBoard, setCreatingBoard] = useState(false);
  const [newBoardName, setNewBoardName] = useState('');
  const [isAiPanelOpen, setIsAiPanelOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'boards' | 'activity' | 'members'>('boards');

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
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-dark)' }}>
      {/* Stitch Navigation Header */}
      <header className="glass-panel" style={{ borderRadius: 0, padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-surface)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          {/* Logo & Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '4px', background: 'var(--primary-container)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={16} color="#fff" />
            </div>
            <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.05rem', letterSpacing: '-0.02em' }}>LiveOps</span>
          </div>

          <div style={{ height: '18px', width: '1px', background: 'var(--border-color)' }} />
          <WorkspaceSwitcher />

          {/* Stitch Section Navigation Tabs */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '8px' }}>
            <button
              onClick={() => setActiveTab('boards')}
              className="btn"
              style={{
                padding: '6px 10px',
                fontSize: '0.8rem',
                color: activeTab === 'boards' ? '#fff' : 'var(--text-muted)',
                background: activeTab === 'boards' ? 'rgba(255,255,255,0.06)' : 'transparent',
                borderRadius: 'var(--radius-sm)'
              }}
            >
              <FolderKanban size={14} color={activeTab === 'boards' ? 'var(--primary-container)' : 'var(--text-muted)'} /> Boards
            </button>

            <button
              onClick={() => setIsAiPanelOpen(!isAiPanelOpen)}
              className="btn"
              style={{
                padding: '6px 10px',
                fontSize: '0.8rem',
                color: isAiPanelOpen ? 'var(--tertiary)' : 'var(--text-muted)',
                background: isAiPanelOpen ? 'rgba(183, 109, 255, 0.15)' : 'transparent',
                borderRadius: 'var(--radius-sm)'
              }}
            >
              <Bot size={14} color="var(--tertiary)" /> AI Insights
            </button>
          </nav>
        </div>

        {/* Right Header Status & Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <PresenceBar />

          <div style={{ height: '18px', width: '1px', background: 'var(--border-color)' }} />

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 600, fontSize: '0.825rem' }}>{user.fullName}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)' }}>{user.email}</div>
          </div>

          <button className="btn btn-secondary" onClick={logout} style={{ padding: '6px 10px', fontSize: '0.8rem' }}>
            <LogOut size={14} />
          </button>
        </div>
      </header>

      {/* Main Workspace Stage */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Left Sidebar Board List */}
        <aside className="glass-panel" style={{ width: '240px', borderRadius: 0, borderTop: 0, borderBottom: 0, borderLeft: 0, padding: '16px', display: 'flex', flexDirection: 'column', background: 'var(--bg-surface)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
              Workspace Boards
            </span>
            {activeWorkspace?.role !== 'guest' && (
              <button
                onClick={() => setCreatingBoard(true)}
                style={{ background: 'none', border: 'none', color: 'var(--primary-container)', cursor: 'pointer', padding: '2px' }}
                title="Create Board"
              >
                <Plus size={15} />
              </button>
            )}
          </div>

          {creatingBoard && (
            <form onSubmit={handleCreateBoard} style={{ marginBottom: '14px' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Board name..."
                value={newBoardName}
                onChange={(e) => setNewBoardName(e.target.value)}
                autoFocus
                required
                style={{ marginBottom: '6px', fontSize: '0.8rem' }}
              />
              <div style={{ display: 'flex', gap: '6px' }}>
                <button type="submit" className="btn btn-primary" style={{ padding: '4px 8px', fontSize: '0.725rem' }}>
                  Save
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setCreatingBoard(false)} style={{ padding: '4px 8px', fontSize: '0.725rem' }}>
                  Cancel
                </button>
              </div>
            </form>
          )}

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {boards.length === 0 ? (
              <div style={{ fontSize: '0.775rem', color: 'var(--text-dim)', textAlign: 'center', padding: '20px 0' }}>
                No boards found. Create one to start!
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
                      gap: '8px',
                      padding: '8px 10px',
                      marginBottom: '4px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid',
                      borderColor: isActive ? 'var(--primary-container)' : 'transparent',
                      background: isActive ? 'rgba(128, 131, 255, 0.12)' : 'transparent',
                      color: isActive ? '#fff' : 'var(--text-muted)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontWeight: isActive ? 600 : 400
                    }}
                  >
                    <FolderKanban size={14} color={isActive ? 'var(--primary-container)' : 'var(--text-muted)'} />
                    <span style={{ fontSize: '0.825rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.name}</span>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* Board Main Stage */}
        <main style={{ flex: 1, padding: '20px', overflowY: 'auto', position: 'relative' }}>
          {activeBoard ? (
            <KanbanBoard board={activeBoard} tasks={tasks} onTasksChange={setTasks} />
          ) : (
            <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', maxWidth: '480px', margin: '60px auto' }}>
              <FolderKanban size={40} color="var(--primary-container)" style={{ marginBottom: '14px' }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '6px' }}>No Board Selected</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.825rem' }}>
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
