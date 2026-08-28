import React, { useState } from 'react';
import { AgentThought, AgentExecutionTrace } from '../types/agent';
import {
  Terminal,
  ShieldAlert,
  ShieldCheck,
  Scale,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Award
} from 'lucide-react';

interface AgentThoughtStreamProps {
  thoughts: AgentThought[];
  trace?: AgentExecutionTrace;
}

export const AgentThoughtStream: React.FC<AgentThoughtStreamProps> = ({
  thoughts,
  trace,
}) => {
  const [activeTab, setActiveTab] = useState<'debate' | 'stream'>('debate');
  const [isExpanded, setIsExpanded] = useState(true);

  const getThoughtIcon = (role: AgentThought['agentRole']) => {
    switch (role) {
      case 'FalseAgent':
        return <ShieldAlert size={14} color="#f85149" />;
      case 'TrueAgent':
        return <ShieldCheck size={14} color="#2ea043" />;
      case 'JudgeAgent':
        return <Scale size={14} color="#a371f7" />;
      default:
        return <Terminal size={14} color="#8b949e" />;
    }
  };

  return (
    <div className="thought-stream-card">
      <div className="thought-stream-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Scale size={20} color="var(--accent-color)" />
          <div>
            <h3 style={{ fontSize: '1.1rem', margin: 0 }}>3-Agent Deliberation & Dialectic Debate</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              True Agent vs False Agent ➔ The Judge synthesis
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div className="stream-tabs">
            <button
              className={`stream-tab-btn ${activeTab === 'debate' ? 'active' : ''}`}
              onClick={() => setActiveTab('debate')}
            >
              <Scale size={14} /> 3-Agent Debate
            </button>
            <button
              className={`stream-tab-btn ${activeTab === 'stream' ? 'active' : ''}`}
              onClick={() => setActiveTab('stream')}
            >
              <MessageSquare size={14} /> Live Thought Stream ({thoughts.length})
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
          {activeTab === 'debate' && trace?.trueAgentCase && trace?.falseAgentCase ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Opponent Row */}
              <div className="debate-grid">
                {/* True Agent Case */}
                <div className="debate-box defender-box">
                  <div className="debate-box-header">
                    <ShieldCheck size={18} color="#2ea043" />
                    <div>
                      <h4 style={{ color: '#3fb950' }}>True Agent (Claims TRUE & Searches)</h4>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                        {trace.trueAgentCase.searchStrategy}
                      </span>
                    </div>
                    <span className="auth-tag">
                      Support: {(trace.trueAgentCase.credibilityScore * 100).toFixed(0)}%
                    </span>
                  </div>
                  <p className="debate-argument">{trace.trueAgentCase.argument}</p>

                  {trace.trueAgentCase.supportingEvidence.length > 0 && (
                    <div className="debate-list-section">
                      <span className="debate-list-title">Supporting Citations Found:</span>
                      <ul>
                        {trace.trueAgentCase.supportingEvidence.map((factor, i) => (
                          <li key={i}>{factor}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* False Agent Case */}
                <div className="debate-box prosecutor-box">
                  <div className="debate-box-header">
                    <ShieldAlert size={18} color="#f85149" />
                    <div>
                      <h4 style={{ color: '#f85149' }}>False Agent (Claims FALSE & Searches)</h4>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                        {trace.falseAgentCase.searchStrategy}
                      </span>
                    </div>
                    <span className="risk-tag">
                      Deception: {(trace.falseAgentCase.deceptionScore * 100).toFixed(0)}%
                    </span>
                  </div>
                  <p className="debate-argument">{trace.falseAgentCase.argument}</p>

                  {trace.falseAgentCase.refutingEvidence.length > 0 && (
                    <div className="debate-list-section">
                      <span className="debate-list-title">Debunk & Refuting Points Found:</span>
                      <ul>
                        {trace.falseAgentCase.refutingEvidence.map((flag, i) => (
                          <li key={i}>{flag}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {/* The Judge Agent Synthesis & Borrowed Decision */}
              {trace.judgeSynthesis && (
                <div className="judge-decision-card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <Award size={20} color="#a371f7" />
                    <h4 style={{ fontSize: '1.05rem', margin: 0, color: '#a371f7' }}>
                      The Judge Agent Decision & Borrowed Reasoning
                    </h4>
                  </div>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1.5, marginBottom: '0.5rem' }}>
                    <strong>Ruling:</strong> {trace.judgeSynthesis.whyWon}
                  </p>
                  <div className="borrowed-rationale-box">
                    <span style={{ fontSize: '0.8rem', color: '#a371f7', fontWeight: 600, display: 'block', marginBottom: '0.2rem' }}>
                      Borrowed Reasoning from Prevailing Agent:
                    </span>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, fontStyle: 'italic' }}>
                      {trace.judgeSynthesis.borrowedRationale}
                    </p>
                  </div>
                </div>
              )}
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
                  No agent thoughts recorded yet. Run a scan to see the 3 agents debate in real-time.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
