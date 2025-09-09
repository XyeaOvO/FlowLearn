import { useEffect, useState } from 'react'
import { Word, Settings } from '../../../shared/types'
import { reviewApply, reviewDue, getSettings as ipcGetSettings, ReviewGrade } from '../../lib/ipc'
import { useTranslation } from 'react-i18next'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { ArrowLeftIcon, VolumeIcon, ChevronDownIcon, SearchIcon, XIcon, WarningIcon, InfoIcon, CheckIcon } from '../../shared/components/Icon'

export default function Review({ onBack, refresh }: { onBack: () => void; refresh: () => void }) {
  const { t } = useTranslation()
  const [queue, setQueue] = useState<Word[]>([])
  const [current, setCurrent] = useState<Word | null>(null)
  const [reviewSettings, setReviewSettings] = useState<Settings | null>(null)
  const [isCardFlipped, setIsCardFlipped] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const load = async () => {
    setIsLoading(true)
    const due = await reviewDue() as Word[]

    await new Promise(resolve => setTimeout(resolve, 100))
    setQueue(due)
    setCurrent(due[0] ?? null)
    setIsCardFlipped(false)
    setIsTransitioning(false)
    setIsLoading(false)
  }

  useEffect(() => { load(); (async () => setReviewSettings(await ipcGetSettings() as Settings))() }, [])

  const next = () => {
    setIsTransitioning(true)
    setTimeout(() => {
      setQueue(q => {
        const [, ...rest] = q
        setCurrent(rest[0] ?? null)
        setIsCardFlipped(false)
        setIsTransitioning(false)
        return rest
      })
    }, 300)
  }

  const apply = async (grade: ReviewGrade) => {
    if (!current) return
    await reviewApply(current.id, grade)
    await refresh()
    next()
  }


  useEffect(() => {
    if (current && reviewSettings?.ttsEnabled && reviewSettings?.ttsAutoOnSelect) {
      try {
        if (reviewSettings.ttsProvider === 'volcengine') {
          (async () => {
            const res = await window.api.invoke('tts:volc:query', current.term) as { ok: boolean; base64?: string; encoding?: string; error?: string }
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
        if (s) {
          const u = new SpeechSynthesisUtterance(current.term)
          if (reviewSettings.ttsLang) u.lang = reviewSettings.ttsLang
          if (reviewSettings.ttsRate) u.rate = reviewSettings.ttsRate
          if (reviewSettings.ttsPitch) u.pitch = reviewSettings.ttsPitch
          if (reviewSettings.ttsVoice) {
            const v = s.getVoices().find(v => v.name === reviewSettings.ttsVoice)
            if (v) u.voice = v
          }
          s.cancel()
        s.speak(u)
        }
      } catch {
        // TTS播放失败，忽略错误
      }
    }
  }, [current, reviewSettings])

  if (isLoading) return (
    <div className="modern-review-container">
      <div className="review-header">
        <button className="back-button" onClick={onBack}>
          <ArrowLeftIcon size={20} />
          {t('review.back')}
        </button>
      </div>
      <div className="review-stage">
        <div className="loading-card">
          <div className="loading-spinner"></div>
          <p className="loading-text">正在加载复习内容...</p>
        </div>
      </div>
    </div>
  )

  if (!current) return (
    <div className="modern-review-container">
      <div className="review-header">
        <button className="back-button" onClick={onBack}>
          <ArrowLeftIcon size={20} />
          {t('review.back')}
        </button>
      </div>
      <div className="completion-celebration">
        <div className="celebration-animation">
          <div className="celebration-icon">🎉</div>
          <div className="celebration-particles">
            <div className="particle"></div>
            <div className="particle"></div>
            <div className="particle"></div>
            <div className="particle"></div>
            <div className="particle"></div>
          </div>
        </div>
        <h2 className="celebration-title">{t('review.great')}</h2>
        <p className="celebration-subtitle">{t('review.noneDue')}</p>
        <div className="celebration-stats">
          <div className="stat-badge">
            <span className="stat-icon">📚</span>
            <span className="stat-text">今日任务完成</span>
          </div>
        </div>
      </div>
    </div>
  )

  const handleShowAnswer = () => {
    setIsCardFlipped(true)
  }

  const speakWord = () => {
    try {
      if (reviewSettings?.ttsProvider === 'volcengine') {
        (async () => {
          const res = await window.api.invoke('tts:volc:query', current.term) as { ok: boolean; base64?: string; encoding?: string; error?: string }
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
      const u = new SpeechSynthesisUtterance(current.term)
      if (reviewSettings?.ttsLang) u.lang = reviewSettings.ttsLang
      if (reviewSettings?.ttsRate) u.rate = reviewSettings.ttsRate
      if (reviewSettings?.ttsPitch) u.pitch = reviewSettings.ttsPitch
      if (reviewSettings?.ttsVoice) {
        const v = s.getVoices().find(v => v.name === reviewSettings.ttsVoice)
        if (v) u.voice = v
      }
      s.cancel()
      s.speak(u)
    } catch {
        // TTS播放失败，忽略错误
      }
  }

  return (
    <div className="modern-review-container">
      {/* Header */}
      <div className="review-header">
        <button className="back-button" onClick={onBack}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m12 19-7-7 7-7"/>
            <path d="m19 12H5"/>
          </svg>
          {t('review.back')}
        </button>
        
        <div className="progress-info">
          <div className="progress-ring">
            <svg className="progress-svg" width="40" height="40">
              <circle
                cx="20"
                cy="20"
                r="16"
                fill="none"
                stroke="var(--border)"
                strokeWidth="3"
              />
              <circle
                cx="20"
                cy="20"
                r="16"
                fill="none"
                stroke="var(--primary)"
                strokeWidth="3"
                strokeDasharray={`${2 * Math.PI * 16}`}
                strokeDashoffset={`${2 * Math.PI * 16 * queue.length / (queue.length + 1)}`}
                style={{ transition: 'stroke-dashoffset 0.5s ease' }}
              />
            </svg>
            <span className="progress-count">{queue.length}</span>
          </div>
          <span className="progress-text">{t('review.remaining', { count: queue.length })}</span>
        </div>
      </div>

      {/* Main Card */}
      <div className="review-stage">
        <div className={`flashcard ${isCardFlipped ? 'flipped' : ''} ${isTransitioning ? 'transitioning' : ''}`}>
          {/* Front Side */}
          <div className="card-face card-front">
            <div className="card-content">
              <div className="word-display">
                <h1 className="word-term">{current.term}</h1>
                {reviewSettings?.ttsEnabled && (
                  <button className="tts-button" onClick={speakWord} aria-label="发音">
                    <VolumeIcon size={24} />
                  </button>
                )}
              </div>
              
              <div className="card-hint">
                <span className="hint-text">点击下方按钮查看释义</span>
              </div>
            </div>
            
            <div className="card-action">
              <button className="reveal-button" onClick={handleShowAnswer}>
                <span>显示答案</span>
                <ChevronDownIcon size={20} />
              </button>
            </div>
          </div>

          {/* Back Side */}
          <div className="card-face card-back">
            <div className="card-content">
              <div className="word-header">
                <h2 className="word-term-small">{current.term}</h2>
                <span className="word-phonetic">[{current.phonetic}]</span>
              </div>
              
              <div className="definition-section">
                <h3 className="section-title">释义</h3>
                <p className="definition-text">{current.definition}</p>
              </div>
              
              {current.example && (
                <div className="example-section">
                  <h3 className="section-title">例句</h3>
                  <p className="example-text">{current.example}</p>
                </div>
              )}
              
              <div className="details-section">
                <button 
                  className="details-button" 
                  onClick={() => setShowDetails(true)}
                >
                  <SearchIcon size={16} />
                  查看详情
                </button>
              </div>
            </div>
            
            <div className="difficulty-buttons">
              <div className="button-grid">
                <button 
                  className="difficulty-btn difficulty-again" 
                  onClick={() => apply('again')}
                >
                  <span className="btn-icon"><WarningIcon size={20} color="#ef4444" /></span>
                  <span className="btn-text">{t('review.again')}</span>
                  <span className="btn-subtitle">需要再学</span>
                </button>
                
                <button 
                  className="difficulty-btn difficulty-hard" 
                  onClick={() => apply('hard')}
                >
                  <span className="btn-icon"><InfoIcon size={20} color="#f59e0b" /></span>
                  <span className="btn-text">{t('review.hard')}</span>
                  <span className="btn-subtitle">比较困难</span>
                </button>
                
                <button 
                  className="difficulty-btn difficulty-good" 
                  onClick={() => apply('good')}
                >
                  <span className="btn-icon"><CheckIcon size={20} color="#10b981" /></span>
                  <span className="btn-text">{t('review.good')}</span>
                  <span className="btn-subtitle">还不错</span>
                </button>
                
                <button 
                  className="difficulty-btn difficulty-easy" 
                  onClick={() => apply('easy')}
                >
                  <span className="btn-icon"><CheckIcon size={20} color="#3b82f6" /></span>
                  <span className="btn-text">{t('review.easy')}</span>
                  <span className="btn-subtitle">很简单</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Details Modal */}
      {showDetails && current && (
        (() => {
          const word = current as Word;
          return (
            <div className="details-modal-overlay" onClick={() => setShowDetails(false)}>
              <div className="details-modal" onClick={e => e.stopPropagation()}>
                <div className="details-modal-header">
                  <h2 className="details-modal-title">{word.term}</h2>
                  <button className="details-modal-close" onClick={() => setShowDetails(false)}>
                    <XIcon size={20} />
                  </button>
                </div>
                
                <div className="details-modal-content">
                  {word.analysis ? (
                    <div className="analysis-content" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(marked.parse(word.analysis) as string) }} />
                  ) : (
                    <div className="no-analysis">
                      <div className="no-analysis-icon">📝</div>
                      <h3 className="no-analysis-title">暂无讲解</h3>
                      <p className="no-analysis-text">这个单词还没有生成详细的讲解内容</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })()
      )}
    </div>
  )
}


