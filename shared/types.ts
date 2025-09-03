/**
 * 单词数据类型定义
 * 包含单词的基本信息、复习状态和FSRS算法相关字段
 */
export type Word = {
  /** 唯一标识符 */
  id: string
  /** 单词或短语 */
  term: string
  /** 释义/定义 */
  definition: string
  /** 音标 */
  phonetic: string
  /** 例句 */
  example: string
  /** 领域/分类（可选） */
  domain?: string
  /** 添加时间戳（毫秒） */
  addedAt: number
  /** 复习状态：新词、学习中、已掌握 */
  reviewStatus: 'new' | 'learning' | 'mastered'
  /** 下次复习时间戳（毫秒），null表示未安排 */
  reviewDueDate: number | null
  /** AI生成的详细分析（可选） */
  analysis?: string
  
  // FSRS算法相关字段（为向后兼容性设为可选）
  /** FSRS难度系数：1（简单）~ 10（困难），默认5 */
  fsrsDifficulty?: number
  /** FSRS稳定度：天数，> 0，默认0.5 */
  fsrsStability?: number
  /** FSRS上次复习时间戳（毫秒） */
  fsrsLastReviewedAt?: number
  /** FSRS复习次数 */
  fsrsReps?: number
  /** FSRS遗忘次数 */
  fsrsLapses?: number
  
  // 软删除（回收站功能）
  /** 删除时间戳（毫秒），undefined表示未删除 */
  deletedAt?: number
}

/**
 * AI模型配置类型定义
 * 用于配置和管理不同的AI服务提供商
 */
export type AIModelConfig = {
  /** 模型配置唯一标识符 */
  id: string
  /** 模型显示名称 */
  name: string
  /** AI服务提供商类型 */
  type: 'openai' | 'anthropic' | 'deepseek' | 'google' | 'custom'
  /** API接口地址 */
  apiUrl: string
  /** API密钥 */
  apiKey: string
  /** 具体模型名称 */
  modelName: string
  /** 是否启用该模型 */
  enabled: boolean
  /** 是否为默认模型 */
  isDefault: boolean
  /** 创建时间戳（毫秒） */
  createdAt: number
  /** 上次测试时间戳（毫秒） */
  lastTested?: number
  /** 测试结果：true表示连接成功 */
  testResult?: boolean
}

/**
 * AI处理状态类型定义
 * 用于跟踪AI处理单词的实时状态
 */
export type AIProcessingStatus = {
  /** 是否正在处理中 */
  isProcessing: boolean
  /** 当前正在处理的单词列表 */
  currentWords: string[]
  /** 当前使用的AI模型ID */
  currentModelId: string
  /** 处理开始时间戳（毫秒） */
  startTime: number
  /** 流式输出内容数组 */
  streamOutput: string[]
  /** 当前处理步骤描述 */
  currentStep: string
  /** 流式内容字符串 */
  streamContent: string
}

/**
 * 生词篮添加操作结果接口
 */
export interface BasketAddResult {
  /** 操作是否成功 */
  ok: boolean
  /** 错误信息（操作失败时） */
  error?: string
  /** 添加的单词数量 */
  count?: number
}

/**
 * AI模型测试结果接口
 */
export interface AIModelTestResult {
  /** 测试是否成功 */
  success: boolean
  /** 测试结果消息 */
  message: string
}

/**
 * 备份列表查询结果接口
 */
export interface BackupListResult {
  /** 操作是否成功 */
  ok: boolean
  /** 备份文件列表 */
  list?: Array<{
    /** 文件名 */
    fileName: string
    /** 完整路径 */
    fullPath: string
    /** 文件大小（字节） */
    size: number
    /** 修改时间戳（毫秒） */
    mtime: number
  }>
  /** 错误信息（操作失败时） */
  error?: string
}

/**
 * 数据库导入操作结果接口
 */
export interface ImportDBResult {
  /** 操作是否成功 */
  ok: boolean
  /** 新增的记录数 */
  added?: number
  /** 总记录数 */
  total?: number
  /** 错误信息（操作失败时） */
  error?: string
}

/**
 * 立即备份操作结果接口
 */
export interface BackupNowResult {
  /** 操作是否成功 */
  ok: boolean
  /** 备份文件路径 */
  path?: string
  /** 错误信息（操作失败时） */
  error?: string
}

/**
 * 备份恢复操作结果接口
 */
