import { useState } from 'react';
import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { FileText, Image as ImageIcon, ShieldAlert, Settings, Activity, Layers } from 'lucide-react';

import TextScanner from './pages/TextScanner';
import ImageScanner from './pages/ImageScanner';
import { SettingsModal } from './components/SettingsModal';
import { agentGraphService } from './services/agentGraph';
import { ApiSettings } from './types/agent';

function App() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleSaveSettings = (settings: ApiSettings) => {
    agentGraphService.updateSettings(settings);
  };

  return (
    <BrowserRouter>
      <div className="app-container">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="header-logo">
            <div className="logo-icon-glow">
              <ShieldAlert size={28} color="#58a6ff" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, letterSpacing: '-0.02em', margin: 0 }}>
                Agentic Truth
              </h2>
              <span style={{ fontSize: '0.75rem', color: '#58a6ff', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                LangGraph Multi-Agent
              </span>
            </div>
          </div>

          <div className="engine-status-badge">
            <Activity size={13} className="pulse-icon" color="#2ea043" />
            <span>StateGraph Engine • Active</span>
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
            <NavLink
              to="/text"
              className={({ isActive }) => (isActive ? 'btn btn-active' : 'btn')}
              style={{ justifyContent: 'flex-start' }}
            >
              <FileText size={18} /> Text Forensics
            </NavLink>
            <NavLink
              to="/media"
              className={({ isActive }) => (isActive ? 'btn btn-active' : 'btn')}
              style={{ justifyContent: 'flex-start' }}
            >
              <ImageIcon size={18} /> Media & ViT Forensics
            </NavLink>
          </nav>

          <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <button
              className="btn btn-secondary"
              onClick={() => setIsSettingsOpen(true)}
              style={{ justifyContent: 'flex-start', width: '100%', fontSize: '0.85rem' }}
            >
              <Settings size={16} /> Graph Settings
            </button>

            <div className="sidebar-footer-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#58a6ff', fontSize: '0.8rem', fontWeight: 600 }}>
                <Layers size={14} /> Netlify Ready
              </div>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0 0', lineHeight: 1.4 }}>
                Full serverless + client-side StateGraph execution.
              </p>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="main-content flex-1">
          <Routes>
            <Route path="/" element={<Navigate to="/text" replace />} />
            <Route path="/text" element={<TextScanner />} />
            <Route path="/media" element={<ImageScanner />} />
          </Routes>
        </main>

        {/* Settings Modal */}
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          onSave={handleSaveSettings}
        />
      </div>
    </BrowserRouter>
  );
}

export default App;
