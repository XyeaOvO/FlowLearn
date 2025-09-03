import { useMemo, useCallback, useState, useEffect } from 'react'
import type { Word } from '../../../shared/types'
import type { VocabFilter } from '../../features/vocab/filters'

/**
 * 优化的词汇过滤Hook
 * 
 * 通过以下方式提升性能：
 * - 缓存正则表达式编译结果
 * - 缓存时间戳转换
 * - 使用useMemo避免重复计算
 * - 提供过滤统计信息
 * 
 * @param words - 待过滤的词汇数组
 * @param filter - 过滤条件对象
 * @returns 包含过滤结果和统计信息的对象
 * 
 * @example
 * ```tsx
 * const { filteredWords, stats } = useOptimizedFilter(words, {
 *   query: 'hello',
 *   status: 'learning',
 *   from: '2024-01-01',
 *   to: '2024-12-31'
 * })
 * ```
 */
export function useOptimizedFilter(words: Word[], filter: VocabFilter) {
  // 缓存正则表达式编译结果
  const compiledRegex = useMemo(() => {
    if (!filter.useRegex || !filter.regex?.trim()) return null
    try {
      return new RegExp(filter.regex.trim(), 'i')
    } catch {
      return null
    }
  }, [filter.useRegex, filter.regex])

  // 缓存时间戳转换
  const dateRange = useMemo(() => {
    const fromTs = filter.from ? new Date(filter.from + 'T00:00:00').getTime() : null
    const toTs = filter.to ? new Date(filter.to + 'T23:59:59').getTime() : null
    return { fromTs, toTs }
  }, [filter.from, filter.to])

  // 缓存查询字符串处理
  const queryLower = useMemo(() => {
    return (filter.query || '').trim().toLowerCase()
  }, [filter.query])

  // 优化的过滤函数
  const filteredWords = useMemo(() => {
    if (words.length === 0) return []

    return words.filter(word => {
      // 删除状态检查
      const isDeleted = !!(word as Word & { deletedAt?: number }).deletedAt
      if (filter.showDeleted) {
        if (!isDeleted) return false
      } else {
        if (isDeleted) return false
      }

      // 状态过滤
      if (filter.status !== 'all' && word.reviewStatus !== filter.status) {
        return false
      }

      // 日期范围过滤
      if (dateRange.fromTs && word.addedAt < dateRange.fromTs) return false
      if (dateRange.toTs && word.addedAt > dateRange.toTs) return false

      // 域名过滤
      if (filter.domain && filter.domain !== 'all' && (word.domain || '').trim() !== filter.domain) {
        return false
      }

      // 示例和音标要求
      if (filter.requireExample && !(word.example && word.example.trim())) return false
      if (filter.requirePhonetic && !(word.phonetic && word.phonetic.trim())) return false

      // 文本搜索（最耗时的操作放在最后）
      if (queryLower || compiledRegex) {
        const fields = [word.term, word.definition, word.example, word.phonetic]
        const fieldsText = fields.join('\n')
        
        if (compiledRegex) {
          return compiledRegex.test(fieldsText)
        } else if (queryLower) {
          return fields.some(fieldValue => (fieldValue || '').toLowerCase().includes(queryLower))
        }
      }

      return true
    })
  }, [words, filter, compiledRegex, dateRange, queryLower])

  // 计算统计信息
  const stats = useMemo(() => {
    const deletedCount = words.filter(w => !!(w as Word & { deletedAt?: number }).deletedAt).length
    const activeCount = words.length - deletedCount
    
    return {
      total: words.length,
      active: activeCount,
      deleted: deletedCount,
      filtered: filteredWords.length,
      filterRate: words.length > 0 ? (filteredWords.length / words.length * 100).toFixed(1) : '0'
    }
  }, [words, filteredWords.length])

  return {
    filteredWords,
    stats
  }
}

/**
 * 防抖Hook，用于延迟执行频繁的操作
 */
/**
 * 防抖Hook
 * 
 * 延迟更新值，直到指定的延迟时间内没有新的更新
 * 常用于搜索输入框，避免频繁触发搜索请求
 * 
 * @param value - 需要防抖的值
 * @param delay - 延迟时间（毫秒），默认300ms
 * @returns 防抖后的值
 * 
 * @example
 * ```tsx
 * const [searchTerm, setSearchTerm] = useState('')
 * const debouncedSearchTerm = useDebounce(searchTerm, 500)
 * 
 * useEffect(() => {
 *   // 只有当用户停止输入500ms后才会触发搜索
 *   performSearch(debouncedSearchTerm)
 * }, [debouncedSearchTerm])
 * ```
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

/**
 * 虚拟滚动Hook，用于处理大量数据的渲染
 */
/**
 * 虚拟滚动Hook
 * 
 * 用于处理大量数据的高性能渲染，只渲染可见区域的项目
 * 显著减少DOM节点数量，提升滚动性能
 * 
 * @param items - 所有数据项数组
 * @param itemHeight - 每个项目的固定高度（像素）
 * @param containerHeight - 容器的高度（像素）
 * @returns 虚拟滚动相关的状态和方法
 * 
 * @example
 * ```tsx
 * const {
 *   visibleItems,
 *   totalHeight,
 *   offsetY,
 *   handleScroll,
 *   visibleRange
 * } = useVirtualScroll(words, 60, 400)
 * 
 * return (
 *   <div style={{ height: containerHeight, overflow: 'auto' }} onScroll={handleScroll}>
 *     <div style={{ height: totalHeight, position: 'relative' }}>
 *       <div style={{ position: 'absolute', top: offsetY }}>
 *         {visibleItems.map(item => <ItemComponent key={item.id} item={item} />)}
 *       </div>
 *     </div>
 *   </div>
 * )
 * ```
 */
export function useVirtualScroll<T>(items: T[], itemHeight: number, containerHeight: number) {
  const [scrollTop, setScrollTop] = useState(0)

  const visibleRange = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight)
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + 1,
      items.length
    )
    return { startIndex, endIndex }
  }, [scrollTop, itemHeight, containerHeight, items.length])

  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.startIndex, visibleRange.endIndex)
  }, [items, visibleRange])

  const totalHeight = items.length * itemHeight
  const offsetY = visibleRange.startIndex * itemHeight

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }, [])

  return {
    visibleItems,
    totalHeight,
    offsetY,
    handleScroll,
    visibleRange
  }
}