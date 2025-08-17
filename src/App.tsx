import { useEffect, useMemo, useRef, useState } from 'react'
// moved usage to DetailPane
import './App.css'
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

// Types moved to shared/types

// dates moved to src/lib/date

function App() {
  const { t, i18n } = useTranslation()
  const [words, setWords] = useState<Word[]>([])
  const [selected, setSelected] = useState<Word | null>(null)
  const [settings, setSettings] = useState<Settings | null>(null)
  const [basketCount, setBasketCount] = useState<number>(0)
  const [tab, setTab] = useState<'list' | 'review' | 'settings'>('list')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | Word['reviewStatus']>('all')
  const [filterDateFrom, setFilterDateFrom] = useState<string>('')
  const [filterDateTo, setFilterDateTo] = useState<string>('')
  const [domainFilter, setDomainFilter] = useState<string>('all')
  const [requireExample, setRequireExample] = useState<boolean>(false)
  const [requirePhonetic, setRequirePhonetic] = useState<boolean>(false)
  const [useRegex, setUseRegex] = useState<boolean>(false)
  const [regexPattern, setRegexPattern] = useState<string>('')
  const [showDeleted, setShowDeleted] = useState<boolean>(false)
  const [multiSelectMode, setMultiSelectMode] = useState<boolean>(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [listWidth, setListWidth] = useState<number>(() => {
    try { const v = Number(localStorage.getItem('listPaneWidth') || 380); if (isFinite(v)) return v } catch {}
    return 380
  })
  const listWidthRef = useRef<number>(listWidth)
  useEffect(() => { listWidthRef.current = listWidth }, [listWidth])
  const [showAddWordModal, setShowAddWordModal] = useState(false)
  const [showWordConfirmationModal, setShowWordConfirmationModal] = useState(false)
  const [showAIProcessingWindow, setShowAIProcessingWindow] = useState(false)
  const [pendingWords, setPendingWords] = useState<string[]>([])
  const speak = (text: string) => {
    try {
      if (settings?.ttsProvider === 'volcengine') {
        ;(async () => {
          const res = await window.api.invoke('tts:volc:query', text) as { ok: boolean; base64?: string; encoding?: string; error?: string }
          if (!res.ok || !res.base64) return
          const bstr = atob(res.base64)
          const len = bstr.length
          const u8 = new Uint8Array(len)
          for (let i = 0; i < len; i++) u8[i] = bstr.charCodeAt(i)
          const mime = res.encoding === 'mp3' ? 'audio/mpeg' : (res.encoding === 'ogg_opus' ? 'audio/ogg' : 'audio/wav')
          const blob = new Blob([u8], { type: mime })
          const url = URL.createObjectURL(blob)
          const audio = new Audio(url)
          audio.play().finally(() => URL.revokeObjectURL(url))
        })()
        return
      }
      const s = window.speechSynthesis
      if (!s) return
      const u = new SpeechSynthesisUtterance(text)
      if (settings?.ttsLang) u.lang = settings.ttsLang
      if (settings?.ttsRate) u.rate = settings.ttsRate
      if (settings?.ttsPitch) u.pitch = settings.ttsPitch
      if (settings?.ttsVoice) {
        const voice = s.getVoices().find(v => v.name === settings.ttsVoice)
        if (voice) u.voice = voice
      }
      s.cancel()
      s.speak(u)
    } catch {}
  }
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<Word | null>(null)

  // status labels moved to child components

  const refresh = async () => {
    const [active, deleted] = await Promise.all([
      dbList() as Promise<Word[]>,
      dbDeletedList() as Promise<Word[]>,
    ])
    setWords([...(active || []), ...(deleted || [])])
  }

  const refreshSettings = async () => {
    const s = await ipcGetSettings() as Settings
    setSettings(s)
  }

  const refreshBasket = async () => {
    const basket = await getBasket() as Array<{term:string}>
    setBasketCount(basket.length)
  }

  useEffect(() => {
    refresh()
    refreshSettings()
    refreshBasket()
    const handler = () => {
      refresh()
      refreshBasket()
    }
    window.api.on('db-updated', handler)
    window.api.on('basket-updated', handler)
    
    // 监听AI处理相关事件
    window.api.on('show-ai-processing-window', () => {
      setShowAIProcessingWindow(true)
    })
    
    window.api.on('show-word-confirmation-modal', (_event: any, words: string[]) => {
      setPendingWords(words)
      setShowWordConfirmationModal(true)
    })
    
    return () => {
      window.api.off('db-updated', handler as any)
      window.api.off('basket-updated', handler as any)
      window.api.off('show-ai-processing-window', handler as any)
      window.api.off('show-word-confirmation-modal', handler as any)
    }
  }, [])

  // Apply theme & locale when settings change
  useEffect(() => {
    if (!settings) return
    const root = document.documentElement
    if (settings.theme === 'system' || !settings.theme) root.removeAttribute('data-theme')
    else root.setAttribute('data-theme', settings.theme)
    if (settings.locale) {
      try { i18n.changeLanguage(settings.locale) } catch {}
    }
  }, [settings?.theme, settings?.locale])

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
      if ((w as any).deletedAt) continue
      if (w.domain && w.domain.trim()) s.add(w.domain.trim())
    }
    return Array.from(s).sort()
  }, [words])

  // filtering moved to features/vocab/filters and applied in ListPane

  const dueWords = useMemo(() => words.filter(w => !((w as any).deletedAt) && w.reviewDueDate !== null && (w.reviewDueDate as number) <= Date.now()), [words])
  const reviewedToday = useMemo(() => {
    const d = new Date(); d.setHours(0,0,0,0)
    return words.filter(w => !((w as any).deletedAt) && (w.fsrsLastReviewedAt || 0) >= d.getTime()).length
  }, [words])

  const onStartResize = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault()
    const startX = e.clientX
    const startW = listWidth
    const onMove = (ev: MouseEvent) => {
      const dx = ev.clientX - startX
      let next = startW + dx
      const min = 280
      const max = 600
      if (next < min) next = min
      if (next > max) next = max
      setListWidth(next)
      listWidthRef.current = next
    }
    const onUp = () => {
      try { localStorage.setItem('listPaneWidth', String(listWidthRef.current)) } catch {}
      try { document.body.classList.remove('is-resizing') } catch {}
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    try { document.body.classList.add('is-resizing') } catch {}
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

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
                  const count = await importFromClipboard()
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
              <span className="nav-item-count">{words.filter(w => !(w as any).deletedAt).length}</span>
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
                    {words.filter(w => !((w as any).deletedAt) && w.reviewStatus === 'new').length}
                  </div>
                </div>
              </div>
              <div className="stat-item">
                <div className="stat-icon learning">📚</div>
                <div className="stat-content">
                  <div className="stat-label">{t('status.learning')}</div>
                  <div className="stat-value learning">
                    {words.filter(w => !((w as any).deletedAt) && w.reviewStatus === 'learning').length}
                  </div>
                </div>
              </div>
              <div className="stat-item">
                <div className="stat-icon mastered">✅</div>
                <div className="stat-content">
                  <div className="stat-label">{t('status.mastered')}</div>
                  <div className="stat-value mastered">
                    {words.filter(w => !((w as any).deletedAt) && w.reviewStatus === 'mastered').length}
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
              filter={{
                query: search,
                status: statusFilter,
                from: filterDateFrom,
                to: filterDateTo,
                domain: domainFilter,
                requireExample,
                requirePhonetic,
                useRegex,
                regex: regexPattern,
                showDeleted,
              }}
              domainOptions={domainOptions}
              ui={{
                search, setSearch,
                status: statusFilter, setStatus: (v) => setStatusFilter(v),
                from: filterDateFrom, setFrom: setFilterDateFrom,
                to: filterDateTo, setTo: setFilterDateTo,
                domain: domainFilter, setDomain: setDomainFilter,
                requireExample, setRequireExample,
                requirePhonetic, setRequirePhonetic,
                useRegex, setUseRegex,
                regex: regexPattern, setRegex: setRegexPattern,
                showDeleted, setShowDeleted: (b: boolean) => { setMultiSelectMode(false); setSelectedIds([]); setShowDeleted(b) },
              }}
              selectionMode={multiSelectMode}
              setSelectionMode={setMultiSelectMode}
              selectedIds={selectedIds}
              setSelectedIds={setSelectedIds}
              onBulkDelete={async (ids) => { await dbBulkDelete(ids); setSelectedIds([]); setMultiSelectMode(false); await refresh() }}
              onBulkRestore={async (ids) => { await dbBulkRestore(ids); setSelectedIds([]); setMultiSelectMode(false); await refresh() }}
              onBulkUpdateDomain={async (ids, domain) => { await dbBulkUpdate(ids, { domain }); setSelectedIds([]); setMultiSelectMode(false); await refresh() }}
              onBulkUpdateStatus={async (ids, status) => { await dbBulkUpdate(ids, { reviewStatus: status }); setSelectedIds([]); setMultiSelectMode(false); await refresh() }}
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
          // 开始AI处理
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
 