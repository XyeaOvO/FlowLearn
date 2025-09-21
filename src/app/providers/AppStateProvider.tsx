import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Word, Settings, DeleteWordResult } from '@common/types'
import {
  dbBulkDelete,
  dbBulkRestore,
  dbBulkUpdate,
  dbDelete,
  dbDeletedList,
  dbList,
  dbUpdate,
  getBasket,
  getSettings as ipcGetSettings,
  importFromClipboard as ipcImportFromClipboard,
  setSettings as ipcSetSettings,
  startAIProcessing as ipcStartAIProcessing,
  triggerBasket as ipcTriggerBasket,
} from '@lib/ipc'
import { useMemoryOptimization } from '@shared/lib/useMemoryOptimization'

type TabKey = 'list' | 'review' | 'settings'

type StatusCounts = {
  active: number
  deleted: number
  new: number
  learning: number
  mastered: number
}

type AppStateValue = {
  activeWords: Word[]
  deletedWords: Word[]
  selectedId: string | null
  selectedWord: Word | null
  settings: Settings | null
  basketCount: number
  tab: TabKey
  showAddWordModal: boolean
  showWordConfirmationModal: boolean
  showAIProcessingWindow: boolean
  pendingWords: string[]
  domainOptions: string[]
  dueCount: number
  reviewedToday: number
  statusCounts: StatusCounts
}

type AppActionsValue = {
  setTab: (tab: TabKey) => void
  selectWord: (id: string | null) => void
  openAddWordModal: () => void
  closeAddWordModal: () => void
  showWordConfirmation: (words: string[]) => void
  hideWordConfirmation: () => void
  confirmWordProcessing: (words: string[]) => Promise<void>
  openAIProcessingWindow: () => void
  closeAIProcessingWindow: () => void
  refreshWords: () => Promise<void>
  refreshSettings: () => Promise<void>
  refreshBasket: () => Promise<void>
  triggerBasket: () => Promise<void>
  importFromClipboard: () => Promise<number>
  bulkDelete: (ids: string[]) => Promise<void>
  bulkRestore: (ids: string[]) => Promise<void>
  bulkUpdateDomain: (ids: string[], domain: string) => Promise<void>
  bulkUpdateStatus: (ids: string[], status: Word['reviewStatus']) => Promise<void>
  deleteWord: (id: string) => Promise<void>
  updateWord: (word: Word) => Promise<void>
  saveSettings: (settings: Partial<Settings>) => Promise<void>
}

