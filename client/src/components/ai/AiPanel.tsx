import React, { useState } from 'react';
import { api } from '../../services/api';
import { Bot, Sparkles, Zap, CheckCircle2, AlertTriangle, X, RefreshCw } from 'lucide-react';

interface AiPanelProps {
  boardId?: string;
  isOpen: boolean;
  onClose: () => void;
}

export const AiPanel: React.FC<AiPanelProps> = ({ boardId, isOpen, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'standup' | 'prioritize'>('standup');
  const [standupSummary, setStandupSummary] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [summaryMeta, setSummaryMeta] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFetchStandup = async () => {
    setLoading(true);
    setError(null);
    setActiveTab('standup');

    try {
      const { data } = await api.post('/ai/summarize-standup');
      setStandupSummary(data.summary);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch AI standup summary.');
    } finally {
      setLoading(false);
    }
  };

  const handleFetchPrioritize = async () => {
    setLoading(true);
    setError(null);
    setActiveTab('prioritize');

    try {
      const { data } = await api.post('/ai/prioritize', { boardId });
      setRecommendations(data.recommendations || []);
      setSummaryMeta(data.summary || null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch AI prioritization recommendations.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', right: '20px', top: '80px', bottom: '20px', width: '420px', zIndex: 900, display: 'flex', flexDirection: 'column' }}>
      <div className="glass-panel" style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 50px rgba(0,0,0,0.6)', border: '1px solid var(--border-color-hover)' }}>
        {/* Drawer Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, var(--secondary-500), var(--primary-500))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bot size={20} color="#fff" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>LiveOps AI Assistant</h3>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Powered by Anthropic Claude</div>
            </div>
          </div>

          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
          <button
            className={`btn ${activeTab === 'standup' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={handleFetchStandup}
            disabled={loading}
            style={{ padding: '10px 8px', fontSize: '0.8rem' }}
          >
            <Sparkles size={14} /> Summarize Activity
          </button>

          <button
            className={`btn ${activeTab === 'prioritize' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={handleFetchPrioritize}
            disabled={loading}
            style={{ padding: '10px 8px', fontSize: '0.8rem' }}
          >
            <Zap size={14} /> Suggest Priorities
          </button>
        </div>

        {/* Response Body Stage */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading && (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
              <RefreshCw size={24} className="spin" style={{ marginBottom: '12px', color: 'var(--primary-500)' }} />
              <p style={{ fontSize: '0.85rem' }}>Claude AI analyzing workspace intelligence...</p>
            </div>
          )}

          {error && (
            <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#fca5a5', padding: '14px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, marginBottom: '6px' }}>
                <AlertTriangle size={16} /> Error Generating AI Output
              </div>
              <p>{error}</p>
            </div>
          )}

          {!loading && !error && activeTab === 'standup' && (
            <div>
              {standupSummary ? (
                <div className="glass-card" style={{ padding: '16px', fontSize: '0.875rem', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                  {standupSummary}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                  Click <strong>Summarize Activity</strong> to generate a 24h executive standup report.
                </div>
              )}
            </div>
          )}

          {!loading && !error && activeTab === 'prioritize' && (
            <div>
              {summaryMeta && (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '14px', fontStyle: 'italic' }}>
                  "{summaryMeta}"
                </p>
              )}

              {recommendations.length > 0 ? (
                recommendations.map((item, idx) => (
                  <div key={idx} className="glass-card" style={{ padding: '14px', marginBottom: '10px' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '4px' }}>{item.title}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', marginBottom: '8px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Current: {item.currentPriority}</span>
                      <span>→</span>
                      <span style={{ fontWeight: 700, color: 'var(--primary-500)', textTransform: 'uppercase' }}>
                        Suggested: {item.suggestedPriority}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.reasoning}</p>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                  Click <strong>Suggest Priorities</strong> to optimize board item urgency with AI.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
