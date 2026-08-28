import React, { useState } from 'react';
import {
  Search,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Scale,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  Flame
} from 'lucide-react';
import { DetectionResult, AgentNodeState, AgentThought } from '../types/agent';
import { agentGraphService } from '../services/agentGraph';
import { AgentGraphVisualizer } from '../components/AgentGraphVisualizer';
import { AgentThoughtStream } from '../components/AgentThoughtStream';

const PRESET_CLAIMS = [
  {
    title: 'Actor Yash in Baahubali',
    text: 'hero yash acted in bahubali',
    url: '',
  },
  {
    title: 'Viral 5G Claim',
    text: 'Secret government report admits 5G radiation weakens human immune systems and causes viral mutations! Doctors are being silenced!',
    url: '',
  },
  {
    title: 'NASA Mars Discovery',
    text: 'NASA researchers confirmed the detection of organic molecules in rock samples on Mars.',
    url: 'https://nasa.gov',
  },
];

const TextScanner: React.FC = () => {
  const [inputValue, setInputValue] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMsg, setProgressMsg] = useState('');
  const [nodes, setNodes] = useState<AgentNodeState[]>([]);
  const [thoughts, setThoughts] = useState<AgentThought[]>([]);
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleScan = async () => {
    if (!inputValue.trim()) return;

    setIsScanning(true);
    setError(null);
    setResult(null);
    setThoughts([]);
    setProgress(0);

    try {
      const res = await agentGraphService.executeTextGraph(inputValue, sourceUrl || undefined, {
        onNodeStart: (node) => {
          setNodes((prev) => {
            const existing = prev.find((n) => n.id === node.id);
            if (existing) {
              return prev.map((n) => (n.id === node.id ? { ...node } : n));
            }
            return [...prev, { ...node }];
          });
        },
        onNodeComplete: (node) => {
          setNodes((prev) => prev.map((n) => (n.id === node.id ? { ...node } : n)));
        },
        onThought: (thought) => {
          setThoughts((prev) => [...prev, thought]);
        },
        onProgress: (pct, msg) => {
          setProgress(pct);
          setProgressMsg(msg);
        },
      });

      setResult(res);
      if (res.execution_trace?.nodes) {
        setNodes(res.execution_trace.nodes);
      }
    } catch (err: any) {
      setError(err.message || 'Error executing LangGraph multi-agent analysis.');
    } finally {
      setIsScanning(false);
    }
  };

  const loadPreset = (preset: typeof PRESET_CLAIMS[0]) => {
    setInputValue(preset.text);
    setSourceUrl(preset.url);
    setResult(null);
    setError(null);
  };

  const renderVerdictBadge = (verdict: string) => {
    switch (verdict.toUpperCase()) {
      case 'LIKELY_FAKE':
        return (
          <span className="status-badge status-fake" style={{ fontSize: '1.1rem', padding: '0.5rem 1.25rem' }}>
            <XCircle size={20} /> FALSE
          </span>
        );
      case 'LIKELY_REAL':
        return (
          <span className="status-badge status-real" style={{ fontSize: '1.1rem', padding: '0.5rem 1.25rem' }}>
            <CheckCircle size={20} /> TRUE
          </span>
        );
      default:
        return (
          <span className="status-badge status-uncertain" style={{ fontSize: '1.1rem', padding: '0.5rem 1.25rem' }}>
            <AlertTriangle size={20} /> UNCERTAIN
          </span>
        );
    }
  };

  return (
    <div className="content-wrapper">
      {/* Input Header */}
      <div className="glass-panel text-scanner-hero">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <Scale size={26} color="var(--accent-color)" />
          <h1 style={{ fontSize: '1.75rem', margin: 0 }}>Agentic Truth Check</h1>
        </div>
        <p style={{ marginBottom: '1.25rem', color: 'var(--text-secondary)' }}>
          3-Agent Adversarial System: <strong>True Agent</strong> (Says TRUE & searches) vs <strong>False Agent</strong> (Says FALSE & searches) ➔ <strong>The Judge Agent</strong> (Decides based on verified proof).
        </p>

        {/* Quick Presets */}
        <div className="preset-bar">
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Flame size={14} color="#f0883e" /> Try Claim:
          </span>
          {PRESET_CLAIMS.map((p, idx) => (
            <button key={idx} className="preset-pill" onClick={() => loadPreset(p)}>
              {p.title}
            </button>
          ))}
        </div>

        {/* Text Input */}
        <div style={{ marginTop: '1rem' }}>
          <textarea
            className="input-area"
            rows={3}
            placeholder="Enter any claim or statement (e.g. 'hero yash acted in bahubali')..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem', alignItems: 'center' }}>
          <input
            type="url"
            className="text-input"
            style={{ flex: 1 }}
            placeholder="Optional Source Link"
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
          />
          <button
            className="btn btn-primary"
            onClick={handleScan}
            disabled={isScanning || !inputValue.trim()}
            style={{ minWidth: '180px' }}
          >
            {isScanning ? (
              <>
                <Search className="spinner" size={18} /> Verifying...
              </>
            ) : (
              <>
                <Sparkles size={18} /> Verify Claim
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="error-box" style={{ marginTop: '1rem' }}>
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Visualizer */}
      {(isScanning || nodes.length > 0) && (
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <AgentGraphVisualizer
            nodes={nodes}
            isExecuting={isScanning}
            currentProgress={progress}
            progressMessage={progressMsg}
          />
        </div>
      )}

      {/* Thought Stream */}
      {(isScanning || thoughts.length > 0) && (
        <div>
          <AgentThoughtStream thoughts={thoughts} trace={result?.execution_trace} />
        </div>
      )}

      {/* Clean, Direct Result Section */}
      {result && (
        <div className="glass-panel animate-fade-in" style={{ padding: '1.75rem' }}>
          <div className="results-header" style={{ alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Final Decision
              </span>
              <h2 style={{ fontSize: '1.4rem', margin: '0.2rem 0' }}>
                {result.verdict === 'LIKELY_FAKE'
                  ? 'Claim is FALSE'
                  : result.verdict === 'LIKELY_REAL'
                  ? 'Claim is TRUE'
                  : 'Claim is UNCERTAIN'}
              </h2>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Confidence: <strong>{(result.confidence * 100).toFixed(0)}%</strong> • Latency: {result.execution_trace?.totalDurationMs}ms
              </span>
            </div>
            <div>{renderVerdictBadge(result.verdict)}</div>
          </div>

          {/* Judge Ruling */}
          <div style={{ margin: '1.25rem 0' }}>
            <div className={`recommendation-card ${result.verdict.toLowerCase()}`}>
              <strong style={{ display: 'block', fontSize: '1rem', lineHeight: '1.4' }}>
                {result.recommendation}
              </strong>
              {result.execution_trace?.judgeSynthesis?.whyWon &&
               result.execution_trace.judgeSynthesis.whyWon !== result.recommendation && (
                <p style={{ margin: '0.4rem 0 0 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  {result.execution_trace.judgeSynthesis.whyWon}
                </p>
              )}
            </div>
          </div>

          {/* Direct Proof / References from both agents */}
          <div style={{ marginTop: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Search size={16} color="var(--accent-color)" /> Referenced Proofs & Evidence
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {/* False Agent Proof (if any) */}
              {result.execution_trace?.falseAgentCase?.hasProof && result.execution_trace.falseAgentCase.refutingEvidence && (
                <div className="card" style={{ borderLeft: '4px solid #f85149', background: 'rgba(248, 81, 73, 0.05)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#f85149', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.3rem' }}>
                    <ShieldAlert size={16} /> False Agent Counter-Proof
                  </div>
                  <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                    {result.execution_trace.falseAgentCase.argument}
                  </p>
                  {result.execution_trace.falseAgentCase.proofUrl && (
                    <a
                      href={result.execution_trace.falseAgentCase.proofUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="evidence-link"
                      style={{ marginTop: '0.5rem' }}
                    >
                      <ExternalLink size={13} /> Reference Source: {result.execution_trace.falseAgentCase.proofUrl}
                    </a>
                  )}
                </div>
              )}

              {/* True Agent Proof (if any) */}
              {result.execution_trace?.trueAgentCase?.hasProof && (
                <div className="card" style={{ borderLeft: '4px solid #2ea043', background: 'rgba(46, 160, 67, 0.05)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#2ea043', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.3rem' }}>
                    <ShieldCheck size={16} /> True Agent Supporting Proof
                  </div>
                  <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                    {result.execution_trace.trueAgentCase.argument}
                  </p>
                  {result.execution_trace.trueAgentCase.proofUrl && (
                    <a
                      href={result.execution_trace.trueAgentCase.proofUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="evidence-link"
                      style={{ marginTop: '0.5rem' }}
                    >
                      <ExternalLink size={13} /> Reference Source: {result.execution_trace.trueAgentCase.proofUrl}
                    </a>
                  )}
                </div>
              )}

              {/* If neither had proof */}
              {!result.execution_trace?.falseAgentCase?.hasProof && !result.execution_trace?.trueAgentCase?.hasProof && (
                <div className="card" style={{ background: 'rgba(255, 255, 255, 0.03)' }}>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                    No definitive public citations or debunk matches were found in indexed registries for this specific claim.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TextScanner;
