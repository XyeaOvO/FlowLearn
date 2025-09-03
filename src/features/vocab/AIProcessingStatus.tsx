import { useAIProcessingStatus } from '../../shared/lib/useAIProcessingStatus'
import { useStreamContent } from '../../shared/lib/useStreamContent'

interface AIProcessingStatusProps {
  onStatusChange?: (isProcessing: boolean) => void
}

export default function AIProcessingStatus({ onStatusChange }: AIProcessingStatusProps) {
  const { status, cancelProcessing } = useAIProcessingStatus(onStatusChange)
  const { streamContent, streamContentRef } = useStreamContent(true)

  // 流式内容处理逻辑已移至useStreamContent hook中

  // 不再显示固定状态栏，改为使用独立窗口
  return null

  const elapsed = Math.floor((Date.now() - status.startTime) / 1000)
  const minutes = Math.floor(elapsed / 60)
  const seconds = elapsed % 60

  const handleCancel = async () => {
    await cancelProcessing()
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
