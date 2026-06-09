import { useEffect, useState, useCallback } from "react";
import type { ToastMessage } from "../types";

let nextId = 0;
const listeners: Set<(t: ToastMessage) => void> = new Set();
const dismissListeners: Set<(id: number) => void> = new Set();

export function showToast(type: ToastMessage["type"], text: string) {
  const msg: ToastMessage = { id: nextId++, type, text };
  for (const fn of listeners) fn(msg);
}

export function dismissToast(id: number) {
  for (const fn of dismissListeners) fn(id);
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const timers = useState(() => new Map<number, ReturnType<typeof setTimeout>>())[0];

  const removeToast = useCallback((id: number) => {
    const timer = timers.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.delete(id);
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, [timers]);

  useEffect(() => {
    const handler = (msg: ToastMessage) => {
      setToasts((prev) => [...prev, msg]);
      const timer = setTimeout(() => removeToast(msg.id), 4000);
      timers.set(msg.id, timer);
    };
    const dismissHandler = (id: number) => removeToast(id);
    listeners.add(handler);
    dismissListeners.add(dismissHandler);
    return () => {
      listeners.delete(handler);
      dismissListeners.delete(dismissHandler);
      for (const timer of timers.values()) clearTimeout(timer);
      timers.clear();
    };
  }, [removeToast, timers]);

  return (
    <div className="toast-stack">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          <span className="toast-text">{t.text}</span>
          <button
            className="toast-close"
            onClick={() => removeToast(t.id)}
            aria-label="关闭"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
