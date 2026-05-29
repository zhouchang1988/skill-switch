import { useState, useEffect } from "react";
import { api } from "../api";
import type { SkillMeta } from "../types";

interface Props {
  dirName: string;
  onClose: () => void;
}

export function SkillModal({ dirName, onClose }: Props) {
  const [meta, setMeta] = useState<SkillMeta | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getSkillMeta(dirName).then((m) => {
      setMeta(m);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [dirName]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const displayFields = meta
    ? Object.entries(meta.metadata).filter(([k]) => k !== "name" && k !== "description")
    : [];

  const description = meta?.readme || meta?.content || "";

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content wide" onClick={(e) => e.stopPropagation()}>
        {loading ? (
          <p className="muted" style={{ textAlign: "center", padding: 24 }}>
            加载中...
          </p>
        ) : meta ? (
          <>
            <h2 className="modal-title">{meta.name}</h2>
            {meta.description && (
              <p className="section-description" style={{ marginBottom: 16 }}>
                {meta.description}
              </p>
            )}

            {description && (
              <div className="content-preview" style={{ marginBottom: 16 }}>
                <pre>
                  {description}
                </pre>
              </div>
            )}

            {displayFields.length > 0 && (
              <div className="metadata-list" style={{ marginBottom: 16 }}>
                {displayFields.map(([key, val]) => (
                  <div
                    key={key}
                    className="metadata-row"
                  >
                    <span className="metadata-key">
                      {key}
                    </span>
                    <span className="metadata-value">
                      {val}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={onClose}>
                关闭
              </button>
            </div>
          </>
        ) : (
          <p className="error-text" style={{ textAlign: "center" }}>
            无法加载技能信息
          </p>
        )}
      </div>
    </div>
  );
}
