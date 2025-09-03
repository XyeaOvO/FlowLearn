import { useState, useRef, useEffect, useCallback } from 'react'

export const useResizable = (initialWidth: number, storageKey: string, min: number = 280, max: number = 600) => {
  const [width, setWidth] = useState<number>(() => {
    try {
      const stored = localStorage.getItem(storageKey)
      const value = stored ? Number(stored) : initialWidth
      return isFinite(value) ? value : initialWidth
    } catch {
      return initialWidth
    }
  })
  
  const widthRef = useRef<number>(width)
  
  useEffect(() => {
    widthRef.current = width
  }, [width])
  
  const onStartResize = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault()
    const startX = e.clientX
    const startW = width
    
    const onMove = (ev: MouseEvent) => {
      const dx = ev.clientX - startX
      let next = startW + dx
      if (next < min) next = min
      if (next > max) next = max
      setWidth(next)
      widthRef.current = next
    }
    
    const onUp = () => {
      try {
        localStorage.setItem(storageKey, String(widthRef.current))
      } catch {
        // 忽略localStorage错误
      }
      try {
        document.body.classList.remove('is-resizing')
      } catch {
        // 忽略DOM操作错误
      }
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    
    try {
      document.body.classList.add('is-resizing')
    } catch {
      // 忽略DOM操作错误
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [width, min, max, storageKey])
  
  return { width, onStartResize }
}