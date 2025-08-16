# FlowLearn - 自动化生词学习助手（Electron + React + Vite + TypeScript）

FlowLearn 是一款专注于“收集-查询-存储-复习”闭环的桌面应用。它在后台静默监听剪贴板，帮你把阅读/学习过程中复制的生词自动收集起来，并在阈值达到时一键生成可直接用于 AI 工具的 Prompt。待你将 AI 的结果复制回来后，应用会自动解析并保存为本地生词库，还提供搜索、详情、删除和“间隔重复”的复习模式。

应用默认不联网，所有数据均保存在本地。

## 主要特性

- 静默监听剪贴板，自动去重与过滤（最小/最大词数、是否忽略多行、正则排除等）
- 生词篮子与阈值触发，支持托盘手动触发与清空
- 一键复制 Prompt（可自定义模板），两种响应模式：
  - 仅 JSON（严格结构化）
  - 富文本解析 + 末尾严格 JSON 摘要（通过 BEGIN_FLOWLEARN_JSON/END_FLOWLEARN_JSON 定界）
- 智能从 AI 回复中提取 JSON 并校验结构，自动入库
- 生词库：搜索、状态筛选、详情页、删除、导出/复制讲解
- 复习模式（简化 SRS）：忘记/掌握将自动安排下次复习时间（10 分钟、1/3/7 天）
- 系统托盘：显示/隐藏窗口、暂停/继续监听、强制加入当前剪贴板、立即处理、清空、生词设置、退出
- 全局快捷键（默认 Windows/Linux: Ctrl+Shift+Y，macOS: Cmd+Ctrl+Shift+Y）强制将当前剪贴板加入篮子
- 本地数据与设置文件存储（位于操作系统的 userData 目录）
- 跨平台开发与打包（Windows/macOS/Linux）

## 运行环境

- Node.js 18+（推荐）
- npm 9+（或使用你熟悉的包管理器）
- Windows 10+/macOS 12+/现代 Linux 发行版

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发模式（Vite + Electron）
npm run dev

