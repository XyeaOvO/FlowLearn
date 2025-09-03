# 🚀 FlowLearn - AI驱动的沉浸式语言学习引擎

<div align="center">

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Electron](https://img.shields.io/badge/Electron-191970?style=for-the-badge&logo=Electron&logoColor=white)](https://www.electronjs.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)

*让技术退居幕后，让学习回归心流*

[🎯 核心特性](#-核心特性) • [🛠️ 技术架构](#️-技术架构) • [🚀 快速开始](#-快速开始) • [📖 使用指南](#-使用指南) • [🔧 开发指南](#-开发指南)

</div>

---

## 📋 项目概述

FlowLearn 是一款革命性的桌面应用，专为高效的跨语言学习而设计。通过创新的**"无感知（Zero-Awareness）"**理念，它将传统的"阅读-中断-查询-记录"学习模式转变为流畅的沉浸式体验。

### 🎯 解决的核心问题

- **🔄 学习流中断**：传统查词方式严重打断阅读心流
- **📚 知识碎片化**：生词记录缺乏系统性管理和科学复习
- **🤖 AI使用门槛**：普通用户难以有效利用大语言模型的强大能力
- **⏰ 效率低下**：重复性的查词、记录、整理工作消耗大量时间

### 💡 创新解决方案

**FlowLearn = 智能捕获 + AI深度解析 + 科学复习**

通过后台静默监听、批量AI处理和间隔重复算法，实现从生词收集到知识内化的全流程自动化。

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
| **状态管理** | React Hooks + Context | 轻量级状态管理方案 |
| **国际化** | react-i18next | 多语言支持 |
| **样式方案** | CSS Modules + 原生CSS | 模块化样式管理 |
| **代码质量** | ESLint + TypeScript | 代码规范和类型安全 |

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
git clone https://github.com/your-username/flowlearn.git
cd flowlearn

# 2. 安装依赖
npm install

# 3. 启动开发环境
npm run dev

# 4. 构建生产版本
npm run build
```

### 📦 可用脚本

| 命令 | 功能 | 说明 |
|------|------|------|
| `npm run dev` | 开发模式 | 启动 Vite 开发服务器 + Electron |
| `npm run build` | 构建应用 | TypeScript 编译 + Vite 构建 + Electron 打包 |
| `npm run lint` | 代码检查 | ESLint 代码质量检查 |
| `npm run lint:fix` | 修复代码 | 自动修复 ESLint 问题 |
| `npm run preview` | 预览构建 | 本地预览构建结果 |
| `npm run electron:pack` | 打包应用 | 生成安装包 |

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

## 🔧 开发指南

### 📁 项目结构

```
flowlearn/
├── 📁 electron/                 # Electron 主进程
│   ├── 📄 main.ts              # 主进程入口
│   └── 📄 preload.ts           # 预加载脚本
├── 📁 src/                     # React 渲染进程
│   ├── 📄 App.tsx              # 主应用组件
│   ├── 📄 main.tsx             # 渲染进程入口
│   ├── 📁 features/            # 功能模块
│   │   ├── 📁 vocab/           # 词汇管理
│   │   ├── 📁 review/          # 复习系统
│   │   └── 📁 settings/        # 设置管理
│   ├── 📁 shared/              # 共享组件和工具
│   │   ├── 📁 components/      # 通用组件
│   │   ├── 📁 lib/             # 工具函数
│   │   └── 📁 types/           # 类型定义
│   └── 📁 widgets/             # 复合组件
├── 📁 shared/                  # 跨进程共享
│   └── 📄 types.ts             # 共享类型定义
├── 📁 public/                  # 静态资源
├── 📄 package.json             # 项目配置
├── 📄 vite.config.ts           # Vite 配置
├── 📄 electron-builder.json5   # 打包配置
└── 📄 tsconfig.json            # TypeScript 配置
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

---

## 📊 功能特性

### 🎯 智能特性
- ✅ 剪贴板智能监听和过滤
- ✅ AI 驱动的深度词汇解析
- ✅ 科学的间隔重复复习算法
- ✅ 个性化学习进度追踪
- ✅ 多维度数据统计分析

### 🖥️ 用户体验
- ✅ 现代化的响应式界面
- ✅ 流畅的动画和交互效果
- ✅ 多语言界面支持
- ✅ 深色/浅色主题切换
- ✅ 键盘快捷键支持

### 🔧 技术特性
- ✅ 跨平台桌面应用
- ✅ 本地数据存储和隐私保护
- ✅ 高性能虚拟化渲染
- ✅ 内存优化和缓存管理
- ✅ 错误边界和容错处理

---

## 🛣️ 发展路线图

### 🎯 近期目标 (v0.2.0)
- [ ] 数据库迁移至 SQLite
- [ ] 自动更新机制
- [ ] 更多 AI 模型支持
- [ ] 导入/导出功能增强

### 🚀 中期目标 (v0.5.0)
- [ ] 浏览器插件版本
- [ ] 移动端应用
- [ ] 云同步功能
- [ ] 社区词库分享

### 🌟 长期愿景 (v1.0.0)
- [ ] 多语言学习支持
- [ ] AI 学习助手集成
- [ ] 学习社区平台
- [ ] 开放 API 生态

---

## 🤝 贡献指南

我们欢迎所有形式的贡献！无论是 bug 报告、功能建议还是代码贡献。

### 🐛 报告问题
- 使用 [GitHub Issues](https://github.com/your-username/flowlearn/issues) 报告 bug
- 提供详细的复现步骤和环境信息
- 包含相关的日志和截图

### 💡 功能建议
- 在 Issues 中标记为 `enhancement`
- 详细描述功能需求和使用场景
- 讨论实现方案和技术细节

### 🔧 代码贡献
1. Fork 项目到你的 GitHub
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

---

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

---

## 🙏 致谢

感谢所有为 FlowLearn 项目做出贡献的开发者和用户！

特别感谢以下开源项目：
- [Electron](https://www.electronjs.org/) - 跨平台桌面应用框架
- [React](https://reactjs.org/) - 用户界面库
- [Vite](https://vitejs.dev/) - 下一代前端构建工具
- [TypeScript](https://www.typescriptlang.org/) - JavaScript 的超集

---

<div align="center">

**🌟 如果这个项目对你有帮助，请给我们一个 Star！**

[⭐ Star on GitHub](https://github.com/your-username/flowlearn) • [🐛 Report Bug](https://github.com/your-username/flowlearn/issues) • [💡 Request Feature](https://github.com/your-username/flowlearn/issues)

</div>
