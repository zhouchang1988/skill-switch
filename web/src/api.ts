import type { ConfigResponse, SwitchResult, StatusResult } from "./types";

const BASE = "/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || "Request failed");
  }
  return res.json();
}

export const api = {
  getConfig: () => request<ConfigResponse>("/config"),

  updateConfig: (data: Partial<Pick<ConfigResponse, "store" | "targets">>) =>
    request<ConfigResponse>("/config", {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  getSkills: () => request<string[]>("/skills"),

  getThemes: () =>
    request<{ currentTheme: string; themes: Record<string, string[]> }>("/themes"),

  createTheme: (name: string, skills: string[]) =>
    request<Record<string, string[]>>( "/themes", {
      method: "POST",
      body: JSON.stringify({ name, skills }),
    }),

  updateTheme: (name: string, data: { newName?: string; skills?: string[] }) =>
    request<Record<string, string[]>>(`/themes/${encodeURIComponent(name)}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  deleteTheme: (name: string) =>
    request<Record<string, string[]>>(`/themes/${encodeURIComponent(name)}`, {
      method: "DELETE",
    }),

  switchTheme: (theme: string) =>
    request<SwitchResult>("/switch", {
      method: "POST",
      body: JSON.stringify({ theme }),
    }),

  getStatus: () => request<StatusResult>("/status"),

  init: (store: string, targets: string[]) =>
    request<{ config: ConfigResponse; switchResult: SwitchResult }>("/init", {
      method: "POST",
      body: JSON.stringify({ store, targets }),
    }),
};
