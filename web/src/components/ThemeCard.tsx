import { useState } from "react";
import { api } from "../api";
import { showToast } from "./Toast";

interface Props {
  name: string;
  skills: string[];
  allSkills: string[];
  onRefresh: () => void;
}

export function ThemeCard({ name, skills, allSkills, onRefresh }: Props) {
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
      showToast("success", `主题「${editName}」已更新`);
      setEditing(false);
      onRefresh();
    } catch (err: any) {
      showToast("error", err.message);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`确认删除主题「${name}」？`)) return;
    try {
      await api.deleteTheme(name);
      showToast("success", `主题「${name}」已删除`);
      onRefresh();
    } catch (err: any) {
      showToast("error", err.message);
    }
  };

  const addableSkills = allSkills.filter((skill) => !editSkills.includes(skill));
  const isDefault = name === "全量";

  if (editing && !isDefault) {
    return (
      <article className="card edit-card">
        <div className="form-stack">
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
          />
          <div className="tag-list compact">
            {editSkills.map((skill) => (
              <button
                key={skill}
                className="tag clickable"
                onClick={() => setEditSkills(editSkills.filter((item) => item !== skill))}
                type="button"
              >
                {skill} ×
              </button>
            ))}
          </div>
          {adding && (
            <div className="tag-list compact">
              {addableSkills.map((skill) => (
                <button
                  key={skill}
                  className="tag clickable"
                  onClick={() => {
                    setEditSkills([...editSkills, skill]);
                    setAdding(false);
                  }}
                  type="button"
                >
                  添加 {skill}
                </button>
              ))}
            </div>
          )}
          {!adding && addableSkills.length > 0 && (
            <button className="btn btn-secondary btn-sm" onClick={() => setAdding(true)}>
              添加技能
            </button>
          )}
          <div className="button-row">
            <button className="btn btn-primary btn-sm" onClick={handleSave}>
              保存
            </button>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => {
                setEditing(false);
                setEditName(name);
                setEditSkills([...skills]);
              }}
            >
              取消
            </button>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="card theme-card">
      <div className="card-header">
        <h3 className="card-title">{name}</h3>
        {!isDefault && (
          <div className="toolbar">
            <button className="btn btn-secondary btn-sm" onClick={() => setEditing(true)}>
              编辑
            </button>
            <button className="btn btn-danger btn-sm" onClick={handleDelete}>
              删除
            </button>
          </div>
        )}
      </div>
      <p className="section-description">{skills.length} 个技能</p>
      <div className="tag-list compact" style={{ marginTop: 10 }}>
        {skills.map((skill) => (
          <span key={skill} className="tag">
            {skill}
          </span>
        ))}
      </div>
    </article>
  );
}
