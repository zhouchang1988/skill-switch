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
  const [storeExpanded, setStoreExpanded] = useState(false);

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
      showToast("success", `已切换到「${theme}」技能组合`);
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
      showToast("success", "技能库路径已更新");
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
      showToast("success", "工具目录已添加");
      setNewTargetPath("");
      setAddingTarget(false);
      onRefresh();
    } catch (err: any) {
      showToast("error", err.message);
    }
  };

  const handleRemoveTarget = async (targetPath: string) => {
    if (!confirm(`确认删除工具目录「${targetPath}」？`)) return;
    const newTargets = targets.filter((t) => t.path !== targetPath);
    try {
      await api.updateConfig({ targets: newTargets });
      showToast("success", "工具目录已删除");
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
      showToast("success", "工具目录已更新");
      setEditingTarget(null);
      onRefresh();
    } catch (err: any) {
      showToast("error", err.message);
    }
  };

  const handleCreate = async () => {
    if (!newThemeName.trim()) return;
    if (newThemeName.trim() === "全量") {
      showToast("error", "「全量」是保留名称，用于自动同步所有技能");
      return;
    }
    try {
      await api.createTheme(newThemeName.trim(), []);
      showToast("success", `技能组合「${newThemeName}」已创建`);
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
      showToast("success", "技能组合已更新");
      setEditingTheme(null);
      onRefresh();
    } catch (err: any) {
      showToast("error", err.message);
    }
  };

  const handleDelete = async (name: string) => {
    if (!confirm(`确认删除技能组合「${name}」？`)) return;
    try {
      await api.deleteTheme(name);
      showToast("success", `技能组合「${name}」已删除`);
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
    if (theme === "全量") return allSkills;
    return themes[theme] || [];
  };

  // Get tool name from path
  const getToolName = (path: string) => {
    const parts = path.split('/');
    const lastPart = parts[parts.length - 1];
    if (lastPart === 'skills' && parts.length > 1) {
      return parts[parts.length - 2].replace(/^\./, '').replace(/^./, c => c.toUpperCase());
    }
    return lastPart;
  };

  return (
    <div className="dashboard">
      {/* Section 1: Store - Collapsible */}
      <section className="store-card">
        <div 
          className="store-card-header"
          onClick={() => setStoreExpanded(!storeExpanded)}
        >
          <div>
            <h2 className="store-card-title">技能库</h2>
            <p className="store-card-description">所有技能源文件的存放位置</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <span className="skill-count">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
              </svg>
              {allSkills.length} 个技能
            </span>
            <button 
              className="btn btn-ghost btn-sm"
              onClick={(e) => {
                e.stopPropagation();
                setEditingStore(true);
                setEditStorePath(store);
              }}
            >
              编辑
            </button>
            <svg 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="var(--text-muted)" 
              strokeWidth="2"
              style={{ 
                transform: storeExpanded ? 'rotate(180deg)' : 'rotate(0)',
                transition: 'transform 0.2s ease'
              }}
            >
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>
        </div>
        
        {storeExpanded && (
          <div className="store-card-content">
            {editingStore ? (
              <div className="inline-form" style={{ marginTop: 'var(--space-3)' }}>
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
                <button className="btn btn-ghost btn-sm" onClick={() => setEditingStore(false)}>
                  取消
                </button>
              </div>
            ) : (
              <div className="store-row">
                <code className="path-code">{store}</code>
              </div>
            )}
            
            {allSkills.length > 0 && (
              <div className="tag-list" style={{ marginTop: 'var(--space-4)' }}>
                {allSkills.map((skill) => (
                  <button
                    key={skill}
                    className="skill-tag skill-tag-clickable"
                    onClick={() => setViewingSkill(skill)}
                    type="button"
                  >
                    {skill}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* Section 2: Target Directories - Main Feature */}
      <section className="section">
        <div className="section-header">
          <div>
            <h1 className="section-title">工具目录</h1>
            <p className="section-subtitle">每个工具目录独立绑定一套技能组合</p>
          </div>
          {!addingTarget ? (
            <button className="btn btn-primary" onClick={() => setAddingTarget(true)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              添加工具目录
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
                className="btn btn-ghost"
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

        <div className="target-list" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          {targets.length === 0 && (
            <div className="empty-state">
              <svg className="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>
              </svg>
              <div className="empty-state-title">还没有工具目录</div>
              <div className="empty-state-description">
                添加工具目录后，可以为每个工具独立配置技能组合
              </div>
            </div>
          )}
          
          {targets.map((target) => {
            const currentTheme = getTargetTheme(target.path);
            const currentSkills = getTargetSkills(target.path);
            const isEditing = editingTarget === target.path;
            const toolName = getToolName(target.path);

            if (isEditing) {
              return (
                <div key={target.path} className="edit-card">
                  <div className="edit-card-header">
                    <h3 className="edit-card-title">编辑工具目录</h3>
                  </div>
                  <div className="edit-card-body">
                    <div className="form-group">
                      <label className="form-label">目录路径</label>
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
                      </div>
                    </div>
                  </div>
                  <div className="edit-card-footer">
                    <button className="btn btn-ghost" onClick={() => setEditingTarget(null)}>
                      取消
                    </button>
                    <button className="btn btn-primary" onClick={() => handleSaveEditTarget(target.path)}>
                      保存
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <article key={target.path} className="target-card">
                <div className="target-card-header">
                  <div className="target-info">
                    <div className="target-path-row">
                      <span className="target-path">{target.path}</span>
                      <span className="target-badge">活跃</span>
                    </div>
                    <div className="target-theme-row">
                      <div className="current-theme">
                        <span className="current-theme-label">当前技能组合</span>
                        <span className="current-theme-value">
                          {currentTheme}
                          <span className="current-theme-count"> · {currentSkills.length} 个技能</span>
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="target-actions">
                    <select
                      className="select-theme"
                      value={currentTheme}
                      onChange={(e) => handleSwitch(target.path, e.target.value)}
                    >
                      <option value="全量">全量</option>
                      {themeEntries.filter(([name]) => name !== "全量").map(([name]) => (
                        <option key={name} value={name}>
                          {name}
                        </option>
                      ))}
                    </select>
                    <div className="toolbar">
                      <button 
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleStartEditTarget(target.path)}
                      >
                        编辑路径
                      </button>
                      <button 
                        className="btn btn-danger btn-sm"
                        onClick={() => handleRemoveTarget(target.path)}
                      >
                        删除
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="target-card-body">
                  <div className="skill-tags">
                    {currentSkills.length === 0 ? (
                      <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>暂无技能</span>
                    ) : (
                      currentSkills.map((skill) => (
                        <button
                          key={skill}
                          className="skill-tag skill-tag-clickable"
                          onClick={() => setViewingSkill(skill)}
                          type="button"
                        >
                          {skill}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Section 3: Themes - Management */}
      <section className="section">
        <div className="section-header">
          <div>
            <h2 className="section-title">技能组合</h2>
            <p className="section-subtitle">管理技能组合的名称和包含的技能</p>
          </div>
          {!creating ? (
            <button className="btn btn-secondary" onClick={() => setCreating(true)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              新建技能组合
            </button>
          ) : (
            <div className="inline-form">
              <input
                type="text"
                value={newThemeName}
                onChange={(e) => setNewThemeName(e.target.value)}
                placeholder="技能组合名称"
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                autoFocus
              />
              <button className="btn btn-primary" onClick={handleCreate}>
                创建
              </button>
              <button
                className="btn btn-ghost"
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

        <div className="theme-grid" style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: 'var(--space-4)'
        }}>
          {/* 全量主题始终显示在第一位 */}
          {(() => {
            const isFullTheme = true;
            const displaySkills = allSkills;
            const isInUse = targets.some((target) => getTargetTheme(target.path) === "全量");
            
            return (
              <article className="theme-card">
                <div className="theme-card-header">
                  <h3 className="theme-card-title">全量</h3>
                  <span className="badge">自动同步</span>
                  {isInUse && <span className="badge badge-success">使用中</span>}
                </div>
                <div className="theme-card-body">
                  <div className="theme-card-meta">
                    <span>{displaySkills.length} 个技能</span>
                  </div>
                  <div className="tag-list tag-list-compact" style={{ marginTop: 'var(--space-3)' }}>
                    {displaySkills.slice(0, 4).map((skill) => (
                      <span key={skill} className="tag">
                        {skill}
                      </span>
                    ))}
                    {displaySkills.length > 4 && (
                      <span className="tag">+{displaySkills.length - 4}</span>
                    )}
                  </div>
                </div>
              </article>
            );
          })()}
          
          {themeEntries.filter(([name]) => name !== "全量").map(([name, skills]) => {
            const isEditing = editingTheme === name;
            const isInUse = targets.some((target) => getTargetTheme(target.path) === name);

            if (isEditing) {
              return (
                <article key={name} className="edit-card">
                  <div className="edit-card-header">
                    <h3 className="edit-card-title">编辑技能组合</h3>
                  </div>
                  <div className="edit-card-body">
                    <div className="form-group">
                      <label className="form-label">名称</label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">包含的技能</label>
                      <div className="tag-list tag-list-compact">
                        {editSkills.map((skill) => (
                          <button
                            key={skill}
                            className="tag tag-removable"
                            onClick={() => setEditSkills(editSkills.filter((item) => item !== skill))}
                            type="button"
                          >
                            {skill} ×
                          </button>
                        ))}
                      </div>
                    </div>
                    {addingSkill && addableSkills.length > 0 && (
                      <div className="form-group">
                        <label className="form-label">添加技能</label>
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
                      </div>
                    )}
                    {!addingSkill && addableSkills.length > 0 && (
                      <button className="btn btn-secondary btn-sm" onClick={() => setAddingSkill(true)}>
                        添加技能
                      </button>
                    )}
                  </div>
                  <div className="edit-card-footer">
                    <button className="btn btn-ghost" onClick={() => setEditingTheme(null)}>
                      取消
                    </button>
                    <button className="btn btn-primary" onClick={handleSaveEdit}>
                      保存
                    </button>
                  </div>
                </article>
              );
            }

            return (
              <article key={name} className="theme-card">
                <div className="theme-card-header">
                  <h3 className="theme-card-title">{name}</h3>
                  {isInUse && <span className="badge badge-success">使用中</span>}
                </div>
                <div className="theme-card-body">
                  <div className="theme-card-meta">
                    <span>{skills.length} 个技能</span>
                  </div>
                  <div className="tag-list tag-list-compact" style={{ marginTop: 'var(--space-3)' }}>
                    {skills.slice(0, 4).map((skill) => (
                      <span key={skill} className="tag">
                        {skill}
                      </span>
                    ))}
                    {skills.length > 4 && (
                      <span className="tag">+{skills.length - 4}</span>
                    )}
                  </div>
                </div>
                <div className="theme-card-footer">
                  <button className="btn btn-ghost btn-sm" onClick={() => handleStartEdit(name)}>
                    编辑
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(name)}>
                    删除
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Modals */}
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
