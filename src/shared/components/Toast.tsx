import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { CheckIcon, WarningIcon, InfoIcon, CloseIcon } from './Icon'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

interface ToastContextType {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => string
  removeToast: (id: string) => void
  success: (title: string, message?: string, options?: Partial<Toast>) => string
  error: (title: string, message?: string, options?: Partial<Toast>) => string
  warning: (title: string, message?: string, options?: Partial<Toast>) => string
  info: (title: string, message?: string, options?: Partial<Toast>) => string
}

const ToastContext = createContext<ToastContextType | null>(null)

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

const toastIcons: Record<ToastType, React.ReactNode> = {
  success: <CheckIcon size={20} />,
  error: <WarningIcon size={20} />,
  warning: <WarningIcon size={20} />,
  info: <InfoIcon size={20} />
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const [isVisible, setIsVisible] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)

  useEffect(() => {
    // 入场动画
    const timer = setTimeout(() => setIsVisible(true), 10)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (toast.duration && toast.duration > 0) {
      const timer = setTimeout(() => {
        handleRemove()
      }, toast.duration)
      return () => clearTimeout(timer)
    }
  }, [toast.duration])

  const handleRemove = useCallback(() => {
    setIsLeaving(true)
    setTimeout(() => {
      onRemove(toast.id)
    }, 300) // 等待退场动画完成
  }, [toast.id, onRemove])

  return (
    <div 
      className={`toast toast-${toast.type} ${
        isVisible && !isLeaving ? 'toast-visible' : ''
      } ${isLeaving ? 'toast-leaving' : ''}`}
    >
      <div className="toast-icon">
        {toastIcons[toast.type]}
      </div>
      
      <div className="toast-content">
        <div className="toast-title">{toast.title}</div>
        {toast.message && (
          <div className="toast-message">{toast.message}</div>
        )}
        {toast.action && (
          <button 
            className="toast-action"
            onClick={() => {
              toast.action!.onClick()
              handleRemove()
            }}
          >
            {toast.action.label}
          </button>
        )}
      </div>
      
      <button 
        className="toast-close"
        onClick={handleRemove}
        aria-label="关闭通知"
      >
        <CloseIcon size={16} />
      </button>
    </div>
  )
}

function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: string) => void }) {
  if (toasts.length === 0) return null

  return (
    <div className="toast-container">
      {toasts.map(toast => (
        <ToastItem 
          key={toast.id} 
          toast={toast} 
          onRemove={onRemove}
        />
      ))}
    </div>
  )
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast: Toast = {
      ...toast,
      id,
      duration: toast.duration ?? 5000 // 默认5秒
    }
    
    setToasts(prev => [...(prev || []), newToast])
    return id
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => (prev || []).filter(toast => toast.id !== id))
  }, [])

  const success = useCallback((title: string, message?: string, options?: Partial<Toast>) => {
    return addToast({ ...options, type: 'success', title, message })
  }, [addToast])

  const error = useCallback((title: string, message?: string, options?: Partial<Toast>) => {
    return addToast({ ...options, type: 'error', title, message, duration: options?.duration ?? 8000 })
  }, [addToast])

  const warning = useCallback((title: string, message?: string, options?: Partial<Toast>) => {
    return addToast({ ...options, type: 'warning', title, message, duration: options?.duration ?? 6000 })
  }, [addToast])

  const info = useCallback((title: string, message?: string, options?: Partial<Toast>) => {
    return addToast({ ...options, type: 'info', title, message })
  }, [addToast])

  const contextValue: ToastContextType = {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info
  }

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  )
}

// 便捷的Hook用于快速显示常见的Toast
export function useToastActions() {
  const { success, error, warning, info } = useToast()
  
  return {
    showSuccess: success,
    showError: error,
    showWarning: warning,
    showInfo: info,
    
    // 常见操作的快捷方法
    showSaveSuccess: () => success('保存成功', '数据已成功保存'),
    showDeleteSuccess: () => success('删除成功', '项目已成功删除'),
    showCopySuccess: () => success('复制成功', '内容已复制到剪贴板'),
    showImportSuccess: (count: number) => success('导入成功', `成功导入 ${count} 个项目`),
    showExportSuccess: () => success('导出成功', '数据已成功导出'),
    
    showSaveError: () => error('保存失败', '保存数据时出现错误，请重试'),
    showDeleteError: () => error('删除失败', '删除项目时出现错误，请重试'),
    showNetworkError: () => error('网络错误', '请检查网络连接后重试'),
    showValidationError: (message: string) => error('输入错误', message),
    
    showUnsavedWarning: () => warning('未保存的更改', '您有未保存的更改，确定要离开吗？'),
    showQuotaWarning: () => warning('存储空间不足', '请清理一些数据以释放空间')
  }
}