import { Router, type Request, type Response } from "express";
import {
  configExists,
  loadConfig,
  saveConfig,
  scanSkills,
  createDefaultConfig,
  getSkillMeta,
  getAllSkillsMeta,
  listDirectory,
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
  if (req.body.targets !== undefined) {
    const raw = req.body.targets as { path: string; theme?: string }[];
    config.targets = raw.map((t) => ({
      path: t.path,
      theme: t.theme || "全量",
    }));
  }
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

// GET /api/skills-meta
router.get("/skills-meta", (_req: Request, res: Response) => {
  const config = loadConfig();
  if (!config) {
    res.status(400).json({ error: "Config not initialized" });
    return;
  }
  const meta = getAllSkillsMeta(config.store);
  res.json(meta);
});

// GET /api/skills/:name
router.get("/skills/:name", (req: Request, res: Response) => {
  const config = loadConfig();
  if (!config) {
    res.status(400).json({ error: "Config not initialized" });
    return;
  }
  const name = req.params.name as string;
  const meta = getSkillMeta(config.store, name);
  if (!meta) {
    res.status(404).json({ error: "Skill not found" });
    return;
  }
  res.json(meta);
});

// GET /api/themes
router.get("/themes", (_req: Request, res: Response) => {
  const config = loadConfig();
  if (!config) {
    res.status(400).json({ error: "Config not initialized" });
    return;
  }
  res.json({ themes: config.themes });
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
  const oldName = req.params.name as string;
  if (!config.themes[oldName]) {
    res.status(404).json({ error: "Theme not found" });
    return;
  }
  const { newName, skills } = req.body;
  if (skills !== undefined) config.themes[oldName] = skills;
  if (newName && newName !== oldName) {
    config.themes[newName] = config.themes[oldName];
    delete config.themes[oldName];
    for (const t of config.targets) {
      if (t.theme === oldName) t.theme = newName;
    }
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
  const name = req.params.name as string;
  if (name === "全量") {
    res.status(403).json({ error: "Cannot delete default theme" });
    return;
  }
  if (!config.themes[name]) {
    res.status(404).json({ error: "Theme not found" });
    return;
  }
  delete config.themes[name];
  for (const t of config.targets) {
    if (t.theme === name) t.theme = "全量";
  }
  saveConfig(config);
  res.json(config.themes);
});

// POST /api/switch
router.post("/switch", (req: Request, res: Response) => {
  const { target, theme } = req.body;
  if (!target || !theme) {
    res.status(400).json({ error: "target and theme required" });
    return;
  }
  try {
    const result = switchTheme(target, theme);
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

// POST /api/browse — list subdirectories of a path for directory picker
router.post("/browse", (req: Request, res: Response) => {
  const { path: dirPath } = req.body;
  if (!dirPath) {
    res.status(400).json({ error: "path required" });
    return;
  }
  try {
    const result = listDirectory(dirPath);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
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
  const results = config.targets.map((t) => switchTheme(t.path, t.theme));
  res.json({ config, switchResults: results });
});
