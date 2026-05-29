# Skill Switch UI 改进设计

日期: 2026-05-26

## 改动范围

4 项改动，均在现有代码基础上增量修改：

1. **只展示包含 SKILL.md 的目录** — scanSkills 过滤逻辑变更
2. **浅色系 UI 配色** — CSS 变量全面替换
3. **Skill 点击弹窗** — 新增 Modal 组件 + 元数据 API
4. **中文界面** — 所有用户可见文案改为中文

---

## 1. 后端：SKILL.md 过滤 + 元数据 API

### scanSkills 改动

`server/config.ts` 的 `scanSkills()` 当前返回 store 目录下所有子目录名。改为：

- 只返回包含 `SKILL.md` 文件的子目录
- 排序不变（按名称字母序）

```ts
export function scanSkills(store: string): string[] {
  const expanded = expandPath(store);
  if (!fs.existsSync(expanded)) return [];
  return fs
    .readdirSync(expanded, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .filter((d) => fs.existsSync(path.join(expanded, d.name, "SKILL.md")))
    .map((d) => d.name)
    .sort();
}
```

### 新增：skill 元数据端点

**GET /api/skills/:name** — 返回单个 skill 的元数据

解析 `SKILL.md` 的 YAML frontmatter（`---` 之间的内容），提取所有字段。返回格式：

```json
{
  "name": "brainstorming",
  "dirName": "brainstorming",
  "description": "帮助将想法转化为完整设计的协作对话技能",
  "metadata": {
    "name": "brainstorming",
    "description": "...",
    "trigger": "...",
    ...其他 frontmatter 字段
  },
  "content": "SKILL.md 完整内容（frontmatter + body）"
}
```

实现要点：
- 在 `server/config.ts` 中新增 `getSkillMeta(store, dirName)` 函数
- 读取 `<store>/<dirName>/SKILL.md`，手动解析 frontmatter（不引入第三方库，正则分割 `---` 块，简易 YAML key:value 解析）
- 在 `server/routes.ts` 中新增 `GET /api/skills/:name` 路由

**GET /api/skills-meta** — 批量返回所有 skill 的元数据

```json
[
  { "name": "brainstorming", "dirName": "brainstorming", "description": "..." },
  ...
]
```

用途：Skills 页面一次性获取所有 skill 的描述，避免逐个请求。

---

## 2. 前端：浅色系配色

### CSS 变量替换

将 `web/src/styles.css` 的深色变量替换为浅色系：

```css
:root {
  --bg-primary: #ffffff;
  --bg-secondary: #f9fafb;
  --bg-tertiary: #f3f4f6;
  --bg-hover: #e5e7eb;
  --border: #d1d5db;
  --text-primary: #111827;
  --text-secondary: #6b7280;
  --text-muted: #9ca3af;
  --accent: #2563eb;
  --accent-hover: #1d4ed8;
  --success: #16a34a;
  --warning: #d97706;
  --error: #dc2626;
  --radius: 8px;
  --radius-lg: 12px;
}
```

关键变化：
- 背景从近黑 → 白/浅灰
- 文字从浅色 → 深色
- 强调色从 indigo 紫 → 蓝色系（区别于 AI 紫，但保持专业感）
- 其他微调（border 更深，hover 更明显）

### 组件样式调整

- `.card` 保持浅色背景 + 细边框
- `.tag` 用浅灰背景 + 深色文字
- 按钮 hover 效果适配浅色底
- Toast 组件颜色保持语义化但适配浅色

---

## 3. 前端：Skill 弹窗

### 新增 Modal 组件

`web/src/components/SkillModal.tsx`

- 居中弹窗，半透明遮罩
- 点击遮罩或按 Esc 关闭
- 内容区域：
  - 标题：skill 的 name（metadata.name 或 dirName）
  - 描述：metadata.description
  - 触发词：metadata.trigger（如果有）
  - 其他 frontmatter 字段以 key-value 列表展示
  - 底部操作按钮：添加/移除（复用现有逻辑）

### SkillItem 改动

`web/src/components/SkillItem.tsx`

- 点击 skill 名称区域打开弹窗（而非直接操作）
- 保留右侧的 Add/Remove 按钮

### Skills 页面改动

- 使用 `GET /api/skills-meta` 获取描述列表
- 每个 SkillItem 传入 description 用于弹窗预览

---

## 4. 中文界面

所有用户可见文案改为中文：

| 页面 | 原文 | 中文 |
|------|------|------|
| 导航 | Dashboard / Skills / Settings | 主题 / 技能 / 设置 |
| Dashboard | Themes / Current / New Theme | 主题 / 当前主题 / 新建主题 |
| Dashboard | Switch / Edit / Active / Add Skill | 切换 / 编辑 / 已激活 / 添加技能 |
| Skills | N skills in store | 仓库中共 N 个技能 |
| Skills | Adding/removing affects "X" | 添加/移除将影响主题 "X" |
| Skills | Add / Remove | 添加 / 移除 |
| Skills | No skills found | 未找到技能 |
| Settings | Skill Store Directory / Target Directories / Config Location | 技能仓库目录 / 目标目录 / 配置文件路径 |
| Settings | Save Settings | 保存设置 |
| Setup | Step 1/2/3 文案 | 全部中文化 |
| Toast | success/warning/error 消息 | 中文 |

---

## 影响范围

| 文件 | 改动类型 |
|------|----------|
| `server/config.ts` | scanSkills 加 SKILL.md 过滤 + 新增 getSkillMeta |
| `server/routes.ts` | 新增 2 个 API 路由 |
| `web/src/styles.css` | CSS 变量全面替换 |
| `web/src/App.tsx` | 导航中文化 |
| `web/src/pages/Dashboard.tsx` | 文案中文化 |
| `web/src/pages/Skills.tsx` | 文案中文化 + 使用 skills-meta API |
| `web/src/pages/Settings.tsx` | 文案中文化 |
| `web/src/pages/Setup.tsx` | 文案中文化 |
| `web/src/components/SkillItem.tsx` | 点击弹窗 + 中文化 |
| `web/src/components/ThemeCard.tsx` | 文案中文化 |
| `web/src/components/SkillModal.tsx` | **新增** |
| `web/src/api.ts` | 新增 getSkillMeta / getSkillsMeta |
| `web/src/types.ts` | 新增 SkillMeta 接口 |

不需要改动的：
- `server/linker.ts` — 软链接逻辑不受影响
- `server/index.ts` — 入口不受影响
- `web/src/components/Toast.tsx` — 结构不变，仅消息内容变中文
