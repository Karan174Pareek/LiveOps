import React, { useState } from 'react';
import { TaskPriority } from '../../types';
import { Plus, X } from 'lucide-react';

interface CreateTaskModalProps {
  columns: string[];
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (taskData: { title: string; description: string; status: string; priority: TaskPriority }) => void;
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({ columns, isOpen, onClose, onSubmit }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState(columns[0] || 'To Do');
  const [priority, setPriority] = useState<TaskPriority>('medium');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSubmit({ title, description, status, priority });
    setTitle('');
    setDescription('');
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '480px', padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Create New Task</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Task Title</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Implement WebSocket Handshake Middleware"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-input"
              rows={3}
              placeholder="Detailed description of deliverables..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Status Column</label>
              <select className="form-input" value={status} onChange={(e) => setStatus(e.target.value)}>
                {columns.map((col) => (
                  <option key={col} value={col} style={{ background: '#0f1420' }}>
                    {col}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Priority</label>
              <select className="form-input" value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)}>
                <option value="low" style={{ background: '#0f1420' }}>Low</option>
                <option value="medium" style={{ background: '#0f1420' }}>Medium</option>
                <option value="high" style={{ background: '#0f1420' }}>High</option>
                <option value="urgent" style={{ background: '#0f1420' }}>Urgent</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <Plus size={16} /> Create Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
