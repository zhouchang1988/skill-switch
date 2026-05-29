import fs from "node:fs";
import path from "node:path";
import { expandPath, loadConfig, saveConfig, type Config } from "./config.js";

export interface SwitchResult {
  target: string;
  theme: string;
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

export function switchTheme(targetPath: string, themeName: string): SwitchResult {
  const config = loadConfig();
  if (!config) throw new Error("Config not found");
  const skills = config.themes[themeName];
  if (!skills) throw new Error(`Theme "${themeName}" not found`);

  const store = expandPath(config.store);
  const target = expandPath(targetPath);

  const result: SwitchResult = {
    target,
    theme: themeName,
    created: [],
    removed: [],
    skipped: [],
    errors: [],
  };

  if (!fs.existsSync(target)) {
    fs.mkdirSync(target, { recursive: true });
  }

  for (const name of listSymlinks(target)) {
    const linkPath = path.join(target, name);
    try {
      fs.unlinkSync(linkPath);
      result.removed.push(name);
    } catch (err: any) {
      result.errors.push(`Failed to remove ${name}: ${err.message}`);
    }
  }

  for (const skill of skills) {
    const linkPath = path.join(target, skill);
    const sourcePath = path.join(store, skill);

    if (fs.existsSync(linkPath) && !isSymlink(linkPath)) {
      result.skipped.push(skill);
      continue;
    }

    if (!fs.existsSync(sourcePath)) {
      result.errors.push(`Source not found: ${skill}`);
      continue;
    }

    try {
      fs.symlinkSync(sourcePath, linkPath);
      result.created.push(skill);
    } catch (err: any) {
      result.errors.push(`Failed to link ${skill}: ${err.message}`);
    }
  }

  const targetConfig = config.targets.find((t) => expandPath(t.path) === target);
  if (targetConfig) {
    targetConfig.theme = themeName;
    saveConfig(config);
  }

  return result;
}

export interface StatusResult {
  targets: {
    target: string;
    theme: string;
    symlinks: string[];
    exists: boolean;
  }[];
}

export function getStatus(config: Config): StatusResult {
  const result: StatusResult = { targets: [] };

  for (const targetConfig of config.targets) {
    const target = expandPath(targetConfig.path);
    const exists = fs.existsSync(target);
    result.targets.push({
      target,
      theme: targetConfig.theme,
      symlinks: exists ? listSymlinks(target) : [],
      exists,
    });
  }

  return result;
}
