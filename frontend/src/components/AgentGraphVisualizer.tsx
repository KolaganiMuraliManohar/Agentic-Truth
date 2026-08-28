import React from 'react';
import { AgentNodeState } from '../types/agent';
import {
  CheckCircle,
  Clock,
  Loader2,
  AlertCircle,
  ShieldCheck,
  ShieldAlert,
  Scale
} from 'lucide-react';

interface AgentGraphVisualizerProps {
  nodes: AgentNodeState[];
  currentProgress?: number;
  progressMessage?: string;
  isExecuting?: boolean;
}

export const AgentGraphVisualizer: React.FC<AgentGraphVisualizerProps> = ({
  nodes,
  currentProgress = 0,
  progressMessage = '',
  isExecuting = false,
}) => {
  const getNodeIcon = (id: string) => {
    switch (id) {
      case 'true_agent':
        return <ShieldCheck size={22} color="#2ea043" />;
      case 'false_agent':
        return <ShieldAlert size={22} color="#f85149" />;
      case 'judge_agent':
        return <Scale size={22} color="#a371f7" />;
      default:
        return <Scale size={22} color="var(--accent-color)" />;
    }
  };

  const getNodeBadge = (status: AgentNodeState['status']) => {
    switch (status) {
      case 'completed':
        return (
          <span className="node-badge completed">
            <CheckCircle size={13} /> Completed
          </span>
        );
      case 'running':
        return (
          <span className="node-badge running">
            <Loader2 size={13} className="spinner" /> Searching & Debating
          </span>
        );
      case 'failed':
        return (
          <span className="node-badge failed">
            <AlertCircle size={13} /> Error
          </span>
        );
      default:
        return (
          <span className="node-badge pending">
            <Clock size={13} /> Queued
          </span>
        );
    }
  };

  return (
    <div className="agent-graph-container">
      <div className="agent-graph-header">
        <div className="agent-graph-title">
          <Scale size={24} color="var(--accent-color)" />
          <div>
            <h3 style={{ fontSize: '1.2rem', margin: 0 }}>3-Agent Adversarial LangGraph System</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0 0' }}>
              <strong>True Agent</strong> (Says TRUE & Searches) vs <strong>False Agent</strong> (Says FALSE & Searches) ➔ <strong>The Judge Agent</strong> (Decides with Borrowed Reasoning)
            </p>
          </div>
        </div>
        {isExecuting && (
          <div className="graph-progress-pill">
            <Loader2 size={14} className="spinner" />
            <span>{progressMessage || `${currentProgress}% In Progress`}</span>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      {isExecuting && (
        <div className="graph-progress-bar-bg">
          <div
            className="graph-progress-bar-fill"
            style={{ width: `${Math.max(5, currentProgress)}%` }}
          />
        </div>
      )}

      {/* 3-Agent Grid Layout: Parallel Opponents on Left/Right, Judge Below */}
      <div className="three-agent-layout">
        <div className="opponents-row">
          {nodes.filter(n => n.id !== 'judge_agent').map((node) => {
            const isTrue = node.id === 'true_agent';
            return (
              <div
                key={node.id}
                className={`node-card opponent-card ${node.status} ${isTrue ? 'true-node' : 'false-node'}`}
              >
                <div className="node-top">
                  <div className="node-icon-wrapper">
                    {getNodeIcon(node.id)}
                  </div>
                  {getNodeBadge(node.status)}
                </div>

                <div className="node-body">
                  <h4 style={{ color: isTrue ? '#3fb950' : '#f85149' }}>{node.name}</h4>
                  <p className="node-desc">{node.roleDescription}</p>

                  {node.outputSummary && (
                    <div className="node-summary-box">
                      <span>{node.outputSummary}</span>
                    </div>
                  )}
                </div>

                <div className="node-footer">
                  <span className="step-counter">
                    {isTrue ? 'Hypothesis: Claims TRUE' : 'Hypothesis: Claims FALSE'}
                  </span>
                  {node.durationMs !== undefined && (
                    <span className="duration-tag">{node.durationMs}ms</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Judge Node */}
        {nodes.filter(n => n.id === 'judge_agent').map((judgeNode) => (
          <div
            key={judgeNode.id}
            className={`node-card judge-node-card ${judgeNode.status}`}
          >
            <div className="node-top">
              <div className="node-icon-wrapper">
                {getNodeIcon(judgeNode.id)}
              </div>
              {getNodeBadge(judgeNode.status)}
            </div>

            <div className="node-body">
              <h4 style={{ color: '#a371f7', fontSize: '1.05rem' }}>{judgeNode.name}</h4>
              <p className="node-desc">{judgeNode.roleDescription}</p>

              {judgeNode.outputSummary && (
                <div className="node-summary-box" style={{ borderLeftColor: '#a371f7' }}>
                  <span>{judgeNode.outputSummary}</span>
                </div>
              )}
            </div>

            <div className="node-footer">
              <span className="step-counter">Final Evaluator & Synthesizer</span>
              {judgeNode.durationMs !== undefined && (
                <span className="duration-tag">{judgeNode.durationMs}ms</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
