import { useCallback } from 'react'
import type { Settings } from '@shared/types'

export const useTTS = (settings: Settings | null) => {
  const speak = useCallback((text: string) => {
    if (!settings) return
    
    try {
      if (settings.ttsProvider === 'volcengine') {
        (async () => {
          const res = await window.api.invoke('tts:volc:query', text) as { 
            ok: boolean
            base64?: string
            encoding?: string
            error?: string 
          }
          if (!res.ok || !res.base64) return
          
          const bstr = atob(res.base64)
          const len = bstr.length
          const u8 = new Uint8Array(len)
          for (let i = 0; i < len; i++) u8[i] = bstr.charCodeAt(i)
          
          const mime = res.encoding === 'mp3' ? 'audio/mpeg' : 
                      (res.encoding === 'ogg_opus' ? 'audio/ogg' : 'audio/wav')
          const blob = new Blob([u8], { type: mime })
          const url = URL.createObjectURL(blob)
          const audio = new Audio(url)
          audio.play().finally(() => URL.revokeObjectURL(url))
        })()
        return
      }
      
      const s = window.speechSynthesis
      if (!s) return
      
      const u = new SpeechSynthesisUtterance(text)
      if (settings.ttsLang) u.lang = settings.ttsLang
      if (settings.ttsRate) u.rate = settings.ttsRate
      if (settings.ttsPitch) u.pitch = settings.ttsPitch
      if (settings.ttsVoice) {
        const voice = s.getVoices().find(v => v.name === settings.ttsVoice)
        if (voice) u.voice = voice
      }
      s.cancel()
      s.speak(u)
    } catch {
      // TTS播放失败，忽略错误
    }
  }, [settings])
  
  return { speak }
}