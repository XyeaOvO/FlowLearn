import { useState, useEffect, useRef } from 'react'

/**
 * 自定义hook用于处理AI流式内容
 */
export function useStreamContent(isActive: boolean = true) {
  const [streamContent, setStreamContent] = useState('')
  const streamContentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isActive) return

    const handleStreamContent = (...eventArguments: unknown[]) => {
      // 在Electron IPC中，第一个参数通常是事件对象，第二个参数是实际数据
      let content: unknown = null
      
      if (eventArguments.length >= 2) {
        // 如果有多个参数，第二个参数通常是数据
        content = eventArguments[1]
      } else if (eventArguments.length === 1) {
        // 如果只有一个参数，可能是数据本身
        content = eventArguments[0]
      }
      
      // 确保content是字符串
      if (typeof content === 'string') {
        setStreamContent(content)
      } else {
        // 尝试从对象中提取字符串数据
        if (content && typeof content === 'object') {
          // 检查是否有data属性
          if ('data' in content && typeof content.data === 'string') {
            setStreamContent(content.data)
            return
          }
          
          // 检查是否有message属性
          if ('message' in content && typeof content.message === 'string') {
            setStreamContent(content.message)
            return
          }
          
          // 尝试将对象转换为字符串
          try {
            const stringContent = JSON.stringify(content)
            setStreamContent(stringContent)
          } catch (e) {
            // JSON转换失败，忽略错误
          }
        }
      }
    }

    // 监听来自主进程的流式内容
    if (typeof window !== 'undefined' && window.api && window.api.on) {
      window.api.on('ai-stream-content', handleStreamContent)
      
      return () => {
        if (window.api && window.api.off) {
          window.api.off('ai-stream-content', handleStreamContent)
        }
      }
    }
    
    // 在浏览器环境中不执行任何操作
    return () => {}
  }, [isActive])

  // 优化的自动滚动，使用requestAnimationFrame减少重排
  useEffect(() => {
    if (streamContent && streamContentRef.current) {
      requestAnimationFrame(() => {
        if (streamContentRef.current) {
          streamContentRef.current.scrollTop = streamContentRef.current.scrollHeight
        }
      })
    }
  }, [streamContent])

  return {
    streamContent,
    setStreamContent,
    streamContentRef
  }
}