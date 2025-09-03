import { useState, useEffect, useCallback } from 'react'
import { getAIProcessingStatus, cancelAIProcessing } from '../../lib/ipc'
import type { AIProcessingStatus } from '../../../shared/types'
import { safeAsync } from './errorHandler'

/**
 * 自定义hook用于管理AI处理状态
 */
export function useAIProcessingStatus(onStatusChange?: (isProcessing: boolean) => void) {
  const [status, setStatus] = useState<AIProcessingStatus>({
    isProcessing: false,
    currentWords: [],
    currentModelId: '',
    startTime: 0,
    streamOutput: [],
    currentStep: '',
    streamContent: ''
  })
  const [streamContent, setStreamContent] = useState('')

  const checkStatus = useCallback(async () => {
    const currentStatus = await safeAsync(
      () => getAIProcessingStatus()
    )
    
    if (currentStatus) {
      setStatus(prevStatus => {
        // 如果开始新的处理，清空流式内容
        if (currentStatus.isProcessing && currentStatus.startTime > prevStatus.startTime) {
          setStreamContent('')
        }
        return currentStatus
      })
      onStatusChange?.(currentStatus.isProcessing)
    }
  }, [onStatusChange])

  const cancelProcessing = useCallback(async () => {
    await safeAsync(() => cancelAIProcessing())
    
    // 重置状态
    const resetStatus = {
      isProcessing: false,
      currentWords: [],
      currentModelId: '',
      startTime: 0,
      streamOutput: [],
      currentStep: '',
      streamContent: ''
    }
    setStatus(resetStatus)
    setStreamContent('')
    onStatusChange?.(false)
  }, [onStatusChange])

  useEffect(() => {
    // 立即检查一次
    checkStatus()

    // 动态调整轮询频率：处理中时更频繁，空闲时较少
    let interval: NodeJS.Timeout
    
    const startPolling = () => {
      const pollFrequency = status?.isProcessing ? 500 : 2000 // 处理中500ms，空闲2s
      interval = setInterval(checkStatus, pollFrequency)
    }
    
    startPolling()

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [checkStatus, status?.isProcessing])

  return {
    status,
    streamContent,
    setStreamContent,
    cancelProcessing,
    checkStatus
  }
}