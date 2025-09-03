import type { Word, Settings, AIModelConfig, AIProcessingStatus, BasketAddResult, AIModelTestResult, BackupListResult, ImportDBResult, BackupNowResult, BackupRestoreResult, ResetAllResult } from '../../shared/types'

export async function ipcInvoke<T = unknown>(channel: string, ...args: unknown[]): Promise<T> {
  // 检查是否在Electron环境中
  if (typeof window !== 'undefined' && window.api && window.api.invoke) {
    return window.api.invoke(channel, ...args) as Promise<T>
  }
  
  // 在开发环境中返回模拟数据
  
  // 为不同的channel返回适当的模拟数据
  if (channel === 'db:list' || channel === 'db:deleted:list') {
    return Promise.resolve([] as T) // 返回空数组而不是空对象
  }
  if (channel === 'basket:list') {
    return Promise.resolve([] as T) // 篮子也返回空数组
  }
  if (channel === 'settings:get') {
    // 返回默认设置
    return Promise.resolve({
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
      aiModels: []
    } as T)
  }
  
  return Promise.resolve({} as T)
}

// Settings
export const getSettings = () => ipcInvoke<Settings>('settings:get')
export const setSettings = (s: Partial<Settings>) => ipcInvoke('settings:set', s)

// Basket
export const getBasket = () => ipcInvoke('basket:list')
export const triggerBasket = () => ipcInvoke('basket:trigger')
export const addToBasket = (term: string) => ipcInvoke<BasketAddResult>('basket:add', term)

// DB
export const dbList = () => ipcInvoke('db:list')
export const dbDelete = (id: string) => ipcInvoke('db:delete', id)
export const dbUpdate = (w: Word) => ipcInvoke('db:update', w)
export const dbDeletedList = () => ipcInvoke('db:deleted:list')
export const dbRestore = (id: string) => ipcInvoke('db:restore', id)
export const dbBulkUpdate = (ids: string[], changes: Partial<Word>) => ipcInvoke('db:bulkUpdate', ids, changes)
export const dbBulkDelete = (ids: string[]) => ipcInvoke('db:bulkDelete', ids)
export const dbBulkRestore = (ids: string[]) => ipcInvoke('db:bulkRestore', ids)

// Review (FSRS)
export type ReviewGrade = 'again' | 'hard' | 'good' | 'easy'
export const reviewDue = () => ipcInvoke('review:due')
export const reviewApply = (id: string, grade: ReviewGrade) => ipcInvoke('review:apply', id, grade)

// Import/Export/Backup
export const importFromClipboard = () => ipcInvoke<number>('import:fromClipboard')
export const importFromText = (text: string) => ipcInvoke<number>('import:fromText', text)
export const exportDB = (format: 'json' | 'csv') => ipcInvoke('db:export', format)
export const importDB = () => ipcInvoke<ImportDBResult>('db:import')
export const backupNow = () => ipcInvoke<BackupNowResult>('db:backup:now')
export const backupList = () => ipcInvoke<BackupListResult>('db:backup:list')
export const backupRestore = (backupPath?: string) => ipcInvoke<BackupRestoreResult>('db:backup:restore', backupPath)
export const backupOpenDir = () => ipcInvoke('db:backup:openDir')
export const resetAll = () => ipcInvoke<ResetAllResult>('db:resetAll')

// TTS
export const ttsVolcQuery = (text: string) => ipcInvoke('tts:volc:query', text)

// AI Model Management
export const testAIModel = (modelConfig: AIModelConfig) => ipcInvoke<AIModelTestResult>('test-ai-model', modelConfig)
export const processWordsWithAI = (words: string[], modelId: string) => ipcInvoke('process-words-with-ai', words, modelId)
export const getAIProcessingStatus = () => ipcInvoke<AIProcessingStatus>('get-ai-processing-status')
export const cancelAIProcessing = () => ipcInvoke('cancel-ai-processing')

// AI Processing Windows
export const createAIProcessingWindow = () => ipcInvoke('create-ai-processing-window')
export const showWordConfirmation = (words: string[]) => ipcInvoke('show-word-confirmation', words)
export const startAIProcessing = (confirmedWords: string[]) => ipcInvoke('start-ai-processing', confirmedWords)


