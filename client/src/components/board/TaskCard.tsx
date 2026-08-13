import React from 'react';
import { Task, TaskPriority } from '../../types';
import { Clock, AlertCircle, ArrowLeft, ArrowRight, Trash2, CheckCircle2 } from 'lucide-react';

interface TaskCardProps {
  task: Task;
  columns: string[];
  onMove: (taskId: string, newStatus: string) => void;
  onDelete: (taskId: string) => void;
  userRole?: string;
}

const priorityColors: Record<TaskPriority, { bg: string; text: string; border: string }> = {
  low: { bg: 'rgba(156, 163, 175, 0.15)', text: '#9ca3af', border: 'rgba(156, 163, 175, 0.3)' },
  medium: { bg: 'rgba(59, 130, 246, 0.15)', text: '#60a5fa', border: 'rgba(59, 130, 246, 0.3)' },
  high: { bg: 'rgba(245, 158, 11, 0.15)', text: '#fbbf24', border: 'rgba(245, 158, 11, 0.3)' },
  urgent: { bg: 'rgba(239, 68, 68, 0.15)', text: '#fca5a5', border: 'rgba(239, 68, 68, 0.3)' }
};

export const TaskCard: React.FC<TaskCardProps> = ({ task, columns, onMove, onDelete, userRole }) => {
  const currentColumnIndex = columns.indexOf(task.status);
  const canLeft = currentColumnIndex > 0;
  const canRight = currentColumnIndex < columns.length - 1;
  const isGuest = userRole === 'guest';

  const priorityStyle = priorityColors[task.priority] || priorityColors.medium;

  return (
    <div className="glass-card" style={{ padding: '14px', marginBottom: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '8px' }}>
        <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)', lineHeight: 1.3 }}>
          {task.title}
        </h4>
        {!isGuest && (
          <button
            onClick={() => onDelete(task._id)}
            style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: '2px' }}
            title="Delete task"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      {task.description && (
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '12px', whiteSpace: 'pre-wrap' }}>
          {task.description}
        </p>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', marginTop: '12px' }}>
        <span
          style={{
            padding: '2px 8px',
            borderRadius: '4px',
            background: priorityStyle.bg,
            color: priorityStyle.text,
            border: `1px solid ${priorityStyle.border}`,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.04em'
          }}
        >
          {task.priority}
        </span>

        {!isGuest && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {canLeft && (
              <button
                className="btn btn-secondary"
                onClick={() => onMove(task._id, columns[currentColumnIndex - 1])}
                style={{ padding: '4px 6px', fontSize: '0.75rem' }}
                title={`Move to ${columns[currentColumnIndex - 1]}`}
              >
                <ArrowLeft size={12} />
              </button>
            )}
            {canRight && (
              <button
                className="btn btn-secondary"
                onClick={() => onMove(task._id, columns[currentColumnIndex + 1])}
                style={{ padding: '4px 6px', fontSize: '0.75rem' }}
                title={`Move to ${columns[currentColumnIndex + 1]}`}
              >
                <ArrowRight size={12} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
