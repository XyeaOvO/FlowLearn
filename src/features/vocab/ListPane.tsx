import { useState, useRef, useEffect } from 'react'
import type { Word } from '@common/types'
import { type VocabFilter } from './filters'
import { useTranslation } from 'react-i18next'
import { useOptimizedFilter } from '@shared/lib/useOptimizedFilter'
import VirtualizedWordList from '@shared/components/VirtualizedWordList'
import { SearchIcon, SettingsIcon, TrashIcon, RefreshIcon } from '@shared/components/Icon'
import { NoDataState, NoResultsState } from '@shared/components/EmptyState'
import { useToastActions } from '@shared/components/Toast'
import { useConfirmActions } from '@shared/components/ConfirmDialog'

export default function ListPane({
  words,
  selectedId,
  onSelect,
  filter,
  domainOptions,
  ui,
  selectionMode,
  setSelectionMode,
  selectedIds,
  setSelectedIds,
  onBulkDelete,
  onBulkRestore,
  onBulkUpdateDomain,
  onBulkUpdateStatus,
  width,
}: {
  words: Word[]
  selectedId: string | null
  onSelect: (w: Word) => void
  filter: VocabFilter
  domainOptions: string[]
  ui: {
    search: string; setSearch: (s: string) => void
    status: VocabFilter['status']; setStatus: (s: VocabFilter['status']) => void
    from: string; setFrom: (s: string) => void
    to: string; setTo: (s: string) => void
    domain: string; setDomain: (s: string) => void
    requireExample: boolean; setRequireExample: (b: boolean) => void
    requirePhonetic: boolean; setRequirePhonetic: (b: boolean) => void
    useRegex: boolean; setUseRegex: (b: boolean) => void
    regex: string; setRegex: (s: string) => void
    showDeleted?: boolean; setShowDeleted?: (b: boolean) => void
  }
  selectionMode: boolean
  setSelectionMode: (b: boolean) => void
  selectedIds: string[]
  setSelectedIds: (ids: string[]) => void
  onBulkDelete: (ids: string[]) => void
  onBulkRestore: (ids: string[]) => void
  onBulkUpdateDomain: (ids: string[], domain: string) => void
  onBulkUpdateStatus: (ids: string[], status: Word['reviewStatus']) => void
  width?: number
}) {

   const { filteredWords: filtered } = useOptimizedFilter(words, filter)
  const { t } = useTranslation()
  const [bulkDomain, setBulkDomain] = useState('')
  const [bulkStatus, setBulkStatus] = useState<Word['reviewStatus']>('learning')
  const [showFilters, setShowFilters] = useState(false)
  const listContentRef = useRef<HTMLDivElement>(null)
  const [containerHeight, setContainerHeight] = useState(400)
  const { showSuccess, showError } = useToastActions()
  const { confirmBulkDelete } = useConfirmActions()

  const toggleId = (id: string) => {
    if (selectedIds.includes(id)) setSelectedIds(selectedIds.filter(x => x !== id))
    else setSelectedIds([...selectedIds, id])
  }
  const allIds = filtered.map(w => w.id)
  const allChecked = selectedIds.length > 0 && selectedIds.length === allIds.length
  const anyChecked = selectedIds.length > 0
  const checkAll = (checked: boolean) => {
    setSelectedIds(checked ? allIds : [])
  }

  useEffect(() => {
    const updateHeight = () => {
      if (listContentRef.current) {
        const rect = listContentRef.current.getBoundingClientRect()
        const availableHeight = rect.height - 32 // 减去padding
        setContainerHeight(Math.max(200, availableHeight))
      }
    }

    updateHeight()
    window.addEventListener('resize', updateHeight)
    return () => window.removeEventListener('resize', updateHeight)
  }, [showFilters, selectionMode, anyChecked])

  return (
    <div className="list-pane" style={width ? { width } : undefined}>
      <div className="list-header">
        {/* Primary Search Bar */}
        <div className="search-section">
          <div className="search-input-container">
            <SearchIcon size={16} className="search-icon" />
            <input 
              className="search-input" 
              placeholder={t('list.searchPlaceholder')} 
              value={ui.search} 
              onChange={e => ui.setSearch(e.target.value)} 
            />
            {ui.search && (
              <button className="search-clear" onClick={() => ui.setSearch('')}>✕</button>
            )}
          </div>
          <button 
            className={`filter-toggle ${Object.values(filter).some(v => v !== '' && v !== 'all' && v !== false) ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <SettingsIcon size={16} className="filter-icon" />
            筛选
            {Object.values(filter).some(v => v !== '' && v !== 'all' && v !== false) && (
              <span className="filter-badge">•</span>
            )}
          </button>
          <button className="selection-toggle" onClick={() => { setSelectionMode(!selectionMode); setSelectedIds([]) }}>
            {selectionMode ? '完成' : '多选'}
          </button>
        </div>

        {/* Quick Status Filters */}
        <div className="quick-filters">
          {(['all', 'new', 'learning', 'mastered'] as const).map(status => (
            <button
              key={status}
              className={`quick-filter ${ui.status === status ? 'active' : ''}`}
              onClick={() => ui.setStatus(status)}
            >
              <span className={`status-indicator ${status}`} />
              {status === 'all' ? t('status.all') : 
               status === 'new' ? t('status.new') :
               status === 'learning' ? t('status.learning') : t('status.mastered')}
            </button>
          ))}
        </div>

        {/* Advanced Filters Panel */}
        {showFilters && (
          <div className="filters-panel">
            <div className="filters-row">
              <div className="filter-group domain">
                <label className="filter-label">领域</label>
                <input 
                  className="filter-input" 
                  placeholder="所有领域" 
                  value={ui.domain === 'all' ? '' : ui.domain} 
                  onChange={e => ui.setDomain(e.target.value || 'all')} 
                  list="domain-filter-options" 
                />
                <datalist id="domain-filter-options">
                  <option value="">所有</option>
                  {domainOptions.filter(d => d !== 'all').map(d => <option key={d} value={d} />)}
                </datalist>
              </div>
              
              <div className="filter-group date-range">
                <label className="filter-label">时间范围</label>
                <div className="date-inputs">
                  <input 
                    className="filter-input date" 
                    type="date" 
                    value={ui.from} 
                    onChange={e => ui.setFrom(e.target.value)}
                    placeholder="开始日期"
                  />
                  <span className="date-separator">至</span>
                  <input 
                    className="filter-input date" 
                    type="date" 
                    value={ui.to} 
                    onChange={e => ui.setTo(e.target.value)}
                    placeholder="结束日期"
                  />
                </div>
              </div>
            </div>

            <div className="filters-row">
              <div className="filter-options">
                <label className="filter-option">
                  <input 
                    type="checkbox" 
                    checked={ui.requireExample} 
                    onChange={e => ui.setRequireExample(e.target.checked)} 
                  />
                  <span className="checkmark"></span>
                  例句
                </label>
                <label className="filter-option">
                  <input 
                    type="checkbox" 
                    checked={ui.requirePhonetic} 
                    onChange={e => ui.setRequirePhonetic(e.target.checked)} 
                  />
                  <span className="checkmark"></span>
                  音标
                </label>
                <label className="filter-option">
                  <input 
                    type="checkbox" 
                    checked={ui.useRegex} 
                    onChange={e => ui.setUseRegex(e.target.checked)} 
                  />
                  <span className="checkmark"></span>
                  正则
                </label>
                {ui.setShowDeleted && (
                  <label className="filter-option">
                    <input 
                      type="checkbox" 
                      checked={!!ui.showDeleted} 
                      onChange={e => ui.setShowDeleted!(e.target.checked)} 
                    />
                    <span className="checkmark"></span>
                    回收站
                  </label>
                )}
              </div>
              
              {ui.useRegex && (
                <div className="filter-group regex">
                  <input 
                    className="filter-input regex-input" 
                    placeholder="正则表达式，如: ^re.+"
                    value={ui.regex} 
                    onChange={e => ui.setRegex(e.target.value)} 
                  />
                </div>
              )}
            </div>

            <div className="filter-actions">
              <button 
                className="filter-clear" 
                onClick={() => {
                  ui.setSearch('')
                  ui.setStatus('all')
                  ui.setDomain('')
                  ui.setFrom('')
                  ui.setTo('')
                  ui.setRequireExample(false)
                  ui.setRequirePhonetic(false)
                  ui.setUseRegex(false)
                  ui.setRegex('')
                  if (ui.setShowDeleted) ui.setShowDeleted(false)
                }}
              >
                <TrashIcon size={16} /> 清除筛选
              </button>
            </div>
          </div>
        )}
      </div>
      {selectionMode && (
        <div className="selection-panel">
          <div className="selection-info">
            <label className="select-all-option">
              <input 
                type="checkbox" 
                checked={allChecked} 
                onChange={e => checkAll(e.target.checked)} 
              />
              <span className="checkmark"></span>
              全选
            </label>
            <div className="selection-count">
              已选择 <span className="count-number">{selectedIds.length}</span> 项
            </div>
          </div>

          {anyChecked && (
            <div className="selection-actions">
              {!ui.showDeleted ? (
                <>
                  <div className="bulk-action-group">
                    <label className="action-label">状态</label>
                    <select 
                      className="action-select" 
                      value={bulkStatus} 
                      onChange={e => setBulkStatus(e.target.value as Word['reviewStatus'])}
                    >
                      <option value="new">{t('status.new')}</option>
                      <option value="learning">{t('status.learning')}</option>
                      <option value="mastered">{t('status.mastered')}</option>
                    </select>
                    <button 
                      className="action-apply"
                      onClick={() => onBulkUpdateStatus(selectedIds, bulkStatus)}
                    >
                      应用
                    </button>
                  </div>

                  <div className="bulk-action-group">
                    <label className="action-label">领域</label>
                    <input 
                      className="action-input" 
                      placeholder="输入或选择领域" 
                      value={bulkDomain} 
                      onChange={e => setBulkDomain(e.target.value)} 
                      list="domain-options" 
                    />
                    <datalist id="domain-options">
                      {domainOptions.map(d => <option key={d} value={d} />)}
                    </datalist>
                    <button 
                      className="action-apply"
                      disabled={!bulkDomain.trim()}
                      onClick={() => onBulkUpdateDomain(selectedIds, bulkDomain.trim())}
                    >
                      应用
                    </button>
                  </div>

                  <button 
                    className="action-delete"
                    onClick={() => {
                      confirmBulkDelete(selectedIds.length, async () => {
                        try {
                          await onBulkDelete(selectedIds)
                          showSuccess('批量删除成功', `已删除 ${selectedIds.length} 个单词`)
                          setSelectedIds([])
                          setSelectionMode(false)
                        } catch (error) {
                          showError('批量删除失败', '删除过程中出现错误，请重试')
                        }
                      })
                    }}
                  >
                    <TrashIcon size={16} /> 批量删除
                  </button>
                </>
              ) : (
                <button 
                  className="action-restore"
                  onClick={async () => {
                    try {
                      await onBulkRestore(selectedIds)
                      showSuccess('批量恢复成功', `已恢复 ${selectedIds.length} 个单词`)
                      setSelectedIds([])
                      setSelectionMode(false)
                    } catch (error) {
                      showError('批量恢复失败', '恢复过程中出现错误，请重试')
                    }
                  }}
                >
                  <RefreshIcon size={16} /> 批量恢复
                </button>
              )}
            </div>
          )}
        </div>
      )}
      <div className="list-content" ref={listContentRef}>
        {filtered.length === 0 ? (
          words.length === 0 ? (
            <NoDataState />
          ) : (
            <NoResultsState 
              query={ui.search || (ui.domain && `领域: ${ui.domain}`) || undefined}
              onClear={() => {
                ui.setSearch('')
                ui.setDomain('')
                ui.setStatus('all')
                ui.setFrom('')
                ui.setTo('')
                ui.setRequireExample(false)
                ui.setRequirePhonetic(false)
                ui.setUseRegex(false)
                ui.setRegex('')
              }}
            />
          )
        ) : (
          <VirtualizedWordList
            words={filtered}
            selectedId={selectedId}
            onSelect={onSelect}
            containerHeight={containerHeight} // 可以根据需要调整高度
            selectionMode={selectionMode}
            selectedIds={selectedIds}
            onToggleSelection={toggleId}
            renderItem={(word) => (
              <div 
                className={`list-item ${selectionMode && selectedIds.includes(word.id) ? 'active' : (selectedId === word.id ? 'active' : '')}`}
                onClick={() => {
                  if (selectionMode) {
                    toggleId(word.id)
                  } else {
                    onSelect(word)
                  }
                }}
                style={{ cursor: 'pointer' }}
              >
                <div className="list-item-header">
                  <div className="title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {selectionMode && (
                      <input 
                        type="checkbox" 
                        checked={selectedIds.includes(word.id)} 
                        onChange={() => toggleId(word.id)} 
                        onClick={e => { e.stopPropagation(); }} 
                      />
                    )}
                    <span>{word.term}</span>
                  </div>
                  <div className={`badge ${word.reviewStatus === 'new' ? 'badge-info' : word.reviewStatus === 'learning' ? 'badge-warning' : 'badge-success'}`}>
                    {word.reviewStatus === 'new' ? t('status.new') : word.reviewStatus === 'learning' ? t('status.learning') : t('status.mastered')}
                  </div>
                </div>
                <div className="meta">{t('detail.addedAt')} {formatSimpleDate(word.addedAt)}</div>
              </div>
            )}
          />
        )}
      </div>
    </div>
  )
}

function formatSimpleDate(ts: number) {
  const d = new Date(ts)
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}


