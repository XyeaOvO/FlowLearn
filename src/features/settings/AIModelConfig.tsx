import { useState, useEffect } from 'react'
import type { AIModelConfig } from '../../../shared/types'
import { testAIModel } from '../../lib/ipc'

interface AIModelConfigProps {
  model: AIModelConfig
  onUpdate: (model: AIModelConfig) => void
  onDelete: (id: string) => void
  onSetDefault: (id: string) => void
  isDefault: boolean
}

export default function AIModelConfigComponent({ 
  model, 
  onUpdate, 
  onDelete, 
  onSetDefault, 
  isDefault 
}: AIModelConfigProps) {
  const [localModel, setLocalModel] = useState(model)
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  useEffect(() => {
    setLocalModel(model)
  }, [model])

  const handleTest = async () => {
    setIsTesting(true)
    setTestResult(null)
    try {
      const result = await testAIModel(localModel)
      setTestResult({
        success: result.success,
        message: result.message || (result.success ? '连接成功' : '连接失败')
      })
      if (result.success) {
        onUpdate({ ...localModel, lastTested: Date.now(), testResult: true })
      }
    } catch (error: any) {
      setTestResult({
        success: false,
        message: error.message || '测试失败'
      })
    } finally {
      setIsTesting(false)
    }
  }

  const getDefaultApiUrl = (type: string) => {
    switch (type) {
      case 'openai': return 'https://api.openai.com/v1'
      case 'anthropic': return 'https://api.anthropic.com'
      case 'deepseek': return 'https://api.deepseek.com'
      case 'google': return 'https://generativelanguage.googleapis.com'
      default: return ''
    }
  }

  const getDefaultModelName = (type: string) => {
    switch (type) {
      case 'openai': return 'gpt-3.5-turbo'
      case 'anthropic': return 'claude-3-sonnet-20240229'
      case 'deepseek': return 'deepseek-chat'
      case 'google': return 'gemini-pro'
      default: return ''
    }
  }

  return (
    <div className="ai-model-config" style={{ 
      border: '1px solid var(--border)', 
      borderRadius: 8, 
      padding: 16, 
      marginBottom: 16,
      backgroundColor: isDefault ? 'var(--accent-bg)' : 'var(--bg)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            type="checkbox"
            checked={localModel.enabled}
            onChange={(e) => {
              const updated = { ...localModel, enabled: e.target.checked }
              setLocalModel(updated)
              onUpdate(updated)
            }}
          />
          <input
            className="input"
            value={localModel.name}
            onChange={(e) => setLocalModel({ ...localModel, name: e.target.value })}
            onBlur={() => onUpdate(localModel)}
            placeholder="模型名称"
            style={{ width: 150 }}
          />
          {isDefault && <span style={{ color: 'var(--accent)', fontSize: 12 }}>默认</span>}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {!isDefault && (
            <button 
              className="btn btn-sm" 
              onClick={() => onSetDefault(model.id)}
            >
              设为默认
            </button>
          )}
          <button 
            className="btn btn-sm btn-danger" 
            onClick={() => onDelete(model.id)}
          >
            删除
          </button>
        </div>
      </div>

      <div className="form-row" style={{ gap: 12, marginBottom: 12 }}>
        <div className="form-group" style={{ flex: 1 }}>
          <label className="form-label">服务类型</label>
          <select 
            className="select" 
            value={localModel.type}
            onChange={(e) => {
              const type = e.target.value as any
              const updated = { 
                ...localModel, 
                type,
                apiUrl: getDefaultApiUrl(type),
                modelName: getDefaultModelName(type)
              }
              setLocalModel(updated)
              onUpdate(updated)
            }}
          >
            <option value="openai">OpenAI</option>
            <option value="anthropic">Anthropic (Claude)</option>
            <option value="deepseek">DeepSeek</option>
            <option value="google">Google (Gemini)</option>
            <option value="custom">自定义</option>
          </select>
        </div>
        <div className="form-group" style={{ flex: 1 }}>
          <label className="form-label">模型名称</label>
          <input
            className="input"
            value={localModel.modelName}
            onChange={(e) => setLocalModel({ ...localModel, modelName: e.target.value })}
            onBlur={() => onUpdate(localModel)}
            placeholder="例如：gpt-3.5-turbo"
          />
        </div>
      </div>

      <div className="form-group" style={{ marginBottom: 12 }}>
        <label className="form-label">API 地址</label>
        <input
          className="input"
          value={localModel.apiUrl}
          onChange={(e) => setLocalModel({ ...localModel, apiUrl: e.target.value })}
          onBlur={() => onUpdate(localModel)}
          placeholder="例如：https://api.openai.com/v1"
        />
        <div className="form-help" style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
          完整端点: {localModel.apiUrl}/chat/completions
        </div>
      </div>

      <div className="form-group" style={{ marginBottom: 12 }}>
        <label className="form-label">API 密钥</label>
        <input
          className="input"
          type="password"
          value={localModel.apiKey}
          onChange={(e) => setLocalModel({ ...localModel, apiKey: e.target.value })}
          onBlur={() => onUpdate(localModel)}
          placeholder="输入您的 API 密钥"
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button 
          className="btn btn-sm" 
          onClick={handleTest}
          disabled={isTesting || !localModel.apiKey || !localModel.apiUrl}
        >
          {isTesting ? '测试中...' : '测试连接'}
        </button>
        
        {testResult && (
          <div style={{ 
            color: testResult.success ? 'var(--success)' : 'var(--danger)',
            fontSize: 12 
          }}>
            {testResult.message}
          </div>
        )}
        
        {localModel.lastTested && (
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>
            上次测试: {new Date(localModel.lastTested).toLocaleString()}
          </div>
        )}
      </div>
    </div>
  )
}
