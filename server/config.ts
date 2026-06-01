import fs from "node:fs";
import path from "node:path";
import os from "node:os";

export interface TargetConfig {
  path: string;
  theme: string;
}

export interface Config {
  store: string;
  targets: TargetConfig[];
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

export interface DirEntry {
  name: string;
  path: string;
  isDir: boolean;
}

export function listDirectory(dirPath: string): { current: string; parent: string | null; entries: DirEntry[] } {
  const expanded = expandPath(dirPath);
  if (!fs.existsSync(expanded) || !fs.statSync(expanded).isDirectory()) {
    throw new Error(`Directory not found: ${dirPath}`);
  }
  const parent = path.dirname(expanded);
  const entries = fs.readdirSync(expanded, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((d) => ({
      name: d.name,
      path: path.join(expanded, d.name),
      isDir: true,
    }));
  return {
    current: expanded,
    parent: expanded !== parent ? parent : null,
    entries,
  };
}

export function sanitizeConfig(config: Config): Config {
  const validSkills = new Set(scanSkills(config.store));
  const sanitizedThemes: Record<string, string[]> = {};
  for (const [name, skills] of Object.entries(config.themes)) {
    sanitizedThemes[name] = skills.filter((s) => validSkills.has(s));
  }
  const validThemeNames = new Set(Object.keys(sanitizedThemes));
  const sanitizedTargets = config.targets.filter((t) => validThemeNames.has(t.theme));
  return { ...config, targets: sanitizedTargets, themes: sanitizedThemes };
}

export function loadConfig(): Config | null {
  if (!fs.existsSync(CONFIG_PATH)) return null;
  const raw = fs.readFileSync(CONFIG_PATH, "utf-8");
  const config: Config = JSON.parse(raw);
  const sanitized = sanitizeConfig(config);
  
  const currentSkills = scanSkills(sanitized.store);
  const fullThemeSkills = new Set(sanitized.themes["全量"] || []);
  let hasNewSkills = false;
  
  for (const skill of currentSkills) {
    if (!fullThemeSkills.has(skill)) {
      sanitized.themes["全量"] = sanitized.themes["全量"] || [];
      sanitized.themes["全量"].push(skill);
      hasNewSkills = true;
    }
  }
  
  if (hasNewSkills) {
    saveConfig(sanitized);
  }
  
  return sanitized;
}

export function saveConfig(config: Config): void {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), "utf-8");
}

export function createDefaultConfig(
  store: string,
  targets: { path: string; theme?: string }[],
  skillNames: string[]
): Config {
  return {
    store: expandPath(store),
    targets: targets.map((t) => ({
      path: expandPath(t.path),
      theme: t.theme || "全量",
    })),
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
    .filter((d) => fs.existsSync(path.join(expanded, d.name, "SKILL.md")))
    .map((d) => d.name)
    .sort();
}

export interface SkillMeta {
  dirName: string;
  name: string;
  description: string;
  metadata: Record<string, string>;
  content: string;
  readme: string | null;
}

export function parseFrontmatter(raw: string): Record<string, string> {
  const match = raw.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  const meta: Record<string, string> = {};
  for (const line of match[1].split("\n")) {
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let val = line.slice(idx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (key) meta[key] = val;
  }
  return meta;
}

export function getSkillMeta(store: string, dirName: string): SkillMeta | null {
  const skillDir = path.join(expandPath(store), dirName);
  const skillPath = path.join(skillDir, "SKILL.md");
  if (!fs.existsSync(skillPath)) return null;
  const content = fs.readFileSync(skillPath, "utf-8");
  const metadata = parseFrontmatter(content);
  const readmePath = path.join(skillDir, "README.md");
  const readme = fs.existsSync(readmePath) ? fs.readFileSync(readmePath, "utf-8") : null;
  return {
    dirName,
    name: metadata.name || dirName,
    description: metadata.description || "",
    metadata,
    content,
    readme,
  };
}

export function getAllSkillsMeta(store: string): SkillMeta[] {
  return scanSkills(store)
    .map((dir) => getSkillMeta(store, dir))
    .filter((m): m is SkillMeta => m !== null);
}
