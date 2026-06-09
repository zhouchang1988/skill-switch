import express from "express";
import path from "node:path";
import { router } from "./routes.js";

const PORT = 13722;
const app = express();

app.use(express.json({ limit: "1mb" }));

// API routes
app.use("/api", router);

// Serve frontend static files
const staticDir = path.join(import.meta.dirname, "..", "web", "dist");
app.use(express.static(staticDir));

// SPA fallback: non-API routes serve index.html
app.get("/{*splat}", (_req, res) => {
  res.sendFile(path.join(staticDir, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Skill Switch running at http://localhost:${PORT}`);
});
