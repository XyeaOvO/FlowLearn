declare global {
  interface Window {
    api: {
      on: (channel: string, listener: (...args: unknown[]) => void) => void
      off: (channel: string, listener: (...args: unknown[]) => void) => void
      invoke: (channel: string, ...args: unknown[]) => Promise<unknown>
    }
  }
}

export {}