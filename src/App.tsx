import { useEffect, useMemo, useState, useCallback } from 'react'
import './App.css'
import './styles/layout.css'
import './styles/list.css'
import { useTranslation } from 'react-i18next'
import type { Word, Settings } from '@shared/types'
import { dbList, dbUpdate, dbDelete, getSettings as ipcGetSettings, getBasket, triggerBasket, importFromClipboard, dbBulkDelete, dbBulkRestore, dbBulkUpdate, dbDeletedList, startAIProcessing } from '@lib/ipc'
import ListPane from '@features/vocab/ListPane'
import DetailPane from '@features/vocab/DetailPane'
import Review from '@features/review/Review'
import SettingsView from '@features/settings/SettingsView'
import AddWordModal from '@features/vocab/AddWordModal'
import AIProcessingStatus from '@features/vocab/AIProcessingStatus'
import WordConfirmationModal from '@features/vocab/WordConfirmationModal'
import AIProcessingWindow from '@features/vocab/AIProcessingWindow'
import { useMemoryOptimization } from './shared/lib/useMemoryOptimization'
import { useTTS } from './shared/hooks/useTTS'
import { useFilters } from './shared/hooks/useFilters'
import { useMultiSelect } from './shared/hooks/useMultiSelect'
import { useResizable } from './shared/hooks/useResizable'

