import { ipcRenderer, contextBridge } from 'electron'

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld('api', {
  on: (...args: Parameters<typeof ipcRenderer.on>) => ipcRenderer.on(...args),
  off: (...args: Parameters<typeof ipcRenderer.off>) => ipcRenderer.off(...args),
  invoke: (channel: string, ...args: any[]) => ipcRenderer.invoke(channel, ...args),
})

declare global {
  interface Window {
    api: {
      on: typeof ipcRenderer.on
      off: typeof ipcRenderer.off
      invoke: (channel: string, ...args: any[]) => Promise<any>
    }
  }
}
