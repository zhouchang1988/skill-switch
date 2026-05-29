# Skill Switch Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a local web service that manages skill symlinks across multiple target directories via theme-based switching.

**Architecture:** Monorepo with Express backend (symlink management + config) and React SPA frontend (theme switching UI). Single process serves API and static files on port 13721. Config stored at `~/.skill-switch/config.json`.

**Tech Stack:** Node.js, Express, TypeScript, React, Vite, CSS Variables (no UI library)

---

## File Structure

```
skill-switch/
├── server/
│   ├── index.ts          # Express entry: start server, serve static + API
│   ├── config.ts         # Config read/write, path expansion, defaults
│   ├── linker.ts         # Symlink CRUD: create, remove, list, switch theme
│   └── routes.ts         # All /api/* route handlers
├── web/
│   ├── index.html
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── src/
│       ├── main.tsx          # React entry
│       ├── App.tsx           # Router + layout shell
│       ├── api.ts            # Fetch wrapper for all API calls
│       ├── types.ts          # Shared TypeScript types
│       ├── styles.css        # CSS variables + global dark theme
│       ├── pages/
│       │   ├── Setup.tsx     # First-run wizard (3 steps)
│       │   ├── Dashboard.tsx # Theme cards + switch
│       │   ├── Skills.tsx    # Skill browser + add/remove
│       │   └── Settings.tsx  # Store/targets config
│       └── components/
│           ├── ThemeCard.tsx  # Theme card with inline editing
│           ├── SkillItem.tsx  # Skill row with toggle
│           └── Toast.tsx      # Success/warning/error notifications
├── package.json
└── tsconfig.json
```

---

### Task 1: Project Scaffolding

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`

- [ ] **Step 1: Initialize npm project and install dependencies**

```bash
cd /Users/zhouchang/Documents/github-projects/skill-switch
npm init -y
npm install express
npm install -D typescript @types/node @types/express tsx
```

- [ ] **Step 2: Create root tsconfig.json**

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "esModuleInterop": true,
    "strict": true,
    "skipLibCheck": true,
    "outDir": "dist",
    "rootDir": ".",
    "resolveJsonModule": true
  },
  "include": ["server/**/*.ts"],
  "exclude": ["node_modules", "web"]
}
```

- [ ] **Step 3: Add scripts to package.json**

Add to `package.json` scripts:

```json
{
  "scripts": {
    "dev:server": "tsx watch server/index.ts",
    "dev:web": "cd web && npm run dev",
    "build:web": "cd web && npm run build",
    "start": "npm run build:web && tsx server/index.ts"
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json tsconfig.json
git commit -m "chore: initialize project with dependencies"
```

---

### Task 2: Config Module

**Files:**
- Create: `server/config.ts`

- [ ] **Step 1: Write the config module**

Create `server/config.ts`:

```typescript
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

export interface Config {
  store: string;
  targets: string[];
  currentTheme: string;
  themes: Record<string, string[]>;
}

const CONFIG_DIR = path.join(os.homedir(), ".skill-switch");
const CONFIG_PATH = path.join(CONFIG_DIR, "config.json");

export function expandPath(p: string): string {
  return p.replace(/^~/, os.homedir());
}

export function configExists(): boolean {
  return fs.existsSync(CONFIG_PATH);
}

export function loadConfig(): Config | null {
  if (!fs.existsSync(CONFIG_PATH)) return null;
  const raw = fs.readFileSync(CONFIG_PATH, "utf-8");
  return JSON.parse(raw);
}

export function saveConfig(config: Config): void {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), "utf-8");
}

export function createDefaultConfig(
  store: string,
  targets: string[],
  skillNames: string[]
): Config {
  return {
    store: expandPath(store),
    targets: targets.map(expandPath),
    currentTheme: "全量",
    themes: {
      全量: skillNames,
    },
  };
}

export function scanSkills(store: string): string[] {
  const expanded = expandPath(store);
  if (!fs.existsSync(expanded)) return [];
  return fs
    .readdirSync(expanded, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit server/config.ts`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add server/config.ts
git commit -m "feat: add config module with read/write/scan"
```

---

### Task 3: Linker Module

**Files:**
- Create: `server/linker.ts`

- [ ] **Step 1: Write the linker module**

Create `server/linker.ts`:

```typescript
import fs from "node:fs";
import path from "node:path";
import { expandPath, loadConfig, saveConfig, type Config } from "./config.js";

export interface SwitchResult {
  theme: string;
  targets: TargetResult[];
}

export interface TargetResult {
  target: string;
  created: string[];
  removed: string[];
  skipped: string[];
  errors: string[];
}

function isSymlink(p: string): boolean {
  try {
    return fs.lstatSync(p).isSymbolicLink();
  } catch {
    return false;
  }
}

function listSymlinks(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isSymbolicLink())
    .map((d) => d.name);
}

