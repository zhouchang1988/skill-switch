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