const AppStateContext = createContext<AppStateValue | undefined>(undefined)
const AppActionsContext = createContext<AppActionsValue | undefined>(undefined)

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [activeWords, setActiveWords] = useState<Word[]>([])
  const [deletedWords, setDeletedWords] = useState<Word[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [settings, setSettingsState] = useState<Settings | null>(null)
  const [basketCount, setBasketCount] = useState(0)
  const [tab, setTab] = useState<TabKey>('list')
  const [showAddWordModal, setShowAddWordModal] = useState(false)
  const [showWordConfirmationModal, setShowWordConfirmationModal] = useState(false)
  const [showAIProcessingWindow, setShowAIProcessingWindow] = useState(false)
  const [pendingWords, setPendingWords] = useState<string[]>([])

  const { getMemoryUsage, clearCache } = useMemoryOptimization()

  const refreshWords = useCallback(async () => {
    const [active, deleted] = await Promise.all([
      dbList() as Promise<Word[]>,
      dbDeletedList() as Promise<Word[]>,
    ])
    setActiveWords(Array.isArray(active) ? active : [])
    setDeletedWords(Array.isArray(deleted) ? deleted : [])
  }, [])

  const refreshSettings = useCallback(async () => {
    const next = await ipcGetSettings()
    setSettingsState(next)
  }, [])

  const refreshBasket = useCallback(async () => {
    const basket = await getBasket()
    if (Array.isArray(basket)) {
      setBasketCount(basket.length)
    }
  }, [])

  useEffect(() => {
    void refreshWords()
    void refreshSettings()
    void refreshBasket()
  }, [refreshWords, refreshSettings, refreshBasket])

  useEffect(() => {
    if (typeof window === 'undefined' || !window.api?.on) {
      return
    }

    const onDbOrBasketUpdated = () => {
      void refreshWords()
      void refreshBasket()
    }
    const onShowAIProcessingWindow = () => setShowAIProcessingWindow(true)
    const onShowWordConfirmationModal = (...args: unknown[]) => {
      const payload = Array.isArray(args[1]) ? (args[1] as string[]) : []
      setPendingWords(payload)
      setShowWordConfirmationModal(true)
    }
    const onSwitchToSettings = () => setTab('settings')
    const onSwitchToReview = () => setTab('review')

    window.api.on('db-updated', onDbOrBasketUpdated)
    window.api.on('basket-updated', onDbOrBasketUpdated)
    window.api.on('show-ai-processing-window', onShowAIProcessingWindow)
    window.api.on('show-word-confirmation-modal', onShowWordConfirmationModal)
    window.api.on('switch-to-settings', onSwitchToSettings)
    window.api.on('switch-to-review', onSwitchToReview)

    return () => {
      window.api?.off?.('db-updated', onDbOrBasketUpdated)
      window.api?.off?.('basket-updated', onDbOrBasketUpdated)
      window.api?.off?.('show-ai-processing-window', onShowAIProcessingWindow)
      window.api?.off?.('show-word-confirmation-modal', onShowWordConfirmationModal)
      window.api?.off?.('switch-to-settings', onSwitchToSettings)
      window.api?.off?.('switch-to-review', onSwitchToReview)
    }
  }, [refreshWords, refreshBasket])

  useEffect(() => {
    const interval = import.meta.env.DEV
      ? setInterval(() => {
          const usage = getMemoryUsage()
          if (usage && usage.used > 100) {
            clearCache()
          }
        }, 30000)
      : null

    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [getMemoryUsage, clearCache])

  useEffect(() => {
    if (!selectedId) return
    const existsInActive = activeWords.some(word => word.id === selectedId)
    const existsInDeleted = deletedWords.some(word => word.id === selectedId)
    if (!existsInActive && !existsInDeleted) {
      setSelectedId(null)
    }
  }, [activeWords, deletedWords, selectedId])

  const stats = useMemo(() => {
    const domainSet = new Set<string>()
    const now = Date.now()
    const dayStart = new Date()
    dayStart.setHours(0, 0, 0, 0)
    const dayStartTs = dayStart.getTime()

    let dueCount = 0
    let reviewedToday = 0
    let newCount = 0
    let learningCount = 0
    let masteredCount = 0

    for (const word of activeWords) {
      if (word.domain && word.domain.trim()) {
        domainSet.add(word.domain.trim())
      }

      switch (word.reviewStatus) {
        case 'new':
          newCount += 1
          break
        case 'learning':
          learningCount += 1
          break
        case 'mastered':
          masteredCount += 1
          break
        default:
          break
      }

      if (word.reviewDueDate != null && word.reviewDueDate <= now) {
        dueCount += 1
      }

      if ((word.fsrsReps || 0) > 0 && word.fsrsLastReviewedAt && word.fsrsLastReviewedAt >= dayStartTs) {
        reviewedToday += 1
      }
    }

    return {
      domainOptions: Array.from(domainSet).sort(),
      dueCount,
      reviewedToday,
      statusCounts: {
        active: activeWords.length,
        deleted: deletedWords.length,
        new: newCount,
        learning: learningCount,
        mastered: masteredCount,
      } satisfies StatusCounts,
    }
  }, [activeWords, deletedWords])

  const selectedWord = useMemo(() => {
    if (!selectedId) return null
    return activeWords.find(word => word.id === selectedId)
      ?? deletedWords.find(word => word.id === selectedId)
      ?? null
  }, [activeWords, deletedWords, selectedId])

  const selectWord = useCallback((id: string | null) => {
    setSelectedId(id)
  }, [])

  const openAddWordModal = useCallback(() => setShowAddWordModal(true), [])
  const closeAddWordModal = useCallback(() => setShowAddWordModal(false), [])

  const showWordConfirmation = useCallback((wordsToConfirm: string[]) => {
    setPendingWords(wordsToConfirm)
    setShowWordConfirmationModal(true)
  }, [])

  const hideWordConfirmation = useCallback(() => {
    setPendingWords([])
    setShowWordConfirmationModal(false)
  }, [])

  const confirmWordProcessing = useCallback(async (wordsToProcess: string[]) => {
    setPendingWords([])
    setShowWordConfirmationModal(false)
    setShowAIProcessingWindow(true)
    await ipcStartAIProcessing(wordsToProcess)
  }, [])

  const openAIProcessingWindow = useCallback(() => setShowAIProcessingWindow(true), [])
  const closeAIProcessingWindow = useCallback(() => setShowAIProcessingWindow(false), [])

  const triggerBasket = useCallback(async () => {
    await ipcTriggerBasket()
    await refreshWords()
    await refreshBasket()
  }, [refreshBasket, refreshWords])

  const importFromClipboard = useCallback(async () => {
    const count = await ipcImportFromClipboard()
    if (count > 0) {
      await refreshWords()
      await refreshBasket()
    }
    return count
  }, [refreshBasket, refreshWords])

  const bulkDelete = useCallback(async (ids: string[]) => {
    if (!ids.length) return
    await dbBulkDelete(ids)
    await refreshWords()
    await refreshBasket()
  }, [refreshBasket, refreshWords])

  const bulkRestore = useCallback(async (ids: string[]) => {
    if (!ids.length) return
    await dbBulkRestore(ids)
    await refreshWords()
    await refreshBasket()
  }, [refreshBasket, refreshWords])

  const bulkUpdateDomain = useCallback(async (ids: string[], domain: string) => {
    if (!ids.length) return
    await dbBulkUpdate(ids, { domain })
    await refreshWords()
  }, [refreshWords])

  const bulkUpdateStatus = useCallback(async (ids: string[], status: Word['reviewStatus']) => {
    if (!ids.length) return
    await dbBulkUpdate(ids, { reviewStatus: status })
    await refreshWords()
  }, [refreshWords])

  const deleteWord = useCallback(async (id: string) => {
    const result = await dbDelete(id) as DeleteWordResult | undefined
    if (result && !result.ok) {
      throw new Error(result.error || 'Failed to delete word')
    }
    setSelectedId(current => (current === id ? null : current))
    await refreshWords()
    await refreshBasket()
  }, [refreshBasket, refreshWords])

  const updateWord = useCallback(async (wordToUpdate: Word) => {
    await dbUpdate(wordToUpdate)
    setSelectedId(wordToUpdate.id)
    await refreshWords()
  }, [refreshWords])

  const saveSettings = useCallback(async (next: Partial<Settings>) => {
    await ipcSetSettings(next)
    await refreshSettings()
  }, [refreshSettings])

  const stateValue = useMemo<AppStateValue>(() => ({
    activeWords,
    deletedWords,
    selectedId,
    selectedWord,
    settings,
    basketCount,
    tab,
    showAddWordModal,
    showWordConfirmationModal,
    showAIProcessingWindow,
    pendingWords,
    domainOptions: stats.domainOptions,
    dueCount: stats.dueCount,
    reviewedToday: stats.reviewedToday,
    statusCounts: stats.statusCounts,
  }), [
    activeWords,
    deletedWords,
    selectedId,
    selectedWord,
    settings,
    basketCount,
    tab,
    showAddWordModal,
    showWordConfirmationModal,
    showAIProcessingWindow,
    pendingWords,
    stats.domainOptions,
    stats.dueCount,
    stats.reviewedToday,
    stats.statusCounts,
  ])

  const actionsValue = useMemo<AppActionsValue>(() => ({
    setTab,
    selectWord,
    openAddWordModal,
    closeAddWordModal,
    showWordConfirmation,
    hideWordConfirmation,
    confirmWordProcessing,
    openAIProcessingWindow,
    closeAIProcessingWindow,
    refreshWords,
    refreshSettings,
    refreshBasket,
    triggerBasket,
    importFromClipboard,
    bulkDelete,
    bulkRestore,
    bulkUpdateDomain,
    bulkUpdateStatus,
    deleteWord,
    updateWord,
    saveSettings,
  }), [
    setTab,
    selectWord,
    openAddWordModal,
    closeAddWordModal,
    showWordConfirmation,
    hideWordConfirmation,
    confirmWordProcessing,
    openAIProcessingWindow,
    closeAIProcessingWindow,
    refreshWords,
    refreshSettings,
    refreshBasket,
    triggerBasket,
    importFromClipboard,
    bulkDelete,
    bulkRestore,
    bulkUpdateDomain,
    bulkUpdateStatus,
    deleteWord,
    updateWord,
    saveSettings,
  ])

  return (
    <AppStateContext.Provider value={stateValue}>
      <AppActionsContext.Provider value={actionsValue}>
        {children}
      </AppActionsContext.Provider>
    </AppStateContext.Provider>
  )
}

/* eslint-disable-next-line react-refresh/only-export-components */
export function useAppState(): AppStateValue {
  const ctx = useContext(AppStateContext)
  if (!ctx) {
    throw new Error('useAppState must be used within AppStateProvider')
  }
  return ctx
}

/* eslint-disable-next-line react-refresh/only-export-components */
export function useAppActions(): AppActionsValue {
  const ctx = useContext(AppActionsContext)
  if (!ctx) {
    throw new Error('useAppActions must be used within AppStateProvider')
  }
  return ctx
}
