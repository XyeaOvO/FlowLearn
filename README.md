# 🚀 FlowLearn - AI驱动的沉浸式语言学习引擎

<div align="center">

[![GitHub stars](https://img.shields.io/github/stars/XyeaOvO/FlowLearn?style=for-the-badge)](https://github.com/XyeaOvO/FlowLearn/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/XyeaOvO/FlowLearn?style=for-the-badge)](https://github.com/XyeaOvO/FlowLearn/network)
[![GitHub issues](https://img.shields.io/github/issues/XyeaOvO/FlowLearn?style=for-the-badge)](https://github.com/XyeaOvO/FlowLearn/issues)
[![GitHub license](https://img.shields.io/github/license/XyeaOvO/FlowLearn?style=for-the-badge)](https://github.com/XyeaOvO/FlowLearn/blob/main/LICENSE)

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Electron](https://img.shields.io/badge/Electron-191970?style=for-the-badge&logo=Electron&logoColor=white)](https://www.electronjs.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)

*让技术退居幕后，让学习回归心流*

[🎯 核心特性](#-核心特性) • [🛠️ 技术架构](#️-技术架构) • [🚀 快速开始](#-快速开始) • [📖 使用指南](#-使用指南) • [🔧 开发指南](#-开发指南)

</div>

---

## 📋 项目概述

FlowLearn 是一款革命性的桌面应用，专为高效的跨语言学习而设计。通过创新的**"无感知（Zero-Awareness）"** 理念，它将传统的"阅读-中断-查询-记录"学习模式转变为流畅的沉浸式体验。

### 🎯 解决的核心问题

- **🔄 学习流中断**：传统查词方式严重打断阅读心流
- **📚 知识碎片化**：生词记录缺乏系统性管理和科学复习
- **🤖 AI使用门槛**：普通用户难以有效利用大语言模型的强大能力
- **⏰ 效率低下**：重复性的查词、记录、整理工作消耗大量时间

### 💡 创新解决方案

**FlowLearn = 智能捕获 + AI深度解析 + 科学复习**

通过后台静默监听、批量AI处理和间隔重复算法，实现从生词收集到知识内化的全流程自动化。

### 📸 应用截图

> 🚧 **开发中**: 应用界面截图将在正式版本发布时添加

---

## ✨ 核心特性

### 🎯 智能捕获引擎
- **🔍 静默监听**：后台自动捕获剪贴板中的生词，零打扰
- **🧠 智能过滤**：基于词长、频率、正则表达式的多维度过滤
- **⚡ 实时去重**：毫秒级去重处理，避免重复学习
- **📊 批量处理**：达到阈值自动触发，提高AI处理效率

### 🤖 AI处理核心
- **📝 动态Prompt生成**：根据词汇特点自动生成最优Prompt
- **🔄 多策略解析**：容错性强的AI回复解析引擎
- **🌐 多模型支持**：兼容OpenAI、Anthropic等主流AI服务
- **🛡️ 故障转移**：自动重试机制确保处理成功率

### 📚 科学复习系统
- **🧮 FSRS算法**：基于科学研究的间隔重复算法
- **📈 记忆曲线**：可视化学习进度和记忆强度
- **🎯 智能推送**：个性化的每日复习任务
- **📊 学习统计**：详细的学习数据分析和报告

### 🖥️ 系统级集成
- **🌍 跨平台支持**：Windows、macOS、Linux全覆盖
- **⌨️ 全局快捷键**：系统级快捷键支持
- **🔔 原生通知**：系统托盘集成和通知推送
- **🔒 隐私保护**：所有数据本地存储，不上传云端

---

## 🛠️ 技术架构

### 📐 架构设计

```
┌─────────────────────────────────────────────────────────────┐
│                    表现层 (Renderer Process)                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   React UI  │  │  TypeScript │  │    Vite     │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────┬───────────────────────────────────┘
                          │ IPC 通信
┌─────────────────────────┴───────────────────────────────────┐
│                   核心逻辑层 (Main Process)                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │  智能捕获引擎  │  │  AI处理核心  │  │  科学复习系统  │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   数据管理器  │  │   系统集成   │  │   配置管理   │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

### 🔧 技术栈

| 层级 | 技术选型 | 说明 |
|------|----------|------|
| **前端框架** | React 18 + TypeScript | 现代化的组件化开发 |
| **构建工具** | Vite 5 | 极速的开发体验和构建性能 |
| **桌面框架** | Electron 30 | 跨平台桌面应用开发 |
| **数据库** | Better-SQLite3 | 高性能本地数据库 |
| **状态管理** | React Hooks + Context | 轻量级状态管理方案 |
| **国际化** | react-i18next + i18next | 多语言支持 |
| **样式方案** | 原生CSS | 简洁高效的样式管理 |
| **代码质量** | ESLint + TypeScript | 代码规范和类型安全 |
| **安全处理** | DOMPurify | XSS 防护和内容净化 |
| **文档渲染** | Marked | Markdown 解析和渲染 |

### 🏗️ 核心模块

#### 🎯 智能捕获引擎 (`useOptimizedFilter`)
- **防抖处理**：避免频繁触发，优化性能
- **虚拟滚动**：大数据集高效渲染
- **智能过滤**：多维度过滤算法

#### 🧠 内存优化系统 (`useMemoryOptimization`)
- **缓存管理**：智能缓存策略，减少重复计算
- **批量处理**：批量操作优化，提升性能
- **内存监控**：实时内存使用统计

#### 📱 虚拟化组件 (`VirtualizedWordList`)
- **虚拟滚动**：支持大量数据的流畅滚动
- **动态渲染**：按需渲染，节省内存
- **性能优化**：requestAnimationFrame优化

---

## 🚀 快速开始

### 📋 环境要求

- **Node.js**: 18.0+ (推荐 LTS 版本)
- **npm**: 9.0+ 或 yarn 1.22+
- **操作系统**: Windows 10+, macOS 12+, 或现代 Linux 发行版

### ⚡ 安装与运行

```bash
# 1. 克隆项目
git clone https://github.com/XyeaOvO/FlowLearn.git
cd FlowLearn

# 2. 安装依赖
npm install

# 3. 启动开发环境（前端）
npm run dev

# 4. 启动 Electron 开发环境
npm run electron:dev

# 5. 构建生产版本
npm run build

# 6. 打包成安装程序
npm run electron:pack
```

### 📦 可用脚本

| 命令 | 功能 | 说明 |
|------|------|------|
| `npm run dev` | 前端开发 | 启动 Vite 开发服务器 |
| `npm run electron:dev` | Electron开发 | 启动 Electron 应用（需先运行 build） |
| `npm run build` | 构建应用 | TypeScript 编译 + Vite 构建 |
| `npm run electron:pack` | 打包应用 | 使用 electron-builder 生成安装包 |
| `npm run lint` | 代码检查 | ESLint 代码质量检查 |
| `npm run lint:fix` | 修复代码 | 自动修复 ESLint 问题 |
| `npm run preview` | 预览构建 | 本地预览构建结果 |

---

## 📖 使用指南

### 🎯 基本工作流

1. **📥 自动收集**
   - 启动应用后，系统托盘出现图标
   - 复制任何文本，应用自动识别并收集生词
   - 智能过滤确保只收集有价值的词汇

2. **🤖 AI 处理**
   - 达到设定阈值（默认5个词）时自动触发
   - 一键复制生成的 Prompt 到剪贴板
   - 将 Prompt 粘贴到任意 AI 工具获取解析

3. **📚 知识入库**
   - 复制 AI 回复，应用自动解析并入库
   - 支持多种 AI 回复格式的智能识别
   - 自动提取词义、音标、例句等信息

4. **🔄 科学复习**
   - 基于 FSRS 算法的个性化复习计划
   - 四级反馈系统：忘记/困难/良好/简单
   - 可视化学习进度和记忆曲线

### ⚙️ 高级配置

#### 🎛️ 捕获设置
- **触发阈值**：自定义批量处理的词汇数量
- **过滤规则**：词长范围、正则表达式排除
- **监听控制**：暂停/继续剪贴板监听

#### 🤖 AI 配置
- **响应模式**：纯 JSON 或富文本+JSON
- **Prompt 模板**：自定义 AI 交互模板
- **模型选择**：支持多种 AI 服务提供商

#### 📚 复习设置
- **复习算法**：FSRS 参数调优
- **每日目标**：自定义每日复习数量
- **难度调节**：个性化难度曲线

---

## 🗂 数据存储与备份

- 数据均保存在本地用户数据目录（userData）中：
  - settings.json：应用设置
  - vocab.db：词汇数据库（SQLite）
  - backups/：自动备份目录
- 常见平台的 userData 位置示例：
  - Windows: C:/Users/你的用户名/AppData/Roaming/FlowLearn
  - macOS: ~/Library/Application Support/FlowLearn
  - Linux: ~/.config/FlowLearn
- 你也可以在应用内使用导入/导出功能进行手动备份和迁移。

## ⌨️ 默认快捷键

- 强制添加当前剪贴板内容：
  - Windows/Linux：Ctrl + Shift + Y
  - macOS：Command + Shift + Y
- 可在 设置 → 基础/快捷键 中自定义。

## 🤖 AI 输出格式说明

- 为了提升解析稳定性，应用在 Prompt 中要求 AI 在输出末尾追加一个被以下标记包裹的严格 JSON：
  - BEGIN_FLOWLEARN_JSON ... END_FLOWLEARN_JSON
- JSON 数组的每一项应包含字段：term, definition, phonetic, example, domain。
- 应用将自动提取并校验该 JSON，并保留完整的富文本解析作为知识卡片详情。

---

### 🔧 开发指南

### 📋 开发环境要求

- **Node.js**: >= 18.0.0
- **npm**: >= 8.0.0
- **操作系统**: Windows 10+, macOS 10.15+, Ubuntu 18.04+
- **Python**: >= 3.8（用于 better-sqlite3 编译）

### 🔧 开发工具推荐

- **IDE**: VS Code + 推荐扩展包
  - TypeScript and JavaScript Language Features
  - ESLint
  - Prettier
  - React snippets
- **调试**: Chrome DevTools + Electron DevTools
- **版本控制**: Git + GitHub Desktop
- **数据库**: DB Browser for SQLite

### 🚀 快速开始

```bash
# 1. 克隆项目
git clone https://github.com/XyeaOvO/FlowLearn.git
cd FlowLearn

# 2. 安装依赖
npm install

# 3. 启动开发环境
npm run dev          # 启动前端开发服务器
npm run electron:dev # 启动 Electron 应用
```

### 🐛 故障排除

#### 常见问题

**1. better-sqlite3 安装失败**
```bash
# Windows 用户需要安装 Visual Studio Build Tools
npm install --global windows-build-tools

# 或使用预编译版本
npm install better-sqlite3 --build-from-source
```

**2. Electron 启动失败**
```bash
# 确保先构建前端代码
npm run build
npm run electron:dev
```

**3. 数据库权限问题**
- 确保应用有写入用户目录的权限
- 检查防病毒软件是否阻止了数据库文件创建

**4. AI 服务连接失败**
- 检查网络连接
- 验证 API 密钥配置
- 查看控制台错误日志

### 📁 项目结构

```
flowlearn/
├── 📁 electron/                 # Electron 主进程
│   ├── 📄 main.ts              # 主进程入口
│   ├── 📄 preload.ts           # 预加载脚本
│   └── 📄 electron-env.d.ts    # Electron 类型定义
├── 📁 src/                     # React 渲染进程
│   ├── 📄 App.tsx              # 主应用组件
│   ├── 📄 main.tsx             # 渲染进程入口
│   ├── 📄 i18n.ts              # 国际化配置
│   ├── 📁 entities/            # 业务实体
│   │   ├── 📁 word/            # 单词实体
│   │   ├── 📁 review/          # 复习实体
│   │   └── 📁 settings/        # 设置实体
│   ├── 📁 features/            # 功能模块
│   │   ├── 📁 vocab/           # 词汇管理
│   │   ├── 📁 review/          # 复习系统
│   │   ├── 📁 review-session/  # 复习会话
│   │   ├── 📁 settings/        # 设置管理
│   │   └── 📁 word-management/ # 单词管理
│   ├── 📁 pages/               # 页面组件
│   │   ├── 📁 vocab/           # 词汇页面
│   │   ├── 📁 review/          # 复习页面
│   │   └── 📁 settings/        # 设置页面
│   ├── 📁 shared/              # 共享模块
│   │   ├── 📁 components/      # 通用组件
│   │   ├── 📁 ui/              # UI 组件库
│   │   ├── 📁 lib/             # 工具函数
│   │   ├── 📁 api/             # API 接口
│   │   └── 📁 config/          # 配置文件
│   ├── 📁 widgets/             # 复合组件
│   │   ├── 📁 Layout/          # 布局组件
│   │   └── 📁 Sidebar/         # 侧边栏组件
│   ├── 📁 lib/                 # 核心库
│   │   ├── 📄 database.ts      # 数据库管理
│   │   ├── 📄 ipc.ts           # IPC 通信
│   │   └── 📄 date.ts          # 日期工具
│   └── 📁 types/               # 类型定义
├── 📁 shared/                  # 跨进程共享
│   └── 📄 types.ts             # 共享类型定义
├── 📁 public/                  # 静态资源
│   └── 📄 icon.png             # 应用图标
├── 📄 package.json             # 项目配置
├── 📄 vite.config.ts           # Vite 配置
├── 📄 electron-builder.config.ts # 打包配置（或 electron-builder.json5）
├── 📄 tsconfig.json            # TypeScript 配置
└── 📄 create-release.bat       # 发布脚本
```

### 🏗️ 核心架构模式

#### 🔄 IPC 通信模式
```typescript
// 主进程 -> 渲染进程
window.api.on('event-name', handler)

// 渲染进程 -> 主进程
const result = await window.api.invoke('channel-name', ...args)
```

#### 🎣 React Hooks 模式
```typescript
// 性能优化 Hook
const { optimizedData, stats } = useOptimizedFilter(data, filters)

// 内存管理 Hook
const { memoizedComputation, clearCache } = useMemoryOptimization()

// 虚拟滚动 Hook
const { visibleItems, containerRef } = useVirtualScroll(items, itemHeight)
```

### 🧪 代码质量

#### 📏 代码规范
- **TypeScript**: 严格类型检查，确保类型安全
- **ESLint**: 代码风格统一，遵循最佳实践
- **JSDoc**: 完整的函数和组件文档
- **模块化**: 高内聚低耦合的模块设计

#### 🚀 性能优化
- **虚拟滚动**: 大数据集高效渲染
- **内存管理**: 智能缓存和垃圾回收
- **防抖节流**: 避免频繁操作影响性能
- **懒加载**: 按需加载减少初始化时间

### 🏗️ 架构设计原则

1. **模块化设计**: 功能模块独立，便于维护和扩展
2. **类型安全**: 全面的 TypeScript 类型定义
3. **性能优先**: 数据库优化和内存管理
4. **用户体验**: 响应式设计和流畅交互
5. **安全可靠**: 数据本地存储和隐私保护
6. **可扩展性**: 插件化架构和 API 设计

### 📊 性能监控

应用内置了性能监控功能：

- **内存使用**: 实时监控内存占用
- **数据库性能**: SQL 查询执行时间
- **渲染性能**: 组件渲染耗时
- **错误追踪**: 自动错误收集和报告

### 🔒 安全特性

- **本地数据存储**: 所有数据保存在本地，不上传云端
- **XSS 防护**: 使用 DOMPurify 净化用户输入
- **安全上下文**: Electron 安全最佳实践
- **API 密钥保护**: 加密存储敏感配置

---

## 📊 功能特性

### 📊 功能特性

### 🎯 智能特性
- ✅ 剪贴板智能监听和过滤
- ✅ AI 驱动的深度词汇解析（支持多种 AI 模型）
- ✅ 科学的间隔重复复习算法（FSRS）
- ✅ 个性化学习进度追踪
- ✅ 多维度数据统计分析
- ✅ 智能批量处理和去重
- ✅ 正则表达式过滤规则

### 🖥️ 用户体验
- ✅ 现代化的响应式界面
- ✅ 多语言界面支持（中文/英文）
- ✅ 深色/浅色/系统主题切换
- ✅ 全局快捷键支持
- ✅ 系统托盘集成
- ✅ TTS 语音合成（本地/火山引擎）
- ✅ 窗口关闭行为自定义

### 🔧 技术特性
- ✅ 跨平台桌面应用（Windows/macOS/Linux）
- ✅ 本地 SQLite 数据库存储
- ✅ 数据备份和恢复功能
- ✅ 隐私保护（所有数据本地存储）
- ✅ 错误边界和容错处理
- ✅ 内存优化和性能监控
- ✅ 模块化架构设计

---

## 🛣️ 发展路线图

### 🛣️ 发展路线图

### 🎯 近期目标 (v0.2.0)
- [x] 数据库迁移至 SQLite（已完成）
- [x] AI 模型配置管理（已完成）
- [x] TTS 语音合成支持（已完成）
- [ ] 自动更新机制
- [ ] 导入/导出功能增强
- [ ] 性能优化和内存管理

### 🚀 中期目标 (v0.5.0)
- [ ] 浏览器插件版本
- [ ] 移动端应用
- [ ] 云同步功能
- [ ] 社区词库分享
- [ ] 插件系统架构

### 🌟 长期愿景 (v1.0.0)
- [ ] 多语言学习支持
- [ ] AI 学习助手集成
- [ ] 学习社区平台
- [ ] 开放 API 生态
- [ ] 企业级功能支持

---

## 🚀 部署

### 📦 构建发布版本

```bash
# 1. 安装依赖
npm install

# 2. 构建应用
npm run build

# 3. 打包成安装程序
npm run electron:pack

# 生成的安装包位于 release/ 目录
# Windows: FlowLearn-Windows-0.1.0-Setup.exe
# macOS: FlowLearn-macOS-0.1.0.dmg
# Linux: FlowLearn-Linux-0.1.0.AppImage
```

### 🔧 自定义构建

可以通过修改 `electron-builder.config.ts` 来自定义构建配置：

```typescript
export default {
  appId: "com.flowlearn.app",
  productName: "FlowLearn",
  directories: {
    output: "release"
  },
  files: [
    "dist/**/*",
    "dist-electron/**/*"
  ],
  win: {
    target: "nsis",
    icon: "public/icon.png"
  },
  mac: {
    target: "dmg",
    icon: "public/icon.png"
  },
  linux: {
    target: "AppImage",
    icon: "public/icon.png"
  }
}
```

### 📋 发布流程

```bash
# 使用提供的发布脚本
./create-release.bat

# 或手动发布到 GitHub Releases
gh release create v0.1.0 release/0.1.0/FlowLearn-Windows-0.1.0-Setup.exe

# 发布到 GitHub Pages (文档)
npm run docs:build
npm run docs:deploy
```

---

## 🤝 贡献指南

我们欢迎所有形式的贡献！无论是代码、文档、设计还是反馈建议。

### 📝 提交规范

我们使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```
feat: 添加新功能
fix: 修复 bug
docs: 更新文档
style: 代码格式调整
refactor: 代码重构
test: 添加测试
chore: 构建过程或辅助工具的变动
perf: 性能优化
```

### 🔄 开发流程

1. **Fork 项目** 到你的 GitHub 账户
2. **创建功能分支** `git checkout -b feature/amazing-feature`
3. **提交更改** `git commit -m 'feat: add amazing feature'`
4. **推送分支** `git push origin feature/amazing-feature`
5. **创建 Pull Request**

### 🐛 问题报告

发现 bug？请通过 [GitHub Issues](https://github.com/XyeaOvO/FlowLearn/issues) 报告，并提供：

- 详细的问题描述和预期行为
- 完整的复现步骤
- 系统环境信息（操作系统、Node.js 版本等）
- 相关截图、错误日志或控制台输出
- 如果可能，提供最小复现示例

### 💡 功能建议

有好的想法？欢迎通过 Issues 提出功能建议：

- 清晰描述功能需求和使用场景
- 说明该功能的价值和必要性
- 如果有设计想法，可以附上草图或原型

---

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](https://github.com/XyeaOvO/FlowLearn/blob/main/LICENSE) 文件了解详情。

### 📈 项目统计

![GitHub repo size](https://img.shields.io/github/repo-size/XyeaOvO/FlowLearn)
![GitHub code size](https://img.shields.io/github/languages/code-size/XyeaOvO/FlowLearn)
![GitHub last commit](https://img.shields.io/github/last-commit/XyeaOvO/FlowLearn)
![GitHub release](https://img.shields.io/github/v/release/XyeaOvO/FlowLearn?include_prereleases)

---

## 🙏 致谢

感谢所有为 FlowLearn 项目做出贡献的开发者和用户！

### �️ 核心技术栈
- [React](https://reactjs.org/) - 用户界面库
- [Electron](https://www.electronjs.org/) - 跨平台桌面应用框架
- [Vite](https://vitejs.dev/) - 下一代前端构建工具
- [TypeScript](https://www.typescriptlang.org/) - JavaScript 的超集
- [Better-SQLite3](https://github.com/WiseLibs/better-sqlite3) - 高性能 SQLite 数据库

### 🎨 UI 和工具
- [React i18next](https://react.i18next.com/) - 国际化解决方案
- [DOMPurify](https://github.com/cure53/DOMPurify) - XSS 防护
- [Marked](https://marked.js.org/) - Markdown 解析器
- [ESLint](https://eslint.org/) - 代码质量工具

### 🤖 AI 服务支持
- OpenAI GPT 系列模型
- 火山引擎 TTS 服务
- 各类开源 AI 模型

### �👥 特别感谢
- 所有提供反馈和建议的用户
- 开源社区的无私贡献
- 语言学习领域的研究者们

### 🤝 贡献者

<a href="https://github.com/XyeaOvO/FlowLearn/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=XyeaOvO/FlowLearn" />
</a>

*感谢所有为 FlowLearn 做出贡献的开发者！*

---

<div align="center">

**🌟 如果这个项目对你有帮助，请给我们一个 Star！**

[⭐ Star on GitHub](https://github.com/XyeaOvO/FlowLearn) • [🐛 Report Bug](https://github.com/XyeaOvO/FlowLearn/issues) • [💡 Request Feature](https://github.com/XyeaOvO/FlowLearn/issues)

<br>

![Version](https://img.shields.io/github/package-json/v/XyeaOvO/FlowLearn?style=for-the-badge)
![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey?style=for-the-badge)
![Downloads](https://img.shields.io/github/downloads/XyeaOvO/FlowLearn/total?style=for-the-badge)

**Made with ❤️ by FlowLearn Team**

</div>
