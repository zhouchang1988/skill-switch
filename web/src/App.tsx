import { useState, useEffect } from "react";
import { api } from "./api";
import type { ConfigResponse } from "./types";
import { Setup } from "./pages/Setup";
import { Dashboard } from "./pages/Dashboard";
import { Skills } from "./pages/Skills";
import { Settings } from "./pages/Settings";
import { ToastContainer } from "./components/Toast";

type Page = "dashboard" | "skills" | "settings";

function getPage(): Page {
  const hash = window.location.hash.replace("#", "");
  if (hash === "skills") return "skills";
  if (hash === "settings") return "settings";
  return "dashboard";
}

export function App() {
  const [config, setConfig] = useState<ConfigResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(getPage);

  useEffect(() => {
    api.getConfig().then((c) => {
      setConfig(c);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    const handler = () => setPage(getPage());
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, []);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 80 }}>
        Loading...
      </div>
    );
  }

  if (!config?.initialized) {
    return (
      <>
        <Setup onComplete={(c) => { setConfig(c); }} />
        <ToastContainer />
      </>
    );
  }

  const nav = (
    <nav
      style={{
        display: "flex",
        gap: 4,
        padding: "12px 24px",
        borderBottom: "1px solid var(--border)",
        background: "var(--bg-secondary)",
      }}
    >
      <a href="#dashboard" style={{
        padding: "6px 12px",
        borderRadius: 6,
        background: page === "dashboard" ? "var(--bg-hover)" : "transparent",
        color: page === "dashboard" ? "var(--text-primary)" : "var(--text-secondary)",
      }}>
        Dashboard
      </a>
      <a href="#skills" style={{
        padding: "6px 12px",
        borderRadius: 6,
        background: page === "skills" ? "var(--bg-hover)" : "transparent",
        color: page === "skills" ? "var(--text-primary)" : "var(--text-secondary)",
      }}>
        Skills
      </a>
      <a href="#settings" style={{
        padding: "6px 12px",
        borderRadius: 6,
        background: page === "settings" ? "var(--bg-hover)" : "transparent",
        color: page === "settings" ? "var(--text-primary)" : "var(--text-secondary)",
      }}>
        Settings
      </a>
    </nav>
  );

  const refresh = () => api.getConfig().then(setConfig);

  return (
    <div style={{ minHeight: "100vh" }}>
      {nav}
      <main style={{ maxWidth: 960, margin: "0 auto", padding: "24px" }}>
        {page === "dashboard" && <Dashboard config={config} onRefresh={refresh} />}
        {page === "skills" && <Skills config={config} onRefresh={refresh} />}
        {page === "settings" && <Settings config={config} onRefresh={refresh} />}
      </main>
      <ToastContainer />
    </div>
  );
}
