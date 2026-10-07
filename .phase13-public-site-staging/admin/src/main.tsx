import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import './index.css'
import './styles/components.css'
import App from './App.tsx'
import '@fontsource-variable/inter/wght.css'
import '@fontsource-variable/manrope/wght.css'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './lib/query-client.ts'
import { AppErrorBoundary } from './components_shared/feedback/AppErrorBoundary.tsx'
import { AuthProvider } from './features/auth/context/AuthContext.tsx'
import { AccessProvider } from './features/access/context/AccessProvider.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AppErrorBoundary>
        <AuthProvider>
          <AccessProvider>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </AccessProvider>
        </AuthProvider>
      </AppErrorBoundary>
    </QueryClientProvider>
  </StrictMode>,
)
