import { useRef, useCallback, useState, useEffect } from 'react'
import type { Word } from '../../../shared/types'

/**
 * 内存优化Hook，用于管理大量词汇数据
 * 提供缓存、批处理和内存监控功能
 * @returns 包含内存优化相关函数的对象
 */
export function useMemoryOptimization() {
  // 使用Map缓存计算结果，提高重复计算的性能
  const memoCache = useRef(new Map())
  
  /**
   * 清理缓存的函数
   * 用于释放内存，防止内存泄漏
   */
  const clearCache = useCallback(() => {
    memoCache.current.clear()
  }, [])

  /**
   * 带缓存的计算函数
   * @template T 依赖项类型
   * @template R 返回值类型
   * @param key 缓存键
   * @param computeFn 计算函数
   * @param dependencies 依赖项数组
   * @returns 计算结果
   */
  const memoizedCompute = useCallback(<T, R>(
    key: string,
    computeFn: () => R,
    dependencies: T[]
  ): R => {
    const depsKey = JSON.stringify(dependencies)
    const cacheKey = `${key}:${depsKey}`
    
    if (memoCache.current.has(cacheKey)) {
      return memoCache.current.get(cacheKey)
    }
    
    const result = computeFn()
    
    // 限制缓存大小，防止内存泄漏
    if (memoCache.current.size > 100) {
      const firstKey = memoCache.current.keys().next().value
      memoCache.current.delete(firstKey)
    }
    
    memoCache.current.set(cacheKey, result)
    return result
  }, [])

  /**
   * 分批处理大量数据
   * 避免长时间阻塞主线程，提升用户体验
   * @template T 输入数据类型
   * @template R 输出数据类型
   * @param items 待处理的数据数组
   * @param processor 处理函数
   * @param batchSize 批处理大小，默认100
   * @returns Promise<R[]> 处理结果数组
   */
  const processBatch = useCallback(<T, R>(
    items: T[],
    processor: (item: T) => R,
    batchSize: number = 100
  ): Promise<R[]> => {
    return new Promise((resolve) => {
      const results: R[] = []
      let currentIndex = 0
      
      const processBatchChunk = () => {
        const endIndex = Math.min(currentIndex + batchSize, items.length)
        
        for (let i = currentIndex; i < endIndex; i++) {
          results.push(processor(items[i]))
        }
        
        currentIndex = endIndex
        
        if (currentIndex < items.length) {
          // 使用setTimeout让出主线程，避免阻塞UI
          setTimeout(processBatchChunk, 0)
        } else {
          resolve(results)
        }
      }
      
      processBatchChunk()
    })
  }, [])

  /**
   * 优化的词汇数据处理
   * 创建多种索引以提高查找性能
   * @param words 词汇数据数组
   * @returns 包含各种索引的优化数据结构
   */
  const optimizeWordData = useCallback((words: Word[]) => {
    return memoizedCompute('optimizeWordData', () => {
      // 创建索引以提高查找性能
      const termIndex = new Map<string, Word>()
      const domainIndex = new Map<string, Word[]>()
      const statusIndex = new Map<string, Word[]>()
      
      words.forEach(word => {
        // 词汇索引
        termIndex.set(word.term.toLowerCase(), word)
        
        // 域名索引
        const domain = word.domain || 'unknown'
        if (!domainIndex.has(domain)) {
          domainIndex.set(domain, [])
        }
        domainIndex.get(domain)!.push(word)
        
        // 状态索引
        if (!statusIndex.has(word.reviewStatus)) {
          statusIndex.set(word.reviewStatus, [])
        }
        statusIndex.get(word.reviewStatus)!.push(word)
      })
      
      return {
        termIndex,
        domainIndex,
        statusIndex,
        totalCount: words.length
      }
    }, [words.length, words.map(w => w.id).join(',')])
  }, [memoizedCompute])

  /**
   * 内存使用监控（开发模式）
   * 仅在开发环境下提供内存使用情况
   * @returns 内存使用统计信息或null
   */
  const getMemoryUsage = useCallback(() => {
    if (process.env.NODE_ENV === 'development' && 'memory' in performance) {
      const memory = (performance as unknown as { memory: {
        usedJSHeapSize: number;
        totalJSHeapSize: number;
        jsHeapSizeLimit: number;
      } }).memory
      return {
        used: Math.round(memory.usedJSHeapSize / 1024 / 1024),
        total: Math.round(memory.totalJSHeapSize / 1024 / 1024),
        limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024),
        cacheSize: memoCache.current.size
      }
    }
    return null
  }, [])

  return {
    memoizedCompute,
    processBatch,
    optimizeWordData,
    clearCache,
    getMemoryUsage
  }
}

/**
 * 节流状态Hook，用于减少频繁的状态更新
 * @template T 状态值类型
 * @param initialValue 初始状态值
 * @param delay 延迟时间（毫秒），默认300ms
 * @returns [当前状态, 节流设置函数, 立即设置函数]
 */
export function useThrottledState<T>(initialValue: T, delay: number = 300) {
  const [state, setState] = useState(initialValue)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  /**
   * 节流设置状态函数
   * @param newValue 新的状态值
   */
  const setThrottledState = useCallback((newValue: T) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    
    timeoutRef.current = setTimeout(() => {
      setState(newValue)
      timeoutRef.current = null
    }, delay)
  }, [delay])
  
  /**
   * 立即设置状态函数
   * @param newValue 新的状态值
   */
  const setImmediateState = useCallback((newValue: T) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    setState(newValue)
  }, [])
  
  return [state, setThrottledState, setImmediateState] as const
}

/**
 * 懒加载Hook，用于延迟加载大量数据
 * @template T 加载数据的类型
 * @param loadFn 数据加载函数
 * @param dependencies 依赖项数组，默认为空
 * @returns 包含数据、加载状态、错误信息和控制函数的对象
 */
export function useLazyLoad<T>(loadFn: () => Promise<T>, dependencies: unknown[] = []) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const loadedRef = useRef(false)

  /**
   * 执行加载操作
   * 支持异步数据加载和错误处理
   */
  const load = useCallback(async () => {
    if (loading) return
    
    setLoading(true)
    setError(null)
    
    try {
      const result = await loadFn()
      setData(result)
      loadedRef.current = true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '加载失败'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [loadFn, loading])

  // 当依赖变化时重置状态
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (loadedRef.current) {
      setData(null)
      setError(null)
      loadedRef.current = false
    }
  }, dependencies)
  
  /**
   * 重置加载状态
   * 清空数据、错误信息和加载状态
   */
  const reset = useCallback(() => {
    setData(null)
    setError(null)
    setLoading(false)
    loadedRef.current = false
  }, [])
  
  return {
    data,
    loading,
    error,
    load,
    reset,
    loaded: loadedRef.current
  }
}