import { useEffect } from 'react'
import { useAIProcessingStatus } from '../../shared/lib/useAIProcessingStatus'
import { useStreamContent } from '../../shared/lib/useStreamContent'

interface AIProcessingWindowProps {
  isOpen: boolean
  onClose: () => void
}

export default function AIProcessingWindow({ isOpen, onClose }: AIProcessingWindowProps) {
  const { status, cancelProcessing } = useAIProcessingStatus()
  const { streamContent, setStreamContent, streamContentRef } = useStreamContent(isOpen)


  useEffect(() => {
    if (isOpen) {
      setStreamContent('')
    }
  }, [isOpen, setStreamContent])


  useEffect(() => {
    if (isOpen && !status.isProcessing && status.currentStep === 'completed') {
      setTimeout(() => {
        onClose()
      }, 3000) // 3秒后自动关闭
    }
  }, [isOpen, status.isProcessing, status.currentStep, onClose])

  if (!isOpen) return null

  const elapsed = Math.floor((Date.now() - status.startTime) / 1000)
  const minutes = Math.floor(elapsed / 60)
  const seconds = elapsed % 60

  const handleCancel = async () => {
    await cancelProcessing()
    onClose()
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.1)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1500
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 24,
        width: '90%',
        maxWidth: 800,
        maxHeight: '90vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        border: '2px solid var(--primary)'
      }}>
        {/* 标题栏 */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          marginBottom: 20,
          borderBottom: '1px solid #e0e0e0',
          paddingBottom: 16
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 20,
              height: 20,
              borderRadius: '50%',
              backgroundColor: status.isProcessing ? '#007bff' : '#28a745',
              animation: status.isProcessing ? 'pulse 1.5s infinite' : 'none'
            }} />
            <h2 style={{ margin: 0, color: '#333', fontSize: 20, fontWeight: 600 }}>
              {status.isProcessing ? 'AI 处理中...' : 'AI 处理完成'}
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 24,
              cursor: 'pointer',
              color: '#666',
              padding: 4
            }}
          >
            ×
          </button>
        </div>
        
        {/* 处理信息 */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: 12
          }}>
            <span style={{ fontSize: 16, color: '#666' }}>
              正在处理 <strong style={{ color: '#007bff' }}>{status.currentWords.length}</strong> 个词汇
            </span>
            <span style={{ fontSize: 14, color: '#999' }}>
              已用时: {minutes}:{seconds.toString().padStart(2, '0')}
            </span>
          </div>
          
          {/* 词汇列表 */}
          <div style={{ 
            backgroundColor: '#f8f9fa', 
            borderRadius: 8, 
            padding: 16,
            marginBottom: 16,
            maxHeight: 120,
            overflowY: 'auto'
          }}>
            <div style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>
              待处理词汇:
            </div>
            <div style={{ fontSize: 14, color: '#333', lineHeight: 1.4 }}>
              {status.currentWords.map((word, index) => (
                <span key={index} style={{ 
                  display: 'inline-block',
                  backgroundColor: '#e3f2fd',
                  padding: '4px 8px',
                  margin: '2px',
                  borderRadius: 6,
                  fontSize: 13
                }}>
                  {word}
                </span>
              ))}
            </div>
          </div>
        </div>
        
        {/* 流式输出区域 */}
        <div style={{ 
          flex: 1,
          backgroundColor: '#f5f5f5', 
          border: '1px solid #ddd',
          borderRadius: 8,
          padding: 16,
          marginBottom: 20,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ color: '#666', marginBottom: 12, fontSize: 14, fontWeight: 500 }}>
            AI 响应流:
          </div>
          <div style={{ 
            flex: 1,
            overflowY: 'auto',
            fontFamily: 'monospace',
            fontSize: 13,
            lineHeight: 1.4
          }}>
            {status.isProcessing ? (
              <div>
                {status.streamOutput.length > 0 ? (
                  <div>
                    {status.streamOutput.map((line, index) => (
                      <div key={index} style={{ 
                        marginBottom: 6,
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
                        marginTop: 12,
                        padding: '16px',
                        backgroundColor: '#f8f9fa',
                        border: '1px solid #28a745',
                        borderRadius: 8,
                        fontSize: 14,
                        lineHeight: 1.5
                      }}>
                        <div style={{ color: '#28a745', fontWeight: 'bold', marginBottom: 12 }}>
                          🚀 实时生成内容:
                        </div>
                        <div 
                          ref={streamContentRef}
                          className="stream-content-container"
                          style={{ 
                            color: '#333',
                            whiteSpace: 'pre-wrap',
                            fontFamily: 'system-ui, -apple-system, sans-serif',
                            maxHeight: '200px',
                            overflowY: 'auto',
                            scrollBehavior: 'smooth'
                          }}
                        >
                          {typeof streamContent === 'string' ? streamContent : String(streamContent)}
                          <span style={{ 
                            display: 'inline-block',
                            width: '2px',
                            height: '18px',
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
                    marginTop: 12,
                    padding: '8px 12px',
                    backgroundColor: status.currentStep.includes('重试') ? '#fff3e0' :
                                    status.currentStep.includes('cancelled') ? '#f8d7da' :
                                    status.currentStep.includes('waiting') ? '#d1ecf1' :
                                    status.currentStep.includes('streaming') ? '#d4edda' :
                                    status.currentStep.includes('completed') ? '#d4edda' : '#e3f2fd',
                    borderRadius: 6
                  }}>
                    当前步骤: {status.currentStep}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ color: '#28a745', fontSize: 16, fontWeight: 'bold' }}>
                ✅ 处理完成
              </div>
            )}
          </div>
        </div>
        
        {/* 操作按钮 */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          {status.isProcessing ? (
            <button 
              onClick={handleCancel}
              style={{ 
                padding: '12px 24px',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                fontSize: 16,
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              🛑 取消处理
            </button>
          ) : (
            <button 
              onClick={onClose}
              style={{ 
                padding: '12px 24px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                fontSize: 16,
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              ✅ 关闭窗口
            </button>
          )}
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
    </div>
  )
}
