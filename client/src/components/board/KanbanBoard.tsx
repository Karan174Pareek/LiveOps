import React, { useState, useEffect } from 'react';
import { Board, Task, TaskPriority } from '../../types';
import { TaskCard } from './TaskCard';
import { CreateTaskModal } from './CreateTaskModal';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { Plus, FolderKanban } from 'lucide-react';

interface KanbanBoardProps {
  board: Board;
  tasks: Task[];
  onTasksChange: React.Dispatch<React.SetStateAction<Task[]>>;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ board, tasks, onTasksChange }) => {
  const { activeWorkspace } = useAuth();
  const { socket, emitTaskMoved, emitTaskCreated, emitTaskDeleted } = useSocket();
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  const isGuest = activeWorkspace?.role === 'guest';

  // Attach Socket listeners for real-time Kanban changes
  useEffect(() => {
    if (!socket) return;

    const handleSocketTaskMoved = (data: { taskId: string; targetColumn: string }) => {
      onTasksChange((prev) =>
        prev.map((t) => (t._id === data.taskId ? { ...t, status: data.targetColumn } : t))
      );
    };

    const handleSocketTaskCreated = (data: { task: Task }) => {
      if (data.task && data.task.boardId === board._id) {
        onTasksChange((prev) => {
          if (prev.some((t) => t._id === data.task._id)) return prev;
          return [...prev, data.task];
        });
      }
    };

    const handleSocketTaskUpdated = (data: { task: Task }) => {
      if (data.task && data.task.boardId === board._id) {
        onTasksChange((prev) => prev.map((t) => (t._id === data.task._id ? data.task : t)));
      }
    };

    const handleSocketTaskDeleted = (data: { taskId: string }) => {
      onTasksChange((prev) => prev.filter((t) => t._id !== data.taskId));
    };

    socket.on('task:moved', handleSocketTaskMoved);
    socket.on('task:created', handleSocketTaskCreated);
    socket.on('task:updated', handleSocketTaskUpdated);
    socket.on('task:deleted', handleSocketTaskDeleted);

    return () => {
      socket.off('task:moved', handleSocketTaskMoved);
      socket.off('task:created', handleSocketTaskCreated);
      socket.off('task:updated', handleSocketTaskUpdated);
      socket.off('task:deleted', handleSocketTaskDeleted);
    };
  }, [socket, board._id, onTasksChange]);

  const handleMoveTask = async (taskId: string, newStatus: string) => {
    const targetTask = tasks.find((t) => t._id === taskId);
    const sourceColumn = targetTask ? targetTask.status : '';

    onTasksChange((prev) => prev.map((t) => (t._id === taskId ? { ...t, status: newStatus } : t)));
    emitTaskMoved({ taskId, sourceColumn, targetColumn: newStatus });

    try {
      await api.put(`/tasks/${taskId}`, { status: newStatus });
    } catch (error) {
      console.error('Failed to sync task move REST:', error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    onTasksChange((prev) => prev.filter((t) => t._id !== taskId));
    emitTaskDeleted(taskId);

    try {
      await api.delete(`/tasks/${taskId}`);
    } catch (error) {
      console.error('Failed to delete task REST:', error);
    }
  };

  const handleCreateTask = async (taskData: { title: string; description: string; status: string; priority: TaskPriority }) => {
    try {
      const { data } = await api.post('/tasks', {
        boardId: board._id,
        ...taskData
      });
      onTasksChange((prev) => [...prev, data]);
      emitTaskCreated(data);
    } catch (error) {
      console.error('Failed to create task REST:', error);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Board Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FolderKanban size={20} color="var(--primary-500)" />
            {board.name}
          </h2>
          {board.description && <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{board.description}</p>}
        </div>

        {!isGuest && (
          <button className="btn btn-primary" onClick={() => setIsTaskModalOpen(true)}>
            <Plus size={16} /> Add Task
          </button>
        )}
      </div>

      {/* Kanban Columns Layout */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${board.columns.length}, minmax(280px, 1fr))`,
          gap: '16px',
          overflowX: 'auto',
          paddingBottom: '16px'
        }}
      >
        {board.columns.map((columnName) => {
          const columnTasks = tasks.filter((t) => t.status === columnName);

          return (
            <div
              key={columnName}
              className="glass-panel"
              style={{
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                minHeight: '500px',
                background: 'rgba(15, 20, 32, 0.6)'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justify: 'space-between',
                  marginBottom: '14px',
                  paddingBottom: '10px',
                  borderBottom: '1px solid var(--border-color)'
                }}
              >
                <h3 style={{ fontSize: '0.875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
                  {columnName}
                </h3>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    color: 'var(--text-main)'
                  }}
                >
                  {columnTasks.length}
                </span>
              </div>

              <div style={{ flex: 1, overflowY: 'auto' }}>
                {columnTasks.length === 0 ? (
                  <div style={{ padding: '30px 10px', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.8rem', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
                    No tasks in {columnName}
                  </div>
                ) : (
                  columnTasks.map((t) => (
                    <TaskCard
                      key={t._id}
                      task={t}
                      columns={board.columns}
                      onMove={handleMoveTask}
                      onDelete={handleDeleteTask}
                      userRole={activeWorkspace?.role}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      <CreateTaskModal
        columns={board.columns}
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSubmit={handleCreateTask}
      />
    </div>
  );
};