function App() {
  const { t, i18n } = useTranslation()
  const [words, setWords] = useState<Word[]>([])
  const [selected, setSelected] = useState<Word | null>(null)
  
  const { getMemoryUsage, clearCache } = useMemoryOptimization()
  const [settings, setSettings] = useState<Settings | null>(null)
  const [basketCount, setBasketCount] = useState<number>(0)
  const [tab, setTab] = useState<'list' | 'review' | 'settings'>('list')
  const { filterState, filterActions } = useFilters()
  const { multiSelectMode, selectedIds, setMultiSelectMode, setSelectedIds, clearSelection } = useMultiSelect()
  const { width: listWidth, onStartResize } = useResizable(380, 'listPaneWidth')
  const [showAddWordModal, setShowAddWordModal] = useState(false)
  const [showWordConfirmationModal, setShowWordConfirmationModal] = useState(false)
  const [showAIProcessingWindow, setShowAIProcessingWindow] = useState(false)
  const [pendingWords, setPendingWords] = useState<string[]>([])
  const { speak } = useTTS(settings)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<Word | null>(null)



  const refresh = useCallback(async () => {
    const [active, deleted] = await Promise.all([
      dbList() as Promise<Word[]>,
      dbDeletedList() as Promise<Word[]>,
    ])
    

    const activeWords = Array.isArray(active) ? active : []
    const deletedWords = Array.isArray(deleted) ? deleted : []
    
    setWords([...activeWords, ...deletedWords])
  }, [])

  const refreshSettings = useCallback(async () => {
    const s = await ipcGetSettings() as Settings
    setSettings(s)
  }, [])

  const refreshBasket = useCallback(async () => {
    const basket = await getBasket() as Array<{term:string}>
    setBasketCount(basket.length)
  }, [])

  useEffect(() => {
    refresh()
    refreshSettings()
    refreshBasket()
    const handler = () => {
      refresh()
      refreshBasket()
    }
    

    if (typeof window !== 'undefined' && window.api && window.api.on) {
      window.api.on('db-updated', handler)
      window.api.on('basket-updated', handler)
      
  
      window.api.on('show-ai-processing-window', () => {
        setShowAIProcessingWindow(true)
      })
      
      window.api.on('show-word-confirmation-modal', (...args: unknown[]) => {
        const words = args[1] as string[]
        setPendingWords(words)
        setShowWordConfirmationModal(true)
      })
      
  
      window.api.on('switch-to-settings', () => setTab('settings'))
      window.api.on('switch-to-review', () => setTab('review'))
      
      return () => {
        if (window.api && window.api.off) {
          window.api.off('db-updated', handler)
          window.api.off('basket-updated', handler)
          window.api.off('show-ai-processing-window', handler)
          window.api.off('show-word-confirmation-modal', handler)
          window.api.off('switch-to-settings', handler)
          window.api.off('switch-to-review', handler)
        }
      }
    }
    
    
    return () => {}
  }, [refresh, refreshSettings, refreshBasket])
  
  
  useEffect(() => {
    const interval = setInterval(() => {
      if (process.env.NODE_ENV === 'development') {
        const memUsage = getMemoryUsage()
        if (memUsage && memUsage.used > 100) { // 超过100MB时清理缓存
          clearCache()
        }
      }
    }, 30000) // 每30秒检查一次
    
    return () => clearInterval(interval)
  }, [getMemoryUsage, clearCache])


  useEffect(() => {
    if (!settings) return
    const root = document.documentElement
    if (settings.theme === 'system' || !settings.theme) root.removeAttribute('data-theme')
    else root.setAttribute('data-theme', settings.theme)
    if (settings.locale) {
      try { i18n.changeLanguage(settings.locale) } catch {
        // 忽略localStorage错误
      }
    }
  }, [settings, i18n])

  useEffect(() => {
    if (selected) {
      setEditing(false)
      setDraft(selected)
    } else {
      setEditing(false)
      setDraft(null)
    }
  }, [selected])

  const domainOptions = useMemo(() => {
    const s = new Set<string>()
    for (const w of words) {
      if ((w as Word & { deletedAt?: number }).deletedAt) continue
      if (w.domain && w.domain.trim()) s.add(w.domain.trim())
    }
    return Array.from(s).sort()
  }, [words])



  const dueWords = useMemo(() => words.filter(w => !((w as Word & { deletedAt?: number }).deletedAt) && w.reviewDueDate !== null && (w.reviewDueDate as number) <= Date.now()), [words])
  const reviewedToday = useMemo(() => {
    const d = new Date(); d.setHours(0,0,0,0)
    return words.filter(w => !((w as Word & { deletedAt?: number }).deletedAt) && (w.fsrsLastReviewedAt || 0) >= d.getTime()).length
  }, [words])



  return (
    <div className="layout">
      <div className="sidebar">
        <div className="sidebar-header">
          <div className="brand">
            <div className="brand-icon">F</div>
            <span>FlowLearn</span>
          </div>
        </div>
        <div className="sidebar-content">
          <div className="sidebar-section">
            <div className="sidebar-section-title">{t('sidebar.quickActions')}</div>
            <button 
              className="btn btn-primary" 
              onClick={() => triggerBasket()} 
              disabled={basketCount === 0}
              style={{ width: '100%' }}
            >
              {basketCount === 0 ? t('buttons.processBasketEmpty') : t('buttons.processBasketCount', { count: basketCount })}
            </button>
            <div style={{ height: 8 }} />
            <div style={{ display: 'flex', gap: 8 }}>
              <button 
                className="btn" 
                onClick={async () => {
                  const count: number = await importFromClipboard()
                  if (count > 0) await refresh()
                }}
                style={{ flex: 1 }}
              >
                {t('buttons.manualImport')}
              </button>
              <button 
                className="btn btn-outline" 
                onClick={() => setShowAddWordModal(true)}
                style={{ flex: 1 }}
              >
                {t('buttons.addWord')}
              </button>
            </div>
          </div>
          
          <div className="sidebar-section">
            <div className="sidebar-section-title">{t('sidebar.navigation')}</div>
            <button 
              className={`nav-item ${tab === 'list' ? 'active' : ''}`}
              onClick={() => setTab('list')}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 16 }}>📚</span>
                  <span>{t('nav.vocab')}</span>
              </span>
              <span className="nav-item-count">{words.filter(w => !(w as Word & { deletedAt?: number }).deletedAt).length}</span>
            </button>
            <button 
              className={`nav-item ${tab === 'review' ? 'active' : ''}`}
              onClick={() => setTab('review')}
              disabled={dueWords.length === 0}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 16 }}>🎯</span>
                  <span>{t('nav.review')}</span>
              </span>
              {dueWords.length > 0 && <span className="nav-item-count">{dueWords.length}</span>}
            </button>
            <button 
              className={`nav-item ${tab === 'settings' ? 'active' : ''}`}
              onClick={() => setTab('settings')}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 16 }}>⚙️</span>
                  <span>{t('nav.settings')}</span>
              </span>
            </button>
          </div>
          
          <div className="spacer" />
          
          <div className="sidebar-section">
            <div className="sidebar-section-title">{t('sidebar.stats')}</div>
            <div className="stats-container">
              <div className="stat-item">
                <div className="stat-icon new">📝</div>
                <div className="stat-content">
                  <div className="stat-label">{t('status.new')}</div>
                  <div className="stat-value new">
                    {words.filter(w => !((w as Word & { deletedAt?: number }).deletedAt) && w.reviewStatus === 'new').length}
                  </div>
                </div>
              </div>
              <div className="stat-item">
                <div className="stat-icon learning">📚</div>
                <div className="stat-content">
                  <div className="stat-label">{t('status.learning')}</div>
                  <div className="stat-value learning">
                    {words.filter(w => !((w as Word & { deletedAt?: number }).deletedAt) && w.reviewStatus === 'learning').length}
                  </div>
                </div>
              </div>
              <div className="stat-item">
                <div className="stat-icon mastered">✅</div>
                <div className="stat-content">
                  <div className="stat-label">{t('status.mastered')}</div>
                  <div className="stat-value mastered">
                    {words.filter(w => !((w as Word & { deletedAt?: number }).deletedAt) && w.reviewStatus === 'mastered').length}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="sidebar-footer">
          {t('footer.localOnly')}
        </div>
      </div>
      <div className="content">
        <div className="topbar">
          <div className="topbar-title">
            {tab === 'list' && t('nav.vocab')}
            {tab === 'review' && t('nav.review')}
            {tab === 'settings' && t('nav.settings')}
          </div>
          <div className="topbar-actions">
            {settings && (
              <div className="progress-widget">
                <div className="progress-stats">
                  <div className="progress-item">
                    <span className="progress-icon">⏰</span>
                    <span className="progress-label">{t('progress.dueCount')}</span>
                    <span className="progress-value due">{dueWords.length}</span>
                  </div>
                  <div className="progress-item">
                    <span className="progress-icon">🎯</span>
                    <span className="progress-label">{t('progress.reviewedToday')}</span>
                    <span className="progress-value completed">{reviewedToday}</span>
                    {settings.dailyGoal && settings.dailyGoal > 0 && (
                      <>
                        <span className="progress-separator">/</span>
                        <span className="progress-value target">{settings.dailyGoal}</span>
                      </>
                    )}
                  </div>
                </div>
                {settings.dailyGoal && settings.dailyGoal > 0 && (
                  <div className="progress-bar-container">
                    <div className="progress-bar">
                      <div 
                        className="progress-bar-fill" 
                        style={{ 
                          width: `${Math.min(100, (reviewedToday / settings.dailyGoal) * 100)}%`,
                          backgroundColor: reviewedToday >= settings.dailyGoal ? 'var(--success)' : 'var(--primary)'
                        }}
                      />
                    </div>
                    <div className="progress-percentage">
                      {Math.round((reviewedToday / settings.dailyGoal) * 100)}%
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        {tab === 'list' && (
          <div className="two-col" style={{ gridTemplateColumns: `${Math.round(listWidth)}px 6px 1fr` }}>
            <ListPane 
              words={words}
              selectedId={selected?.id || null}
              onSelect={setSelected}
              filter={filterState}
              domainOptions={domainOptions}
              ui={{
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
                setShowDeleted: (b: boolean) => { clearSelection(); filterActions.setShowDeleted(b) },
              }}
              selectionMode={multiSelectMode}
              setSelectionMode={setMultiSelectMode}
              selectedIds={selectedIds}
              setSelectedIds={setSelectedIds}
              onBulkDelete={async (ids) => { await dbBulkDelete(ids); clearSelection(); await refresh() }}
              onBulkRestore={async (ids) => { await dbBulkRestore(ids); clearSelection(); await refresh() }}
              onBulkUpdateDomain={async (ids, domain) => { await dbBulkUpdate(ids, { domain }); clearSelection(); await refresh() }}
              onBulkUpdateStatus={async (ids, status) => { await dbBulkUpdate(ids, { reviewStatus: status }); clearSelection(); await refresh() }}
            />
            <div className="col-resizer" onMouseDown={onStartResize} title={t('filters.domainAll') as string} />
            <DetailPane 
              word={selected}
              editing={editing}
              draft={draft}
              setDraft={setDraft}
              setEditing={setEditing}
              speak={speak}
              settings={settings}
              onDelete={async () => {
                if (!selected) return
                await dbDelete(selected.id)
                setSelected(null)
                refresh()
              }}
              onSave={async () => {
                if (!draft) return
                const updated: Word = { ...draft }
                await dbUpdate(updated)
                setSelected(updated)
                setEditing(false)
                await refresh()
              }}
            />
          </div>
        )}
        {tab === 'review' && (
          <Review onBack={() => setTab('list')} refresh={refresh} />
        )}
        {tab === 'settings' && settings && (
          <SettingsView settings={settings} onSave={async (s) => { await window.api.invoke('settings:set', s); await refreshSettings() }} />
        )}
      </div>
      
      <AddWordModal 
        isOpen={showAddWordModal}
        onClose={() => setShowAddWordModal(false)}
        onSuccess={refreshBasket}
      />
      
      <WordConfirmationModal
        isOpen={showWordConfirmationModal}
        words={pendingWords}
        onConfirm={async (confirmedWords) => {
          setShowWordConfirmationModal(false)
          
          await startAIProcessing(confirmedWords)
        }}
        onCancel={() => setShowWordConfirmationModal(false)}
      />
      
      <AIProcessingWindow
        isOpen={showAIProcessingWindow}
        onClose={() => setShowAIProcessingWindow(false)}
      />
      
      <AIProcessingStatus />
    </div>
  )
}
 
export default App
 