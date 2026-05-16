import React, { useState } from 'react';
import { Search, Link2, CheckCircle, XCircle, AlertTriangle, ChevronRight } from 'lucide-react';

interface Evidence {
    type: string;
    description: string;
    confidence: number;
    severity: string;
    source_url?: string;
    proof_quote?: string;
}

interface TextAnalysisResult {
    ifai_style?: string;
    ifai_content?: string;
    ifai_consistency?: string;
}

interface AnalysisResult {
    verdict: string;
    confidence: number;
    evidence: Evidence[];
    recommendation: string;
    text_analysis?: TextAnalysisResult;
}

const TextScanner: React.FC = () => {
    const [inputValue, setInputValue] = useState('');
    const [isScanning, setIsScanning] = useState(false);
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleScan = async () => {
        if (!inputValue.trim()) return;

        setIsScanning(true);
        setError(null);
        setResult(null);

        const endpoint = '/api/analyze/text';
        const payload = { text: inputValue };

        try {
            // Assume API runs on localhost:8000 (handled via uvicorn/CORS)
            const response = await fetch(`http://127.0.0.1:8000${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw new Error(`Error: ${response.statusText}`);
            }

            const data = await response.json();
            setResult(data);
        } catch (err: any) {
            setError(err.message || 'Failed to scan. Is the API running and CORS enabled?');
        } finally {
            setIsScanning(false);
        }
    };

    const renderVerdictBadge = (verdict: string) => {
        switch (verdict.toUpperCase()) {
            case 'LIKELY_FAKE':
                return <span className="status-badge status-fake"><XCircle size={16} /> Fake</span>;
            case 'LIKELY_REAL':
                return <span className="status-badge status-real"><CheckCircle size={16} /> Real</span>;
            default:
                return <span className="status-badge status-uncertain"><AlertTriangle size={16} /> Uncertain</span>;
        }
    };

    return (
        <div className="content-wrapper">
            <div className="glass-panel" style={{ padding: '2rem' }}>
                <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Text Analysis</h1>
                <p style={{ marginBottom: '2rem' }}>
                    Extract claims from text, perform live evidence retrieval,
                    and run NLI fact-checking natively.
                </p>

                <div style={{ marginBottom: '1.5rem' }}>
                    <textarea
                        className="input-area"
                        placeholder="Paste suspicious text, claims, or social media posts here..."
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                    />
                </div>

                <button
                    className="btn btn-primary"
                    onClick={handleScan}
                    disabled={isScanning || !inputValue.trim()}
                    style={{ width: '100%' }}
                >
                    {isScanning ? (
                        <>
                            <Search className="spinner" size={20} /> Analyzing with Agentic Framework...
                        </>
                    ) : (
                        <>
                            <Search size={20} /> Scan Content
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
                            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Analysis Results</h2>
                            <p>Confidence: {(result.confidence * 100).toFixed(1)}%</p>
                        </div>
                        <div>
                            {renderVerdictBadge(result.verdict)}
                        </div>
                    </div>

                    <div style={{ marginBottom: '2rem' }}>
                        <h3 style={{ marginBottom: '1rem' }}>Recommendation</h3>
                        <div className="card" style={{ background: result.verdict === 'LIKELY_FAKE' ? 'rgba(248, 81, 73, 0.05)' : 'rgba(22, 27, 34, 0.4)' }}>
                            <p style={{ color: result.verdict === 'LIKELY_FAKE' ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{result.recommendation}</p>
                        </div>
                    </div>

                    {/* Phase 13: IFAI Structured Assessment Dashboard */}
                    {result.text_analysis && (result.text_analysis.ifai_style || result.text_analysis.ifai_content || result.text_analysis.ifai_consistency) && (
                        <div style={{ marginBottom: '2rem' }}>
                            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <AlertTriangle size={20} color="var(--accent-color)" /> AI Judge Rationale
                            </h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                                {result.text_analysis.ifai_style && (
                                    <div className="card" style={{ borderTop: '3px solid #8e44ad' }}>
                                        <h4 style={{ color: '#9b59b6', marginBottom: '0.5rem', fontSize: '1rem' }}>Style & Formatting</h4>
                                        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>{result.text_analysis.ifai_style}</p>
                                    </div>
                                )}
                                {result.text_analysis.ifai_content && (
                                    <div className="card" style={{ borderTop: '3px solid #3498db' }}>
                                        <h4 style={{ color: '#2980b9', marginBottom: '0.5rem', fontSize: '1rem' }}>Content Verification</h4>
                                        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>{result.text_analysis.ifai_content}</p>
                                    </div>
                                )}
                                {result.text_analysis.ifai_consistency && (
                                    <div className="card" style={{ borderTop: '3px solid #e67e22' }}>
                                        <h4 style={{ color: '#d35400', marginBottom: '0.5rem', fontSize: '1rem' }}>Cross-Source Consistency</h4>
                                        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>{result.text_analysis.ifai_consistency}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <div>
                        <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <ChevronRight size={20} color="var(--accent-color)" /> Evidence Retrieved
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {result.evidence.map((ev, idx) => (
                                <div key={idx} className="card" style={{ position: 'relative', overflow: 'hidden' }}>
                                    {/* Left colored bar based on severity */}
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

                                    {ev.source_url && (
                                        <div style={{ fontSize: '0.85rem' }}>
                                            <a href={ev.source_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-color)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                <Link2 size={14} /> Source Link
                                            </a>
                                        </div>
                                    )}
                                </div>
                            ))}
                            {result.evidence.length === 0 && (
                                <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>No concrete evidence generated.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TextScanner;
