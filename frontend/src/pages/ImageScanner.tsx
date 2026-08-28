import React, { useState, useRef } from 'react';
import {
  Upload,
  Image as ImageIcon,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileVideo,
  Camera,
  Cpu,
  Search,
  Sparkles,
  HardDrive
} from 'lucide-react';
import { DetectionResult, AgentNodeState, AgentThought } from '../types/agent';
import { agentGraphService } from '../services/agentGraph';
import { AgentGraphVisualizer } from '../components/AgentGraphVisualizer';
import { AgentThoughtStream } from '../components/AgentThoughtStream';

const PRESET_MEDIA = [
  {
    name: 'Synthetic Midjourney Portrait (AI)',
    type: 'image/jpeg',
    isAi: true,
    desc: 'Deepfake diffusion image with stripped EXIF and unnatural skin smoothing',
  },
  {
    name: 'DSLR Camera Photo (Authentic)',
    type: 'image/jpeg',
    isAi: false,
    desc: 'Sony ILCE-7M4 authentic optical sensor raw Bayer output with valid lens profile',
  },
];

const ImageScanner: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMsg, setProgressMsg] = useState('');
  const [nodes, setNodes] = useState<AgentNodeState[]>([]);
  const [thoughts, setThoughts] = useState<AgentThought[]>([]);
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      setPreviewUrl(URL.createObjectURL(selected));
      setResult(null);
      setError(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selected = e.dataTransfer.files[0];
      if (selected.type.startsWith('image/') || selected.type.startsWith('video/')) {
        setFile(selected);
        setPreviewUrl(URL.createObjectURL(selected));
        setResult(null);
        setError(null);
      }
    }
  };

  const selectPreset = (preset: typeof PRESET_MEDIA[0]) => {
    // Generate a mock synthetic / camera file
    const mockFile = new File(['mock data content'], preset.isAi ? 'synthetic_gen_portrait.jpg' : 'dsc_sony_photo.jpg', {
      type: preset.type,
    });
    setFile(mockFile);
    setPreviewUrl(null);
    setResult(null);
    setError(null);
  };

  const clearSelection = () => {
    setFile(null);
    setPreviewUrl(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleScan = async () => {
    if (!file) return;

    setIsScanning(true);
    setError(null);
    setResult(null);
    setThoughts([]);
    setProgress(0);

    try {
      const res = await agentGraphService.executeMediaGraph(file, {
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
      setError(err.message || 'Error executing media forensics.');
    } finally {
      setIsScanning(false);
    }
  };

  const renderVerdictBadge = (verdict: string) => {
    switch (verdict.toUpperCase()) {
      case 'LIKELY_FAKE':
        return (
          <span className="status-badge status-fake">
            <XCircle size={16} /> Synthetic / Manipulated
          </span>
        );
      case 'LIKELY_REAL':
        return (
          <span className="status-badge status-real">
            <CheckCircle size={16} /> Authentic Media
          </span>
        );
      default:
        return (
          <span className="status-badge status-uncertain">
            <AlertTriangle size={16} /> Inconclusive / Stripped EXIF
          </span>
        );
    }
  };

  return (
    <div className="content-wrapper">
      <div className="glass-panel text-scanner-hero">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <Camera size={28} color="var(--accent-color)" />
          <h1 style={{ fontSize: '1.85rem', margin: 0 }}>Multi-Modal Media Forensics</h1>
        </div>
        <p style={{ maxWidth: '850px', marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>
          Detect deepfakes, AI diffusion signatures, face-swaps, and EXIF metadata stripping across images and video feeds using our multi-stage Vision Transformer & Provenance Graph pipeline.
        </p>

        {/* Presets */}
        <div className="preset-bar">
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Sparkles size={14} color="var(--accent-color)" /> Test Presets:
          </span>
          {PRESET_MEDIA.map((p, idx) => (
            <button key={idx} className="preset-pill" onClick={() => selectPreset(p)}>
              {p.name}
            </button>
          ))}
        </div>

        {/* Upload Dropzone */}
        <div
          className={`dropzone ${file ? 'has-file' : ''}`}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => !file && fileInputRef.current?.click()}
          style={{ marginTop: '1.25rem' }}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*,video/*"
            style={{ display: 'none' }}
          />

          {file ? (
            <div className="file-preview-container">
              {previewUrl && file.type.startsWith('image/') ? (
                <img src={previewUrl} alt="Preview" className="media-preview-img" />
              ) : (
                <div className="file-icon-box">
                  {file.type.startsWith('video/') ? <FileVideo size={48} color="#58a6ff" /> : <ImageIcon size={48} color="#58a6ff" />}
                </div>
              )}
              <div className="file-details">
                <strong>{file.name}</strong>
                <span>{(file.size / 1024).toFixed(1)} KB • {file.type || 'Media File'}</span>
                <button className="btn btn-sm" onClick={(e) => { e.stopPropagation(); clearSelection(); }}>
                  Change File
                </button>
              </div>
            </div>
          ) : (
            <div className="dropzone-empty">
              <Upload size={40} color="var(--accent-color)" />
              <h4 style={{ marginTop: '0.75rem', marginBottom: '0.25rem' }}>Drop image or video here, or browse</h4>
              <p style={{ fontSize: '0.85rem' }}>Supports JPG, PNG, WEBP, MP4, MOV up to 100MB</p>
            </div>
          )}
        </div>

        <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            className="btn btn-primary"
            onClick={handleScan}
            disabled={isScanning || !file}
            style={{ minWidth: '200px' }}
          >
            {isScanning ? (
              <>
                <Search className="spinner" size={18} /> Analyzing Forensics...
              </>
            ) : (
              <>
                <Cpu size={18} /> Execute Forensic Graph
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

      {/* Thought Stream */}
      {(isScanning || thoughts.length > 0) && (
        <div style={{ marginTop: '1.5rem' }}>
          <AgentThoughtStream thoughts={thoughts} trace={result?.execution_trace} />
        </div>
      )}

      {/* Forensic Results */}
      {result && (
        <div className="glass-panel animate-fade-in" style={{ marginTop: '1.5rem', padding: '2rem' }}>
          <div className="results-header">
            <div>
              <h2 style={{ fontSize: '1.6rem', marginBottom: '0.4rem' }}>Media Forensic Verdict</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginTop: '0.5rem' }}>
                <span className="metric-pill">
                  Confidence: <strong>{(result.confidence * 100).toFixed(1)}%</strong>
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

          <div style={{ margin: '1.75rem 0' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>Recommendation</h3>
            <div className={`recommendation-card ${result.verdict.toLowerCase()}`}>
              <p>{result.recommendation}</p>
            </div>
          </div>

          {/* Forensic Signal Metrics */}
          {result.media_analysis && (
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <HardDrive size={18} color="var(--accent-color)" /> Forensic Sensor Metrics
              </h3>
              <div className="metrics-grid">
                <div className="card metric-card">
                  <span className="metric-label">Synthetic AI Probability</span>
                  <span className="metric-val" style={{ color: result.media_analysis.deepfake_score > 0.5 ? '#f85149' : '#2ea043' }}>
                    {(result.media_analysis.deepfake_score * 100).toFixed(0)}%
                  </span>
                  <div className="meter-bar">
                    <div
                      className="meter-fill"
                      style={{
                        width: `${result.media_analysis.deepfake_score * 100}%`,
                        backgroundColor: result.media_analysis.deepfake_score > 0.5 ? '#f85149' : '#2ea043',
                      }}
                    />
                  </div>
                </div>

                <div className="card metric-card">
                  <span className="metric-label">Biological Consistency</span>
                  <span className="metric-val" style={{ color: '#58a6ff' }}>
                    {(result.media_analysis.biological_signals_score * 100).toFixed(0)}%
                  </span>
                  <div className="meter-bar">
                    <div className="meter-fill" style={{ width: `${result.media_analysis.biological_signals_score * 100}%`, backgroundColor: '#58a6ff' }} />
                  </div>
                </div>

                <div className="card metric-card">
                  <span className="metric-label">Physical Light Consistency</span>
                  <span className="metric-val" style={{ color: '#a371f7' }}>
                    {(result.media_analysis.physical_consistency_score * 100).toFixed(0)}%
                  </span>
                  <div className="meter-bar">
                    <div className="meter-fill" style={{ width: `${result.media_analysis.physical_consistency_score * 100}%`, backgroundColor: '#a371f7' }} />
                  </div>
                </div>

                <div className="card metric-card">
                  <span className="metric-label">EXIF Authenticity</span>
                  <span className="metric-val" style={{ color: '#d29922' }}>
                    {(result.media_analysis.metadata_score * 100).toFixed(0)}%
                  </span>
                  <div className="meter-bar">
                    <div className="meter-fill" style={{ width: `${result.media_analysis.metadata_score * 100}%`, backgroundColor: '#d29922' }} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Evidence */}
          {result.evidence && result.evidence.length > 0 && (
            <div>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Search size={18} color="var(--accent-color)" /> Forensic Evidence Discovered ({result.evidence.length})
              </h3>
              <div className="evidence-grid">
                {result.evidence.map((ev, index) => (
                  <div key={index} className={`card evidence-card severity-${ev.severity || 'low'}`}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span className="evidence-type-badge">{ev.type.replace(/_/g, ' ')}</span>
                      <span className="evidence-conf">{(ev.confidence * 100).toFixed(0)}% Confidence</span>
                    </div>
                    <p className="evidence-desc">{ev.description}</p>
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

export default ImageScanner;
