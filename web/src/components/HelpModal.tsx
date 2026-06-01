import { useEffect } from "react";

interface Props {
  onClose: () => void;
}

export function HelpModal({ onClose }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-content-wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">使用帮助</h2>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="modal-body readme-content">
          <h2>Skill Switch 是什么？</h2>
          <p>
            Skill Switch 是一个基于符号链接的技能主题切换工具。它可以把一个技能仓库里的技能目录按「主题」分组，
            并把不同主题链接到 Claude Code、OpenCode、Codex 等工具的目标目录中。
          </p>

          <h2>核心概念</h2>

          <h3>技能库（Store）</h3>
          <p>
            技能库是存放所有技能源文件的目录。你可以把所有的技能都放在这个目录下，
            Skill Switch 会自动扫描并识别它们。
          </p>

          <h3>工具目录（Target）</h3>
          <p>
            工具目录是 Claude Code、OpenCode 等工具读取技能的位置。你可以添加多个工具目录，
            每个工具目录可以独立绑定一套技能组合。
          </p>

          <h3>技能组合（Theme）</h3>
          <p>
            技能组合是技能的集合。你可以创建不同的技能组合，比如「前端开发」、「后端开发」、「设计」等，
            每个组合包含不同的技能。切换技能组合时，目标目录中的符号链接会自动更新。
          </p>

          <h2>使用步骤</h2>

          <ol>
            <li>
              <strong>配置技能库</strong>
              <p>点击「技能库」卡片的「编辑」按钮，设置技能源文件的存放路径。</p>
            </li>
            <li>
              <strong>添加工具目录</strong>
              <p>点击「添加工具目录」按钮，添加 Claude Code 或其他工具的技能目录路径。</p>
            </li>
            <li>
              <strong>创建技能组合</strong>
              <p>点击「新建技能组合」按钮，创建不同的技能主题，并为每个主题选择包含的技能。</p>
            </li>
            <li>
              <strong>切换技能组合</strong>
              <p>在工具目录卡片中，使用下拉菜单选择要应用的技能组合。</p>
            </li>
          </ol>

          <h2>常见问题</h2>

          <h3>Q: 「全量」技能组合是什么？</h3>
          <p>
            「全量」是一个特殊的技能组合，它会自动包含技能库中的所有技能。当你选择「全量」时，
            所有技能都会被链接到目标目录。
          </p>

          <h3>Q: 如何查看技能的详细信息？</h3>
          <p>
            点击任意技能标签，即可查看该技能的 SKILL.md 元数据和 README 内容。
          </p>

          <h3>Q: 切换技能组合后会发生什么？</h3>
          <p>
            切换技能组合时，Skill Switch 会自动重建目标目录中的符号链接，
            确保只有当前组合中的技能被链接到目标目录。
          </p>
        </div>
      </div>
    </div>
  );
}
