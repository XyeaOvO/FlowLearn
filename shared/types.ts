export type Word = {
  id: string
  term: string
  definition: string
  phonetic: string
  example: string
  domain?: string
  addedAt: number
  reviewStatus: 'new' | 'learning' | 'mastered'
  reviewDueDate: number | null
  analysis?: string
  // FSRS fields (optional for backward compatibility)
  fsrsDifficulty?: number // 1 (easy) ~ 10 (hard), default 5
  fsrsStability?: number // in days, > 0, default 0.5
  fsrsLastReviewedAt?: number // timestamp ms
  fsrsReps?: number
  fsrsLapses?: number
  // Soft delete (Recycle Bin)
  deletedAt?: number
}

export type AIModelConfig = {
  id: string
  name: string
  type: 'openai' | 'anthropic' | 'deepseek' | 'google' | 'custom'
  apiUrl: string
  apiKey: string
  modelName: string
  enabled: boolean
  isDefault: boolean
  createdAt: number
  lastTested?: number
  testResult?: boolean
}

export type Settings = {
  triggerThreshold: number
  promptTemplate: string
  minWords: number
  maxWords: number
  ignoreMultiline: boolean
  regexExcludes: string[]
  hotkey: string
  responseMode: 'rich-summary' | 'json-only'
  richHeader: string
  ttsEnabled?: boolean
  ttsAutoOnSelect?: boolean
  ttsVoice?: string
  ttsLang?: string
  ttsRate?: number
  ttsPitch?: number
  ttsProvider?: 'local' | 'volcengine'
  volcAppid?: string
  volcToken?: string
  volcCluster?: string
  volcVoiceType?: string
  volcEncoding?: 'wav' | 'pcm' | 'ogg_opus' | 'mp3'
  volcSpeedRatio?: number
  volcRate?: number
  theme?: 'system' | 'light' | 'dark'
  locale?: 'zh' | 'en'
  // Close behavior
  closeAction?: 'ask' | 'minimize' | 'exit'
  // Daily goal & reminders
  dailyGoal?: number
  reviewReminderTimes?: string[] // e.g. ["09:00","21:30"]
  // AI Integration
  aiEnabled?: boolean
  aiModels?: AIModelConfig[]
  defaultModelId?: string
}


