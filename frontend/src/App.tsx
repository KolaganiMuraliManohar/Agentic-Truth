
import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { FileText, Image as ImageIcon, ShieldAlert } from 'lucide-react';

import TextScanner from './pages/TextScanner';
import ImageScanner from './pages/ImageScanner';

function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="header-logo">
            <ShieldAlert size={32} color="#58a6ff" />
            <h2>Agentic Truth</h2>
          </div>
          
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <NavLink 
              to="/text"
              className={({ isActive }) => isActive ? 'btn btn-active' : 'btn'}
              style={{ justifyContent: 'flex-start' }}
            >
              <FileText size={20} /> Text Scanner
            </NavLink>
            <NavLink 
              to="/media"
              className={({ isActive }) => isActive ? 'btn btn-active' : 'btn'}
              style={{ justifyContent: 'flex-start' }}
            >
              <ImageIcon size={20} /> Media Scanner
            </NavLink>
          </nav>

          <div style={{ marginTop: 'auto', fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'center', lineHeight: 1.5 }}>
            <p>Phase 5 - MLOps System</p>
            <p>© 2026 Agentic Truth AI</p>
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
      </div>
    </BrowserRouter>
  );
}

export default App;
