import React, { useCallback } from 'react'
import type { Word } from '../../../shared/types'
import { useVirtualScroll } from '../lib/useOptimizedFilter'

/**
 * 虚拟化单词列表组件的属性接口
 */
interface VirtualizedWordListProps {
  /** 要显示的单词数组 */
  words: Word[]
  /** 当前选中的单词ID */
  selectedId: string | null
  /** 选择单词时的回调函数 */
  onSelect: (word: Word) => void
  /** 容器高度（像素） */
  containerHeight: number
  /** 每个列表项的高度（像素），默认60 */
  itemHeight?: number
  /** 是否启用多选模式 */
  selectionMode?: boolean
  /** 多选模式下已选中的单词ID数组 */
  selectedIds?: string[]
  /** 切换选择状态的回调函数 */
  onToggleSelection?: (id: string) => void
  /** 自定义渲染单个列表项的函数 */
  renderItem?: (word: Word) => React.ReactNode
  /** 是否显示性能统计信息 */
  showStats?: boolean
}

/** 默认列表项高度 */
const DEFAULT_ITEM_HEIGHT = 60

/**
 * 虚拟化单词列表组件
 * 使用虚拟滚动技术优化大量数据的渲染性能
 * 只渲染可见区域内的列表项，大幅提升性能
 * 支持单选和多选模式，提供灵活的交互方式
 * 
 * @param props 组件属性
 * @returns 虚拟化列表组件
 */
export default function VirtualizedWordList({
  words,
  selectedId,
  onSelect,
  containerHeight,
  itemHeight = DEFAULT_ITEM_HEIGHT,
  selectionMode = false,
  selectedIds = [],
  onToggleSelection,
  renderItem,
  showStats = process.env.NODE_ENV === 'development'
}: VirtualizedWordListProps) {
  // 使用增强的虚拟滚动Hook获取可见项和滚动相关属性
  const {
    visibleItems,
    totalHeight,
    offsetY,
    handleScroll,
    stats
  } = useVirtualScroll(words, itemHeight, containerHeight, {
    bufferSize: 5, // 预加载5个项目
    throttleDelay: 16, // 60fps滚动
    enablePerfMonitoring: showStats // 由外部开关控制是否启用性能监控
  })

  /**
   * 默认的列表项渲染函数
   * 当没有提供自定义渲染函数时使用
   * 包含单词信息、选择状态、交互功能等完整UI
   */
  const defaultRenderItem = useCallback((word: Word) => {
    const isCurrentSelected = selectedId === word.id
    const isMultiSelected = selectedIds.includes(word.id)
    
    return (
      <div
        className={`word-item ${
          isCurrentSelected ? 'selected' : ''
        } ${
          isMultiSelected ? 'multi-selected' : ''
        }`}
        style={{
          height: itemHeight,
          display: 'flex',
          alignItems: 'center',
          padding: '8px 12px',
          borderBottom: '1px solid #eee',
          cursor: 'pointer',
          backgroundColor: isCurrentSelected ? '#e3f2fd' : 
                          isMultiSelected ? '#f3e5f5' : 'transparent'
        }}
        onClick={() => {
          if (selectionMode && onToggleSelection) {
            onToggleSelection(word.id)
          } else {
            onSelect(word)
          }
        }}
      >
        {selectionMode && (
          <input
            type="checkbox"
            checked={isMultiSelected}
            onChange={() => onToggleSelection?.(word.id)}
            style={{ marginRight: 8 }}
            onClick={(e) => e.stopPropagation()}
          />
        )}
        
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ 
            fontWeight: 'bold', 
            fontSize: 14,
            marginBottom: 2,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {word.term}
          </div>
          <div style={{ 
            fontSize: 12, 
            color: '#666',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {word.definition}
          </div>
          {word.phonetic && (
            <div style={{ 
              fontSize: 11, 
              color: '#999',
              fontStyle: 'italic'
            }}>
              {word.phonetic}
            </div>
          )}
        </div>
        
        <div style={{ 
          fontSize: 11, 
          color: '#999',
          textAlign: 'right',
          minWidth: 60
        }}>
          <div>{word.reviewStatus}</div>
          {word.domain && (
            <div style={{ fontSize: 10 }}>{word.domain}</div>
          )}
        </div>
      </div>
    )
  }, [selectedId, selectedIds, selectionMode, onToggleSelection, onSelect, itemHeight])

  const renderFunction = renderItem || defaultRenderItem

  return (
    <div
      style={{
        height: containerHeight,
        overflow: 'auto',
        position: 'relative'
      }}
      onScroll={handleScroll}
    >
      {/* 总高度占位符 */}
      <div style={{ height: totalHeight, position: 'relative' }}>
        {/* 可见项容器 */}
        <div
          style={{
            position: 'absolute',
            top: offsetY,
            left: 0,
            right: 0
          }}
        >
          {visibleItems.map((word) => (
            <React.Fragment key={word.id}>
              {renderFunction(word)}
            </React.Fragment>
          ))}
        </div>
      </div>
      
      {/* 性能统计信息（可配置开关） */}
      {stats && showStats && (
        <div
          style={{
            position: 'fixed',
            top: 10,
            right: 10,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            padding: '8px 12px',
            borderRadius: 6,
            fontSize: 11,
            fontFamily: 'monospace',
            zIndex: 1000,
            pointerEvents: 'none'
          }}
        >
          <div>总项目: {stats.totalItems}</div>
          <div>可见项目: {stats.visibleItems}</div>
          <div>渲染时间: {stats.renderTime.toFixed(2)}ms</div>
          <div>滚动事件: {stats.scrollEvents}</div>
          <div>缓存命中: {stats.cacheHits}</div>
          <div>缓存未命中: {stats.cacheMisses}</div>
          <div>命中率: {stats.cacheHits + stats.cacheMisses > 0 ? ((stats.cacheHits / (stats.cacheHits + stats.cacheMisses)) * 100).toFixed(1) : 0}%</div>
        </div>
      )}
    </div>
  )
}

// 导出相关样式
export const virtualizedWordListStyles = `
.word-item {
  transition: background-color 0.15s ease;
}

.word-item:hover {
  background-color: #f5f5f5 !important;
}

.word-item.selected {
  background-color: #e3f2fd !important;
  border-left: 3px solid #2196f3;
}

.word-item.multi-selected {
  background-color: #f3e5f5 !important;
  border-left: 3px solid #9c27b0;
}
`