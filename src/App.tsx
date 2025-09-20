import { ThemeProvider } from '@shared/contexts/ThemeContext'
import { ToastProvider } from '@shared/components/Toast'
import { ConfirmProvider } from '@shared/components/ConfirmDialog'
import { AppStateProvider } from '@/app/providers/AppStateProvider'
import { AppLayout } from '@/app/components/AppLayout'

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <ConfirmProvider>
          <AppStateProvider>
            <AppLayout />
          </AppStateProvider>
        </ConfirmProvider>
      </ToastProvider>
    </ThemeProvider>
  )
}

export default App
