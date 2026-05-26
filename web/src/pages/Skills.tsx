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
