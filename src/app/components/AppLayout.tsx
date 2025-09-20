import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import type { Settings, Word } from '@common/types'
import { useAppActions, useAppState } from '@/app/providers/AppStateProvider'
import { useFilters } from '@shared/hooks/useFilters'
import { useMultiSelect } from '@shared/hooks/useMultiSelect'
import { useResizable } from '@shared/hooks/useResizable'
import { useTTS } from '@shared/hooks/useTTS'
import ListPane from '@features/vocab/ListPane'
import DetailPane from '@features/vocab/DetailPane'
import Review from '@features/review/Review'
import SettingsView from '@features/settings/SettingsView'
import AddWordModal from '@features/vocab/AddWordModal'
import AIProcessingStatus from '@features/vocab/AIProcessingStatus'
import WordConfirmationModal from '@features/vocab/WordConfirmationModal'
import AIProcessingWindow from '@features/vocab/AIProcessingWindow'
import { ThemeToggleButton } from '@shared/components/ThemeToggle'
import { BookIcon, TargetIcon, SettingsIcon, CheckIcon, ClockIcon, FileTextIcon } from '@shared/components/Icon'

import '@/App.css'
import '@/styles/layout.css'
import '@/styles/list.css'
import '@/styles/detail.css'
import '@/styles/forms.css'
import '@/styles/review.css'
import '@/styles/settings.css'
import '@/styles/cupertino.css'
import '@/styles/themes.css'
import '@/styles/empty-state.css'
import '@/styles/toast.css'
import '@/styles/confirm-dialog.css'
import '@/styles/buttons.css'
import '@/styles/cards.css'

type SidebarProps = {
  tab: 'list' | 'review' | 'settings'
  basketCount: number
  dueCount: number
  statusCounts: { active: number; new: number; learning: number; mastered: number }
  onTabChange: (tab: 'list' | 'review' | 'settings') => void
  onTriggerBasket: () => Promise<void> | void
  onImportClipboard: () => Promise<void>
  onOpenAddWordModal: () => void
  isImporting: boolean
  t: TFunction
}

type TopbarProps = {
  tab: 'list' | 'review' | 'settings'
  settings: Settings | null
  dueCount: number
  reviewedToday: number
  t: TFunction
}

