import type { ConfigResponse, TargetConfig, SwitchResult, StatusResult, SkillMeta, DirBrowseResult } from "./types";

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

  getSkillsMeta: () => request<SkillMeta[]>("/skills-meta"),

  getSkillMeta: (name: string) => request<SkillMeta>(`/skills/${encodeURIComponent(name)}`),

  getThemes: () =>
    request<{ themes: Record<string, string[]> }>("/themes"),

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

  switchTheme: (target: string, theme: string) =>
    request<SwitchResult>("/switch", {
      method: "POST",
      body: JSON.stringify({ target, theme }),
    }),

  getStatus: () => request<StatusResult>("/status"),

  browseDirectory: (path: string) =>
    request<DirBrowseResult>("/browse", {
      method: "POST",
      body: JSON.stringify({ path }),
    }),

  init: (store: string, targets: TargetConfig[]) =>
    request<{ config: ConfigResponse; switchResults: SwitchResult[] }>("/init", {
      method: "POST",
      body: JSON.stringify({ store, targets }),
    }),
};
