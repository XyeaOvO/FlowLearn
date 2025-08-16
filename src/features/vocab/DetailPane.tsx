import { marked } from 'marked'
import DOMPurify from 'dompurify'
import type { Word } from '../../../shared/types'
import { toDateInputValue, formatDate } from '../../lib/date'
import { useTranslation } from 'react-i18next'

export default function DetailPane({
  word,
  editing,
  draft,
  setDraft,
  setEditing,
  speak,
  onDelete,
  onSave,
}: {
  word: Word | null
  editing: boolean
  draft: Word | null
  setDraft: (w: Word | null) => void
  setEditing: (b: boolean) => void
  speak: (t: string) => void
  onDelete: () => void
  onSave: () => void
}) {
  const { t } = useTranslation()
  if (!word) return (
    <div className="detail-pane">
      <div className="detail-empty">
        <div className="empty-state">
          <div className="empty-state-icon">👈</div>
          <div className="empty-state-title">{t('detail.selectTitle')}</div>
          <div className="empty-state-description">{t('detail.selectDesc')}</div>
        </div>
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
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
              </svg>
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
                  const d = (word.fsrsDifficulty ?? null)
                  const s = (word.fsrsStability ?? null)
                  const reps = word.fsrsReps ?? 0
                  const lapses = word.fsrsLapses ?? 0
                  const last = word.fsrsLastReviewedAt ?? null
                  const now = Date.now()
                  let r = 0
                  if (last && s && s > 0) {
                    const elapsedDays = (now - last) / (24 * 60 * 60 * 1000)
                    r = Math.exp(Math.log(0.9) * (elapsedDays / s))
                    if (!isFinite(r) || r < 0) r = 0
                    if (r > 1) r = 1
                  } else {
                    r = 0
                  }
                  const rPct = Math.round(r * 100)
                  return (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <div className="meta-label">{t('detail.difficulty')}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span className="badge badge-neutral">{d ? `${d}/10` : '—'}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <div className="meta-label">{t('detail.stability')}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span className="badge badge-neutral">{s != null ? `${(s as number).toFixed(1)} d` : '—'}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <div className="meta-label">{t('detail.retrievability')}</div>
                        <div>
                          <div style={{ height: 8, background: 'var(--border-subtle)', borderRadius: 999, overflow: 'hidden' }}>
                            <div style={{ width: `${rPct}%`, height: '100%', background: 'var(--primary)', transition: 'width .2s ease' }} />
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>{rPct}%</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <div className="meta-label">{t('detail.reps')}</div>
                        <div className="badge badge-neutral">{reps}</div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <div className="meta-label">{t('detail.lapses')}</div>
                        <div className="badge badge-neutral">{lapses}</div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <div className="meta-label">{t('detail.lastReviewedAt')}</div>
                        <div className="badge badge-neutral">{last ? formatDate(last) : '—'}</div>
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
            <button className="btn" onClick={() => { setEditing(true); setDraft(word) }}>编辑</button>
          )}
          {editing && (
            <>
              <button className="btn" onClick={() => { setEditing(false); setDraft(word) }}>{t('actions.cancel')}</button>
              <button className="btn btn-primary" onClick={onSave}>{t('actions.save')}</button>
            </>
          )}
          <button className="btn btn-danger" onClick={onDelete}>{t('actions.deleteWord')}</button>
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


