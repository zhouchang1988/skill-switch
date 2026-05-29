# Skill Switch

基于符号链接的技能主题切换工具。它把一个技能仓库里的技能目录按“主题”分组，并把不同主题链接到 Claude Code、OpenCode、Codex 等工具的目标目录中。

## 功能

- **多目标目录** — 每个目标目录都可以独立绑定一个主题
- **主题管理** — 创建、编辑、删除技能主题，维护每个主题包含的技能
- **符号链接切换** — 切换主题时自动重建目标目录中的符号链接
- **技能详情** — 点击技能标签查看 `SKILL.md` 元数据和说明内容
- **目录选择器** — 初始化、仓库设置、目标目录设置都支持浏览本地目录
- **统一中文界面** — 初始化页、主面板、弹窗和反馈提示保持同一套视觉风格

## 快速开始

```bash
# 安装依赖
npm install
cd web && npm install && cd ..

# 开发模式（前后端分别启动）
npm run dev:server   # 后端 http://localhost:13722
npm run dev:web      # 前端 http://localhost:13721

# 生产模式
npm start
```

首次启动会进入初始化向导，配置技能仓库目录和默认目标目录。初始化后进入主面板，可以在同一页面中管理仓库、目标目录和主题。

> 当前前端依赖 Vite 8，建议使用 Node.js 20.19+ 或 22.12+。

## 页面结构

- **初始化页**：选择技能仓库，扫描技能，确认默认目标目录
- **技能仓库面板**：显示当前仓库路径和全部技能标签
- **目录与主题**：展示每个目标目录的当前主题、技能列表和主题下拉切换
- **主题管理**：以卡片网格展示主题，支持内联编辑技能集合
- **弹窗组件**：目录浏览器、技能详情、配置 JSON 查看

## 设计规范

项目根目录包含 [DESIGN.md](/Users/zhouchang/Documents/github-projects/skill-switch/DESIGN.md)，记录当前 UI 的设计令牌和组件规范，包括：

- 颜色、排版、间距、圆角和阴影令牌
- 卡片、按钮、输入框、标签、徽标、弹窗等组件规则
- 页面布局、响应式行为和设计宜忌

前端样式集中在 [web/src/styles.css](/Users/zhouchang/Documents/github-projects/skill-switch/web/src/styles.css)。新增 UI 时优先复用现有 class 和 `DESIGN.md` 中的令牌，不要重新散落 inline style。

## 架构

```text
server/             Express 后端
  index.ts          入口，端口 13722
  config.ts         配置读写 + 技能扫描 + 元数据解析
  routes.ts         REST API 路由
  linker.ts         符号链接管理

web/                React + Vite 前端
  src/App.tsx       应用入口，加载配置并切换初始化页/主面板
  src/pages/        页面：Setup、Dashboard
  src/components/   组件：DirPicker、SkillModal、JsonModal、Toast 等
  src/styles.css    全局设计系统和组件样式
```

## API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/config` | 获取配置 |
| PUT | `/api/config` | 更新技能仓库或目标目录 |
| GET | `/api/skills` | 技能目录列表 |
| GET | `/api/skills-meta` | 所有技能元数据 |
| GET | `/api/skills/:name` | 单个技能元数据 |
| GET | `/api/themes` | 主题列表 |
| POST | `/api/themes` | 创建主题 |
| PUT | `/api/themes/:name` | 更新主题 |
| DELETE | `/api/themes/:name` | 删除主题 |
| POST | `/api/switch` | 为指定目标目录切换主题 |
| GET | `/api/status` | 当前目标目录状态 |
| POST | `/api/scan` | 预览扫描技能仓库 |
| POST | `/api/browse` | 浏览本地目录 |
| POST | `/api/init` | 初始化配置 |

## 配置

配置文件位于 `~/.skill-switch/config.json`：

```json
{
  "store": "/path/to/skill/store",
  "targets": [
    { "path": "~/.claude/skills", "theme": "全量" },
    { "path": "~/.codex/skills", "theme": "设计" }
  ],
  "themes": {
    "全量": ["skill-a", "skill-b"],
    "设计": ["skill-a"]
  }
}
```
