import { useState } from "react";
import { api } from "../api";
import { showToast } from "./Toast";

interface Props {
  name: string;
  skills: string[];
  isActive: boolean;
  allSkills: string[];
  onRefresh: () => void;
}

export function ThemeCard({ name, skills, isActive, allSkills, onRefresh }: Props) {
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(name);
  const [editSkills, setEditSkills] = useState([...skills]);
  const [adding, setAdding] = useState(false);

  const handleSave = async () => {
    try {
      const data: { newName?: string; skills?: string[] } = {};
      if (editName !== name) data.newName = editName;
      data.skills = editSkills;
      await api.updateTheme(name, data);
      showToast("success", `Theme "${editName}" updated`);
      setEditing(false);
      onRefresh();
    } catch (err: any) {
      showToast("error", err.message);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete theme "${name}"?`)) return;
    try {
      await api.deleteTheme(name);
      showToast("success", `Theme "${name}" deleted`);
      onRefresh();
    } catch (err: any) {
      showToast("error", err.message);
    }
  };

  const handleSwitch = async () => {
    try {
      const result = await api.switchTheme(name);
      const hasErrors = result.targets.some((t) => t.errors.length > 0);
      const hasSkipped = result.targets.some((t) => t.skipped.length > 0);
      if (hasErrors) {
        showToast("warning", `Switched with errors — check status`);
      } else if (hasSkipped) {
        showToast("warning", `Switched — some targets skipped`);
      } else {
        showToast("success", `Switched to "${name}"`);
      }
      onRefresh();
    } catch (err: any) {
      showToast("error", err.message);
    }
  };

  const addableSkills = allSkills.filter((s) => !editSkills.includes(s));

  if (editing) {
    return (
      <div className="card" style={{ borderLeft: isActive ? "3px solid var(--accent)" : undefined }}>
        <div style={{ marginBottom: 12 }}>
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            style={{ fontSize: 16, fontWeight: 600, width: "100%" }}
          />
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
          {editSkills.map((s) => (
            <span key={s} className="tag" style={{ cursor: "pointer" }} onClick={() => setEditSkills(editSkills.filter((x) => x !== s))}>
              {s} ×
            </span>
          ))}
        </div>
        {adding && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
            {addableSkills.map((s) => (
              <span key={s} className="tag" style={{ cursor: "pointer", background: "var(--bg-hover)" }} onClick={() => { setEditSkills([...editSkills, s]); setAdding(false); }}>
                + {s}
              </span>
            ))}
          </div>
        )}
        {!adding && addableSkills.length > 0 && (
          <button className="btn-secondary" onClick={() => setAdding(true)} style={{ marginBottom: 12, fontSize: 12, padding: "4px 10px" }}>
            + Add Skill
          </button>
        )}
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn-primary" onClick={handleSave} style={{ fontSize: 13 }}>Save</button>
          <button className="btn-secondary" onClick={() => { setEditing(false); setEditName(name); setEditSkills([...skills]); }} style={{ fontSize: 13 }}>Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div className="card" style={{ borderLeft: isActive ? "3px solid var(--accent)" : undefined }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <h3 style={{ fontSize: 16 }}>{name}</h3>
        <div style={{ display: "flex", gap: 6 }}>
          {!isActive && (
            <button className="btn-primary" onClick={handleSwitch} style={{ fontSize: 12, padding: "4px 12px" }}>
              Switch
            </button>
          )}
          <button className="btn-secondary" onClick={() => setEditing(true)} style={{ fontSize: 12, padding: "4px 10px" }}>
            Edit
          </button>
          {name !== "全量" && (
            <button className="btn-danger" onClick={handleDelete} style={{ fontSize: 12, padding: "4px 10px" }}>
              ×
            </button>
          )}
        </div>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {skills.map((s) => (
          <span key={s} className="tag">{s}</span>
        ))}
      </div>
      {isActive && <div style={{ marginTop: 8, fontSize: 12, color: "var(--accent)" }}>Active</div>}
    </div>
  );
}
