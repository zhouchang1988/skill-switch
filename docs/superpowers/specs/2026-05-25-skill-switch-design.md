# Skill Switch — 设计文档

> 日期: 2026-05-25
> 状态: Approved

## 问题

Claude Code、Codex 等 AI 编码工具通过 `~/.claude/skills/`、`~/.codex/skills/` 等目录加载技能。技能以文件夹形式存放，但不同工作场景（编程开发、PPT 制作等）需要的技能组合不同。手动增删技能繁琐且容易遗忘，缺少一个统一的管理和切换工具。

## 解决方案

Skill Switch 是一个本地 Web 服务，通过软链接管理技能目录。核心思路参考 hosts switch：目标目录只存软链接，不存真实文件；按主题切换时，删除旧链接、创建新链接。

## 核心概念

- **仓库目录 (Store)**: 存放全部技能真实文件的本地目录（如 `~/Documents/github-skills/`），用户首次使用时配置。
- **目标目录 (Target)**: 工具写入软链接的目录（如 `~/.claude/skills/`、`~/.codex/skills/`），可配置多个，切换主题时同步更新。
- **技能 (Skill)**: 仓库目录下的一个子文件夹，视为一个可安装的技能单元。
- **主题 (Theme)**: 一组技能名称的平铺列表。切换主题时，目标目录中只保留该主题包含的技能软链接。

## 数据模型

配置文件存放在 `~/.skill-switch/config.json`：

```json
{
  "store": "/Users/zhouchang/Documents/github-skills",
  "targets": [
    "~/.claude/skills",
    "~/.codex/skills"
  ],
  "currentTheme": "编程开发",
  "themes": {
    "编程开发": [
      "code-to-diagram",
      "skill-tester-cn",
      "publish-skill-repo"
    ],
    "PPT制作": [
      "awesome-design-skill",
      "codebase-to-course-cn"
    ],
    "全量": [
      "code-to-diagram",
      "skill-tester-cn",
      "publish-skill-repo",
      "awesome-design-skill",
      "codebase-to-course-cn"
    ]
  }
}
```

路径中的 `~` 在运行时展开为 `$HOME`。

## 架构

Monorepo 单进程架构，`npm start` 启动即可用：

```
skill-switch/
├── server/            # Express 后端
│   ├── index.ts       # 入口，启动服务
│   ├── config.ts      # 配置文件读写
│   ├── linker.ts      # 软链接管理核心逻辑
│   └── routes.ts      # REST API 路由
├── web/               # React SPA 前端
│   ├── src/
│   │   ├── App.tsx
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx    # 主题切换 + 当前状态
│   │   │   ├── Skills.tsx       # 仓库技能浏览
│   │   │   └── Settings.tsx     # 仓库/目标目录配置
│   │   └── components/
│   └── dist/          # 构建产物，后端 serve 静态文件
├── package.json
└── tsconfig.json
```

后端在端口 13721 启动，同时提供 API 和前端静态文件。

## 切换逻辑

切换主题时执行：

1. 读取目标主题的 skill 列表
2. 遍历每个目标目录：
   - 删除所有现有软链接（只删软链接，不删真实目录/文件）
   - 为目标主题中的每个 skill 创建软链接：`target/skill-name → store/skill-name`
3. 更新 `config.json` 中的 `currentTheme`

**安全规则**：只操作软链接，绝不删除或移动仓库目录中的真实文件。若目标目录中存在同名真实目录（非软链接），跳过并警告。

## 初始化

首次启动时 `config.json` 不存在，前端显示 **引导页面**：

1. 要求用户填写仓库目录（store）路径
2. 扫描该路径下的技能文件夹
3. 自动创建"全量"主题（包含全部扫描到的技能）
4. 要求用户至少配置一个目标目录（target）
5. 保存配置并跳转到 Dashboard

引导完成后，后续访问直接进入 Dashboard。

## API

| Method | Path | 描述 |
|--------|------|------|
| GET | /api/config | 获取配置（仓库路径、目标目录列表） |
| PUT | /api/config | 更新仓库路径或目标目录 |
| GET | /api/skills | 扫描仓库目录，返回所有可用技能列表 |
| GET | /api/themes | 获取所有主题及其 skill 列表 |
| POST | /api/themes | 创建新主题 |
| PUT | /api/themes/:name | 更新主题（重命名、修改 skill 列表） |
| DELETE | /api/themes/:name | 删除主题 |
| POST | /api/switch | 切换到指定主题 `{ theme: string }` |
| GET | /api/status | 当前状态：当前主题、各目标目录中的软链接情况 |

## 前端页面

### 引导页 (Setup)

- 仅在 config.json 不存在时显示
- 步骤 1：填写仓库目录路径，点击"扫描"预览发现到的技能
- 步骤 2：配置目标目录（至少一个），支持添加多个
- 步骤 3：确认并创建配置，自动生成"全量"主题

### Dashboard（首页）

- 显示当前激活的主题名称
- 所有主题卡片列表，点击即切换
- 主题卡片支持内联编辑：重命名、添加/移除技能
- 切换后显示操作结果（成功/失败/警告）

### Skills 页

- 展示仓库目录下扫描到的全部技能
- 每个技能显示名称、是否已在当前主题中
- 快捷操作：添加到当前主题 / 从当前主题移除

### Settings 页

- 仓库目录路径（修改后重新扫描）
- 目标目录列表（增删）
- 配置持久化说明

## UI 风格

现代暗色风，类似 Linear/Raycast：深色背景、微妙边框、圆角卡片、柔和阴影。无 UI 框架依赖，用 CSS 变量 + 原生组件实现。

## 技术选型

- **后端**: Node.js + Express + TypeScript
- **前端**: React + TypeScript + Vite 构建
- **样式**: CSS 变量 + 原生组件（无第三方 UI 库）
- **部署**: 单进程，前端构建产物嵌入后端静态服务，`npm start` 一键启动
- **端口**: 13721
- **配置存储**: `~/.skill-switch/config.json`

## 边界与约束

- 不做远程仓库拉取，只管理本地已有技能
- 不做技能内容编辑，只管理链接的增删
- 目标目录中已有的非软链接内容不触碰（跳过 + 警告）
- 无用户认证（纯本地工具）
- 系统自动维护一个"全量"主题（包含仓库中所有技能），用户不可删除，但可编辑其内容