export function switchTheme(themeName: string): SwitchResult {
  const config = loadConfig();
  if (!config) throw new Error("Config not found");
  const skills = config.themes[themeName];
  if (!skills) throw new Error(`Theme "${themeName}" not found`);

  const store = expandPath(config.store);
  const result: SwitchResult = { theme: themeName, targets: [] };

  for (const rawTarget of config.targets) {
    const target = expandPath(rawTarget);
    const targetResult: TargetResult = {
      target,
      created: [],
      removed: [],
      skipped: [],
      errors: [],
    };

    // Ensure target directory exists
    if (!fs.existsSync(target)) {
      fs.mkdirSync(target, { recursive: true });
    }

    // Remove existing symlinks
    for (const name of listSymlinks(target)) {
      const linkPath = path.join(target, name);
      try {
        fs.unlinkSync(linkPath);
        targetResult.removed.push(name);
      } catch (err: any) {
        targetResult.errors.push(`Failed to remove ${name}: ${err.message}`);
      }
    }

    // Create new symlinks
    for (const skill of skills) {
      const linkPath = path.join(target, skill);
      const sourcePath = path.join(store, skill);

      // Check for non-symlink collision
      if (fs.existsSync(linkPath) && !isSymlink(linkPath)) {
        targetResult.skipped.push(skill);
        continue;
      }

      // Check source exists
      if (!fs.existsSync(sourcePath)) {
        targetResult.errors.push(`Source not found: ${skill}`);
        continue;
      }

      try {
        fs.symlinkSync(sourcePath, linkPath);
        targetResult.created.push(skill);
      } catch (err: any) {
        targetResult.errors.push(`Failed to link ${skill}: ${err.message}`);
      }
    }

    result.targets.push(targetResult);
  }

  // Update current theme
  config.currentTheme = themeName;
  saveConfig(config);

  return result;
}

export interface StatusResult {
  currentTheme: string;
  targets: {
    target: string;
    symlinks: string[];
    exists: boolean;
  }[];
}

