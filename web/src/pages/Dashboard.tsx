import { useState, useEffect } from "react";
import { api } from "../api";
import type { ConfigResponse } from "../types";
import { ThemeCard } from "../components/ThemeCard";
import { showToast } from "../components/Toast";

interface Props {
  config: ConfigResponse;
  onRefresh: () => void;
}

export function Dashboard({ config, onRefresh }: Props) {
  const [allSkills, setAllSkills] = useState<string[]>([]);
  const [newThemeName, setNewThemeName] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (config.initialized) {
      api.getSkills().then(setAllSkills).catch(() => {});
    }
  }, [config.initialized]);

  const themes = config.themes || {};
  const themeEntries = Object.entries(themes);

  const handleCreate = async () => {
    if (!newThemeName.trim()) return;
    try {
      await api.createTheme(newThemeName.trim(), []);
      showToast("success", `Theme "${newThemeName}" created`);
      setNewThemeName("");
      setCreating(false);
      onRefresh();
    } catch (err: any) {
      showToast("error", err.message);
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, marginBottom: 4 }}>Themes</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
            Current: <span style={{ color: "var(--accent)" }}>{config.currentTheme}</span>
          </p>
        </div>
        {!creating ? (
          <button className="btn-primary" onClick={() => setCreating(true)}>+ New Theme</button>
        ) : (
          <div style={{ display: "flex", gap: 8 }}>
            <input
              type="text"
              value={newThemeName}
              onChange={(e) => setNewThemeName(e.target.value)}
              placeholder="Theme name"
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              autoFocus
            />
            <button className="btn-primary" onClick={handleCreate}>Create</button>
            <button className="btn-secondary" onClick={() => { setCreating(false); setNewThemeName(""); }}>Cancel</button>
          </div>
        )}
      </div>

      <div style={{ display: "grid", gap: 12 }}>
        {themeEntries.map(([name, skills]) => (
          <ThemeCard
            key={name}
            name={name}
            skills={skills}
            isActive={name === config.currentTheme}
            allSkills={allSkills}
            onRefresh={onRefresh}
          />
        ))}
      </div>
    </div>
  );
}
