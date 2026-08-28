import React, { useState, useEffect } from 'react';
import { ApiSettings } from '../types/agent';
import { X, Key, Sparkles, Check, Server, Globe } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: ApiSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const [provider, setProvider] = useState<'auto' | 'groq' | 'gemini' | 'openai'>('auto');
  const [groqKey, setGroqKey] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  const [openaiKey, setOpenaiKey] = useState('');
  const [tavilyKey, setTavilyKey] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('agentic_truth_settings');
      if (stored) {
        const parsed = JSON.parse(stored);
        setProvider(parsed.provider || 'auto');
        setGroqKey(parsed.groqApiKey || '');
        setGeminiKey(parsed.geminiApiKey || '');
        setOpenaiKey(parsed.openaiApiKey || '');
        setTavilyKey(parsed.tavilyApiKey || '');
      }
    } catch {
      // ignore
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    const settings: ApiSettings = {
      provider,
      groqApiKey: groqKey,
      geminiApiKey: geminiKey,
      openaiApiKey: openaiKey,
      tavilyApiKey: tavilyKey,
    };
    localStorage.setItem('agentic_truth_settings', JSON.stringify(settings));
    onSave(settings);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 600);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Key size={20} color="var(--accent-color)" />
            <h3>LangGraph Multi-Agent Configuration</h3>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
            Agentic-Truth runs seamlessly on Netlify with built-in heuristic LangGraph reasoning. You can also plug in your live LLM & Search API keys for live cloud reasoning.
          </p>

          <div className="form-group">
            <label className="form-label">Execution Engine Mode</label>
            <div className="provider-selector">
              <button
                type="button"
                className={`provider-card ${provider === 'auto' ? 'selected' : ''}`}
                onClick={() => setProvider('auto')}
              >
                <Sparkles size={18} color="#58a6ff" />
                <div className="provider-info">
                  <strong>Zero-Config Autonomous Mode</strong>
                  <span>High-speed deterministic LangGraph multi-agent dialectic</span>
                </div>
              </button>

              <button
                type="button"
                className={`provider-card ${provider === 'groq' ? 'selected' : ''}`}
                onClick={() => setProvider('groq')}
              >
                <Server size={18} color="#f0883e" />
                <div className="provider-info">
                  <strong>Groq (Llama-3.3-70B / 3.1)</strong>
                  <span>Ultra low-latency LLM inference</span>
                </div>
              </button>

              <button
                type="button"
                className={`provider-card ${provider === 'gemini' ? 'selected' : ''}`}
                onClick={() => setProvider('gemini')}
              >
                <Globe size={18} color="#a371f7" />
                <div className="provider-info">
                  <strong>Google Gemini 2.5 Flash</strong>
                  <span>Advanced multimodal reasoning engine</span>
                </div>
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Groq API Key (Optional)</label>
            <input
              type="password"
              className="text-input"
              placeholder="gsk_..."
              value={groqKey}
              onChange={(e) => setGroqKey(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Google Gemini API Key (Optional)</label>
            <input
              type="password"
              className="text-input"
              placeholder="AIzaSy..."
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Tavily / Search API Key (Optional)</label>
            <input
              type="password"
              className="text-input"
              placeholder="tvly-..."
              value={tavilyKey}
              onChange={(e) => setTavilyKey(e.target.value)}
            />
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSave}>
            {savedSuccess ? (
              <>
                <Check size={16} /> Saved!
              </>
            ) : (
              'Save & Apply'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