export function getStatus(config: Config): StatusResult {
  const result: StatusResult = { currentTheme: config.currentTheme, targets: [] };

  for (const rawTarget of config.targets) {
    const target = expandPath(rawTarget);
    const exists = fs.existsSync(target);
    result.targets.push({
      target,
      symlinks: exists ? listSymlinks(target) : [],
      exists,
    });
  }

  return result;
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit server/linker.ts`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add server/linker.ts
git commit -m "feat: add linker module for symlink management"
```

---

### Task 4: API Routes

**Files:**
- Create: `server/routes.ts`

- [ ] **Step 1: Write the routes module**

Create `server/routes.ts`:

```typescript
import { Router, type Request, type Response } from "express";
import {
  configExists,
  loadConfig,
  saveConfig,
  scanSkills,
  createDefaultConfig,
  type Config,
} from "./config.js";
import { switchTheme, getStatus } from "./linker.js";

export const router = Router();

// GET /api/config
router.get("/config", (_req: Request, res: Response) => {
  if (!configExists()) {
    res.json({ initialized: false });
    return;
  }
  const config = loadConfig()!;
  res.json({ initialized: true, ...config });
});

// PUT /api/config
router.put("/config", (req: Request, res: Response) => {
  const config = loadConfig();
  if (!config) {
    res.status(400).json({ error: "Config not initialized" });
    return;
  }
  if (req.body.store !== undefined) config.store = req.body.store;
  if (req.body.targets !== undefined) config.targets = req.body.targets;
  saveConfig(config);
  res.json(config);
});

// GET /api/skills
router.get("/skills", (_req: Request, res: Response) => {
  const config = loadConfig();
  if (!config) {
    res.status(400).json({ error: "Config not initialized" });
    return;
  }
  const skills = scanSkills(config.store);
  res.json(skills);
});

// GET /api/themes
router.get("/themes", (_req: Request, res: Response) => {
  const config = loadConfig();
  if (!config) {
    res.status(400).json({ error: "Config not initialized" });
    return;
  }
  res.json({ currentTheme: config.currentTheme, themes: config.themes });
});

// POST /api/themes
router.post("/themes", (req: Request, res: Response) => {
  const config = loadConfig();
  if (!config) {
    res.status(400).json({ error: "Config not initialized" });
    return;
  }
  const { name, skills } = req.body;
  if (!name || !Array.isArray(skills)) {
    res.status(400).json({ error: "name and skills[] required" });
    return;
  }
  if (config.themes[name]) {
    res.status(409).json({ error: "Theme already exists" });
    return;
  }
  config.themes[name] = skills;
  saveConfig(config);
  res.json(config.themes);
});

// PUT /api/themes/:name
router.put("/themes/:name", (req: Request, res: Response) => {
  const config = loadConfig();
  if (!config) {
    res.status(400).json({ error: "Config not initialized" });
    return;
  }
  const oldName = req.params.name;
  if (!config.themes[oldName]) {
    res.status(404).json({ error: "Theme not found" });
    return;
  }
  const { newName, skills } = req.body;
  if (skills !== undefined) config.themes[oldName] = skills;
  if (newName && newName !== oldName) {
    config.themes[newName] = config.themes[oldName];
    delete config.themes[oldName];
    if (config.currentTheme === oldName) config.currentTheme = newName;
  }
  saveConfig(config);
  res.json(config.themes);
});

// DELETE /api/themes/:name
router.delete("/themes/:name", (req: Request, res: Response) => {
  const config = loadConfig();
  if (!config) {
    res.status(400).json({ error: "Config not initialized" });
    return;
  }
  const name = req.params.name;
  if (name === "全量") {
    res.status(403).json({ error: "Cannot delete default theme" });
    return;
  }
  if (!config.themes[name]) {
    res.status(404).json({ error: "Theme not found" });
    return;
  }
  delete config.themes[name];
  if (config.currentTheme === name) config.currentTheme = "全量";
  saveConfig(config);
  res.json(config.themes);
});

// POST /api/switch
router.post("/switch", (req: Request, res: Response) => {
  const { theme } = req.body;
  if (!theme) {
    res.status(400).json({ error: "theme required" });
    return;
  }
  try {
    const result = switchTheme(theme);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/status
router.get("/status", (_req: Request, res: Response) => {
  const config = loadConfig();
  if (!config) {
    res.status(400).json({ error: "Config not initialized" });
    return;
  }
  res.json(getStatus(config));
});

// POST /api/init — first-run setup
router.post("/init", (req: Request, res: Response) => {
  const { store, targets } = req.body;
  if (!store || !targets || !Array.isArray(targets) || targets.length === 0) {
    res.status(400).json({ error: "store and targets[] required" });
    return;
  }
  const skills = scanSkills(store);
  const config = createDefaultConfig(store, targets, skills);
  saveConfig(config);
  // Apply "全量" theme immediately
  const result = switchTheme("全量");
  res.json({ config, switchResult: result });
});
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit server/routes.ts`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add server/routes.ts
git commit -m "feat: add REST API routes for config, themes, skills, switch"
```

---

### Task 5: Server Entry

**Files:**
- Create: `server/index.ts`

- [ ] **Step 1: Write the server entry**

Create `server/index.ts`:

```typescript
import express from "express";
import path from "node:path";
import { router } from "./routes.js";

const PORT = 13721;
const app = express();

app.use(express.json());

// API routes
app.use("/api", router);

// Serve frontend static files
const staticDir = path.join(import.meta.dirname, "..", "web", "dist");
app.use(express.static(staticDir));

// SPA fallback: non-API routes serve index.html
app.get("*", (_req, res) => {
  res.sendFile(path.join(staticDir, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Skill Switch running at http://localhost:${PORT}`);
});
```

- [ ] **Step 2: Verify server starts**

Run: `npx tsx server/index.ts`
Expected: "Skill Switch running at http://localhost:13721"
Then press Ctrl+C to stop.

- [ ] **Step 3: Commit**

```bash
git add server/index.ts
git commit -m "feat: add Express server entry point"
```

---

### Task 6: Frontend Scaffolding

**Files:**
- Create: `web/package.json`
- Create: `web/tsconfig.json`
- Create: `web/vite.config.ts`
- Create: `web/index.html`
- Create: `web/src/main.tsx`
- Create: `web/src/styles.css`

- [ ] **Step 1: Initialize web project**

```bash
cd /Users/zhouchang/Documents/github-projects/skill-switch/web
npm init -y
npm install react react-dom
npm install -D @types/react @types/react-dom @vitejs/plugin-react vite typescript
```

- [ ] **Step 2: Create web/tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Create web/vite.config.ts**

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:13721",
    },
  },
});
```

- [ ] **Step 4: Create web/index.html**

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Skill Switch</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 5: Create web/src/main.tsx**

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

- [ ] **Step 6: Create web/src/styles.css — dark theme global styles**

```css
:root {
  --bg-primary: #0a0a0b;
  --bg-secondary: #141416;
  --bg-tertiary: #1c1c1f;
  --bg-hover: #232326;
  --border: #2a2a2e;
  --text-primary: #e8e8ec;
  --text-secondary: #8b8b94;
  --text-muted: #56565e;
  --accent: #6366f1;
  --accent-hover: #818cf8;
  --success: #22c55e;
  --warning: #f59e0b;
  --error: #ef4444;
  --radius: 8px;
  --radius-lg: 12px;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  background: var(--bg-primary);
  color: var(--text-primary);
  line-height: 1.5;
}

a {
  color: var(--accent);
  text-decoration: none;
}

button {
  cursor: pointer;
  font-family: inherit;
  font-size: 14px;
  border: none;
  border-radius: var(--radius);
  padding: 8px 16px;
  transition: all 0.15s ease;
}

input {
  font-family: inherit;
  font-size: 14px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 8px 12px;
  color: var(--text-primary);
  outline: none;
  transition: border-color 0.15s;
}

input:focus {
  border-color: var(--accent);
}

.btn-primary {
  background: var(--accent);
  color: white;
}

.btn-primary:hover {
  background: var(--accent-hover);
}

.btn-secondary {
  background: var(--bg-tertiary);
  color: var(--text-primary);
  border: 1px solid var(--border);
}

.btn-secondary:hover {
  background: var(--bg-hover);
}

.btn-danger {
  background: transparent;
  color: var(--error);
  border: 1px solid var(--error);
}

.btn-danger:hover {
  background: var(--error);
  color: white;
}

.card {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 16px;
  transition: border-color 0.15s;
}

.card:hover {
  border-color: var(--text-muted);
}

.tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  background: var(--bg-tertiary);
  color: var(--text-secondary);
}
```

- [ ] **Step 7: Add web scripts**

Add to `web/package.json` scripts:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

- [ ] **Step 8: Commit**

```bash
cd /Users/zhouchang/Documents/github-projects/skill-switch
git add web/
git commit -m "chore: scaffold React frontend with Vite and dark theme"
```

---

### Task 7: Frontend Types & API Client

**Files:**
- Create: `web/src/types.ts`
- Create: `web/src/api.ts`

- [ ] **Step 1: Create web/src/types.ts**

```typescript
export interface Config {
  store: string;
  targets: string[];
  currentTheme: string;
  themes: Record<string, string[]>;
}

export interface ConfigResponse {
  initialized: boolean;
  store?: string;
  targets?: string[];
  currentTheme?: string;
  themes?: Record<string, string[]>;
}

export interface SwitchResult {
  theme: string;
  targets: TargetResult[];
}

export interface TargetResult {
  target: string;
  created: string[];
  removed: string[];
  skipped: string[];
  errors: string[];
}

export interface StatusResult {
  currentTheme: string;
  targets: {
    target: string;
    symlinks: string[];
    exists: boolean;
  }[];
}

export interface ToastMessage {
  id: number;
  type: "success" | "warning" | "error";
  text: string;
}
```

- [ ] **Step 2: Create web/src/api.ts**

```typescript
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
    request<Record<string, string[]>>("/themes", {
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
```

- [ ] **Step 3: Commit**

```bash
git add web/src/types.ts web/src/api.ts
git commit -m "feat: add frontend types and API client"
```

---

### Task 8: Toast Component

**Files:**
- Create: `web/src/components/Toast.tsx`

- [ ] **Step 1: Create Toast component**

Create `web/src/components/Toast.tsx`:

```tsx
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
```

- [ ] **Step 2: Commit**

```bash
git add web/src/components/Toast.tsx
git commit -m "feat: add Toast notification component"
```

---

### Task 9: App Shell with Routing

**Files:**
- Create: `web/src/App.tsx`

- [ ] **Step 1: Create App component with simple hash routing**

Create `web/src/App.tsx`:

```tsx
import { useState, useEffect } from "react";
import { api } from "./api";
import type { ConfigResponse } from "./types";
import { Setup } from "./pages/Setup";
import { Dashboard } from "./pages/Dashboard";
import { Skills } from "./pages/Skills";
import { Settings } from "./pages/Settings";
import { ToastContainer } from "../components/Toast";

type Page = "dashboard" | "skills" | "settings";

function getPage(): Page {
  const hash = window.location.hash.replace("#", "");
  if (hash === "skills") return "skills";
  if (hash === "settings") return "settings";
  return "dashboard";
}

export function App() {
  const [config, setConfig] = useState<ConfigResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(getPage);

  useEffect(() => {
    api.getConfig().then((c) => {
      setConfig(c);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    const handler = () => setPage(getPage());
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, []);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 80 }}>
        Loading...
      </div>
    );
  }

  if (!config?.initialized) {
    return (
      <>
        <Setup onComplete={(c) => { setConfig(c); }} />
        <ToastContainer />
      </>
    );
  }

  const nav = (
    <nav
      style={{
        display: "flex",
        gap: 4,
        padding: "12px 24px",
        borderBottom: "1px solid var(--border)",
        background: "var(--bg-secondary)",
      }}
    >
      <a href="#dashboard" style={{
        padding: "6px 12px",
        borderRadius: 6,
        background: page === "dashboard" ? "var(--bg-hover)" : "transparent",
        color: page === "dashboard" ? "var(--text-primary)" : "var(--text-secondary)",
      }}>
        Dashboard
      </a>
      <a href="#skills" style={{
        padding: "6px 12px",
        borderRadius: 6,
        background: page === "skills" ? "var(--bg-hover)" : "transparent",
        color: page === "skills" ? "var(--text-primary)" : "var(--text-secondary)",
      }}>
        Skills
      </a>
      <a href="#settings" style={{
        padding: "6px 12px",
        borderRadius: 6,
        background: page === "settings" ? "var(--bg-hover)" : "transparent",
        color: page === "settings" ? "var(--text-primary)" : "var(--text-secondary)",
      }}>
        Settings
      </a>
    </nav>
  );

  const refresh = () => api.getConfig().then(setConfig);

  return (
    <div style={{ minHeight: "100vh" }}>
      {nav}
      <main style={{ maxWidth: 960, margin: "0 auto", padding: "24px" }}>
        {page === "dashboard" && <Dashboard config={config} onRefresh={refresh} />}
        {page === "skills" && <Skills config={config} onRefresh={refresh} />}
        {page === "settings" && <Settings config={config} onRefresh={refresh} />}
      </main>
      <ToastContainer />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add web/src/App.tsx
git commit -m "feat: add App shell with hash routing and setup gate"
```

---

### Task 10: Setup Page (First-Run Wizard)

**Files:**
- Create: `web/src/pages/Setup.tsx`

- [ ] **Step 1: Create Setup page**

Create `web/src/pages/Setup.tsx`:

```tsx
import { useState } from "react";
import { api } from "../api";
import type { ConfigResponse } from "../types";
import { showToast } from "../components/Toast";

interface Props {
  onComplete: (config: ConfigResponse) => void;
}

export function Setup({ onComplete }: Props) {
  const [step, setStep] = useState(1);
  const [store, setStore] = useState("");
  const [previewSkills, setPreviewSkills] = useState<string[]>([]);
  const [targets, setTargets] = useState<string[]>(["~/.claude/skills"]);
  const [newTarget, setNewTarget] = useState("");

  const handleScan = async () => {
    try {
      // Temporarily save config to scan
      const res = await fetch("/api/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ store, targets: ["__tmp__"] }),
      });
      if (res.ok) {
        const data = await res.json();
        setPreviewSkills(data.config.themes?.["全量"] || []);
        setStep(2);
      } else {
        const err = await res.json();
        showToast("error", err.error || "Scan failed");
      }
    } catch {
      showToast("error", "Failed to scan directory");
    }
  };

  const handleAddTarget = () => {
    if (newTarget.trim()) {
      setTargets([...targets, newTarget.trim()]);
      setNewTarget("");
    }
  };

  const handleRemoveTarget = (idx: number) => {
    setTargets(targets.filter((_, i) => i !== idx));
  };

  const handleFinish = async () => {
    try {
      const res = await api.init(store, targets);
      showToast("success", `Initialized with ${previewSkills.length} skills`);
      onComplete({ initialized: true, ...res.config });
    } catch (err: any) {
      showToast("error", err.message);
    }
  };

  return (
    <div style={{ maxWidth: 560, margin: "80px auto", padding: "0 24px" }}>
      <h1 style={{ fontSize: 28, marginBottom: 8 }}>Skill Switch Setup</h1>
      <p style={{ color: "var(--text-secondary)", marginBottom: 32 }}>
        Configure your skill store and target directories.
      </p>

      {/* Step indicators */}
      <div style={{ display: "flex", gap: 8, marginBottom: 32 }}>
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            style={{
              width: 32,
              height: 4,
              borderRadius: 2,
              background: s <= step ? "var(--accent)" : "var(--bg-tertiary)",
            }}
          />
        ))}
      </div>

      {step === 1 && (
        <div className="card">
          <h2 style={{ fontSize: 16, marginBottom: 12 }}>Step 1: Skill Store Directory</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: 14, marginBottom: 16 }}>
            Where are your skill folders stored locally?
          </p>
          <input
            type="text"
            value={store}
            onChange={(e) => setStore(e.target.value)}
            placeholder="e.g. ~/Documents/github-skills"
            style={{ width: "100%", marginBottom: 16 }}
          />
          <button
            className="btn-primary"
            onClick={handleScan}
            disabled={!store.trim()}
          >
            Scan Directory
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="card">
          <h2 style={{ fontSize: 16, marginBottom: 12 }}>Step 2: Skills Found</h2>
          {previewSkills.length === 0 ? (
            <p style={{ color: "var(--warning)" }}>No skills found in this directory.</p>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
              {previewSkills.map((s) => (
                <span key={s} className="tag">{s}</span>
              ))}
            </div>
          )}
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn-secondary" onClick={() => setStep(1)}>Back</button>
            <button className="btn-primary" onClick={() => setStep(3)}>Next</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="card">
          <h2 style={{ fontSize: 16, marginBottom: 12 }}>Step 3: Target Directories</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: 14, marginBottom: 16 }}>
            Where should skill symlinks be created?
          </p>
          {targets.map((t, i) => (
            <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <input type="text" value={t} readOnly style={{ flex: 1 }} />
              <button className="btn-danger" onClick={() => handleRemoveTarget(i)} style={{ padding: "8px 12px" }}>
                ×
              </button>
            </div>
          ))}
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <input
              type="text"
              value={newTarget}
              onChange={(e) => setNewTarget(e.target.value)}
              placeholder="e.g. ~/.codex/skills"
              style={{ flex: 1 }}
              onKeyDown={(e) => e.key === "Enter" && handleAddTarget()}
            />
            <button className="btn-secondary" onClick={handleAddTarget}>Add</button>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn-secondary" onClick={() => setStep(2)}>Back</button>
            <button
              className="btn-primary"
              onClick={handleFinish}
              disabled={targets.length === 0}
            >
              Complete Setup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add web/src/pages/Setup.tsx
git commit -m "feat: add Setup wizard page for first-run initialization"
```

---

### Task 11: ThemeCard Component

**Files:**
- Create: `web/src/components/ThemeCard.tsx`

- [ ] **Step 1: Create ThemeCard component**

Create `web/src/components/ThemeCard.tsx`:

```tsx
import { useState } from "react";
import { api } from "../api";
import { showToast } from "./Toast";

interface Props {
  name: string;
  skills: string[];
  isActive: boolean;
  allSkills: string[];
  onRefresh: () => void;
}

export function ThemeCard({ name, skills, isActive, allSkills, onRefresh }: Props) {
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(name);
  const [editSkills, setEditSkills] = useState([...skills]);
  const [adding, setAdding] = useState(false);

  const handleSave = async () => {
    try {
      const data: { newName?: string; skills?: string[] } = {};
      if (editName !== name) data.newName = editName;
      data.skills = editSkills;
      await api.updateTheme(name, data);
      showToast("success", `Theme "${editName}" updated`);
      setEditing(false);
      onRefresh();
    } catch (err: any) {
      showToast("error", err.message);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete theme "${name}"?`)) return;
    try {
      await api.deleteTheme(name);
      showToast("success", `Theme "${name}" deleted`);
      onRefresh();
    } catch (err: any) {
      showToast("error", err.message);
    }
  };

  const handleSwitch = async () => {
    try {
      const result = await api.switchTheme(name);
      const hasErrors = result.targets.some((t) => t.errors.length > 0);
      const hasSkipped = result.targets.some((t) => t.skipped.length > 0);
      if (hasErrors) {
        showToast("warning", `Switched with errors — check status`);
      } else if (hasSkipped) {
        showToast("warning", `Switched — some targets skipped`);
      } else {
        showToast("success", `Switched to "${name}"`);
      }
      onRefresh();
    } catch (err: any) {
      showToast("error", err.message);
    }
  };

  const addableSkills = allSkills.filter((s) => !editSkills.includes(s));

  if (editing) {
    return (
      <div className="card" style={{ borderLeft: isActive ? "3px solid var(--accent)" : undefined }}>
        <div style={{ marginBottom: 12 }}>
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            style={{ fontSize: 16, fontWeight: 600, width: "100%" }}
          />
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
          {editSkills.map((s) => (
            <span key={s} className="tag" style={{ cursor: "pointer" }} onClick={() => setEditSkills(editSkills.filter((x) => x !== s))}>
              {s} ×
            </span>
          ))}
        </div>
        {adding && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
            {addableSkills.map((s) => (
              <span key={s} className="tag" style={{ cursor: "pointer", background: "var(--bg-hover)" }} onClick={() => { setEditSkills([...editSkills, s]); setAdding(false); }}>
                + {s}
              </span>
            ))}
          </div>
        )}
        {!adding && addableSkills.length > 0 && (
          <button className="btn-secondary" onClick={() => setAdding(true)} style={{ marginBottom: 12, fontSize: 12, padding: "4px 10px" }}>
            + Add Skill
          </button>
        )}
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn-primary" onClick={handleSave} style={{ fontSize: 13 }}>Save</button>
          <button className="btn-secondary" onClick={() => { setEditing(false); setEditName(name); setEditSkills([...skills]); }} style={{ fontSize: 13 }}>Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div className="card" style={{ borderLeft: isActive ? "3px solid var(--accent)" : undefined }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <h3 style={{ fontSize: 16 }}>{name}</h3>
        <div style={{ display: "flex", gap: 6 }}>
          {!isActive && (
            <button className="btn-primary" onClick={handleSwitch} style={{ fontSize: 12, padding: "4px 12px" }}>
              Switch
            </button>
          )}
          <button className="btn-secondary" onClick={() => setEditing(true)} style={{ fontSize: 12, padding: "4px 10px" }}>
            Edit
          </button>
          {name !== "全量" && (
            <button className="btn-danger" onClick={handleDelete} style={{ fontSize: 12, padding: "4px 10px" }}>
              ×
            </button>
          )}
        </div>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {skills.map((s) => (
          <span key={s} className="tag">{s}</span>
        ))}
      </div>
      {isActive && <div style={{ marginTop: 8, fontSize: 12, color: "var(--accent)" }}>Active</div>}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add web/src/components/ThemeCard.tsx
git commit -m "feat: add ThemeCard component with inline editing"
```

---

### Task 12: Dashboard Page

**Files:**
- Create: `web/src/pages/Dashboard.tsx`

- [ ] **Step 1: Create Dashboard page**

Create `web/src/pages/Dashboard.tsx`:

```tsx
import { useState, useEffect } from "react";
import { api } from "../api";
import type { ConfigResponse } from "../types";
import { ThemeCard } from "../components/ThemeCard";
import { showToast } from "../components/Toast";

interface Props {
  config: ConfigResponse;
  onRefresh: () => void;
}

export function Dashboard({ config, onRefresh }: Props) {
  const [allSkills, setAllSkills] = useState<string[]>([]);
  const [newThemeName, setNewThemeName] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (config.initialized) {
      api.getSkills().then(setAllSkills).catch(() => {});
    }
  }, [config.initialized]);

  const themes = config.themes || {};
  const themeEntries = Object.entries(themes);

  const handleCreate = async () => {
    if (!newThemeName.trim()) return;
    try {
      await api.createTheme(newThemeName.trim(), []);
      showToast("success", `Theme "${newThemeName}" created`);
      setNewThemeName("");
      setCreating(false);
      onRefresh();
    } catch (err: any) {
      showToast("error", err.message);
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, marginBottom: 4 }}>Themes</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
            Current: <span style={{ color: "var(--accent)" }}>{config.currentTheme}</span>
          </p>
        </div>
        {!creating ? (
          <button className="btn-primary" onClick={() => setCreating(true)}>+ New Theme</button>
        ) : (
          <div style={{ display: "flex", gap: 8 }}>
            <input
              type="text"
              value={newThemeName}
              onChange={(e) => setNewThemeName(e.target.value)}
              placeholder="Theme name"
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              autoFocus
            />
            <button className="btn-primary" onClick={handleCreate}>Create</button>
            <button className="btn-secondary" onClick={() => { setCreating(false); setNewThemeName(""); }}>Cancel</button>
          </div>
        )}
      </div>

      <div style={{ display: "grid", gap: 12 }}>
        {themeEntries.map(([name, skills]) => (
          <ThemeCard
            key={name}
            name={name}
            skills={skills}
            isActive={name === config.currentTheme}
            allSkills={allSkills}
            onRefresh={onRefresh}
          />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add web/src/pages/Dashboard.tsx
git commit -m "feat: add Dashboard page with theme switching and creation"
```

---

### Task 13: Skills Page

**Files:**
- Create: `web/src/pages/Skills.tsx`
- Create: `web/src/components/SkillItem.tsx`

- [ ] **Step 1: Create SkillItem component**

Create `web/src/components/SkillItem.tsx`:

```tsx
import { api } from "../api";
import { showToast } from "./Toast";

interface Props {
  name: string;
  inCurrentTheme: boolean;
  currentTheme: string;
  onRefresh: () => void;
}

export function SkillItem({ name, inCurrentTheme, currentTheme, onRefresh }: Props) {
  const handleToggle = async () => {
    try {
      // Fetch current themes to get the skill list for current theme
      const data = await api.getThemes();
      const currentSkills = data.themes[currentTheme] || [];

      const newSkills = inCurrentTheme
        ? currentSkills.filter((s) => s !== name)
        : [...currentSkills, name];

      await api.updateTheme(currentTheme, { skills: newSkills });
      showToast("success", inCurrentTheme ? `Removed "${name}"` : `Added "${name}"`);
      onRefresh();
    } catch (err: any) {
      showToast("error", err.message);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "10px 16px",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <span style={{ fontSize: 14 }}>{name}</span>
      <button
        className={inCurrentTheme ? "btn-secondary" : "btn-primary"}
        onClick={handleToggle}
        style={{ fontSize: 12, padding: "4px 12px" }}
      >
        {inCurrentTheme ? "Remove" : "Add"}
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Create Skills page**

Create `web/src/pages/Skills.tsx`:

```tsx
import { useState, useEffect } from "react";
import { api } from "../api";
import type { ConfigResponse } from "../types";
import { SkillItem } from "../components/SkillItem";

interface Props {
  config: ConfigResponse;
  onRefresh: () => void;
}

export function Skills({ config, onRefresh }: Props) {
  const [skills, setSkills] = useState<string[]>([]);

  useEffect(() => {
    if (config.initialized) {
      api.getSkills().then(setSkills).catch(() => {});
    }
  }, [config.initialized]);

  const currentThemeSkills = config.themes?.[config.currentTheme || ""] || [];

  return (
    <div>
      <h1 style={{ fontSize: 24, marginBottom: 4 }}>Skills</h1>
      <p style={{ color: "var(--text-secondary)", fontSize: 14, marginBottom: 24 }}>
        {skills.length} skills in store · Adding/removing affects "{config.currentTheme}"
      </p>

      <div className="card" style={{ padding: 0 }}>
        {skills.length === 0 ? (
          <p style={{ padding: 16, color: "var(--text-secondary)" }}>No skills found in store directory.</p>
        ) : (
          skills.map((s) => (
            <SkillItem
              key={s}
              name={s}
              inCurrentTheme={currentThemeSkills.includes(s)}
              currentTheme={config.currentTheme || "全量"}
              onRefresh={onRefresh}
            />
          ))
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add web/src/pages/Skills.tsx web/src/components/SkillItem.tsx
git commit -m "feat: add Skills page with add/remove toggle"
```

---

### Task 14: Settings Page

**Files:**
- Create: `web/src/pages/Settings.tsx`

- [ ] **Step 1: Create Settings page**

Create `web/src/pages/Settings.tsx`:

```tsx
import { useState } from "react";
import { api } from "../api";
import type { ConfigResponse } from "../types";
import { showToast } from "../components/Toast";

interface Props {
  config: ConfigResponse;
  onRefresh: () => void;
}

export function Settings({ config, onRefresh }: Props) {
  const [store, setStore] = useState(config.store || "");
  const [targets, setTargets] = useState<string[]>(config.targets || []);
  const [newTarget, setNewTarget] = useState("");
  const [dirty, setDirty] = useState(false);

  const handleSave = async () => {
    try {
      await api.updateConfig({ store, targets });
      showToast("success", "Settings saved");
      setDirty(false);
      onRefresh();
    } catch (err: any) {
      showToast("error", err.message);
    }
  };

  const handleAddTarget = () => {
    if (newTarget.trim()) {
      setTargets([...targets, newTarget.trim()]);
      setNewTarget("");
      setDirty(true);
    }
  };

  const handleRemoveTarget = (idx: number) => {
    setTargets(targets.filter((_, i) => i !== idx));
    setDirty(true);
  };

  return (
    <div>
      <h1 style={{ fontSize: 24, marginBottom: 24 }}>Settings</h1>

      <div className="card" style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 16, marginBottom: 12 }}>Skill Store Directory</h2>
        <input
          type="text"
          value={store}
          onChange={(e) => { setStore(e.target.value); setDirty(true); }}
          style={{ width: "100%" }}
        />
        <p style={{ color: "var(--text-muted)", fontSize: 12, marginTop: 8 }}>
          Directory containing all skill folders. Changes take effect on next scan.
        </p>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 16, marginBottom: 12 }}>Target Directories</h2>
        {targets.map((t, i) => (
          <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <input type="text" value={t} readOnly style={{ flex: 1 }} />
            <button className="btn-danger" onClick={() => handleRemoveTarget(i)} style={{ padding: "8px 12px" }}>
              ×
            </button>
          </div>
        ))}
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <input
            type="text"
            value={newTarget}
            onChange={(e) => setNewTarget(e.target.value)}
            placeholder="e.g. ~/.codex/skills"
            style={{ flex: 1 }}
            onKeyDown={(e) => e.key === "Enter" && handleAddTarget()}
          />
          <button className="btn-secondary" onClick={handleAddTarget}>Add</button>
        </div>
        <p style={{ color: "var(--text-muted)", fontSize: 12 }}>
          Symlinks will be created in these directories when switching themes.
        </p>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 16, marginBottom: 8 }}>Config Location</h2>
        <code style={{ color: "var(--text-secondary)", fontSize: 13 }}>~/.skill-switch/config.json</code>
      </div>

      <button className="btn-primary" onClick={handleSave} disabled={!dirty}>
        Save Settings
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add web/src/pages/Settings.tsx
git commit -m "feat: add Settings page for store/target configuration"
```

---

### Task 15: Integration & Smoke Test

**Files:**
- Modify: `server/routes.ts` (fix init endpoint to not actually switch on scan preview)

- [ ] **Step 1: Fix the init endpoint scan flow**

The `/api/init` POST currently both saves config AND switches. For the Setup wizard scan preview (step 2), we need a way to just scan without saving. Add a scan-only endpoint.

Add to `server/routes.ts` before the `/api/init` handler:

```typescript
// POST /api/scan — preview skills in a directory without saving config
router.post("/scan", (req: Request, res: Response) => {
  const { store } = req.body;
  if (!store) {
    res.status(400).json({ error: "store required" });
    return;
  }
  const skills = scanSkills(store);
  res.json({ skills });
});
```

- [ ] **Step 2: Update Setup.tsx to use /api/scan for preview**

In `web/src/pages/Setup.tsx`, replace the `handleScan` function:

```typescript
const handleScan = async () => {
  try {
    const res = await fetch("/api/scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ store }),
    });
    if (res.ok) {
      const data = await res.json();
      setPreviewSkills(data.skills || []);
      setStep(2);
    } else {
      const err = await res.json();
      showToast("error", err.error || "Scan failed");
    }
  } catch {
    showToast("error", "Failed to scan directory");
  }
};
```

- [ ] **Step 3: Build frontend**

```bash
cd /Users/zhouchang/Documents/github-projects/skill-switch/web && npm run build
```

Expected: Build completes, `web/dist/` created

- [ ] **Step 4: Start server and test**

```bash
cd /Users/zhouchang/Documents/github-projects/skill-switch && npx tsx server/index.ts
```

Expected: "Skill Switch running at http://localhost:13721"

Open http://localhost:13721 in browser. Verify:
- Setup wizard appears (no config yet)
- Can enter store path and scan
- Can add target directories
- Can complete setup
- Dashboard loads with theme cards
- Can switch themes
- Skills page shows all skills
- Settings page shows current config

- [ ] **Step 5: Commit**

```bash
git add server/routes.ts web/src/pages/Setup.tsx
git commit -m "fix: add scan-only endpoint, update setup wizard flow"
```

---

### Task 16: Final Polish

**Files:**
- Modify: `package.json` (ensure start script works end-to-end)

- [ ] **Step 1: Update start script to build web first**

Ensure `package.json` scripts are:

```json
{
  "scripts": {
    "dev:server": "tsx watch server/index.ts",
    "dev:web": "cd web && npm run dev",
    "build:web": "cd web && npm run build",
    "start": "npm run build:web && tsx server/index.ts"
  }
}
```

- [ ] **Step 2: Add .gitignore**

Create `.gitignore`:

```
node_modules/
dist/
web/dist/
web/node_modules/
.code-review-graph/
```

- [ ] **Step 3: Final smoke test**

```bash
cd /Users/zhouchang/Documents/github-projects/skill-switch && npm start
```

Expected: Builds web, starts server, accessible at http://localhost:13721

- [ ] **Step 4: Commit**

```bash
git add .gitignore package.json
git commit -m "chore: add .gitignore and finalize start script"
```