export interface BackupRestoreResult {
  /** 操作是否成功 */
  ok: boolean
  /** 错误信息（操作失败时） */
  error?: string
}

/**
 * 重置所有数据操作结果接口
 */
export interface ResetAllResult {
  /** 操作是否成功 */
  ok: boolean
  /** 重置的记录数量 */
  count?: number
  /** 错误信息 */
  error?: string
}

/**
 * 导出数据库结果类型定义
 */
export interface ExportDBResult {
  /** 操作是否成功 */
  ok: boolean
  /** 导出的记录数量 */
  count?: number
  /** 错误信息 */
  error?: string
}

/**
 * AI处理结果接口
 */
export interface AIProcessingResult {
  /** 处理是否成功 */
  success: boolean
  /** 处理结果：解析后的单词数据数组 */
  result?: Array<{
    /** 单词或短语 */
    term: string
    /** 释义 */
    definition: string
    /** 音标 */
    phonetic: string
    /** 例句 */
    example: string
    /** 领域分类（可选） */
    domain?: string
  }>
  /** 错误信息（处理失败时） */
  error?: string
  /** AI的完整响应内容 */
  fullResponse?: string
}

/**
 * 应用设置类型定义
 * 包含所有用户可配置的选项
 */
export type Settings = {
  // 基础设置
  /** 触发处理的单词数量阈值 */
  triggerThreshold: number
  /** AI提示词模板 */
  promptTemplate: string
  /** 最小单词数限制 */
  minWords: number
  /** 最大单词数限制 */
  maxWords: number
  /** 是否忽略多行文本 */
  ignoreMultiline: boolean
  /** 正则表达式排除规则数组 */
  regexExcludes: string[]
  /** 全局快捷键（兼容性保留） */
  hotkey: string
  
  // 多种快捷键配置
  hotkeys: {
    /** 强制添加剪贴板内容 */
    addFromClipboard: string
    /** 显示/隐藏窗口 */
    showHideWindow: string
    /** 处理生词篮 */
    processBasket: string
    /** 清空生词篮 */
    clearBasket: string
    /** 暂停/恢复监听 */
    togglePause: string
    /** 打开设置 */
    openSettings: string
    /** 开始复习 */
    startReview: string
    /** 快速添加 */
    quickAdd: string
  }
  
  // AI响应模式
  /** AI响应模式：富文本摘要或纯JSON */
  responseMode: 'rich-summary' | 'json-only'
  /** 富文本摘要提示词 */
  richHeader: string
  
  // TTS语音设置
  /** 是否启用TTS */
  ttsEnabled?: boolean
  /** 选中时自动播放 */
  ttsAutoOnSelect?: boolean
  /** TTS语音 */
  ttsVoice?: string
  /** TTS语言 */
  ttsLang?: string
  /** TTS语速 */
  ttsRate?: number
  /** TTS音调 */
  ttsPitch?: number
  /** TTS提供商：本地或火山引擎 */
  ttsProvider?: 'local' | 'volcengine'
  
  // 火山引擎TTS配置
  /** 火山引擎AppID */
  volcAppid?: string
  /** 火山引擎访问令牌 */
  volcToken?: string
  /** 火山引擎集群 */
  volcCluster?: string
  /** 火山引擎音色类型 */
  volcVoiceType?: string
  /** 火山引擎音频编码格式 */
  volcEncoding?: 'wav' | 'pcm' | 'ogg_opus' | 'mp3'
  /** 火山引擎语速比例 */
  volcSpeedRatio?: number
  /** 火山引擎采样率 */
  volcRate?: number
  
  // UI设置
  /** 主题：系统、浅色、深色 */
  theme?: 'system' | 'light' | 'dark'
  /** 界面语言：中文或英文 */
  locale?: 'zh' | 'en'
  
  // 窗口行为
  /** 关闭按钮行为：询问、最小化、退出 */
  closeAction?: 'ask' | 'minimize' | 'exit'
  
  // 学习目标和提醒
  /** 每日学习目标 */
  dailyGoal?: number
  /** 复习提醒时间数组，如["09:00","21:30"] */
  reviewReminderTimes?: string[]
  
  // AI集成设置
  /** 是否启用AI功能 */
  aiEnabled?: boolean
  /** AI模型配置数组 */
  aiModels?: AIModelConfig[]
  /** 默认AI模型ID */
  defaultModelId?: string
}


