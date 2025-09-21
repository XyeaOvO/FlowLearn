import { useMemo, useCallback, useState, useEffect, useRef } from 'react'
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
 * 虚拟滚动Hook配置选项
 */
interface VirtualScrollOptions {
  /** 预加载缓冲区大小（额外渲染的项目数量） */
  bufferSize?: number
  /** 是否启用动态高度计算 */
  dynamicHeight?: boolean
  /** 滚动节流延迟（毫秒） */
  throttleDelay?: number
  /** 是否启用性能监控 */
  enablePerfMonitoring?: boolean
}

/**
 * 虚拟滚动性能统计
 */
interface VirtualScrollStats {
  totalItems: number
  visibleItems: number
  renderTime: number
  scrollEvents: number
  cacheHits: number
  cacheMisses: number
}

/**
 * 增强的虚拟滚动Hook
 * 
 * 用于处理大量数据的高性能渲染，只渲染可见区域的项目
 * 显著减少DOM节点数量，提升滚动性能
 * 新增功能：预加载缓冲区、动态高度、性能监控、智能缓存
 * 
 * @param items - 所有数据项数组
 * @param itemHeight - 每个项目的固定高度（像素）
 * @param containerHeight - 容器的高度（像素）
 * @param options - 配置选项
 * @returns 虚拟滚动相关的状态和方法
 * 
 * @example
 * ```tsx
 * const {
 *   visibleItems,
 *   totalHeight,
 *   offsetY,
 *   handleScroll,
 *   visibleRange,
 *   stats
 * } = useVirtualScroll(words, 60, 400, {
 *   bufferSize: 5,
 *   enablePerfMonitoring: true
 * })
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
export function useVirtualScroll<T>(
  items: T[], 
  itemHeight: number, 
  containerHeight: number,
  options: VirtualScrollOptions = {}
) {
  const {
    bufferSize = 3,
    dynamicHeight = false,
    throttleDelay = 16,
    enablePerfMonitoring = false
  } = options

  const [scrollTop, setScrollTop] = useState(0)
  const createInitialStats = () => ({
    totalItems: 0,
    visibleItems: 0,
    renderTime: 0,
    scrollEvents: 0,
    cacheHits: 0,
    cacheMisses: 0
  })
  const statsRef = useRef<VirtualScrollStats>(createInitialStats())
  const statsDirtyRef = useRef(false)
  const [stats, setStats] = useState<VirtualScrollStats>(statsRef.current)

  // 缓存计算结果
  const cacheRef = useRef<Map<string, unknown>>(new Map())
  const heightCacheRef = useRef(new Map<number, number>())

  // 节流滚动处理（优化底部滚动）
  const throttledSetScrollTop = useMemo(
    () =>
      throttle((newScrollTop: number) => {
        // 限制滚动范围，避免超出边界
        const maxScrollTop = Math.max(0, items.length * itemHeight - containerHeight)
        const clampedScrollTop = Math.min(newScrollTop, maxScrollTop)
        
        setScrollTop(clampedScrollTop)
        if (enablePerfMonitoring) {
          statsRef.current.scrollEvents += 1
          statsDirtyRef.current = true
        }
      }, throttleDelay),
    [throttleDelay, enablePerfMonitoring, items.length, itemHeight, containerHeight]
  )

  // 计算可见范围（带缓冲区）
  const visibleRange = useMemo(() => {
    const startTime = enablePerfMonitoring ? performance.now() : 0
    
    // 优化缓存键，减少精度以提高命中率
    const roundedScrollTop = Math.floor(scrollTop / 10) * 10
    const cacheKey = `range-${roundedScrollTop}-${itemHeight}-${containerHeight}-${items.length}-${bufferSize}`
    
    if (cacheRef.current.has(cacheKey)) {
      if (enablePerfMonitoring) {
        statsRef.current.cacheHits += 1
        statsDirtyRef.current = true
      }
      return cacheRef.current.get(cacheKey) as {
        startIndex: number
        endIndex: number
        visibleCount: number
        isNearBottom: boolean
      }
    }

    const visibleCount = Math.ceil(containerHeight / itemHeight)
    const rawStartIndex = Math.floor(scrollTop / itemHeight)
    
    // 优化边界处理，避免底部卡顿
    const startIndex = Math.max(0, rawStartIndex - bufferSize)
    const rawEndIndex = rawStartIndex + visibleCount + bufferSize * 2
    const endIndex = Math.min(items.length, rawEndIndex)
    
    // 当接近底部时，确保不会超出边界
    const adjustedEndIndex = Math.min(endIndex, items.length)
    const adjustedStartIndex = Math.max(0, Math.min(startIndex, items.length - visibleCount - bufferSize))
    
    const result = { 
      startIndex: adjustedStartIndex, 
      endIndex: adjustedEndIndex, 
      visibleCount,
      isNearBottom: rawEndIndex >= items.length - bufferSize
    }
    
    // 优化缓存管理，使用LRU策略
    if (cacheRef.current.size > 30) {
      const keys = Array.from(cacheRef.current.keys())
      // 删除最旧的一半缓存
      for (let i = 0; i < Math.floor(keys.length / 2); i++) {
        cacheRef.current.delete(keys[i])
      }
    }
    
    cacheRef.current.set(cacheKey, result)
    
    if (enablePerfMonitoring) {
      const endTime = performance.now()
      statsRef.current.cacheMisses += 1
      statsRef.current.renderTime = endTime - startTime
      statsDirtyRef.current = true
    }
    
    return result
  }, [scrollTop, itemHeight, containerHeight, items.length, bufferSize, enablePerfMonitoring])

  // 获取可见项目（优化边界处理）
  const visibleItems = useMemo(() => {
    // 确保索引在有效范围内
    const safeStartIndex = Math.max(0, Math.min(visibleRange.startIndex, items.length))
    const safeEndIndex = Math.max(safeStartIndex, Math.min(visibleRange.endIndex, items.length))
    
    const result = items.slice(safeStartIndex, safeEndIndex)
    
    if (enablePerfMonitoring) {
      const nextTotal = items.length
      const nextVisible = result.length
      if (statsRef.current.totalItems !== nextTotal || statsRef.current.visibleItems !== nextVisible) {
        statsRef.current.totalItems = nextTotal
        statsRef.current.visibleItems = nextVisible
        statsDirtyRef.current = true
      }
    }
    
    return result
  }, [items, visibleRange, enablePerfMonitoring])

  // 计算总高度（支持动态高度，优化性能）
  const totalHeight = useMemo(() => {
    if (!dynamicHeight) {
      return items.length * itemHeight
    }
    
    // 动态高度计算（优化版本）
    const cacheKey = `totalHeight-${items.length}-${itemHeight}`
    if (cacheRef.current.has(cacheKey)) {
      return cacheRef.current.get(cacheKey) as number
    }
    
    let total = 0
    const cachedHeights = heightCacheRef.current
    
    // 批量计算，减少循环开销
    for (let i = 0; i < items.length; i++) {
      total += cachedHeights.get(i) || itemHeight
    }
    
    cacheRef.current.set(cacheKey, total)
    return total
  }, [items.length, itemHeight, dynamicHeight])

  // 计算偏移量（优化性能）
  const offsetY = useMemo(() => {
    if (!dynamicHeight) {
      return visibleRange.startIndex * itemHeight
    }
    
    // 动态高度偏移计算（优化版本）
    const cacheKey = `offset-${visibleRange.startIndex}-${itemHeight}`
    if (cacheRef.current.has(cacheKey)) {
      return cacheRef.current.get(cacheKey) as number
    }
    
    let offset = 0
    const cachedHeights = heightCacheRef.current
    const startIndex = visibleRange.startIndex
    
    // 批量计算偏移量
    for (let i = 0; i < startIndex; i++) {
      offset += cachedHeights.get(i) || itemHeight
    }
    
    cacheRef.current.set(cacheKey, offset)
    return offset
  }, [visibleRange.startIndex, itemHeight, dynamicHeight])

  // 滚动处理函数
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const newScrollTop = e.currentTarget.scrollTop
    throttledSetScrollTop(newScrollTop)
  }, [throttledSetScrollTop])

  // 更新项目高度（用于动态高度）
  const updateItemHeight = useCallback((index: number, height: number) => {
    if (dynamicHeight) {
      heightCacheRef.current.set(index, height)
    }
  }, [dynamicHeight])

  // 清理缓存
  const clearCache = useCallback(() => {
    cacheRef.current.clear()
    heightCacheRef.current.clear()
    statsRef.current = createInitialStats()
    statsDirtyRef.current = true
    setStats({ ...statsRef.current })
  }, [])

  useEffect(() => {
    if (!enablePerfMonitoring) {
      return
    }
    if (!statsDirtyRef.current) {
      return
    }
    statsDirtyRef.current = false
    setStats({ ...statsRef.current })
  }, [enablePerfMonitoring, items.length, scrollTop, visibleItems, visibleRange])

  // 清理效果
  useEffect(() => {
    return () => {
      clearCache()
    }
  }, [clearCache])

  return {
    visibleItems,
    totalHeight,
    offsetY,
    handleScroll,
    visibleRange,
    updateItemHeight,
    clearCache,
    stats: enablePerfMonitoring ? stats : null
  }
}

/**
 * 节流函数
 */
function throttle<TArgs extends unknown[]>(
  func: (...args: TArgs) => void,
  delay: number
): (...args: TArgs) => void {
  let timeoutId: NodeJS.Timeout | null = null
  let lastExecTime = 0
  
  return (...args: TArgs) => {
    const currentTime = Date.now()
    
    if (currentTime - lastExecTime > delay) {
      func(...args)
      lastExecTime = currentTime
    } else {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      timeoutId = setTimeout(() => {
        func(...args)
        lastExecTime = Date.now()
      }, delay - (currentTime - lastExecTime))
    }
  }
}
