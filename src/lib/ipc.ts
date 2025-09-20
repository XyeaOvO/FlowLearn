import type { Word, Settings, AIModelConfig, AIProcessingStatus, BasketAddResult, AIModelTestResult, BackupListResult, ImportDBResult, BackupNowResult, BackupRestoreResult, ResetAllResult, DeleteWordResult } from '@common/types'
import { IPC } from '@common/ipcChannels'

type MutableWord = Word & { deletedAt?: number }

const isMacPlatform = (() => {
  if (typeof navigator !== 'undefined') {
    const nav = navigator as Navigator & { userAgentData?: { platform?: string } }
    const platform = nav.userAgentData?.platform ?? nav.platform ?? nav.userAgent
    return /mac|iphone|ipad|ipod/i.test(platform)
  }
  return false
})()

const modifierKey = isMacPlatform ? 'CommandOrControl' : 'Control'

const defaultHotkeys = {
  addFromClipboard: `${modifierKey}+Shift+Y`,
  showHideWindow: `${modifierKey}+Shift+H`,
  processBasket: `${modifierKey}+Shift+P`,
  clearBasket: `${modifierKey}+Shift+C`,
  togglePause: `${modifierKey}+Shift+S`,
  openSettings: `${modifierKey}+Shift+O`,
  startReview: `${modifierKey}+Shift+R`,
  quickAdd: `${modifierKey}+Shift+A`
}

const defaultSettings: Settings = {
  triggerThreshold: 5,
  promptTemplate: '',
  minWords: 1,
  maxWords: 10,
  ignoreMultiline: false,
  regexExcludes: [],
  hotkey: defaultHotkeys.addFromClipboard,
  hotkeys: defaultHotkeys,
  responseMode: 'rich-summary',
  richHeader: '',
  ttsEnabled: false,
  ttsProvider: 'local',
  theme: 'system',
  locale: 'zh',
  closeAction: 'ask',
  dailyGoal: 20,
  reviewReminderTimes: [],
  aiEnabled: false,
  aiModels: [],
  defaultModelId: undefined,
}

let mockSettings: Settings = { ...defaultSettings }
const mockWords: MutableWord[] = []
let mockBasket: Array<{ term: string }> = []

const cloneWord = (word: MutableWord): Word => ({ ...word })

const getActiveWords = () => mockWords.filter(word => !(word as MutableWord & { deletedAt?: number }).deletedAt)
const getDeletedWords = () => mockWords.filter(word => !!(word as MutableWord & { deletedAt?: number }).deletedAt)

const markWordsAsDeleted = (ids: string[]) => {
  const timestamp = Date.now()
  ids.forEach(id => {
    const target = mockWords.find(word => word.id === id)
    if (target) target.deletedAt = timestamp
  })
}

export async function ipcInvoke<T = unknown>(channel: string, ...args: unknown[]): Promise<T> {
  // 检查是否在Electron环境中
  if (typeof window !== 'undefined' && window.api && window.api.invoke) {
    return window.api.invoke(channel, ...args) as Promise<T>
  }
  
  switch (channel) {
    case IPC.DbList:
      return getActiveWords().map(cloneWord) as T
    case IPC.DbDeletedList:
      return getDeletedWords().map(cloneWord) as T
    case IPC.DbDelete: {
      const [id] = args as [string]
      const target = mockWords.find(word => word.id === id)
      if (!target) {
        return { ok: false, error: 'Word not found' } as T
      }
      target.deletedAt = Date.now()
      return { ok: true } as T
    }
    case IPC.DbRestore: {
      const [id] = args as [string]
      const target = mockWords.find(word => word.id === id)
      if (!target) {
        return { ok: false, error: 'Word not found' } as T
      }
      delete target.deletedAt
      return { ok: true } as T
    }
    case IPC.DbUpdate: {
      const [word] = args as [Word]
      const index = mockWords.findIndex(item => item.id === word.id)
      if (index >= 0) {
        mockWords[index] = { ...mockWords[index], ...word }
      } else {
        mockWords.push({ ...word })
      }
      return { ok: true } as T
    }
    case IPC.DbBulkUpdate: {
      const [ids, changes] = args as [string[], Partial<Word>]
      ids.forEach(id => {
        const target = mockWords.find(word => word.id === id)
        if (target) {
          Object.assign(target, changes)
        }
      })
      return undefined as T
    }
    case IPC.DbBulkDelete: {
      const [ids] = args as [string[]]
      markWordsAsDeleted(ids)
      return undefined as T
    }
    case IPC.DbBulkRestore: {
      const [ids] = args as [string[]]
      ids.forEach(id => {
        const target = mockWords.find(word => word.id === id)
        if (target) delete target.deletedAt
      })
      return undefined as T
    }
    case IPC.BasketList:
      return mockBasket.slice() as T
    case IPC.BasketAdd: {
      const [term] = args as [string]
      mockBasket.push({ term })
      return { ok: true, count: mockBasket.length } as T
    }
    case IPC.BasketTrigger:
      mockBasket = []
      return { ok: true } as T
    case IPC.SettingsGet:
      return { ...mockSettings } as T
    case IPC.SettingsSet: {
      const [newSettings] = args as [Partial<Settings>]
      mockSettings = {
        ...mockSettings,
        ...newSettings,
        hotkeys: newSettings?.hotkeys ? { ...mockSettings.hotkeys, ...newSettings.hotkeys } : mockSettings.hotkeys,
      }
      return { success: true } as T
    }
    case IPC.ImportFromClipboard:
      return 0 as T
    case IPC.ImportFromText:
      return 0 as T
    case IPC.TestAIModel:
      return { success: true, message: 'Mock connection successful' } as T
    case IPC.ProcessWordsWithAI:
    case IPC.StartAIProcessing:
    case IPC.CancelAIProcessing:
    case IPC.CreateAIProcessingWindow:
    case IPC.ShowWordConfirmation:
      return { ok: true } as T
    case IPC.GetAIProcessingStatus:
      return {
        isProcessing: false,
        currentWords: [],
        currentModelId: '',
        startTime: 0,
        streamOutput: [],
        currentStep: '',
        streamContent: '',
      } as T
    case IPC.TtsVolcQuery:
      return null as T
    case IPC.DbExport:
    case IPC.DbImport:
    case IPC.DbBackupNow:
    case IPC.DbBackupList:
    case IPC.DbBackupRestore:
    case IPC.DbBackupOpenDir:
    case IPC.DbResetAll:
    case IPC.DbRebuild:
      return { ok: true } as T
    default:
      return {} as T
  }
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

