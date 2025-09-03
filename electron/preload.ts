const { ipcRenderer, contextBridge } = require('electron')

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld('api', {
  on: (...args: unknown[]) => ipcRenderer.on(...args),
  off: (...args: unknown[]) => ipcRenderer.off(...args),
  invoke: (channel: string, ...args: unknown[]) => ipcRenderer.invoke(channel, ...args),
})