export function AppLayout() {
  const {
    words,
    selectedId,
    selectedWord,
    settings,
    basketCount,
    tab,
    showAddWordModal,
    showWordConfirmationModal,
    showAIProcessingWindow,
    pendingWords,
    domainOptions,
    dueCount,
    reviewedToday,
    statusCounts,
  } = useAppState()
  const {
    setTab,
    selectWord,
    openAddWordModal,
    closeAddWordModal,
    triggerBasket,
    importFromClipboard,
    bulkDelete,
    bulkRestore,
    bulkUpdateDomain,
    bulkUpdateStatus,
    deleteWord,
    updateWord,
    refreshWords,
    refreshBasket,
    hideWordConfirmation,
    confirmWordProcessing,
    closeAIProcessingWindow,
    saveSettings,
  } = useAppActions()
  const { filterState, filterActions } = useFilters()
  const { multiSelectMode, selectedIds, setMultiSelectMode, setSelectedIds, clearSelection } = useMultiSelect()
  const { width: listWidth, onStartResize } = useResizable(380, 'listPaneWidth')
  const { speak } = useTTS(settings)
  const { t, i18n } = useTranslation()
  const [isImporting, setIsImporting] = useState(false)

  useEffect(() => {
    if (!settings) return
    const root = document.documentElement
    if (!settings.theme || settings.theme === 'system') {
      root.removeAttribute('data-theme')
    } else {
      root.setAttribute('data-theme', settings.theme)
    }

    if (settings.locale) {
      i18n.changeLanguage(settings.locale).catch(() => {})
    }
  }, [settings, i18n])

  const handleSelectWord = useCallback((word: Word) => {
    selectWord(word.id)
  }, [selectWord])

  const handleDeleteWord = useCallback(async () => {
    if (!selectedWord) return
    await deleteWord(selectedWord.id)
  }, [selectedWord, deleteWord])

  const handleSaveWord = useCallback(async (wordToUpdate: Word) => {
    await updateWord(wordToUpdate)
  }, [updateWord])

  const handleBulkDelete = useCallback(async (ids: string[]) => {
    await bulkDelete(ids)
    clearSelection()
  }, [bulkDelete, clearSelection])

  const handleBulkRestore = useCallback(async (ids: string[]) => {
    await bulkRestore(ids)
    clearSelection()
  }, [bulkRestore, clearSelection])

  const handleBulkUpdateDomain = useCallback(async (ids: string[], domain: string) => {
    await bulkUpdateDomain(ids, domain)
    clearSelection()
  }, [bulkUpdateDomain, clearSelection])

  const handleBulkUpdateStatus = useCallback(async (ids: string[], status: Word['reviewStatus']) => {
    await bulkUpdateStatus(ids, status)
    clearSelection()
  }, [bulkUpdateStatus, clearSelection])

  const handleManualImport = useCallback(async () => {
    if (isImporting) return
    setIsImporting(true)
    try {
      await importFromClipboard()
    } finally {
      setIsImporting(false)
    }
  }, [importFromClipboard, isImporting])

  const filterUi = useMemo(() => ({
    search: filterState.query,
    setSearch: filterActions.setSearch,
    status: filterState.status,
    setStatus: filterActions.setStatus,
    from: filterState.from,
    setFrom: filterActions.setFrom,
    to: filterState.to,
    setTo: filterActions.setTo,
    domain: filterState.domain,
    setDomain: filterActions.setDomain,
    requireExample: filterState.requireExample,
    setRequireExample: filterActions.setRequireExample,
    requirePhonetic: filterState.requirePhonetic,
    setRequirePhonetic: filterActions.setRequirePhonetic,
    useRegex: filterState.useRegex,
    setUseRegex: filterActions.setUseRegex,
    regex: filterState.regex,
    setRegex: filterActions.setRegex,
    showDeleted: filterState.showDeleted,
    setShowDeleted: (value: boolean) => {
      clearSelection()
      filterActions.setShowDeleted(value)
    },
  }), [filterState, filterActions, clearSelection])

  return (
    <div className="layout">
      <Sidebar
        tab={tab}
        basketCount={basketCount}
        dueCount={dueCount}
        statusCounts={statusCounts}
        onTabChange={setTab}
        onTriggerBasket={() => void triggerBasket()}
        onImportClipboard={handleManualImport}
        onOpenAddWordModal={openAddWordModal}
        isImporting={isImporting}
        t={t}
      />
      <div className="content">
        <Topbar tab={tab} settings={settings} dueCount={dueCount} reviewedToday={reviewedToday} t={t} />
        {tab === 'list' && (
          <div className="two-col" style={{ gridTemplateColumns: `${Math.round(listWidth)}px 6px 1fr` }}>
            <ListPane
              words={words}
              selectedId={selectedId}
              onSelect={handleSelectWord}
              filter={filterState}
              domainOptions={domainOptions}
              ui={filterUi}
              selectionMode={multiSelectMode}
              setSelectionMode={setMultiSelectMode}
              selectedIds={selectedIds}
              setSelectedIds={setSelectedIds}
              onBulkDelete={handleBulkDelete}
              onBulkRestore={handleBulkRestore}
              onBulkUpdateDomain={handleBulkUpdateDomain}
              onBulkUpdateStatus={handleBulkUpdateStatus}
            />
            <div className="col-resizer" onMouseDown={onStartResize} title={t('filters.domainAll') as string} />
            <DetailPane
              word={selectedWord}
              speak={speak}
              settings={settings}
              onDelete={handleDeleteWord}
              onSave={handleSaveWord}
            />
          </div>
        )}
        {tab === 'review' && <Review onBack={() => setTab('list')} refresh={refreshWords} />}
        {tab === 'settings' && settings && (
          <SettingsView settings={settings} onSave={saveSettings} />
        )}
      </div>

      <AddWordModal
        isOpen={showAddWordModal}
        onClose={closeAddWordModal}
        onSuccess={refreshBasket}
      />

      <WordConfirmationModal
        isOpen={showWordConfirmationModal}
        words={pendingWords}
        onConfirm={confirmWordProcessing}
        onCancel={hideWordConfirmation}
      />

      <AIProcessingWindow isOpen={showAIProcessingWindow} onClose={closeAIProcessingWindow} />

      <AIProcessingStatus />
    </div>
  )
}

