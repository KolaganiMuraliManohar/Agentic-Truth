import React from 'react';
import { AgentNodeState } from '../types/agent';
import {
  CheckCircle,
  Clock,
  Loader2,
  AlertCircle,
  Network,
  Cpu,
  Search,
  ShieldAlert,
  ShieldCheck,
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
      case 'supervisor':
      case 'file_ingest':
        return <Network size={18} />;
      case 'claim_extractor':
      case 'exif_forensics':
        return <Cpu size={18} />;
      case 'evidence_retriever':
      case 'ai_synthetic_detector':
        return <Search size={18} />;
      case 'prosecutor_agent':
        return <ShieldAlert size={18} />;
      case 'defender_agent':
        return <ShieldCheck size={18} />;
      case 'judge_agent':
      case 'vision_transformer_judge':
        return <Scale size={18} />;
      default:
        return <Cpu size={18} />;
    }
  };

  const getNodeBadge = (status: AgentNodeState['status']) => {
    switch (status) {
      case 'completed':
        return (
          <span className="node-badge completed">
            <CheckCircle size={13} /> Done
          </span>
        );
      case 'running':
        return (
          <span className="node-badge running">
            <Loader2 size={13} className="spinner" /> Active
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
          <Network size={20} color="var(--accent-color)" />
          <div>
            <h3>LangGraph Multi-Agent Orchestration</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              StateGraph pipeline with parallel dialectic debate & Bayesian judge synthesis
            </p>
          </div>
        </div>
        {isExecuting && (
          <div className="graph-progress-pill">
            <Loader2 size={14} className="spinner" />
            <span>{progressMessage || `${currentProgress}% Processing`}</span>
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

      {/* Interactive Node Graph */}
      <div className="nodes-flow-grid">
        {nodes.map((node, idx) => {
          const isParallel = node.id === 'prosecutor_agent' || node.id === 'defender_agent';
          return (
            <div
              key={node.id}
              className={`node-card ${node.status} ${isParallel ? 'node-parallel' : ''}`}
            >
              <div className="node-top">
                <div className="node-icon-wrapper">
                  {getNodeIcon(node.id)}
                </div>
                {getNodeBadge(node.status)}
              </div>

              <div className="node-body">
                <h4>{node.name}</h4>
                <p className="node-desc">{node.description}</p>

                {node.outputSummary && (
                  <div className="node-summary-box">
                    <span>{node.outputSummary}</span>
                  </div>
                )}
              </div>

              <div className="node-footer">
                <span className="step-counter">Node {idx + 1} of {nodes.length}</span>
                {node.durationMs !== undefined && (
                  <span className="duration-tag">{node.durationMs}ms</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