# 构建并打包安装包（使用 electron-builder）
npm run build
```

构建完成后，安装包会输出到 `release/<version>/` 目录：

- Windows：NSIS 安装包（x64）
- macOS：DMG
- Linux：AppImage

## 常用脚本

- `npm run dev`：启动 Vite 开发服务器并运行 Electron 主进程
- `npm run build`：类型检查 + 构建前端 + electron-builder 打包
- `npm run lint`：ESLint 检查
- `npm run preview`：本地预览构建产物（仅渲染进程网页）

## 目录结构

```
words/
├─ electron/                 # Electron 主进程与预加载脚本
│  ├─ main.ts
│  └─ preload.ts
├─ src/                      # 渲染进程（React + TS + Vite）
│  ├─ App.tsx                # 主界面：生词库/复习/设置
│  └─ main.tsx               # 渲染入口
├─ public/                   # 图标与静态资源（托盘/窗口图标优先从这里查找）
├─ dist/                     # 渲染进程构建产物（自动生成）
├─ dist-electron/            # 主进程构建产物（自动生成）
├─ electron-builder.json5    # electron-builder 打包配置
├─ vite.config.ts            # Vite 配置（包含 vite-plugin-electron）
├─ package.json
└─ 需求文档.md               # 软件需求说明
```

## 使用指南

1) 启动应用后，系统托盘会出现图标，应用在后台监听剪贴板；
2) 复制你在阅读中遇到的生词，应用将自动加入“生词篮子”（去重、过滤生效）；
3) 达到阈值（默认 5）时会推送通知，点击后自动将 Prompt 复制到剪贴板；
4) 将该 Prompt 粘贴到任意 AI 工具，等待回复；
5) 复制 AI 的完整回复回到剪贴板，应用会自动识别并提取 JSON，校验结构并入库；
6) 在主界面“生词库”中可搜索、筛选、查看详情、删除；
7) 在“复习模式”中依据到期词条进行训练，“忘记/掌握”会自动安排下次复习；
8) 在“设置”中可调整阈值、过滤规则、快捷键、响应模式与 Prompt 模板。

提示：托盘菜单可随时暂停/继续监听、强制加入剪贴板文本、立即处理篮中生词、清空篮子、显示/隐藏主窗口等。

## 设置项说明（App 内“设置”页）

- 触发阈值：达到数量后提示复制 Prompt
- 最小/最大单词数：用于基础过滤
- 忽略包含换行：开启后会忽略多行文本
- 正则排除：每行一条正则，用于排除不需要的文本
- 全局快捷键：强制把当前剪贴板加入篮子（绕过过滤）
- 响应模式：
  - 仅 JSON：使用下方“Prompt 模板”，模板内支持 `{count}` 与 `{terms}` 占位符
  - 富文本解析：使用“富文本解析提示（richHeader）”，并要求 AI 在回复末尾追加 `BEGIN_FLOWLEARN_JSON`/`END_FLOWLEARN_JSON` 包裹的严格 JSON 数组
- Prompt 模板：仅 JSON 模式下使用，应用会将 `{count}` 和 `{terms}` 替换为实际值
- 富文本解析提示（richHeader）：用于指导 AI 输出详尽讲解与末尾 JSON 摘要

## 数据与隐私

- 应用不会主动联网；与 AI 的交互由用户在外部工具中完成
- 应用数据保存在系统的 userData 目录，主要文件：
  - `settings.json`：应用设置
  - `vocab.json`：生词库（包含 term/definition/phonetic/example/domain/addedAt/reviewStatus/reviewDueDate/analysis 等）
- 如需重置应用，可关闭应用后备份/删除上述文件（注意操作不可逆）

说明：当前实现使用本地 JSON 文件存储；未来可根据需要迁移到 SQLite（参见 `需求文档.md`）。

## 托盘菜单

- 显示/隐藏窗口
- 暂停/继续监听
- 强制加入当前剪贴板（绕过过滤）
- 立即处理篮中 X 个生词（复制 Prompt）
- 清空生词篮子
- 设置
- 退出应用

## 打包与品牌化

打包使用 `electron-builder`，配置位于 `electron-builder.json5`：

- 修改应用标识与名称：
  - `appId`: 请替换为你的反向域名（如 `com.example.flowlearn`）
  - `productName`: 应用显示名称（安装包与安装后程序名）
- 目标产物：
  - Windows：NSIS（x64），产物名 `${productName}-Windows-${version}-Setup.${ext}`
  - macOS：DMG，产物名 `${productName}-Mac-${version}-Installer.${ext}`
  - Linux：AppImage，产物名 `${productName}-Linux-${version}.${ext}`
- 资源与图标：
  - 窗口/托盘优先从 `public/` 读取图标：`icon.ico`（Win）/`icon.png`（macOS/Linux）及可选 `tray.*` 文件
  - 若托盘图标在高分屏不清晰，可在 `public/` 放置针对托盘优化的图标（见代码中的优先顺序）

注意：Windows 通知需要 AppUserModelId，应用已在主进程设置 `FlowLearn`；如改名，请同步调整。

## 技术栈与代码结构

- Electron 主进程：`electron/main.ts`
  - 剪贴板监听、托盘、通知、全局快捷键
  - 生词篮子管理、Prompt 生成、AI 结果解析与入库
  - IPC 通道（如 `settings:get`/`settings:set`、`basket:*`、`db:*`、`review:*`）
- 预加载脚本：`electron/preload.ts`
  - 向渲染进程暴露 `window.api`（on/off/invoke）
- 渲染进程（React）：`src/App.tsx`
  - 生词库列表/详情、复习模式、设置页、搜索/筛选/删除/导出

## 常见问题（FAQ）

- 全局快捷键注册失败？
  - 检查是否被其他程序占用，尝试修改为不冲突的组合
- 无法解析 AI 结果？
  - 仅 JSON 模式：确保回复是一个严格的 JSON 数组，键包括 `term/definition/phonetic/example`；
  - 富文本模式：确保在回复末尾追加 `BEGIN_FLOWLEARN_JSON` 与 `END_FLOWLEARN_JSON` 定界且其中为严格 JSON 数组；
  - 若回复中含多余文字，应用会尝试自动抽取第一个平衡的 JSON 结构，但不保证 100% 成功
- 托盘图标模糊或过大/过小？
  - 在 `public/` 放置针对托盘优化的 `tray.ico/.png`，应用会依据 DPI 自适应缩放（Windows）
- 打包后白屏？
  - 确认 `dist` 与 `dist-electron` 已包含在 `electron-builder.json5` 的 `files` 列表，并由主进程正确加载 `dist/index.html`

## 路线图（Roadmap）

- 本地数据库由 JSON 迁移到 SQLite，并提供加密选项
- 自动更新（electron-updater）
- 导入/导出与多设备迁移
- 多语言界面
- 更完善的复习算法与统计

## 许可证

当前未设置许可证。如需开源/发布，请根据你的需求添加合适的 License 并在 `package.json` 与本文件中声明。

---

如有问题或建议，欢迎在 `需求文档.md` 中补充或直接提交 Issue/PR。
