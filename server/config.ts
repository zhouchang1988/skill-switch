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
