import { useState } from "react";
import { api } from "../api";
import type { ConfigResponse } from "../types";
import { showToast } from "../components/Toast";

interface Props {
  config: ConfigResponse;
  onRefresh: () => void;
}

export function Settings({ config, onRefresh }: Props) {
  const [store, setStore] = useState(config.store || "");
  const [targets, setTargets] = useState<string[]>(config.targets || []);
  const [newTarget, setNewTarget] = useState("");
  const [dirty, setDirty] = useState(false);

  const handleSave = async () => {
    try {
      await api.updateConfig({ store, targets });
      showToast("success", "Settings saved");
      setDirty(false);
      onRefresh();
    } catch (err: any) {
      showToast("error", err.message);
    }
  };

  const handleAddTarget = () => {
    if (newTarget.trim()) {
      setTargets([...targets, newTarget.trim()]);
      setNewTarget("");
      setDirty(true);
    }
  };

  const handleRemoveTarget = (idx: number) => {
    setTargets(targets.filter((_, i) => i !== idx));
    setDirty(true);
  };

  return (
    <div>
      <h1 style={{ fontSize: 24, marginBottom: 24 }}>Settings</h1>

      <div className="card" style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 16, marginBottom: 12 }}>Skill Store Directory</h2>
        <input
          type="text"
          value={store}
          onChange={(e) => { setStore(e.target.value); setDirty(true); }}
          style={{ width: "100%" }}
        />
        <p style={{ color: "var(--text-muted)", fontSize: 12, marginTop: 8 }}>
          Directory containing all skill folders. Changes take effect on next scan.
        </p>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 16, marginBottom: 12 }}>Target Directories</h2>
        {targets.map((t, i) => (
          <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <input type="text" value={t} readOnly style={{ flex: 1 }} />
            <button className="btn-danger" onClick={() => handleRemoveTarget(i)} style={{ padding: "8px 12px" }}>
              ×
            </button>
          </div>
        ))}
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <input
            type="text"
            value={newTarget}
            onChange={(e) => setNewTarget(e.target.value)}
            placeholder="e.g. ~/.codex/skills"
            style={{ flex: 1 }}
            onKeyDown={(e) => e.key === "Enter" && handleAddTarget()}
          />
          <button className="btn-secondary" onClick={handleAddTarget}>Add</button>
        </div>
        <p style={{ color: "var(--text-muted)", fontSize: 12 }}>
          Symlinks will be created in these directories when switching themes.
        </p>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 16, marginBottom: 8 }}>Config Location</h2>
        <code style={{ color: "var(--text-secondary)", fontSize: 13 }}>~/.skill-switch/config.json</code>
      </div>

      <button className="btn-primary" onClick={handleSave} disabled={!dirty}>
        Save Settings
      </button>
    </div>
  );
}
