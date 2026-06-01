import { useEffect } from "react";

interface Props {
  title: string;
  skills: string[];
  onClose: () => void;
  onViewSkill: (skill: string) => void;
}

export function SkillListModal({ title, skills, onClose, onViewSkill }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{title} - 全部技能</h2>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="modal-body">
          <p style={{ marginBottom: 'var(--space-4)', color: 'var(--text-secondary)', fontSize: '14px' }}>
            共 {skills.length} 个技能
          </p>
          <div className="tag-list" style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
            {skills.map((skill) => (
              <button
                key={skill}
                className="skill-tag skill-tag-clickable"
                onClick={() => {
                  onClose();
                  onViewSkill(skill);
                }}
                type="button"
              >
                {skill}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
