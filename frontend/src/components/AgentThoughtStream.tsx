import React, { useState } from 'react';
import { AgentThought, AgentExecutionTrace } from '../types/agent';
import {
  Terminal,
  ShieldAlert,
  ShieldCheck,
  Scale,
  Search,
  MessageSquare,
  Sparkles,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface AgentThoughtStreamProps {
  thoughts: AgentThought[];
  trace?: AgentExecutionTrace;
}

export const AgentThoughtStream: React.FC<AgentThoughtStreamProps> = ({
  thoughts,
  trace,
}) => {
  const [activeTab, setActiveTab] = useState<'stream' | 'debate'>('debate');
  const [isExpanded, setIsExpanded] = useState(true);

  const getThoughtIcon = (role: AgentThought['agentRole']) => {
    switch (role) {
      case 'Prosecutor':
        return <ShieldAlert size={14} color="#f85149" />;
      case 'Defender':
        return <ShieldCheck size={14} color="#2ea043" />;
      case 'Judge':
        return <Scale size={14} color="#a371f7" />;
      case 'Retriever':
        return <Search size={14} color="#58a6ff" />;
      case 'Extractor':
        return <Sparkles size={14} color="#d29922" />;
      default:
        return <Terminal size={14} color="#8b949e" />;
    }
  };

  return (
    <div className="thought-stream-card">
      <div className="thought-stream-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Terminal size={18} color="var(--accent-color)" />
          <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Agent Deliberation & Thought Stream</h3>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div className="stream-tabs">
            <button
              className={`stream-tab-btn ${activeTab === 'debate' ? 'active' : ''}`}
              onClick={() => setActiveTab('debate')}
            >
              <Scale size={14} /> Parallel Debate
            </button>
            <button
              className={`stream-tab-btn ${activeTab === 'stream' ? 'active' : ''}`}
              onClick={() => setActiveTab('stream')}
            >
              <MessageSquare size={14} /> Live Trace ({thoughts.length})
            </button>
          </div>

          <button
            className="btn-icon"
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="thought-stream-body">
          {activeTab === 'debate' && trace?.prosecutorCase && trace?.defenderCase ? (
            <div className="debate-grid">
              {/* Prosecutor Column */}
              <div className="debate-box prosecutor-box">
                <div className="debate-box-header">
                  <ShieldAlert size={18} color="#f85149" />
                  <h4>Prosecutor Agent (Adversarial Case)</h4>
                  <span className="risk-tag">
                    Risk: {(trace.prosecutorCase.riskScore * 100).toFixed(0)}%
                  </span>
                </div>
                <p className="debate-argument">{trace.prosecutorCase.argument}</p>

                {trace.prosecutorCase.redFlags.length > 0 && (
                  <div className="debate-list-section">
                    <span className="debate-list-title">Flagged Red Flags:</span>
                    <ul>
                      {trace.prosecutorCase.redFlags.map((flag, i) => (
                        <li key={i}>{flag}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Defender Column */}
              <div className="debate-box defender-box">
                <div className="debate-box-header">
                  <ShieldCheck size={18} color="#2ea043" />
                  <h4>Defender Agent (Authenticity Case)</h4>
                  <span className="auth-tag">
                    Auth: {(trace.defenderCase.authenticityScore * 100).toFixed(0)}%
                  </span>
                </div>
                <p className="debate-argument">{trace.defenderCase.argument}</p>

                {trace.defenderCase.corroboratingFactors.length > 0 && (
                  <div className="debate-list-section">
                    <span className="debate-list-title">Corroborating Evidence:</span>
                    <ul>
                      {trace.defenderCase.corroboratingFactors.map((factor, i) => (
                        <li key={i}>{factor}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="terminal-logs">
              {thoughts.map((th, index) => (
                <div key={index} className={`terminal-line ${th.level || 'info'}`}>
                  <span className="terminal-timestamp">
                    {new Date(th.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                  <span className="terminal-role">
                    {getThoughtIcon(th.agentRole)}
                    [{th.agentRole}]
                  </span>
                  <span className="terminal-thought">{th.thought}</span>
                  {th.confidence !== undefined && (
                    <span className="terminal-conf">
                      {(th.confidence * 100).toFixed(0)}%
                    </span>
                  )}
                </div>
              ))}
              {thoughts.length === 0 && (
                <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic', padding: '1rem 0' }}>
                  No agent thoughts recorded yet. Run a scan to see live LangGraph execution logs.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
