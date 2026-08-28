import React, { useState } from 'react';
import {
  Search,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Scale,
  Sparkles,
  ExternalLink,
  Flame
} from 'lucide-react';
import { DetectionResult, AgentNodeState, AgentThought } from '../types/agent';
import { agentGraphService } from '../services/agentGraph';
import { AgentGraphVisualizer } from '../components/AgentGraphVisualizer';
import { AgentThoughtStream } from '../components/AgentThoughtStream';

const PRESET_CLAIMS = [
  {
    title: 'Viral Misinformation',
    text: 'SHOCKING: Secret government report admits 5G radiation weakens human immune systems and causes viral mutations! Doctors are being silenced!',
    url: 'https://conspiracydaily.example.com/5g-leak',
  },
  {
    title: 'Authoritative News',
    text: 'NASA researchers have successfully confirmed the detection of organic molecules in rock samples collected by the Perseverance rover on Mars.',
    url: 'https://www.nasa.gov/news/perseverance-mars-organic-discovery',
  },
  {
    title: 'Unverified Rumor',
    text: 'Leaked internal memo suggests tech giant is preparing to replace 40% of customer support personnel with autonomous AI agents by Q4.',
    url: 'https://techrumorhub.example.org/ai-layoffs',
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
      // Execute the multi-agent LangGraph system
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
          <span className="status-badge status-fake">
            <XCircle size={16} /> Likely Misinformation
          </span>
        );
      case 'LIKELY_REAL':
        return (
          <span className="status-badge status-real">
            <CheckCircle size={16} /> Verified Authentic
          </span>
        );
      default:
        return (
          <span className="status-badge status-uncertain">
            <AlertTriangle size={16} /> Inconclusive / Uncertain
          </span>
        );
    }
  };

  return (
    <div className="content-wrapper">
      {/* Top Banner */}
      <div className="glass-panel text-scanner-hero">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <Scale size={28} color="var(--accent-color)" />
          <h1 style={{ fontSize: '1.85rem', margin: 0 }}>Multi-Agent Text Forensics</h1>
        </div>
        <p style={{ maxWidth: '850px', marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>
          Autonomous multi-agent verification orchestrated with <strong>LangGraph</strong>. Claims are extracted, cross-referenced, and debated in parallel by <strong>Prosecutor</strong> and <strong>Defender</strong> agents before receiving a synthesis verdict by <strong>The Judge</strong>.
        </p>

        {/* Preset selector */}
        <div className="preset-bar">
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Flame size={14} color="#f0883e" /> Quick Presets:
          </span>
          {PRESET_CLAIMS.map((p, idx) => (
            <button key={idx} className="preset-pill" onClick={() => loadPreset(p)}>
              {p.title}
            </button>
          ))}
        </div>

        {/* Input area */}
        <div style={{ marginTop: '1.25rem' }}>
          <textarea
            className="input-area"
            rows={4}
            placeholder="Paste suspicious text, news claims, or social media statements here..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', alignItems: 'center' }}>
          <input
            type="url"
            className="text-input"
            style={{ flex: 1 }}
            placeholder="Optional Source URL (e.g., https://reuters.com/...)"
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
          />
          <button
            className="btn btn-primary"
            onClick={handleScan}
            disabled={isScanning || !inputValue.trim()}
            style={{ minWidth: '190px' }}
          >
            {isScanning ? (
              <>
                <Search className="spinner" size={18} /> Running LangGraph...
              </>
            ) : (
              <>
                <Sparkles size={18} /> Execute Agent Graph
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

      {/* LangGraph Visualizer */}
      {(isScanning || nodes.length > 0) && (
        <div className="glass-panel" style={{ marginTop: '1.5rem', padding: '1.5rem' }}>
          <AgentGraphVisualizer
            nodes={nodes}
            isExecuting={isScanning}
            currentProgress={progress}
            progressMessage={progressMsg}
          />
        </div>
      )}

      {/* Thought Stream & Debate Logs */}
      {(isScanning || thoughts.length > 0) && (
        <div style={{ marginTop: '1.5rem' }}>
          <AgentThoughtStream thoughts={thoughts} trace={result?.execution_trace} />
        </div>
      )}

      {/* Results Dashboard */}
      {result && (
        <div className="glass-panel animate-fade-in" style={{ marginTop: '1.5rem', padding: '2rem' }}>
          <div className="results-header">
            <div>
              <h2 style={{ fontSize: '1.6rem', marginBottom: '0.4rem' }}>Ensemble Forensics Report</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginTop: '0.5rem' }}>
                <span className="metric-pill">
                  Confidence: <strong>{(result.confidence * 100).toFixed(1)}%</strong>
                </span>
                <span className="metric-pill">
                  Uncertainty: <strong>{(result.uncertainty * 100).toFixed(1)}%</strong>
                </span>
                {result.execution_trace?.totalDurationMs && (
                  <span className="metric-pill">
                    Latency: <strong>{result.execution_trace.totalDurationMs}ms</strong>
                  </span>
                )}
              </div>
            </div>
            <div>{renderVerdictBadge(result.verdict)}</div>
          </div>

          {/* Recommendation Box */}
          <div style={{ margin: '1.75rem 0' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>Synthesis & Operational Guidance</h3>
            <div className={`recommendation-card ${result.verdict.toLowerCase()}`}>
              <p>{result.recommendation}</p>
            </div>
          </div>

          {/* Extracted Claims */}
          {result.text_analysis?.claims && result.text_analysis.claims.length > 0 && (
            <div style={{ marginBottom: '1.75rem' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles size={18} color="var(--accent-color)" /> Decomposed Claims ({result.text_analysis.claims.length})
              </h3>
              <div className="claims-list">
                {result.text_analysis.claims.map((claim, idx) => (
                  <div key={idx} className="claim-item">
                    <span className="claim-number">#{idx + 1}</span>
                    <span className="claim-text">{claim}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3-Part IFAI Rationale Dashboard */}
          {result.text_analysis && (
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Scale size={18} color="#a371f7" /> 3-Part Forensic Assessment
              </h3>
              <div className="ifai-grid">
                <div className="card ifai-card ifai-style">
                  <h4>1. Linguistic & Style Profile</h4>
                  <p>{result.text_analysis.ifai_style || 'Adheres to standard syntactic structure.'}</p>
                </div>
                <div className="card ifai-card ifai-content">
                  <h4>2. Empirical Content Grounding</h4>
                  <p>{result.text_analysis.ifai_content || 'Grounded against institutional consensus.'}</p>
                </div>
                <div className="card ifai-card ifai-consistency">
                  <h4>3. Cross-Source Consistency</h4>
                  <p>{result.text_analysis.ifai_consistency || 'Evaluated across multi-registry index.'}</p>
                </div>
              </div>
            </div>
          )}

          {/* Evidence Cards */}
          {result.evidence && result.evidence.length > 0 && (
            <div>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Search size={18} color="var(--accent-color)" /> Grounded Evidence & Citations ({result.evidence.length})
              </h3>
              <div className="evidence-grid">
                {result.evidence.map((ev, index) => (
                  <div key={index} className={`card evidence-card severity-${ev.severity || 'low'}`}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span className="evidence-type-badge">{ev.type.replace(/_/g, ' ')}</span>
                      <span className="evidence-conf">{(ev.confidence * 100).toFixed(0)}% Match</span>
                    </div>
                    <p className="evidence-desc">{ev.description}</p>
                    {ev.proof_quote && (
                      <div className="evidence-quote">
                        <em>"{ev.proof_quote}"</em>
                      </div>
                    )}
                    {ev.source_url && (
                      <a
                        href={ev.source_url}
                        target="_blank"
                        rel="noreferrer"
                        className="evidence-link"
                      >
                        <ExternalLink size={13} /> {ev.source_url}
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TextScanner;
