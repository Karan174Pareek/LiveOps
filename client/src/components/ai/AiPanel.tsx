import React, { useState } from 'react';
import { api } from '../../services/api';
import { Bot, Sparkles, Zap, AlertTriangle, X, RefreshCw } from 'lucide-react';

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
      if (data.error) {
        setError(data.error);
      }
      setStandupSummary(data.summary || null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Unable to connect to AI service.');
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
      if (data.error) {
        setError(data.error);
      }
      setRecommendations(data.recommendations || []);
      setSummaryMeta(data.summary || null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Unable to connect to AI service.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', right: '16px', top: '70px', bottom: '16px', width: '400px', zIndex: 900, display: 'flex', flexDirection: 'column' }}>
      <div className="glass-panel" style={{ flex: 1, padding: '20px', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 50px rgba(0,0,0,0.6)', border: '1px solid var(--border-color-hover)', background: 'var(--bg-surface)' }}>
        {/* Drawer Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', paddingBottom: '10px', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: 'var(--radius-sm)', background: 'var(--tertiary-container)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bot size={18} color="#fff" />
            </div>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, fontFamily: 'var(--font-heading)' }}>LiveOps AI Copilot</h3>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>Powered by Claude 3.5 Sonnet</div>
            </div>
          </div>

          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}>
            <X size={18} />
          </button>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
          <button
            className={`btn ${activeTab === 'standup' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={handleFetchStandup}
            disabled={loading}
            style={{ padding: '8px 6px', fontSize: '0.775rem' }}
          >
            <Sparkles size={13} /> Summarize Activity
          </button>

          <button
            className={`btn ${activeTab === 'prioritize' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={handleFetchPrioritize}
            disabled={loading}
            style={{ padding: '8px 6px', fontSize: '0.775rem' }}
          >
            <Zap size={13} /> Suggest Priorities
          </button>
        </div>

        {/* Drawer Body */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading && (
            <div style={{ padding: '20px 10px', textAlign: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ height: '20px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', width: '70%', margin: '0 auto' }} />
                <div style={{ height: '14px', background: 'rgba(255,255,255,0.04)', borderRadius: '4px', width: '90%', margin: '0 auto' }} />
                <div style={{ height: '14px', background: 'rgba(255,255,255,0.04)', borderRadius: '4px', width: '80%', margin: '0 auto' }} />
              </div>
              <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <RefreshCw size={14} className="spin" color="var(--primary-container)" /> Processing intelligence request...
              </p>
            </div>
          )}

          {error && !loading && (
            <div style={{ background: 'rgba(255, 180, 171, 0.12)', border: '1px solid rgba(255, 180, 171, 0.3)', color: 'var(--danger)', padding: '12px', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, marginBottom: '4px' }}>
                <AlertTriangle size={14} /> AI Notice
              </div>
              <p>{error}</p>
            </div>
          )}

          {!loading && activeTab === 'standup' && (
            <div>
              {standupSummary ? (
                <div className="glass-card" style={{ padding: '14px', fontSize: '0.825rem', lineHeight: 1.6, whiteSpace: 'pre-wrap', fontFamily: 'var(--font-body)' }}>
                  {standupSummary}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-dim)', fontSize: '0.8rem' }}>
                  Click <strong>Summarize Activity</strong> to generate a 24h standup report.
                </div>
              )}
            </div>
          )}

          {!loading && activeTab === 'prioritize' && (
            <div>
              {summaryMeta && (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '12px', fontStyle: 'italic' }}>
                  "{summaryMeta}"
                </p>
              )}

              {recommendations.length > 0 ? (
                recommendations.map((item, idx) => (
                  <div key={idx} className="glass-card" style={{ padding: '12px', marginBottom: '8px' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.825rem', marginBottom: '4px' }}>{item.title}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.725rem', marginBottom: '6px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Current: {item.currentPriority}</span>
                      <span>→</span>
                      <span style={{ fontWeight: 700, color: 'var(--primary-container)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                        Suggested: {item.suggestedPriority}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>{item.reasoning}</p>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-dim)', fontSize: '0.8rem' }}>
                  Click <strong>Suggest Priorities</strong> to optimize board item urgency.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