function Sidebar({
  tab,
  basketCount,
  dueCount,
  statusCounts,
  onTabChange,
  onTriggerBasket,
  onImportClipboard,
  onOpenAddWordModal,
  isImporting,
  t,
}: SidebarProps) {
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="brand">
          <img src="/icon.png" alt="FlowLearn" className="brand-icon" />
          <span>FlowLearn</span>
        </div>
      </div>
      <div className="sidebar-content">
        <div className="sidebar-section">
          <div className="sidebar-section-title">{t('sidebar.quickActions')}</div>
          <button
            className="btn btn-primary"
            onClick={() => void onTriggerBasket()}
            disabled={basketCount === 0}
            style={{ width: '100%' }}
          >
            {basketCount === 0 ? t('buttons.processBasketEmpty') : t('buttons.processBasketCount', { count: basketCount })}
          </button>
          <div style={{ height: 8 }} />
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="btn"
              onClick={() => void onImportClipboard()}
              style={{ flex: 1 }}
              disabled={isImporting}
            >
              {isImporting ? t('loading.common') : t('buttons.manualImport')}
            </button>
            <button
              className="btn btn-outline"
              onClick={onOpenAddWordModal}
              style={{ flex: 1 }}
            >
              {t('buttons.addWord')}
            </button>
          </div>
        </div>

        <div className="sidebar-section">
          <div className="sidebar-section-title">{t('sidebar.navigation')}</div>
          <button className={`nav-item ${tab === 'list' ? 'active' : ''}`} onClick={() => onTabChange('list')}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <BookIcon size={16} />
              <span>{t('nav.vocab')}</span>
            </span>
            <span className="nav-item-count">{statusCounts.active}</span>
          </button>
          <button
            className={`nav-item ${tab === 'review' ? 'active' : ''}`}
            onClick={() => onTabChange('review')}
            disabled={dueCount === 0}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <TargetIcon size={16} />
              <span>{t('nav.review')}</span>
            </span>
            {dueCount > 0 && <span className="nav-item-count">{dueCount}</span>}
          </button>
          <button className={`nav-item ${tab === 'settings' ? 'active' : ''}`} onClick={() => onTabChange('settings')}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <SettingsIcon size={16} />
              <span>{t('nav.settings')}</span>
            </span>
          </button>
        </div>

        <div className="spacer" />

        <div className="sidebar-section">
          <div className="sidebar-section-title">{t('sidebar.stats')}</div>
          <div className="stats-container">
            <div className="stat-item">
              <div className="stat-icon new"><FileTextIcon size={16} /></div>
              <div className="stat-content">
                <div className="stat-label">{t('status.new')}</div>
                <div className="stat-value new">{statusCounts.new}</div>
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-icon learning"><BookIcon size={20} /></div>
              <div className="stat-content">
                <div className="stat-label">{t('status.learning')}</div>
                <div className="stat-value learning">{statusCounts.learning}</div>
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-icon mastered"><CheckIcon size={20} /></div>
              <div className="stat-content">
                <div className="stat-label">{t('status.mastered')}</div>
                <div className="stat-value mastered">{statusCounts.mastered}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="sidebar-footer">{t('footer.localOnly')}</div>
    </div>
  )
}

function Topbar({ tab, settings, dueCount, reviewedToday, t }: TopbarProps) {
  const dailyGoal = settings?.dailyGoal && settings.dailyGoal > 0 ? settings.dailyGoal : null
  const progressPercentage = dailyGoal ? Math.round((reviewedToday / dailyGoal) * 100) : 0

  return (
    <div className="topbar">
      <div className="topbar-title">
        {tab === 'list' && t('nav.vocab')}
        {tab === 'review' && t('nav.review')}
        {tab === 'settings' && t('nav.settings')}
      </div>
      <div className="topbar-actions">
        <ThemeToggleButton className="theme-toggle-topbar" />
        {settings && (
          <div className="progress-widget">
            <div className="progress-stats">
              <div className="progress-item">
                <span className="progress-icon"><ClockIcon size={14} /></span>
                <span className="progress-label">{t('progress.dueCount')}</span>
                <span className="progress-value due">{dueCount}</span>
              </div>
              <div className="progress-item">
                <span className="progress-icon"><TargetIcon size={14} /></span>
                <span className="progress-label">{t('progress.reviewedToday')}</span>
                <span className="progress-value completed">{reviewedToday}</span>
                {dailyGoal && (
                  <>
                    <span className="progress-separator">/</span>
                    <span className="progress-value target">{dailyGoal}</span>
                  </>
                )}
              </div>
            </div>
            {dailyGoal && (
              <div className="progress-bar-container">
                <div className="progress-bar">
                  <div
                    className="progress-bar-fill"
                    style={{
                      width: `${Math.min(100, progressPercentage)}%`,
                      backgroundColor: reviewedToday >= dailyGoal ? 'var(--success)' : 'var(--primary)',
                    }}
                  />
                </div>
                <div className="progress-percentage">{progressPercentage}%</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
