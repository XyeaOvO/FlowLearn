import { useState, useEffect, useRef } from 'react'
import { getAIProcessingStatus, cancelAIProcessing } from '../../lib/ipc'

interface AIProcessingStatusProps {
  onStatusChange?: (isProcessing: boolean) => void
}

export default function AIProcessingStatus({ onStatusChange }: AIProcessingStatusProps) {
  const [status, setStatus] = useState({
    isProcessing: false,
    currentWords: [] as string[],
    currentModelId: '',
    startTime: 0,
    streamOutput: [] as string[],
    currentStep: '',
    streamContent: ''
  })
  
  const [streamContent, setStreamContent] = useState('')
  const streamContentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const currentStatus = await getAIProcessingStatus()
        setStatus(currentStatus)
        onStatusChange?.(currentStatus.isProcessing)
      } catch (error) {
        console.error('Failed to get AI processing status:', error)
      }
    }

    // Check immediately
    checkStatus()

    // Check every 1 second for real-time updates
    const interval = setInterval(checkStatus, 1000)

    return () => clearInterval(interval)
  }, [onStatusChange])
  
  // 监听流式内容更新
  useEffect(() => {
    const handleStreamContent = (...args: any[]) => {
      // 在Electron IPC中，第一个参数通常是事件对象，第二个参数是实际数据
      let content: any = null
      
      if (args.length >= 2) {
        // 如果有多个参数，第二个参数通常是数据
        content = args[1]
      } else if (args.length === 1) {
        // 如果只有一个参数，可能是数据本身
        content = args[0]
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
            console.error('无法转换对象为字符串:', e)
          }
        }
      }
    }
    
    // 监听来自主进程的流式内容
    window.api.on('ai-stream-content', handleStreamContent)
    
    return () => {
      window.api.off('ai-stream-content', handleStreamContent)
    }
  }, [])

  // 自动滚动到最新内容
  useEffect(() => {
    if (streamContent && streamContentRef.current) {
      // 使用setTimeout确保DOM更新后再滚动
      setTimeout(() => {
        if (streamContentRef.current) {
          streamContentRef.current.scrollTop = streamContentRef.current.scrollHeight
        }
      }, 10)
    }
  }, [streamContent])

  // 不再显示固定状态栏，改为使用独立窗口
  return null

  const elapsed = Math.floor((Date.now() - status.startTime) / 1000)
  const minutes = Math.floor(elapsed / 60)
  const seconds = elapsed % 60

  const handleCancel = async () => {
    try {
      await cancelAIProcessing()
      setStatus({
        isProcessing: false,
        currentWords: [],
        currentModelId: '',
        startTime: 0,
        streamOutput: [],
        currentStep: '',
        streamContent: ''
      })
      setStreamContent('') // 清空流式内容
      onStatusChange?.(false)
    } catch (error) {
      console.error('Failed to cancel AI processing:', error)
    }
  }

  return (
    <div style={{
      position: 'fixed',
      top: 20,
      right: 20,
      backgroundColor: 'white',
      border: '2px solid var(--primary)',
      borderRadius: 12,
      padding: 20,
      boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
      zIndex: 1000,
      minWidth: 400,
      maxWidth: 600,
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* 标题栏 */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 12, 
        marginBottom: 16,
        borderBottom: '1px solid #e0e0e0',
        paddingBottom: 12
      }}>
        <div style={{
          width: 16,
          height: 16,
          borderRadius: '50%',
          backgroundColor: '#007bff',
          animation: 'pulse 1.5s infinite'
        }} />
        <h3 style={{ margin: 0, color: '#333', fontSize: 18, fontWeight: 600 }}>
          AI 处理中...
        </h3>
      </div>
      
      {/* 处理信息 */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: 8
        }}>
          <span style={{ fontSize: 14, color: '#666' }}>
            正在处理 <strong style={{ color: '#007bff' }}>{status.currentWords.length}</strong> 个词汇
          </span>
          <span style={{ fontSize: 12, color: '#999' }}>
            已用时: {minutes}:{seconds.toString().padStart(2, '0')}
          </span>
        </div>
        
        {/* 词汇列表 */}
        <div style={{ 
          backgroundColor: '#f8f9fa', 
          borderRadius: 6, 
          padding: 12,
          marginBottom: 12,
          maxHeight: 120,
          overflowY: 'auto'
        }}>
          <div style={{ fontSize: 12, color: '#666', marginBottom: 6 }}>
            待处理词汇:
          </div>
          <div style={{ fontSize: 13, color: '#333', lineHeight: 1.4 }}>
            {status.currentWords.map((word, index) => (
              <span key={index} style={{ 
                display: 'inline-block',
                backgroundColor: '#e3f2fd',
                padding: '2px 6px',
                margin: '2px',
                borderRadius: 4,
                fontSize: 12
              }}>
                {word}
              </span>
            ))}
          </div>
        </div>
      </div>
      
      {/* 流式输出区域 */}
      <div style={{ 
        backgroundColor: '#f5f5f5', 
        border: '1px solid #ddd',
        borderRadius: 6,
        padding: 12,
        marginBottom: 16,
        minHeight: 80,
        maxHeight: 200,
        overflowY: 'auto',
        fontFamily: 'monospace',
        fontSize: 12,
        lineHeight: 1.4
      }}>
        <div style={{ color: '#666', marginBottom: 8 }}>
          AI 响应流:
        </div>
        <div style={{ color: '#333' }}>
          {status.isProcessing ? (
            <div>
              {status.streamOutput.length > 0 ? (
                <div>
                  {status.streamOutput.map((line, index) => (
                    <div key={index} style={{ 
                      marginBottom: 4,
                      color: line.includes('失败') ? '#dc3545' : 
                             line.includes('成功') ? '#28a745' : 
                             line.includes('正在生成') ? '#28a745' : '#007bff'
                    }}>
                      {line}
                    </div>
                  ))}
                  {/* 显示真正的流式内容 */}
                  {streamContent && (
                    <div style={{
                      marginTop: 8,
                      padding: '12px',
                      backgroundColor: '#f8f9fa',
                      border: '1px solid #28a745',
                      borderRadius: 6,
                      fontSize: 13,
                      lineHeight: 1.5,
                      maxHeight: 150,
                      overflowY: 'auto'
                    }}>
                      <div style={{ color: '#28a745', fontWeight: 'bold', marginBottom: 8 }}>
                        🚀 实时生成内容:
                      </div>
                      <div 
                        ref={streamContentRef}
                        className="stream-content-container"
                        style={{ 
                          color: '#333',
                          whiteSpace: 'pre-wrap',
                          fontFamily: 'system-ui, -apple-system, sans-serif',
                          maxHeight: '150px',
                          overflowY: 'auto',
                          scrollBehavior: 'smooth'
                        }}
                      >
                        {typeof streamContent === 'string' ? streamContent : String(streamContent)}
                        <span style={{ 
                          display: 'inline-block',
                          width: '2px',
                          height: '16px',
                          backgroundColor: '#28a745',
                          animation: 'blink 1s infinite',
                          marginLeft: '2px'
                        }} />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <div>🔄 正在连接AI服务...</div>
                  <div>📤 发送词汇数据...</div>
                  <div>⏳ 等待AI响应...</div>
                  <div style={{ color: '#007bff' }}>
                    {elapsed > 10 ? '🤖 AI正在处理中，请稍候...' : '⏱️ 处理中...'}
                  </div>
                </div>
              )}
              {status.currentStep && (
                <div style={{ 
                  color: status.currentStep.includes('重试') ? '#ff9800' : 
                         status.currentStep.includes('cancelled') ? '#dc3545' :
                         status.currentStep.includes('waiting') ? '#17a2b8' :
                         status.currentStep.includes('streaming') ? '#28a745' :
                         status.currentStep.includes('completed') ? '#28a745' : '#007bff', 
                  fontWeight: 'bold',
                  marginTop: 8,
                  padding: '4px 8px',
                  backgroundColor: status.currentStep.includes('重试') ? '#fff3e0' :
                                  status.currentStep.includes('cancelled') ? '#f8d7da' :
                                  status.currentStep.includes('waiting') ? '#d1ecf1' :
                                  status.currentStep.includes('streaming') ? '#d4edda' :
                                  status.currentStep.includes('completed') ? '#d4edda' : '#e3f2fd',
                  borderRadius: 4
                }}>
                  当前步骤: {status.currentStep}
                </div>
              )}
            </div>
          ) : (
            <div style={{ color: '#28a745' }}>✅ 处理完成</div>
          )}
        </div>
      </div>
      
      {/* 操作按钮 */}
      <div style={{ display: 'flex', gap: 12 }}>
        <button 
          className="btn btn-danger"
          onClick={handleCancel}
          style={{ 
            flex: 1,
            padding: '10px 16px',
            fontSize: 14,
            fontWeight: 500
          }}
        >
          🛑 取消处理
        </button>
      </div>
      
      <style>{`
        @keyframes pulse {
          0% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.1); }
          100% { opacity: 1; transform: scale(1); }
        }
        
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
      `}</style>
    </div>
  )
}
