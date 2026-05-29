import { useState, useEffect } from "react";
import { api } from "../api";
import type { ConfigResponse, StatusResult } from "../types";
import { showToast } from "../components/Toast";
import { DirPicker } from "../components/DirPicker";
import { SkillModal } from "../components/SkillModal";

interface Props {
  config: ConfigResponse;
  onRefresh: () => void;
}

export function Dashboard({ config, onRefresh }: Props) {
  const [status, setStatus] = useState<StatusResult | null>(null);
  const [allSkills, setAllSkills] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [newThemeName, setNewThemeName] = useState("");
  const [editingTheme, setEditingTheme] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editSkills, setEditSkills] = useState<string[]>([]);
  const [addingSkill, setAddingSkill] = useState(false);
  const [addingTarget, setAddingTarget] = useState(false);
  const [newTargetPath, setNewTargetPath] = useState("");
  const [editingTarget, setEditingTarget] = useState<string | null>(null);
  const [editTargetPath, setEditTargetPath] = useState("");
  const [editingStore, setEditingStore] = useState(false);
  const [editStorePath, setEditStorePath] = useState("");
  const [pickerFor, setPickerFor] = useState<"store" | "newTarget" | "editTarget" | null>(null);
  const [viewingSkill, setViewingSkill] = useState<string | null>(null);

  useEffect(() => {
    if (config.initialized) {
      api.getStatus().then(setStatus).catch(() => {});
      api.getSkills().then(setAllSkills).catch(() => {});
    }
  }, [config.initialized]);

  const themes = config.themes || {};
  const themeEntries = Object.entries(themes);
  const targets = config.targets || [];
  const store = config.store || "";

  const handleSwitch = async (targetPath: string, theme: string) => {
    try {
      await api.switchTheme(targetPath, theme);
      showToast("success", `已切换到「${theme}」`);
      onRefresh();
      api.getStatus().then(setStatus).catch(() => {});
    } catch (err: any) {
      showToast("error", err.message);
    }
  };

  const handleSaveStore = async () => {
    if (!editStorePath.trim()) return;
    try {
      await api.updateConfig({ store: editStorePath.trim() });
      showToast("success", "仓库地址已更新");
      setEditingStore(false);
      onRefresh();
    } catch (err: any) {
      showToast("error", err.message);
    }
  };

  const handleAddTarget = async () => {
    if (!newTargetPath.trim()) return;
    const newTargets = [...targets, { path: newTargetPath.trim(), theme: "全量" }];
    try {
      await api.updateConfig({ targets: newTargets });
      showToast("success", "目录已添加");
      setNewTargetPath("");
      setAddingTarget(false);
      onRefresh();
    } catch (err: any) {
      showToast("error", err.message);
    }
  };

  const handleRemoveTarget = async (targetPath: string) => {
    if (!confirm(`确认删除目录「${targetPath}」？`)) return;
    const newTargets = targets.filter((t) => t.path !== targetPath);
    try {
      await api.updateConfig({ targets: newTargets });
      showToast("success", "目录已删除");
      onRefresh();
    } catch (err: any) {
      showToast("error", err.message);
    }
  };

  const handleStartEditTarget = (targetPath: string) => {
    setEditingTarget(targetPath);
    setEditTargetPath(targetPath);
  };

  const handleSaveEditTarget = async (oldPath: string) => {
    if (!editTargetPath.trim() || editTargetPath === oldPath) {
      setEditingTarget(null);
      return;
    }
    const newTargets = targets.map((t) =>
      t.path === oldPath ? { ...t, path: editTargetPath.trim() } : t
    );
    try {
      await api.updateConfig({ targets: newTargets });
      showToast("success", "目录已更新");
      setEditingTarget(null);
      onRefresh();
    } catch (err: any) {
      showToast("error", err.message);
    }
  };

  const handleCreate = async () => {
    if (!newThemeName.trim()) return;
    try {
      await api.createTheme(newThemeName.trim(), []);
      showToast("success", `主题「${newThemeName}」已创建`);
      setNewThemeName("");
      setCreating(false);
      onRefresh();
    } catch (err: any) {
      showToast("error", err.message);
    }
  };

  const handleStartEdit = (name: string) => {
    setEditingTheme(name);
    setEditName(name);
    setEditSkills([...(themes[name] || [])]);
    setAddingSkill(false);
  };

  const handleSaveEdit = async () => {
    if (!editingTheme) return;
    try {
      const data: { newName?: string; skills?: string[] } = {};
      if (editName !== editingTheme) data.newName = editName;
      data.skills = editSkills;
      await api.updateTheme(editingTheme, data);
      showToast("success", "主题已更新");
      setEditingTheme(null);
      onRefresh();
    } catch (err: any) {
      showToast("error", err.message);
    }
  };

  const handleDelete = async (name: string) => {
    if (!confirm(`确认删除主题「${name}」？`)) return;
    try {
      await api.deleteTheme(name);
      showToast("success", `主题「${name}」已删除`);
      onRefresh();
    } catch (err: any) {
      showToast("error", err.message);
    }
  };

  const addableSkills = allSkills.filter((s) => !editSkills.includes(s));

  const handleDirSelect = (dirPath: string) => {
    if (pickerFor === "store") {
      setEditStorePath(dirPath);
    } else if (pickerFor === "newTarget") {
      setNewTargetPath(dirPath);
    } else if (pickerFor === "editTarget") {
      setEditTargetPath(dirPath);
    }
    setPickerFor(null);
  };

  const getTargetTheme = (targetPath: string) => {
    const targetStatus = status?.targets.find((s) => s.target === targetPath);
    const targetConfig = targets.find((t) => t.path === targetPath);
    return targetStatus?.theme || targetConfig?.theme || "全量";
  };

  const getTargetSkills = (targetPath: string) => {
    const theme = getTargetTheme(targetPath);
    return themes[theme] || [];
  };

  return (
    <div className="dashboard">
      <section className="card panel-card">
        <div className="card-header">
          <div>
            <h2 className="card-title">技能仓库</h2>
            <p className="section-description">包含所有技能文件夹的目录</p>
          </div>
        </div>

        {editingStore ? (
          <div className="inline-form" style={{ marginTop: 12 }}>
            <input
              type="text"
              value={editStorePath}
              onChange={(e) => setEditStorePath(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSaveStore()}
              autoFocus
            />
            <button className="btn btn-secondary btn-sm" onClick={() => setPickerFor("store")}>
              浏览
            </button>
            <button className="btn btn-primary btn-sm" onClick={handleSaveStore}>
              保存
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => setEditingStore(false)}>
              取消
            </button>
          </div>
        ) : (
          <div className="store-row">
            <code className="path-code">{store}</code>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => {
                setEditingStore(true);
                setEditStorePath(store);
              }}
            >
              编辑
            </button>
          </div>
        )}

        {allSkills.length > 0 && (
          <div className="tag-list" style={{ marginTop: 14 }}>
            {allSkills.map((skill) => (
              <button
                key={skill}
                className="tag clickable"
                onClick={() => setViewingSkill(skill)}
                type="button"
              >
                {skill}
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="section">
        <div className="section-header">
          <div>
            <h1 className="page-title">目录与主题</h1>
            <p className="page-subtitle">每个目标目录可以独立绑定一个技能主题。</p>
          </div>
          {!addingTarget ? (
            <button className="btn btn-primary" onClick={() => setAddingTarget(true)}>
              添加目录
            </button>
          ) : (
            <div className="inline-form">
              <input
                type="text"
                value={newTargetPath}
                onChange={(e) => setNewTargetPath(e.target.value)}
                placeholder="例如 ~/.codex/skills"
                onKeyDown={(e) => e.key === "Enter" && handleAddTarget()}
                autoFocus
              />
              <button className="btn btn-secondary" onClick={() => setPickerFor("newTarget")}>
                浏览
              </button>
              <button className="btn btn-primary" onClick={handleAddTarget}>
                添加
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setAddingTarget(false);
                  setNewTargetPath("");
                }}
              >
                取消
              </button>
            </div>
          )}
        </div>

        <div className="target-list">
          {targets.length === 0 && <div className="empty-state">还没有目标目录</div>}
          {targets.map((target) => {
            const currentTheme = getTargetTheme(target.path);
            const currentSkills = getTargetSkills(target.path);
            const isEditing = editingTarget === target.path;

            if (isEditing) {
              return (
                <div key={target.path} className="card edit-card">
                  <div className="inline-form">
                    <input
                      type="text"
                      value={editTargetPath}
                      onChange={(e) => setEditTargetPath(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSaveEditTarget(target.path)}
                      autoFocus
                    />
                    <button className="btn btn-secondary btn-sm" onClick={() => setPickerFor("editTarget")}>
                      浏览
                    </button>
                    <button className="btn btn-primary btn-sm" onClick={() => handleSaveEditTarget(target.path)}>
                      保存
                    </button>
                    <button className="btn btn-secondary btn-sm" onClick={() => setEditingTarget(null)}>
                      取消
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <article key={target.path} className="card target-card">
                <div className="target-card-header">
                  <div className="target-main">
                    <div className="target-path-row">
                      <code className="path-code">{target.path}</code>
                      <div className="toolbar">
                        <button className="btn btn-secondary btn-sm" onClick={() => handleStartEditTarget(target.path)}>
                          编辑
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleRemoveTarget(target.path)}>
                          删除
                        </button>
                      </div>
                    </div>
                    <div className="metric-row">
                      <span className="metric-primary">{currentTheme}</span>
                      <span className="metric-secondary">{currentSkills.length} 个技能</span>
                    </div>
                  </div>
                  <select
                    className="select-theme"
                    value={currentTheme}
                    onChange={(e) => handleSwitch(target.path, e.target.value)}
                  >
                    {themeEntries.map(([name]) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="tag-list compact" style={{ marginTop: 12 }}>
                  {currentSkills.length === 0 ? (
                    <span className="muted">暂无技能</span>
                  ) : (
                    currentSkills.map((skill) => (
                      <span key={skill} className="tag">
                        {skill}
                      </span>
                    ))
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="section">
        <div className="section-header">
          <div>
            <h2 className="section-title">主题管理</h2>
            <p className="section-description">维护主题名称和它包含的技能集合。</p>
          </div>
          {!creating ? (
            <button className="btn btn-primary" onClick={() => setCreating(true)}>
              新建主题
            </button>
          ) : (
            <div className="inline-form">
              <input
                type="text"
                value={newThemeName}
                onChange={(e) => setNewThemeName(e.target.value)}
                placeholder="主题名称"
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                autoFocus
              />
              <button className="btn btn-primary" onClick={handleCreate}>
                创建
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setCreating(false);
                  setNewThemeName("");
                }}
              >
                取消
              </button>
            </div>
          )}
        </div>

        <div className="theme-grid">
          {themeEntries.map(([name, skills]) => {
            const isEditing = editingTheme === name;
            const isInUse = targets.some((target) => getTargetTheme(target.path) === name);

            if (isEditing) {
              return (
                <article key={name} className="card edit-card">
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
                    {addingSkill && addableSkills.length > 0 && (
                      <select
                        autoFocus
                        onBlur={() => setAddingSkill(false)}
                        onChange={(e) => {
                          if (e.target.value) {
                            setEditSkills([...editSkills, e.target.value]);
                            setAddingSkill(false);
                          }
                        }}
                      >
                        <option value="">选择技能...</option>
                        {addableSkills.map((skill) => (
                          <option key={skill} value={skill}>
                            {skill}
                          </option>
                        ))}
                      </select>
                    )}
                    {!addingSkill && addableSkills.length > 0 && (
                      <button className="btn btn-secondary btn-sm" onClick={() => setAddingSkill(true)}>
                        添加技能
                      </button>
                    )}
                    <div className="button-row">
                      <button className="btn btn-primary btn-sm" onClick={handleSaveEdit}>
                        保存
                      </button>
                      <button className="btn btn-secondary btn-sm" onClick={() => setEditingTheme(null)}>
                        取消
                      </button>
                    </div>
                  </div>
                </article>
              );
            }

            return (
              <article key={name} className="card theme-card">
                <div className="card-header">
                  <h3 className="card-title">{name}</h3>
                  {isInUse && <span className="badge">使用中</span>}
                </div>
                <p className="section-description">{skills.length} 个技能</p>
                <div className="tag-list compact" style={{ marginTop: 10 }}>
                  {skills.slice(0, 5).map((skill) => (
                    <span key={skill} className="tag">
                      {skill}
                    </span>
                  ))}
                  {skills.length > 5 && <span className="tag">+{skills.length - 5}</span>}
                </div>
                {name !== "全量" && (
                  <div className="button-row" style={{ marginTop: 12 }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => handleStartEdit(name)}>
                      编辑
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(name)}>
                      删除
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </section>

      {pickerFor && (
        <DirPicker
          onSelect={handleDirSelect}
          onClose={() => setPickerFor(null)}
        />
      )}

      {viewingSkill && (
        <SkillModal
          dirName={viewingSkill}
          onClose={() => setViewingSkill(null)}
        />
      )}
    </div>
  );
}
