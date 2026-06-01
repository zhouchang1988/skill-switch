import { useState } from "react";
import { api } from "../api";
import type { ConfigResponse, TargetConfig } from "../types";
import { showToast } from "../components/Toast";
import { DirPicker } from "../components/DirPicker";

interface Props {
  onComplete: (config: ConfigResponse) => void;
}

export function Setup({ onComplete }: Props) {
  const [store, setStore] = useState("");
  const [targetPath, setTargetPath] = useState("~/.claude/skills");
  const [previewSkills, setPreviewSkills] = useState<string[]>([]);
  const [scanning, setScanning] = useState(false);
  const [pickerFor, setPickerFor] = useState<"store" | "target" | null>(null);

  const handleScan = async () => {
    if (!store.trim()) return;
    setScanning(true);
    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ store }),
      });
      if (res.ok) {
        const data = await res.json();
        setPreviewSkills(data.skills || []);
      } else {
        const err = await res.json();
        showToast("error", err.error || "扫描失败");
      }
    } catch {
      showToast("error", "扫描目录失败");
    } finally {
      setScanning(false);
    }
  };

  const handleFinish = async () => {
    if (!store.trim()) return;
    const targets: TargetConfig[] = targetPath.trim()
      ? [{ path: targetPath.trim(), theme: "全量" }]
      : [{ path: "~/.claude/skills", theme: "全量" }];
    try {
      const res = await api.init(store, targets);
      showToast("success", `已初始化，共 ${previewSkills.length} 个技能`);
      onComplete({ ...res.config, initialized: true });
    } catch (err: any) {
      showToast("error", err.message);
    }
  };

  const handleDirSelect = (dirPath: string) => {
    if (pickerFor === "store") {
      setStore(dirPath);
      setPreviewSkills([]);
    } else if (pickerFor === "target") {
      setTargetPath(dirPath);
    }
    setPickerFor(null);
  };

  return (
    <div className="setup-page">
      <div className="setup-panel">
        <header className="setup-header">
          <h1 className="setup-title">Skill Switch</h1>
          <p className="setup-subtitle">选择技能源目录，为不同工具配置专属技能组合。</p>
        </header>

        <div className="form-stack">
          <section className="card panel-card">
            <div className="card-header">
              <div>
                <h2 className="card-title">技能库目录</h2>
                <p className="section-description">存放所有技能文件的地方，比如你从 GitHub 下载的技能。</p>
              </div>
            </div>
            <div className="form-stack" style={{ marginTop: 14 }}>
              <div className="form-row">
                <input
                  type="text"
                  value={store}
                  onChange={(e) => {
                    setStore(e.target.value);
                    setPreviewSkills([]);
                  }}
                  placeholder="例如 ~/Documents/skills"
                  onKeyDown={(e) => e.key === "Enter" && handleScan()}
                />
                <button className="btn btn-secondary" onClick={() => setPickerFor("store")}>
                  浏览
                </button>
              </div>
              <button
                className="btn btn-primary btn-block"
                onClick={handleScan}
                disabled={!store.trim() || scanning}
              >
                {scanning ? "扫描中..." : "扫描技能"}
              </button>
            </div>
          </section>

          {previewSkills.length > 0 && (
            <section className="card panel-card">
              <div className="card-header">
                <div>
                  <h2 className="card-title">发现 {previewSkills.length} 个技能</h2>
                  <p className="section-description">将创建"完整版"技能组合，包含以下所有技能</p>
                </div>
              </div>
              <div className="tag-list" style={{ marginTop: 14 }}>
                {previewSkills.map((s) => (
                  <span key={s} className="tag">
                    {s}
                  </span>
                ))}
              </div>
            </section>
          )}

          {previewSkills.length > 0 && (
            <>
              <section className="card panel-card">
                <div className="card-header">
                  <div>
                    <h2 className="card-title">工具目录</h2>
                    <p className="section-description">Claude Code、OpenCode 等工具读取技能的位置。如果不确定，使用默认值即可。</p>
                  </div>
                </div>
                <div className="form-row" style={{ marginTop: 14 }}>
                  <input
                    type="text"
                    value={targetPath}
                    onChange={(e) => setTargetPath(e.target.value)}
                    placeholder="~/.claude/skills"
                  />
                  <button className="btn btn-secondary" onClick={() => setPickerFor("target")}>
                    浏览
                  </button>
                </div>
              </section>

              <button className="btn btn-primary btn-block" onClick={handleFinish}>
                开始使用
              </button>
            </>
          )}
        </div>
      </div>

      {pickerFor && (
        <DirPicker
          onSelect={handleDirSelect}
          onClose={() => setPickerFor(null)}
        />
      )}
    </div>
  );
}
