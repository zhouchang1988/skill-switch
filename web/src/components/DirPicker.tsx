import { useState, useEffect, useRef } from "react";
import { api } from "../api";
import type { DirBrowseResult } from "../types";

interface Props {
  onSelect: (path: string) => void;
  onClose: () => void;
}

export function DirPicker({ onSelect, onClose }: Props) {
  const [path, setPath] = useState("~");
  const [data, setData] = useState<DirBrowseResult | null>(null);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const browse = (p: string) => {
    setPath(p);
    setError("");
    api.browseDirectory(p).then(setData).catch((err) => {
      setError(err.message);
      setData(null);
    });
  };

  useEffect(() => { browse("~"); }, []);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">选择目录</h2>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="modal-body">
          <div className="form-row" style={{ marginBottom: 12 }}>
            <input
              ref={inputRef}
              type="text"
              value={path}
              onChange={(e) => setPath(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") browse(path); }}
              style={{ fontFamily: "var(--font-mono)", fontSize: 13 }}
            />
            <button className="btn btn-secondary" onClick={() => browse(path)}>
              前往
            </button>
          </div>

          {error && (
            <p className="error-text" style={{ marginBottom: 8 }}>{error}</p>
          )}

          {data && (
            <div className="directory-list">
              {data.parent !== null && (
                <button
                  className="directory-row"
                  onClick={() => browse(data.parent!)}
                  type="button"
                >
                  .. (上级目录)
                </button>
              )}
              {data.entries.length === 0 && (
                <div className="empty-state" style={{ padding: "var(--space-6)" }}>
                  无子目录
                </div>
              )}
              {data.entries.map((entry) => (
                <button
                  key={entry.path}
                  className="directory-row"
                  onClick={() => browse(entry.path)}
                  type="button"
                >
                  {entry.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>取消</button>
          <button
            className="btn btn-primary"
            onClick={() => { onSelect(data?.current || path); onClose(); }}
          >
            选择此目录
          </button>
        </div>
      </div>
    </div>
  );
}
