export async function ipcInvoke<T = any>(channel: string, ...args: any[]): Promise<T> {
  return window.api.invoke(channel, ...args) as Promise<T>
}

// Settings
export const getSettings = () => ipcInvoke('settings:get')
export const setSettings = (s: any) => ipcInvoke('settings:set', s)

// Basket
export const getBasket = () => ipcInvoke('basket:list')
export const triggerBasket = () => ipcInvoke('basket:trigger')
export const addToBasket = (term: string) => ipcInvoke('basket:add', term)

// DB
export const dbList = () => ipcInvoke('db:list')
export const dbDelete = (id: string) => ipcInvoke('db:delete', id)
export const dbUpdate = (w: any) => ipcInvoke('db:update', w)
export const dbDeletedList = () => ipcInvoke('db:deleted:list')
export const dbRestore = (id: string) => ipcInvoke('db:restore', id)
export const dbBulkUpdate = (ids: string[], changes: any) => ipcInvoke('db:bulkUpdate', ids, changes)
export const dbBulkDelete = (ids: string[]) => ipcInvoke('db:bulkDelete', ids)
export const dbBulkRestore = (ids: string[]) => ipcInvoke('db:bulkRestore', ids)

// Review (FSRS)
export type ReviewGrade = 'again' | 'hard' | 'good' | 'easy'
export const reviewDue = () => ipcInvoke('review:due')
export const reviewApply = (id: string, grade: ReviewGrade) => ipcInvoke('review:apply', id, grade)

// Import/Export/Backup
export const importFromClipboard = () => ipcInvoke('import:fromClipboard')
export const importFromText = (text: string) => ipcInvoke('import:fromText', text)
export const exportDB = (format: 'json' | 'csv') => ipcInvoke('db:export', format)
export const importDB = () => ipcInvoke('db:import')
export const backupNow = () => ipcInvoke('db:backup:now')
export const backupList = () => ipcInvoke('db:backup:list')
export const backupRestore = (p?: string) => ipcInvoke('db:backup:restore', p)
export const backupOpenDir = () => ipcInvoke('db:backup:openDir')
export const resetAll = () => ipcInvoke('db:resetAll')

// TTS
export const ttsVolcQuery = (text: string) => ipcInvoke('tts:volc:query', text)


