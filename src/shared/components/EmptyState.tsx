import React from 'react'
import { BookIcon, SearchIcon, InfoIcon, WarningIcon, CheckIcon } from './Icon'

type EmptyStateType = 'no-data' | 'no-results' | 'no-selection' | 'error' | 'success' | 'loading'

interface EmptyStateProps {
  type?: EmptyStateType
  title: string
  description?: string
  icon?: React.ReactNode
  action?: {
    label: string
    onClick: () => void
    variant?: 'primary' | 'secondary'
  }
  secondaryAction?: {
    label: string
    onClick: () => void
  }
  className?: string
  size?: 'small' | 'medium' | 'large'
}

const defaultIcons: Record<EmptyStateType, React.ReactNode> = {
  'no-data': <BookIcon size={48} />,
  'no-results': <SearchIcon size={48} />,
  'no-selection': <InfoIcon size={48} />,
  'error': <WarningIcon size={48} />,
  'success': <CheckIcon size={48} />,
  'loading': (
    <div className="loading-spinner" style={{ width: 48, height: 48 }}>
      <div className="spinner"></div>
    </div>
  )
}

export default function EmptyState({
  type = 'no-data',
  title,
  description,
  icon,
  action,
  secondaryAction,
  className = '',
  size = 'medium'
}: EmptyStateProps) {
  const displayIcon = icon || defaultIcons[type]
  
  return (
    <div className={`empty-state empty-state-${size} ${className}`}>
      <div className="empty-state-content">
        <div className={`empty-state-icon empty-state-icon-${type}`}>
          {displayIcon}
        </div>
        
        <div className="empty-state-text">
          <h3 className="empty-state-title">{title}</h3>
          {description && (
            <p className="empty-state-description">{description}</p>
          )}
        </div>
        
        {(action || secondaryAction) && (
          <div className="empty-state-actions">
            {action && (
              <button
                className={`btn ${action.variant === 'secondary' ? 'btn-secondary' : 'btn-primary'}`}
                onClick={action.onClick}
              >
                {action.label}
              </button>
            )}
            {secondaryAction && (
              <button
                className="btn btn-ghost"
                onClick={secondaryAction.onClick}
              >
                {secondaryAction.label}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// 预设的空状态组件
export function NoDataState({ onAction }: { onAction?: () => void }) {
  return (
    <EmptyState
      type="no-data"
      title="暂无数据"
      description="还没有添加任何单词，开始构建你的词汇库吧！"
      action={onAction ? {
        label: "添加第一个单词",
        onClick: onAction,
        variant: "primary"
      } : undefined}
    />
  )
}

export function NoResultsState({ query, onClear }: { query?: string; onClear?: () => void }) {
  return (
    <EmptyState
      type="no-results"
      title="未找到匹配结果"
      description={query ? `没有找到包含 "${query}" 的单词` : "当前筛选条件下没有找到任何单词"}
      action={onClear ? {
        label: "清除筛选",
        onClick: onClear,
        variant: "secondary"
      } : undefined}
    />
  )
}

export function NoSelectionState() {
  return (
    <EmptyState
      type="no-selection"
      title="选择一个单词"
      description="从左侧列表中选择一个单词来查看详细信息"
      size="small"
    />
  )
}

export function LoadingState({ message = "正在加载..." }: { message?: string }) {
  return (
    <EmptyState
      type="loading"
      title={message}
      size="small"
    />
  )
}

export function ErrorState({ 
  title = "出现错误", 
  description = "加载数据时出现问题，请稍后重试",
  onRetry 
}: { 
  title?: string
  description?: string
  onRetry?: () => void 
}) {
  return (
    <EmptyState
      type="error"
      title={title}
      description={description}
      action={onRetry ? {
        label: "重试",
        onClick: onRetry,
        variant: "primary"
      } : undefined}
    />
  )
}

export function SuccessState({ 
  title = "操作成功", 
  description,
  onContinue 
}: { 
  title?: string
  description?: string
  onContinue?: () => void 
}) {
  return (
    <EmptyState
      type="success"
      title={title}
      description={description}
      action={onContinue ? {
        label: "继续",
        onClick: onContinue,
        variant: "primary"
      } : undefined}
    />
  )
}