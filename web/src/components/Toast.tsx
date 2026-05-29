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
    <div className="toast-stack">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`toast ${t.type}`}
        >
          {t.text}
        </div>
      ))}
    </div>
  );
}
