import type { Word, Settings, AIModelConfig, AIProcessingStatus, BasketAddResult, AIModelTestResult, BackupListResult, ImportDBResult, BackupNowResult, BackupRestoreResult, ResetAllResult, DeleteWordResult } from '../../shared/types'
import { IPC } from '@shared/ipcChannels'

// 在开发环境中存储设置的临时变量
let mockSettings: any = {
  aiEnabled: false,
  triggerThreshold: 5,
  promptTemplate: '',
  filterMinWords: 1,
  filterMaxWords: 10,
  filterIgnoreNewlines: false,
  filterRegex: '',
  globalShortcut: '',
  ttsEnabled: false,
  ttsProvider: 'system',
  ttsVolcAppId: '',
  ttsVolcAccessKey: '',
  ttsVolcSecretKey: '',
  aiModels: [],
  dailyGoal: 20,
  theme: 'system',
  locale: 'zh',
  closeAction: 'ask'
}

export async function ipcInvoke<T = unknown>(channel: string, ...args: unknown[]): Promise<T> {
  // 检查是否在Electron环境中
  if (typeof window !== 'undefined' && window.api && window.api.invoke) {
    return window.api.invoke(channel, ...args) as Promise<T>
  }
  
  // 在开发环境中返回模拟数据
  
  // 为不同的channel返回适当的模拟数据
  if (channel === IPC.DbList || channel === IPC.DbDeletedList) {
    return Promise.resolve([] as T) // 返回空数组而不是空对象
  }
  if (channel === IPC.BasketList) {
    return Promise.resolve([] as T) // 篮子也返回空数组
  }
  if (channel === IPC.SettingsGet) {
    // 返回模拟设置
    return Promise.resolve(mockSettings as T)
  }
  if (channel === IPC.SettingsSet) {
    // 在开发环境中更新模拟设置
    const newSettings = args[0] as Partial<typeof mockSettings>
    mockSettings = { ...mockSettings, ...newSettings }
    console.log('Mock settings updated:', mockSettings)
    return Promise.resolve({ success: true } as T)
  }
  
  return Promise.resolve({} as T)
}

// Settings
export const getSettings = () => ipcInvoke<Settings>(IPC.SettingsGet)
export const setSettings = (s: Partial<Settings>) => ipcInvoke(IPC.SettingsSet, s)

// Basket
export const getBasket = () => ipcInvoke(IPC.BasketList)
export const triggerBasket = () => ipcInvoke(IPC.BasketTrigger)
export const addToBasket = (term: string) => ipcInvoke<BasketAddResult>(IPC.BasketAdd, term)

// DB
export const dbList = () => ipcInvoke(IPC.DbList)
export const dbDelete = (id: string) => ipcInvoke<DeleteWordResult>(IPC.DbDelete, id)
export const dbUpdate = (w: Word) => ipcInvoke(IPC.DbUpdate, w)
export const dbDeletedList = () => ipcInvoke(IPC.DbDeletedList)
export const dbRestore = (id: string) => ipcInvoke(IPC.DbRestore, id)
export const dbBulkUpdate = (ids: string[], changes: Partial<Word>) => ipcInvoke(IPC.DbBulkUpdate, ids, changes)
export const dbBulkDelete = (ids: string[]) => ipcInvoke(IPC.DbBulkDelete, ids)
export const dbBulkRestore = (ids: string[]) => ipcInvoke(IPC.DbBulkRestore, ids)
export const dbRebuild = () => ipcInvoke<{ ok: boolean; message?: string; error?: string }>(IPC.DbRebuild)
export const dbClearAll = () => ipcInvoke<{ ok: boolean; error?: string }>(IPC.DbClearAll)

// Review (FSRS)
export type ReviewGrade = 'again' | 'hard' | 'good' | 'easy'
export const reviewDue = () => ipcInvoke(IPC.ReviewDue)
export const reviewApply = (id: string, grade: ReviewGrade) => ipcInvoke(IPC.ReviewApply, id, grade)

// Import/Export/Backup
export const importFromClipboard = () => ipcInvoke<number>(IPC.ImportFromClipboard)
export const importFromText = (text: string) => ipcInvoke<number>(IPC.ImportFromText, text)
export const exportDB = (format: 'json' | 'csv') => ipcInvoke(IPC.DbExport, format)
export const importDB = () => ipcInvoke<ImportDBResult>(IPC.DbImport)
export const backupNow = () => ipcInvoke<BackupNowResult>(IPC.DbBackupNow)
export const backupList = () => ipcInvoke<BackupListResult>(IPC.DbBackupList)
export const backupRestore = (backupPath?: string) => ipcInvoke<BackupRestoreResult>(IPC.DbBackupRestore, backupPath)
export const backupOpenDir = () => ipcInvoke(IPC.DbBackupOpenDir)
export const resetAll = () => ipcInvoke<ResetAllResult>(IPC.DbResetAll)

// TTS
export const ttsVolcQuery = (text: string) => ipcInvoke(IPC.TtsVolcQuery, text)

// AI Model Management
export const testAIModel = (modelConfig: AIModelConfig) => ipcInvoke<AIModelTestResult>(IPC.TestAIModel, modelConfig)
export const processWordsWithAI = (words: string[], modelId: string) => ipcInvoke(IPC.ProcessWordsWithAI, words, modelId)
export const getAIProcessingStatus = () => ipcInvoke<AIProcessingStatus>(IPC.GetAIProcessingStatus)
export const cancelAIProcessing = () => ipcInvoke(IPC.CancelAIProcessing)

// AI Processing Windows
export const createAIProcessingWindow = () => ipcInvoke(IPC.CreateAIProcessingWindow)
export const showWordConfirmation = (words: string[]) => ipcInvoke(IPC.ShowWordConfirmation, words)
export const startAIProcessing = (confirmedWords: string[]) => ipcInvoke(IPC.StartAIProcessing, confirmedWords)

