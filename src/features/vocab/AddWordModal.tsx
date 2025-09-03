import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { addToBasket } from '@lib/ipc'
import type { BasketAddResult } from '../../../shared/types'

interface AddWordModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export default function AddWordModal({ isOpen, onClose, onSuccess }: AddWordModalProps) {
  const { t } = useTranslation()
  const [term, setTerm] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!term.trim()) return

    setIsLoading(true)
    setError('')

    try {
      const result: BasketAddResult = await addToBasket(term.trim())
      if (result.ok) {
        setTerm('')
        onSuccess?.()
        onClose()
      } else {
        setError(result.error || t('modal.addWord.errors.failed'))
      }
    } catch (err: unknown) {
      setError(t('modal.addWord.errors.failed'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">
            <span className="modal-icon">➕</span>
            {t('modal.addWord.title')}
          </h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        
        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-group">
            <label className="form-label">{t('modal.addWord.label')}</label>
            <input
              type="text"
              className="form-input"
              placeholder={t('modal.addWord.placeholder')}
              value={term}
              onChange={e => setTerm(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
              disabled={isLoading}
            />
            {error && <div className="form-error">{error}</div>}
          </div>
          
          <div className="form-tips">
            <div className="tip-item">
              <span className="tip-icon">💡</span>
              <span>{t('modal.addWord.tips.support')}</span>
            </div>
            <div className="tip-item">
              <span className="tip-icon">🔄</span>
              <span>{t('modal.addWord.tips.deduplicate')}</span>
            </div>
          </div>
        </form>
        
        <div className="modal-footer">
          <button 
            className="btn btn-secondary" 
            onClick={onClose}
            disabled={isLoading}
          >
            {t('modal.addWord.cancel')}
          </button>
          <button 
            className="btn btn-primary" 
            onClick={handleSubmit}
            disabled={!term.trim() || isLoading}
          >
            {isLoading ? t('modal.addWord.adding') : t('modal.addWord.addButton')}
          </button>
        </div>
      </div>
    </div>
  )
}
