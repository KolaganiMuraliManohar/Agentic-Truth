 import React, { useState, useRef } from 'react';
import { Search, CheckCircle, XCircle, AlertTriangle, ImageIcon, ChevronRight, HardDrive } from 'lucide-react';

interface Evidence {
    type: string;
    description: string;
    confidence: number;
    severity: string;
    source_url?: string;
    proof_quote?: string;
}

interface AnalysisResult {
    verdict: string;
    confidence: number;
    evidence: Evidence[];
    recommendation: string;
}

const ImageScanner: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            setPreviewUrl(URL.createObjectURL(selectedFile));
            setResult(null);
            setError(null);
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const selectedFile = e.dataTransfer.files[0];
            if (selectedFile.type.startsWith('image/') || selectedFile.type.startsWith('video/')) {
                setFile(selectedFile);
                setPreviewUrl(URL.createObjectURL(selectedFile));
                setResult(null);
                setError(null);
            }
        }
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

        const formData = new FormData();
        formData.append('file', file);

        const endpoint = file.type.startsWith('video/') ? '/api/analyze/video' : '/api/analyze/image';

        try {
            const response = await fetch(`http://127.0.0.1:8000${endpoint}`, {
                method: 'POST',
                // Omit Content-Type to let browser set boundary for multipart/form-data
                body: formData,
            });

            if (!response.ok) {
                throw new Error(`Error: ${response.statusText}`);
            }

            const data = await response.json();
            setResult(data);
        } catch (err: any) {
            setError(err.message || 'Failed to scan. Ensure API server is running on :8000');
        } finally {
            setIsScanning(false);
        }
    };

    const renderVerdictBadge = (verdict: string) => {
        switch (verdict.toUpperCase()) {
            case 'LIKELY_FAKE':
                return <span className="status-badge status-fake"><XCircle size={16} /> Manipulated</span>;
            case 'LIKELY_REAL':
                return <span className="status-badge status-real"><CheckCircle size={16} /> Authentic</span>;
            default:
                return <span className="status-badge status-uncertain"><AlertTriangle size={16} /> Uncertain</span>;
        }
    };

    return (
        <div className="content-wrapper">
            <div className="glass-panel" style={{ padding: '2rem' }}>
                <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Media Analysis</h1>
                <p style={{ marginBottom: '2rem' }}>
                    Upload an image or video to run Deepfake ViT detection, OCR meme fact-checking, and CLIP reverse-image search.
                </p>

                {!file ? (
                    <div
                        className="card"
                        style={{
                            border: '2px dashed var(--border-color)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '4rem 2rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            marginBottom: '1.5rem'
                        }}
                        onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--accent-color)'; }}
                        onDragLeave={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--border-color)'; }}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <input
                            type="file"
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                            accept="image/*,video/mp4,video/quicktime"
                            onChange={handleFileChange}
                        />
                        <HardDrive size={48} color="var(--text-secondary)" style={{ marginBottom: '1rem' }} />
                        <h3 style={{ marginBottom: '0.5rem' }}>Drag & drop media here</h3>
                        <p style={{ textAlign: 'center', fontSize: '0.9rem' }}>Supports JPG, PNG, WEBP, MP4 (Max 20MB)</p>
                        <p style={{ marginTop: '1rem', color: 'var(--accent-color)' }}>Or click to browse</p>
                    </div>
                ) : (
                    <div className="card" style={{ marginBottom: '1.5rem', display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                        {file.type.startsWith('image/') ? (
                            <img src={previewUrl!} alt="Preview" style={{ width: '120px', height: '120px', objectFit: 'cover', borderRadius: '8px' }} />
                        ) : (
                            <div style={{ width: '120px', height: '120px', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px' }}>
                                <ImageIcon size={32} color="var(--text-secondary)" />
                            </div>
                        )}

                        <div style={{ flex: 1 }}>
                            <h4 style={{ margin: 0, wordBreak: 'break-all' }}>{file.name}</h4>
                            <p style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                            <button className="btn" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', marginTop: '0.75rem' }} onClick={clearSelection}>
                                Remove
                            </button>
                        </div>
                    </div>
                )}

                <button
                    className="btn btn-primary"
                    onClick={handleScan}
                    disabled={isScanning || !file}
                    style={{ width: '100%' }}
                >
                    {isScanning ? (
                        <>
                            <Search className="spinner" size={20} /> Running Vision Models...
                        </>
                    ) : (
                        <>
                            <Search size={20} /> Analyze Media
                        </>
                    )}
                </button>

                {error && (
                    <div style={{ marginTop: '1.5rem', color: 'var(--danger)', background: 'rgba(248, 81, 73, 0.1)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(248, 81, 73, 0.2)' }}>
                        {error}
                    </div>
                )}
            </div>

            {result && (
                <div className="glass-panel animate-fade-in" style={{ padding: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1.5rem' }}>
                        <div>
                            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Deepfake & Media Report</h2>
                            <p>Confidence: {(result.confidence * 100).toFixed(1)}%</p>
                        </div>
                        <div>
                            {renderVerdictBadge(result.verdict)}
                        </div>
                    </div>

                    <div style={{ marginBottom: '2rem' }}>
                        <h3 style={{ marginBottom: '1rem' }}>System Conclusion</h3>
                        <div className="card" style={{ background: result.verdict === 'LIKELY_FAKE' ? 'rgba(248, 81, 73, 0.05)' : 'rgba(22, 27, 34, 0.4)' }}>
                            <p style={{ color: result.verdict === 'LIKELY_FAKE' ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{result.recommendation}</p>
                        </div>
                    </div>

                    <div>
                        <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <ChevronRight size={20} color="var(--accent-color)" /> Visual Anomalies Found
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {result.evidence.map((ev, idx) => (
                                <div key={idx} className="card" style={{ position: 'relative', overflow: 'hidden' }}>
                                    <div style={{
                                        position: 'absolute',
                                        left: 0,
                                        top: 0,
                                        bottom: 0,
                                        width: '4px',
                                        background: ev.severity === 'HIGH' ? 'var(--danger)' : ev.severity === 'MEDIUM' ? 'var(--warning)' : 'var(--success)'
                                    }} />

                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                        <span style={{ fontWeight: 600, color: 'var(--text-primary)', textTransform: 'capitalize' }}>
                                            {ev.type.replace('_', ' ')}
                                        </span>
                                        <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                            {(ev.confidence * 100).toFixed(0)}%
                                        </span>
                                    </div>
                                    <p style={{ fontSize: '0.95rem', marginBottom: '0.5rem' }}>{ev.description}</p>

                                    {ev.proof_quote && (
                                        <div style={{ background: 'rgba(1, 4, 9, 0.5)', padding: '0.75rem', borderRadius: '4px', borderLeft: '2px solid var(--border-color)', fontSize: '0.9rem', fontStyle: 'italic', marginBottom: '0.5rem' }}>
                                            "{ev.proof_quote}"
                                        </div>
                                    )}
                                </div>
                            ))}
                            {result.evidence.length === 0 && (
                                <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>No anomalies detected in this media file.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ImageScanner;
