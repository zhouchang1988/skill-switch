import { useState, useEffect } from "react";
import { api } from "./api";
import type { ConfigResponse } from "./types";
import { Setup } from "./pages/Setup";
import { Dashboard } from "./pages/Dashboard";
import { ToastContainer } from "./components/Toast";

export function App() {
  const [config, setConfig] = useState<ConfigResponse | null>(null);
  const [loading, setLoading] = useState(true);

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
        </div>
      </nav>
      <main className="app-main">
        <Dashboard config={config} onRefresh={refresh} />
      </main>
      <ToastContainer />
    </div>
  );
}
