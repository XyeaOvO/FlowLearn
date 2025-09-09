import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { useEffect, useCallback } from 'react'
import type { Word, Settings } from '../../../shared/types'
import { toDateInputValue, formatDate } from '../../lib/date'
import { useTranslation } from 'react-i18next'
import { VolumeIcon, EditIcon, RobotIcon, TargetIcon } from '../../shared/components/Icon'
import { NoSelectionState } from '../../shared/components/EmptyState'

export default function DetailPane({
  word,
  editing,
  draft,
  setDraft,
  setEditing,
  speak,
  onDelete,
  onSave,
  settings,
}: {
  word: Word | null
  editing: boolean
  draft: Word | null
  setDraft: (w: Word | null) => void
  setEditing: (b: boolean) => void
  speak: (t: string) => void
  onDelete: () => void
  onSave: () => void
  settings: Settings | null
}) {
  const { t } = useTranslation()
  

  const handleAutoSpeak = useCallback(() => {
    if (word && word.term && settings?.ttsEnabled && settings?.ttsAutoOnSelect) {
      speak(word.term)
    }
  }, [word, settings?.ttsEnabled, settings?.ttsAutoOnSelect, speak])

  useEffect(() => {
    handleAutoSpeak()
  }, [handleAutoSpeak])

  if (!word) return (
    <div className="detail-pane">
      <div className="detail-empty">
        <NoSelectionState />
      </div>
    </div>
  )

  return (
    <div className="detail-pane">
      <div className="detail-content">
        <div className="detail-header">
          <div className="detail-title">
            {word.term}
            <button className="tts-button-detail" onClick={() => speak(word.term)} aria-label="发音">
              <VolumeIcon size={20} />
            </button>
            <span className={`badge ${word.reviewStatus === 'new' ? 'badge-info' : word.reviewStatus === 'learning' ? 'badge-warning' : 'badge-success'}`} style={{ marginLeft: 12, verticalAlign: 'middle' }}>
              {word.reviewStatus === 'new' ? t('status.new') : word.reviewStatus === 'learning' ? t('status.learning') : t('status.mastered')}
            </span>
          </div>
          <div className="detail-phonetic">[{word.phonetic}]</div>
        </div>
        {!editing ? (
          <>
            <div className="detail-meta">
              <div className="meta-item">
                <div className="meta-label">{t('detail.domain')}</div>
                <div className="meta-value">{word.domain || '通用'}</div>
              </div>
              <div className="meta-item">
                <div className="meta-label">{t('detail.addedAt')}</div>
                <div className="meta-value">{formatDate(word.addedAt)}</div>
              </div>
              <div className="meta-item">
                <div className="meta-label">{t('detail.nextReview')}</div>
                <div className="meta-value">{formatDate(word.reviewDueDate) || '未安排'}</div>
              </div>
            </div>
            {/* FSRS metrics */}
            <div className="detail-section">
              <div className="detail-section-title">{t('detail.fsrs')}</div>
              <div className="detail-section-content">
                {(() => {
                  const difficulty = (word.fsrsDifficulty ?? null)
                  const stability = (word.fsrsStability ?? null)
                  const repetitions = word.fsrsReps ?? 0
                  const lapseCount = word.fsrsLapses ?? 0
                  const lastReviewedAt = word.fsrsLastReviewedAt ?? null
                  const currentTime = Date.now()
                  let retrievability = 0
                  if (lastReviewedAt && stability && stability > 0) {
                    const elapsedDays = (currentTime - lastReviewedAt) / (24 * 60 * 60 * 1000)
                    retrievability = Math.exp(Math.log(0.9) * (elapsedDays / stability))
                    if (!isFinite(retrievability) || retrievability < 0) retrievability = 0
                    if (retrievability > 1) retrievability = 1
                  } else {
                    retrievability = 0
                  }
                  const retrievabilityPercentage = Math.round(retrievability * 100)
                  return (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <div className="meta-label">{t('detail.difficulty')}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span className="badge badge-neutral">{difficulty ? `${difficulty}/10` : '—'}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <div className="meta-label">{t('detail.stability')}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span className="badge badge-neutral">{stability != null ? `${(stability as number).toFixed(1)} d` : '—'}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <div className="meta-label">{t('detail.retrievability')}</div>
                        <div>
                          <div style={{ height: 8, background: 'var(--border-subtle)', borderRadius: 999, overflow: 'hidden' }}>
                            <div style={{ width: `${retrievabilityPercentage}%`, height: '100%', background: 'var(--primary)', transition: 'width .2s ease' }} />
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>{retrievabilityPercentage}%</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <div className="meta-label">{t('detail.reps')}</div>
                        <div className="badge badge-neutral">{repetitions}</div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <div className="meta-label">{t('detail.lapses')}</div>
                        <div className="badge badge-neutral">{lapseCount}</div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <div className="meta-label">{t('detail.lastReviewedAt')}</div>
                        <div className="badge badge-neutral">{lastReviewedAt ? formatDate(lastReviewedAt) : '—'}</div>
                      </div>
                    </div>
                  )
                })()}
              </div>
            </div>
            <div className="detail-section">
              <div className="detail-section-title">{t('detail.definition')}</div>
              <div className="detail-section-content">{word.definition}</div>
            </div>
            <div className="detail-section">
              <div className="detail-section-title">{t('detail.example')}</div>
              <div className="detail-section-content" style={{ whiteSpace: 'pre-wrap' }}>{word.example}</div>
            </div>
          </>
        ) : (
          draft && (
            <div className="detail-section">
              <div className="detail-section-title">{t('actions.edit')}</div>
              <div className="detail-section-content" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">单词</label>
                  <input className="input" value={draft.term} onChange={e => setDraft({ ...draft, term: e.target.value } as Word)} />
                </div>
                <div className="form-group">
                  <label className="form-label">音标</label>
                  <input className="input" value={draft.phonetic} onChange={e => setDraft({ ...draft, phonetic: e.target.value } as Word)} />
                </div>
                <div className="form-group">
                  <label className="form-label">领域</label>
                  <input className="input" value={draft.domain || ''} onChange={e => setDraft({ ...draft, domain: e.target.value } as Word)} />
                </div>
                <div className="form-group">
                  <label className="form-label">释义</label>
                  <textarea className="textarea" style={{ height: 100 }} value={draft.definition} onChange={e => setDraft({ ...draft, definition: e.target.value } as Word)} />
                </div>
                <div className="form-group">
                  <label className="form-label">例句</label>
                  <textarea className="textarea" style={{ height: 120 }} value={draft.example} onChange={e => setDraft({ ...draft, example: e.target.value } as Word)} />
                </div>
                <div className="form-group">
                  <label className="form-label">下次复习日期</label>
                  <input className="input" type="date" value={toDateInputValue(draft.reviewDueDate)} onChange={e => setDraft({ ...draft, reviewDueDate: e.target.value ? new Date(e.target.value + 'T00:00:00').getTime() : null } as Word)} />
                  <div className="form-help">留空表示未安排</div>
                </div>
              </div>
            </div>
          )
        )}
        <div className="toolbar">
          {!editing && (
            <button className="btn" onClick={() => { setEditing(true); setDraft(word) }}><EditIcon size={16} /> 编辑</button>
          )}
          {editing && (
            <>
              <button className="btn" onClick={() => { setEditing(false); setDraft(word) }}>{t('actions.cancel')}</button>
              <button className="btn btn-primary" onClick={onSave}>{t('actions.save')}</button>
            </>
          )}
          <button className="btn btn-danger" onClick={() => {
            console.log('删除按钮被点击')
            onDelete()
          }}>{t('actions.deleteWord')}</button>
        </div>

        {(!editing && word.analysis) && (
          <div className="analysis-card">
            <div className="analysis-header">
              <div className="analysis-title">{t('detail.analysis')}</div>
              <div className="toolbar">
                <button className="btn btn-ghost" onClick={() => navigator.clipboard.writeText(word.analysis || '')}>{t('actions.copy')}</button>
                <button className="btn btn-ghost" onClick={() => {
                  const blob = new Blob([word.analysis || ''], { type: 'text/plain;charset=utf-8' })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = `${word.term}-analysis.txt`
                  a.click()
                  URL.revokeObjectURL(url)
                }}>{t('actions.export')}</button>
              </div>
            </div>
            <div className="analysis-content" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(marked.parse(word.analysis || '') as string) }} />
          </div>
        )}
      </div>
    </div>
  )
}


