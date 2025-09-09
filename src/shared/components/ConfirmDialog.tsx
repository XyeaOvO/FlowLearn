import React, { createContext, useContext, useState, useCallback } from 'react'
import { WarningIcon, InfoIcon, TrashIcon, CheckIcon } from './Icon'

type ConfirmType = 'danger' | 'warning' | 'info' | 'success'

interface ConfirmOptions {
  type?: ConfirmType
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  icon?: React.ReactNode
  onConfirm: () => void | Promise<void>
  onCancel?: () => void
  destructive?: boolean
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => void
  confirmDelete: (itemName: string, onConfirm: () => void | Promise<void>) => void
  confirmBulkDelete: (count: number, onConfirm: () => void | Promise<void>) => void
  confirmUnsavedChanges: (onConfirm: () => void | Promise<void>) => void
}

const ConfirmContext = createContext<ConfirmContextType | null>(null)

export function useConfirm() {
  const context = useContext(ConfirmContext)
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmProvider')
  }
  return context
}

const defaultIcons: Record<ConfirmType, React.ReactNode> = {
  danger: <WarningIcon size={24} />,
  warning: <WarningIcon size={24} />,
  info: <InfoIcon size={24} />,
  success: <CheckIcon size={24} />
}

function ConfirmDialog({ 
  isOpen, 
  options, 
  onClose 
}: { 
  isOpen: boolean
  options: ConfirmOptions | null
  onClose: () => void 
}) {
  const [isLoading, setIsLoading] = useState(false)

  if (!isOpen || !options) return null

  const handleConfirm = async () => {
    try {
      setIsLoading(true)
      await options.onConfirm()
      onClose()
    } catch (error) {
      console.error('Confirm action failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    if (options.onCancel) {
      options.onCancel()
    }
    onClose()
  }

  const icon = options.icon || defaultIcons[options.type || 'info']
  const confirmText = options.confirmText || '确认'
  const cancelText = options.cancelText || '取消'

  return (
    <div className="modal-overlay" onClick={handleCancel}>
      <div className="confirm-dialog" onClick={e => e.stopPropagation()}>
        <div className="confirm-header">
          <div className={`confirm-icon confirm-icon-${options.type || 'info'}`}>
            {icon}
          </div>
          <h3 className="confirm-title">{options.title}</h3>
        </div>
        
        <div className="confirm-content">
          <p className="confirm-message">{options.message}</p>
        </div>
        
        <div className="confirm-actions">
          <button 
            className="btn btn-secondary"
            onClick={handleCancel}
            disabled={isLoading}
          >
            {cancelText}
          </button>
          <button 
            className={`btn ${
              options.destructive || options.type === 'danger' 
                ? 'btn-danger' 
                : 'btn-primary'
            }`}
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className="btn-spinner"></div>
                处理中...
              </>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [options, setOptions] = useState<ConfirmOptions | null>(null)

  const confirm = useCallback((confirmOptions: ConfirmOptions) => {
    setOptions(confirmOptions)
    setIsOpen(true)
  }, [])

  const close = useCallback(() => {
    setIsOpen(false)
    setTimeout(() => setOptions(null), 300) // 等待动画完成
  }, [])

  // 预设的确认对话框
  const confirmDelete = useCallback((itemName: string, onConfirm: () => void | Promise<void>) => {
    confirm({
      type: 'danger',
      title: '确认删除',
      message: `确定要删除 "${itemName}" 吗？此操作无法撤销。`,
      confirmText: '删除',
      cancelText: '取消',
      icon: <TrashIcon size={24} />,
      onConfirm,
      destructive: true
    })
  }, [confirm])

  const confirmBulkDelete = useCallback((count: number, onConfirm: () => void | Promise<void>) => {
    confirm({
      type: 'danger',
      title: '批量删除确认',
      message: `确定要删除选中的 ${count} 个项目吗？此操作无法撤销。`,
      confirmText: `删除 ${count} 个项目`,
      cancelText: '取消',
      icon: <TrashIcon size={24} />,
      onConfirm,
      destructive: true
    })
  }, [confirm])

  const confirmUnsavedChanges = useCallback((onConfirm: () => void | Promise<void>) => {
    confirm({
      type: 'warning',
      title: '未保存的更改',
      message: '您有未保存的更改，确定要离开吗？未保存的更改将会丢失。',
      confirmText: '离开',
      cancelText: '继续编辑',
      onConfirm
    })
  }, [confirm])

  const contextValue: ConfirmContextType = {
    confirm,
    confirmDelete,
    confirmBulkDelete,
    confirmUnsavedChanges
  }

  return (
    <ConfirmContext.Provider value={contextValue}>
      {children}
      <ConfirmDialog 
        isOpen={isOpen} 
        options={options} 
        onClose={close} 
      />
    </ConfirmContext.Provider>
  )
}

// 便捷的Hook用于常见确认操作
export function useConfirmActions() {
  const { confirm, confirmDelete, confirmBulkDelete, confirmUnsavedChanges } = useConfirm()
  
  return {
    confirm,
    confirmDelete,
    confirmBulkDelete,
    confirmUnsavedChanges,
    
    // 其他常见确认操作
    confirmRestore: (itemName: string, onConfirm: () => void | Promise<void>) => {
      confirm({
        type: 'info',
        title: '确认恢复',
        message: `确定要恢复 "${itemName}" 吗？`,
        confirmText: '恢复',
        onConfirm
      })
    },
    
    confirmClear: (onConfirm: () => void | Promise<void>) => {
      confirm({
        type: 'warning',
        title: '确认清空',
        message: '确定要清空所有数据吗？此操作无法撤销。',
        confirmText: '清空',
        onConfirm,
        destructive: true
      })
    },
    
    confirmReset: (onConfirm: () => void | Promise<void>) => {
      confirm({
        type: 'warning',
        title: '确认重置',
        message: '确定要重置所有设置吗？这将恢复到默认配置。',
        confirmText: '重置',
        onConfirm
      })
    },
    
    confirmImport: (count: number, onConfirm: () => void | Promise<void>) => {
      confirm({
        type: 'info',
        title: '确认导入',
        message: `即将导入 ${count} 个项目，是否继续？`,
        confirmText: '导入',
        onConfirm
      })
    }
  }
}