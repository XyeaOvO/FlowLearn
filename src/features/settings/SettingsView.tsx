import { useEffect, useState } from 'react'
import type { Settings, AIModelConfig } from '../../../shared/types'
import { useTranslation } from 'react-i18next'
import { exportDB, importDB, backupList, backupNow, backupOpenDir, backupRestore, resetAll } from '../../lib/ipc'
import AIModelConfigComponent from './AIModelConfig'

export default function SettingsView({ settings, onSave }: { settings: Settings; onSave: (s: Partial<Settings>) => void }) {
  const [local, setLocal] = useState(settings)
  useEffect(() => setLocal(settings), [settings])
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [opMsg, setOpMsg] = useState<string>('')
  const [backups, setBackups] = useState<Array<{ fileName: string; fullPath: string; size: number; mtime: number }>>([])
  const { t } = useTranslation()
  const loadBackups = async () => {
    try {
      const r = await backupList() as { ok: boolean; list?: Array<{ fileName: string; fullPath: string; size: number; mtime: number }>; error?: string }
      if (r?.ok && Array.isArray(r.list)) setBackups(r.list)
    } catch {}
  }
  useEffect(() => {
    const load = () => {
      try {
        const list = window.speechSynthesis?.getVoices?.() || []
        setVoices(list)
      } catch {}
    }
    load()
    try {
      window.speechSynthesis?.addEventListener?.('voiceschanged', load)
    } catch {}
    return () => {
      try {
        window.speechSynthesis?.removeEventListener?.('voiceschanged', load)
      } catch {}
    }
  }, [])
  useEffect(() => { loadBackups() }, [])
  
  return (
    <div className="settings-container">
      <div className="settings-section">
        <div className="settings-section-title">⚙️ {t('settings.section.basic')}</div>
        
        <div className="form-group">
          <label className="form-label">每日复习目标</label>
          <input 
            className="input" 
            type="number" 
            value={Number(local.dailyGoal || 0)} 
            onChange={e => setLocal({ ...local, dailyGoal: Math.max(0, Number(e.target.value) || 0) })} 
          />
          <div className="form-help">设置每天希望完成的复习数量，用于进度显示与提醒</div>
        </div>

        <div className="form-group">
          <label className="form-label">复习提醒时间（HH:MM，一行一个）</label>
          <textarea 
            className="textarea" 
            value={(local.reviewReminderTimes || []).join('\n')} 
            onChange={e => setLocal({ ...local, reviewReminderTimes: e.target.value.split('\n').map(s => s.trim()).filter(Boolean) })}
            style={{ height: 96 }}
            placeholder={'例如:\n09:00\n21:00'}
          />
          <div className="form-help">到点后会发送系统通知；无待复习时也会提示“当前无待复习”。</div>
        </div>

        <div className="form-group">
          <label className="form-label">{t('settings.triggerThreshold')}</label>
          <input 
            className="input" 
            type="number" 
            value={local.triggerThreshold} 
            onChange={e => setLocal({ ...local, triggerThreshold: Number(e.target.value) || 0 })} 
          />
          <div className="form-help">{t('settings.triggerHelp')}</div>
        </div>
        
        <div className="form-group">
          <label className="form-label">单词数量限制</label>
          <div className="form-row">
            <div>
              <input 
                className="input" 
                type="number" 
                placeholder="最小单词数"
                value={local.minWords} 
                onChange={e => setLocal({ ...local, minWords: Number(e.target.value) || 0 })} 
              />
              <div className="form-help">最少包含的单词数</div>
            </div>
            <div>
              <input 
                className="input" 
                type="number" 
                placeholder="最大单词数"
                value={local.maxWords} 
                onChange={e => setLocal({ ...local, maxWords: Number(e.target.value) || 0 })} 
              />
              <div className="form-help">最多包含的单词数</div>
            </div>
          </div>
        </div>
        
        <div className="form-group">
          <label style={{ display: 'flex', gap: 8, alignItems: 'center', cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              checked={local.ignoreMultiline} 
              onChange={e => setLocal({ ...local, ignoreMultiline: e.target.checked })} 
            />
            <span className="form-label" style={{ marginBottom: 0 }}>忽略包含换行的文本</span>
          </label>
          <div className="form-help">跳过多行文本，只处理单行内容</div>
        </div>
        
        <div className="form-group">
          <label className="form-label">{t('settings.hotkey')}</label>
          <input 
            className="input" 
            value={local.hotkey} 
            onChange={e => setLocal({ ...local, hotkey: e.target.value })} 
            placeholder="例如：Ctrl+Shift+Y"
          />
          <div className="form-help">{t('settings.hotkeyHelp')}</div>
        </div>

          <div className="form-row">
          <div className="form-group">
            <label className="form-label">{t('settings.theme')}</label>
            <select className="select" value={local.theme || 'system'} onChange={e => setLocal({ ...local, theme: e.target.value as any })}>
              <option value="system">{t('settings.themeSystem')}</option>
              <option value="light">{t('settings.themeLight')}</option>
              <option value="dark">{t('settings.themeDark')}</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">{t('settings.locale')}</label>
            <select className="select" value={local.locale || 'zh'} onChange={e => setLocal({ ...local, locale: e.target.value as any })}>
              <option value="zh">{t('settings.localeZh')}</option>
              <option value="en">{t('settings.localeEn')}</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">窗口关闭行为</label>
          <select className="select" value={local.closeAction || 'ask'} onChange={e => setLocal({ ...local, closeAction: e.target.value as any })}>
            <option value="ask">每次询问</option>
            <option value="minimize">最小化到系统托盘</option>
            <option value="exit">直接退出应用</option>
          </select>
          <div className="form-help">设置点击窗口关闭按钮时的默认行为。选择"每次询问"将弹出确认对话框。</div>
        </div>
      </div>
      
      <div className="settings-section">
        <div className="settings-section-title">🔍 {t('settings.section.filters')}</div>
        
        <div className="form-group">
          <label className="form-label">{t('settings.regexRules')}</label>
          <textarea 
            className="textarea" 
            value={(local.regexExcludes || []).join('\n')} 
            onChange={e => setLocal({ ...local, regexExcludes: e.target.value.split('\n').map(s => s.trim()).filter(Boolean) })} 
            style={{ height: 120 }}
            placeholder={`每行一条正则表达式\n例如：^https?://\n例如：\\d{4}-\\d{2}-\\d{2}`}
          />
          <div className="form-help">{t('settings.regexHelp')}</div>
        </div>
      </div>
      
      <div className="settings-section">
        <div className="settings-section-title">🤖 {t('settings.section.ai')}</div>
        
        <div className="form-group">
          <label style={{ display: 'flex', gap: 8, alignItems: 'center', cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              checked={!!local.aiEnabled} 
              onChange={e => setLocal({ ...local, aiEnabled: e.target.checked })} 
            />
            <span className="form-label" style={{ marginBottom: 0 }}>启用AI自动处理</span>
          </label>
          <div className="form-help">开启后，收集够词汇数量后会自动发送给AI处理并保存结果</div>
        </div>

        <div className="form-group">
          <label className="form-label">{t('settings.responseMode')}</label>
          <select 
            className="select" 
            value={local.responseMode} 
            onChange={e => setLocal({ ...local, responseMode: e.target.value as any })}
          >
            <option value="rich-summary">{t('settings.responseModeRich')}</option>
            <option value="json-only">{t('settings.responseModeJson')}</option>
          </select>
          <div className="form-help">{t('settings.responseModeHelp')}</div>
        </div>
        
        {local.responseMode === 'rich-summary' && (
          <div className="form-group">
            <label className="form-label">{t('settings.richHeader')}</label>
            <textarea 
              className="textarea" 
              value={local.richHeader} 
              onChange={e => setLocal({ ...local, richHeader: e.target.value })} 
              style={{ height: 160 }}
            />
            <div className="form-help">{t('settings.richHeaderHelp')}</div>
          </div>
        )}
        
        {local.responseMode === 'json-only' && (
          <div className="form-group">
            <label className="form-label">{t('settings.promptTemplate')}</label>
            <textarea 
              className="textarea" 
              value={local.promptTemplate} 
              onChange={e => setLocal({ ...local, promptTemplate: e.target.value })} 
              style={{ height: 180 }}
            />
            <div className="form-help">{t('settings.promptTemplateHelp')}</div>
          </div>
        )}

        {/* AI Model Configuration */}
        {local.aiEnabled && (
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <label className="form-label">AI模型配置</label>
              <button 
                className="btn btn-sm" 
                onClick={() => {
                  const newModel: AIModelConfig = {
                    id: Date.now().toString(),
                    name: `模型 ${(local.aiModels?.length || 0) + 1}`,
                    type: 'openai',
                    apiUrl: 'https://api.openai.com/v1',
                    apiKey: '',
                    modelName: 'gpt-3.5-turbo',
                    enabled: true,
                    isDefault: !local.aiModels?.length,
                    createdAt: Date.now()
                  }
                  const updatedModels = [...(local.aiModels || []), newModel]
                  setLocal({ 
                    ...local, 
                    aiModels: updatedModels,
                    defaultModelId: newModel.isDefault ? newModel.id : local.defaultModelId
                  })
                }}
              >
                添加模型
              </button>
            </div>
            
            {(local.aiModels || []).map((model) => (
              <AIModelConfigComponent
                key={model.id}
                model={model}
                isDefault={model.id === local.defaultModelId}
                onUpdate={(updatedModel) => {
                  const updatedModels = (local.aiModels || []).map(m => 
                    m.id === updatedModel.id ? updatedModel : m
                  )
                  setLocal({ ...local, aiModels: updatedModels })
                }}
                onDelete={(id) => {
                  const updatedModels = (local.aiModels || []).filter(m => m.id !== id)
                  setLocal({ 
                    ...local, 
                    aiModels: updatedModels,
                    defaultModelId: local.defaultModelId === id ? undefined : local.defaultModelId
                  })
                }}
                onSetDefault={(id) => {
                  const updatedModels = (local.aiModels || []).map(m => ({
                    ...m,
                    isDefault: m.id === id
                  }))
                  setLocal({ 
                    ...local, 
                    aiModels: updatedModels,
                    defaultModelId: id
                  })
                }}
              />
            ))}
            
            {(!local.aiModels || local.aiModels.length === 0) && (
              <div style={{ 
                textAlign: 'center', 
                padding: 20, 
                color: 'var(--muted)',
                border: '1px dashed var(--border)',
                borderRadius: 8
              }}>
                暂无AI模型配置，点击"添加模型"开始配置
              </div>
            )}
          </div>
        )}
      </div>

      <div className="settings-section">
        <div className="settings-section-title">🔊 {t('settings.section.tts')}</div>
        <div className="form-group">
          <label style={{ display: 'flex', gap: 8, alignItems: 'center', cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              checked={!!local.ttsEnabled} 
              onChange={e => setLocal({ ...local, ttsEnabled: e.target.checked })} 
            />
            <span className="form-label" style={{ marginBottom: 0 }}>{t('settings.ttsEnable')}</span>
          </label>
          <div className="form-help">开启后可在单词旁手动播放，也可配置自动播放</div>
        </div>
        <div className="form-group">
          <label style={{ display: 'flex', gap: 8, alignItems: 'center', cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              checked={!!local.ttsAutoOnSelect} 
              onChange={e => setLocal({ ...local, ttsAutoOnSelect: e.target.checked })} 
            />
            <span className="form-label" style={{ marginBottom: 0 }}>{t('settings.ttsAutoPlay')}</span>
          </label>
        </div>
        {local.ttsProvider !== 'volcengine' && (
          <div className="form-group">
            <label className="form-label">{t('settings.ttsLangLabel')}</label>
            <input className="input" value={local.ttsLang || ''} onChange={e => setLocal({ ...local, ttsLang: e.target.value })} placeholder="例如：en-US" />
          </div>
        )}
        <div className="form-group">
          <label className="form-label">{t('settings.ttsEngine')}</label>
          <select className="select" value={local.ttsProvider || 'local'} onChange={e => setLocal({ ...local, ttsProvider: e.target.value as any })}>
            <option value="local">本地（SpeechSynthesis）</option>
            <option value="volcengine">火山引擎 TTS</option>
          </select>
        </div>
        {local.ttsProvider === 'volcengine' && (
          <>
            <div className="form-group">
              <label className="form-label">{t('settings.volcAppid')}</label>
              <input className="input" value={local.volcAppid || ''} onChange={e => setLocal({ ...local, volcAppid: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">{t('settings.volcToken')}</label>
              <input className="input" value={local.volcToken || ''} onChange={e => setLocal({ ...local, volcToken: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">{t('settings.volcCluster')}</label>
              <input className="input" value={local.volcCluster || ''} onChange={e => setLocal({ ...local, volcCluster: e.target.value })} placeholder="volcano_tts" />
            </div>
            <div className="form-group">
              <label className="form-label">{t('settings.volcVoiceType')}</label>
              <input className="input" value={local.volcVoiceType || ''} onChange={e => setLocal({ ...local, volcVoiceType: e.target.value })} placeholder="例如：zh_female_cancan_mars_bigtts" />
            </div>
            <div className="form-row">
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">{t('settings.encoding')}</label>
                <select className="select" value={local.volcEncoding || 'mp3'} onChange={e => setLocal({ ...local, volcEncoding: e.target.value as any })}>
                  <option value="mp3">mp3</option>
                  <option value="ogg_opus">ogg_opus</option>
                  <option value="wav">wav</option>
                  <option value="pcm">pcm</option>
                </select>
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">{t('settings.speedRatio')}</label>
                <input className="input" type="number" step="0.1" min="0.8" max="2" value={local.volcSpeedRatio ?? 1} onChange={e => setLocal({ ...local, volcSpeedRatio: Number(e.target.value) || 1 })} />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">{t('settings.sampleRate')}</label>
                <input className="input" type="number" step="1000" min="8000" max="48000" value={local.volcRate ?? 24000} onChange={e => setLocal({ ...local, volcRate: Number(e.target.value) || 24000 })} />
              </div>
            </div>
          </>
        )}
        {local.ttsProvider !== 'volcengine' && (
          <div className="form-group">
            <label className="form-label">{t('settings.voiceLabel')}</label>
            {voices.length > 0 ? (
              <div className="form-row" style={{ gap: 8 }}>
                <select 
                  className="select" 
                  value={local.ttsVoice || ''}
                  onChange={e => setLocal({ ...local, ttsVoice: e.target.value || '' })}
                  style={{ flex: 1 }}
                >
                  <option value="">{t('settings.voiceLabel')}</option>
                  {(() => {
                    const lang = (local.ttsLang || '').toLowerCase()
                    const prefix = lang ? lang.split('-')[0] : ''
                    const norm = (s: string) => s.toLowerCase().replace('_','-')
                    const filtered = prefix 
                      ? voices.filter(v => norm(v.lang || '').startsWith(prefix))
                      : voices
                    const list = (prefix && filtered.length === 0) ? voices : filtered
                    return list.map(v => (
                      <option key={v.name} value={v.name}>
                        {v.name} — {v.lang}{v.default ? '（默认）' : ''}
                      </option>
                    ))
                  })()}
                </select>
                <button className="btn" onClick={() => {
                  try { 
                    setVoices(window.speechSynthesis?.getVoices?.() || [])
                    setTimeout(() => {
                      try { setVoices(window.speechSynthesis?.getVoices?.() || []) } catch {}
                    }, 500)
                  } catch {}
                }}>{t('settings.voiceRefreshBtn')}</button>
                <button className="btn" onClick={() => {
                  try {
                    const s = window.speechSynthesis
                    if (!s) return
                    const u = new SpeechSynthesisUtterance('This is a voice test.')
                    if (local.ttsLang) u.lang = local.ttsLang
                    if (local.ttsRate) u.rate = local.ttsRate
                    if (local.ttsPitch) u.pitch = local.ttsPitch
                    if (local.ttsVoice) {
                      const vv = s.getVoices().find(x => x.name === local.ttsVoice)
                      if (vv) u.voice = vv
                    }
                    s.cancel(); s.speak(u)
                  } catch {}
                }}>{t('settings.voiceTestBtn')}</button>
              </div>
            ) : (
              <div className="form-row" style={{ gap: 8 }}>
                <input className="input" value={local.ttsVoice || ''} onChange={e => setLocal({ ...local, ttsVoice: e.target.value })} placeholder="例如：Microsoft Aria Online (Natural) - English (United States)" />
                <button className="btn" onClick={() => {
                  try { window.speechSynthesis?.getVoices?.() } catch {}
                }}>{t('settings.voiceTryLoadBtn')}</button>
              </div>
            )}
            <div className="form-help">若列表为空，可先等待数秒或点击“刷新”。留空则按语言自动选择。</div>
          </div>
        )}
        {local.ttsProvider !== 'volcengine' && (
          <>
            <div className="form-group">
              <label className="form-label">{t('settings.rateLabel')}</label>
              <input className="input" type="number" step="0.1" min="0.5" max="2" value={local.ttsRate ?? 1} onChange={e => setLocal({ ...local, ttsRate: Number(e.target.value) || 1 })} />
            </div>
            <div className="form-group">
              <label className="form-label">{t('settings.pitchLabel')}</label>
              <input className="input" type="number" step="0.1" min="0" max="2" value={local.ttsPitch ?? 1} onChange={e => setLocal({ ...local, ttsPitch: Number(e.target.value) || 1 })} />
            </div>
          </>
        )}
      </div>
      
      <div className="settings-section">
        <div className="settings-section-title">💾 {t('data.section')}</div>
        <div className="form-group">
          <label className="form-label">{t('settings.importExportLabel')}</label>
          <div className="form-row" style={{ gap: 8 }}>
            <button className="btn" onClick={async () => {
              try {
                const r = await exportDB('json') as { ok: boolean; count?: number; error?: string }
                setOpMsg(r?.ok ? `已导出为 JSON（${r.count || 0} 项）` : `导出失败：${r?.error || '未知错误'}`)
              } catch (err: any) {
                setOpMsg(`导出失败：${String(err?.message || err)}`)
              }
            }}>{t('data.exportJSON')}</button>
            <button className="btn" onClick={async () => {
              try {
                const r = await exportDB('csv') as { ok: boolean; count?: number; error?: string }
                setOpMsg(r?.ok ? `已导出为 CSV（${r.count || 0} 项）` : `导出失败：${r?.error || '未知错误'}`)
              } catch (err: any) {
                setOpMsg(`导出失败：${String(err?.message || err)}`)
              }
            }}>{t('data.exportCSV')}</button>
            <button className="btn" onClick={async () => {
              try {
                const r = await importDB() as { ok: boolean; added?: number; total?: number; error?: string }
                setOpMsg(r?.ok ? `导入完成：新增 ${r.added || 0} / 共 ${r.total || 0}` : `导入失败：${r?.error || '未知错误'}`)
              } catch (err: any) {
                setOpMsg(`导入失败：${String(err?.message || err)}`)
              }
            }}>{t('data.import')}</button>
          </div>
          <div className="form-help">{t('data.importHelp')}</div>
        </div>

        <div className="form-group">
          <label className="form-label">{t('data.backup')}</label>
          <div className="form-row" style={{ gap: 8 }}>
            <button className="btn" onClick={async () => {
              try {
                const r = await backupNow() as { ok: boolean; path?: string; error?: string }
                setOpMsg(r?.ok ? '已创建备份' : `备份失败：${r?.error || '未知错误'}`)
                await loadBackups()
              } catch (err: any) {
                setOpMsg(`备份失败：${String(err?.message || err)}`)
              }
            }}>{t('data.backupNow')}</button>
            <button className="btn" onClick={async () => {
              try { await backupOpenDir() } catch {}
            }}>{t('data.openDir')}</button>
            <button className="btn" onClick={async () => {
              try {
                const r = await backupRestore() as { ok: boolean; error?: string }
                setOpMsg(r?.ok ? '已从备份恢复' : `恢复失败：${r?.error || '未知错误'}`)
              } catch (err: any) {
                setOpMsg(`恢复失败：${String(err?.message || err)}`)
              }
            }}>{t('data.restore')}</button>
            <button className="btn" onClick={loadBackups}>{t('data.refresh')}</button>
          </div>
          <div className="form-help">{t('data.autoDaily')}</div>
        </div>

        <div className="form-group" style={{ borderTop: '1px dashed var(--border)', paddingTop: 12, marginTop: 12 }}>
          <label className="form-label" style={{ color: 'var(--danger)' }}>{t('data.dangerZone')}</label>
          <div className="form-row" style={{ gap: 8 }}>
            <button className="btn btn-danger" onClick={async () => {
              try {
                if (!confirm(t('data.resetAllConfirm'))) return
                const r = await resetAll() as { ok: boolean; count?: number; error?: string }
                setOpMsg(r?.ok ? t('data.resetAllDone', { count: r.count || 0 }) : `重置失败：${r?.error || '未知错误'}`)
              } catch (err: any) {
                setOpMsg(`重置失败：${String(err?.message || err)}`)
              }
            }}>{t('data.resetAll')}</button>
          </div>
        </div>

        {opMsg && (
          <div className="form-group">
            <div className="muted">{opMsg}</div>
          </div>
        )}

        <div className="form-group">
          <label className="form-label">{t('data.recent')}</label>
          <div className="form-help">{t('data.recentTip')}</div>
          <div style={{ fontSize: 13 }}>
            {backups.slice(0, 5).map(b => (
              <div key={b.fullPath} style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <span>{new Date(b.mtime).toLocaleString()} — {b.fileName}（{(b.size / 1024).toFixed(1)} KB）</span>
              </div>
            ))}
            {backups.length === 0 && <div className="muted">{t('data.none')}</div>}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <button className="btn btn-primary" onClick={() => onSave(local)}>
          {t('actions.saveSettings')}
        </button>
        <button className="btn" onClick={() => setLocal(settings)}>
          {t('actions.reset')}
        </button>
      </div>
    </div>
  )
}


