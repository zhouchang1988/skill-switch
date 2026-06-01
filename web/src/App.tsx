import { useState, useEffect } from "react";
import { api } from "./api";
import type { ConfigResponse } from "./types";
import { Setup } from "./pages/Setup";
import { Dashboard } from "./pages/Dashboard";
import { ToastContainer } from "./components/Toast";
import { HelpModal } from "./components/HelpModal";

export function App() {
  const [config, setConfig] = useState<ConfigResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    api.getConfig().then((c) => {
      setConfig(c);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <div className="loading-state">加载中...</div>;
  }

  if (!config?.initialized) {
    return (
      <>
        <Setup onComplete={(c) => { setConfig(c); }} />
        <ToastContainer />
      </>
    );
  }

  const refresh = () => api.getConfig().then(setConfig);

  return (
    <div className="app-shell">
      <nav className="app-topbar">
        <div className="app-topbar-inner">
          <div className="brand">
            <span className="brand-mark">SS</span>
            <span>Skill Switch</span>
          </div>
          <button 
            className="btn btn-ghost"
            onClick={() => setShowHelp(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: '15px' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
            帮助
          </button>
        </div>
      </nav>
      <main className="app-main">
        <Dashboard config={config} onRefresh={refresh} />
      </main>
      <ToastContainer />
      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
    </div>
  );
}
