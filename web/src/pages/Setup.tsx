import { useState } from "react";
import { api } from "../api";
import type { ConfigResponse } from "../types";
import { showToast } from "../components/Toast";

interface Props {
  onComplete: (config: ConfigResponse) => void;
}

export function Setup({ onComplete }: Props) {
  const [step, setStep] = useState(1);
  const [store, setStore] = useState("");
  const [previewSkills, setPreviewSkills] = useState<string[]>([]);
  const [targets, setTargets] = useState<string[]>(["~/.claude/skills"]);
  const [newTarget, setNewTarget] = useState("");

  const handleScan = async () => {
    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ store }),
      });
      if (res.ok) {
        const data = await res.json();
        setPreviewSkills(data.skills || []);
        setStep(2);
      } else {
        const err = await res.json();
        showToast("error", err.error || "Scan failed");
      }
    } catch {
      showToast("error", "Failed to scan directory");
    }
  };

  const handleAddTarget = () => {
    if (newTarget.trim()) {
      setTargets([...targets, newTarget.trim()]);
      setNewTarget("");
    }
  };

  const handleRemoveTarget = (idx: number) => {
    setTargets(targets.filter((_, i) => i !== idx));
  };

  const handleFinish = async () => {
    try {
      const res = await api.init(store, targets);
      showToast("success", `Initialized with ${previewSkills.length} skills`);
      onComplete({ initialized: true, ...res.config });
    } catch (err: any) {
      showToast("error", err.message);
    }
  };

  return (
    <div style={{ maxWidth: 560, margin: "80px auto", padding: "0 24px" }}>
      <h1 style={{ fontSize: 28, marginBottom: 8 }}>Skill Switch Setup</h1>
      <p style={{ color: "var(--text-secondary)", marginBottom: 32 }}>
        Configure your skill store and target directories.
      </p>

      <div style={{ display: "flex", gap: 8, marginBottom: 32 }}>
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            style={{
              width: 32,
              height: 4,
              borderRadius: 2,
              background: s <= step ? "var(--accent)" : "var(--bg-tertiary)",
            }}
          />
        ))}
      </div>

      {step === 1 && (
        <div className="card">
          <h2 style={{ fontSize: 16, marginBottom: 12 }}>Step 1: Skill Store Directory</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: 14, marginBottom: 16 }}>
            Where are your skill folders stored locally?
          </p>
          <input
            type="text"
            value={store}
            onChange={(e) => setStore(e.target.value)}
            placeholder="e.g. ~/Documents/github-skills"
            style={{ width: "100%", marginBottom: 16 }}
          />
          <button
            className="btn-primary"
            onClick={handleScan}
            disabled={!store.trim()}
          >
            Scan Directory
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="card">
          <h2 style={{ fontSize: 16, marginBottom: 12 }}>Step 2: Skills Found</h2>
          {previewSkills.length === 0 ? (
            <p style={{ color: "var(--warning)" }}>No skills found in this directory.</p>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
              {previewSkills.map((s) => (
                <span key={s} className="tag">{s}</span>
              ))}
            </div>
          )}
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn-secondary" onClick={() => setStep(1)}>Back</button>
            <button className="btn-primary" onClick={() => setStep(3)}>Next</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="card">
          <h2 style={{ fontSize: 16, marginBottom: 12 }}>Step 3: Target Directories</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: 14, marginBottom: 16 }}>
            Where should skill symlinks be created?
          </p>
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
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn-secondary" onClick={() => setStep(2)}>Back</button>
            <button
              className="btn-primary"
              onClick={handleFinish}
              disabled={targets.length === 0}
            >
              Complete Setup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
