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
