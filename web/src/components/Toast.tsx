import { useEffect, useState } from "react";
import type { ToastMessage } from "../types";

let nextId = 0;
const listeners: Set<(t: ToastMessage) => void> = new Set();

export function showToast(type: ToastMessage["type"], text: string) {
  const msg: ToastMessage = { id: nextId++, type, text };
  for (const fn of listeners) fn(msg);
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const handler = (msg: ToastMessage) => {
      setToasts((prev) => [...prev, msg]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== msg.id));
      }, 4000);
    };
    listeners.add(handler);
    return () => { listeners.delete(handler); };
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        bottom: 20,
        right: 20,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        zIndex: 9999,
      }}
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          style={{
            padding: "10px 16px",
            borderRadius: 8,
            fontSize: 14,
            background:
              t.type === "success"
                ? "var(--success)"
                : t.type === "warning"
                  ? "var(--warning)"
                  : "var(--error)",
            color: t.type === "warning" ? "#000" : "#fff",
          }}
        >
          {t.text}
        </div>
      ))}
    </div>
  );
}
