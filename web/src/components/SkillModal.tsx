import { useState, useEffect } from "react";
import Markdown from "react-markdown";
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

  const hasReadme = Boolean(meta?.readme);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-content-wide" role="dialog" aria-modal="true" aria-label={dirName} onClick={(e) => e.stopPropagation()}>
        {loading ? (
          <div className="modal-body">
            <p className="muted" style={{ textAlign: "center", padding: 24 }}>
              加载中...
            </p>
          </div>
        ) : meta ? (
          <>
            <div className="modal-header">
              <h2 className="modal-title">{meta.name}</h2>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <div className="modal-body">
              {hasReadme ? (
                <div className="readme-content">
                  <Markdown>{meta.readme}</Markdown>
                </div>
              ) : (
                <>
                  {meta.description && (
                    <p style={{
                      fontSize: "15px",
                      lineHeight: "1.7",
                      color: "var(--text-secondary)",
                    }}>
                      {meta.description}
                    </p>
                  )}
                  {!meta.description && (
                    <p className="muted">该技能没有 README.md，也未在 SKILL.md 中描述。</p>
                  )}
                </>
              )}

              {displayFields.length > 0 && (
                <div className="metadata-list" style={{ marginTop: "var(--space-5)" }}>
                  {displayFields.map(([key, val]) => (
                    <div key={key} className="metadata-row">
                      <span className="metadata-key">{key}</span>
                      <span className="metadata-value">{val}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>


          </>
        ) : (
          <div className="modal-body">
            <p className="error-text" style={{ textAlign: "center" }}>
              无法加载技能信息
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
