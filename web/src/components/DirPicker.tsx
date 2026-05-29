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
        <h2 className="modal-title">选择目录</h2>

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
              <div className="empty-state">
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

        <div className="modal-actions">
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
