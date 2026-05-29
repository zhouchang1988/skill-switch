export interface TargetConfig {
  path: string;
  theme: string;
}

export interface Config {
  store: string;
  targets: TargetConfig[];
  themes: Record<string, string[]>;
}

export interface ConfigResponse {
  initialized: boolean;
  store?: string;
  targets?: TargetConfig[];
  themes?: Record<string, string[]>;
}

export interface SwitchResult {
  target: string;
  theme: string;
  created: string[];
  removed: string[];
  skipped: string[];
  errors: string[];
}

export interface StatusResult {
  targets: {
    target: string;
    theme: string;
    symlinks: string[];
    exists: boolean;
  }[];
}

export interface ToastMessage {
  id: number;
  type: "success" | "warning" | "error";
  text: string;
}

export interface SkillMeta {
  dirName: string;
  name: string;
  description: string;
  metadata: Record<string, string>;
  content: string;
  readme: string | null;
}

export interface DirEntry {
  name: string;
  path: string;
  isDir: boolean;
}

export interface DirBrowseResult {
  current: string;
  parent: string | null;
  entries: DirEntry[];
}
