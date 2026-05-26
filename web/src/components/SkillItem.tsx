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
