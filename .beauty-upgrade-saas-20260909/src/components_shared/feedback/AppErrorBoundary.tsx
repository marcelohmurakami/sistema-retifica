import { QueryErrorResetBoundary } from '@tanstack/react-query'
import { CircleAlert, Home, RefreshCw } from 'lucide-react'
import type { PropsWithChildren } from 'react'
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary'

function AppErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  const technicalMessage =
    error instanceof Error ? error.message : 'Erro desconhecido'

  function handleGoHome() {
    window.location.assign('/')
  }

  return (
    <main className="app-error-boundary" role="alert" aria-live="assertive">
      <section
        className="app-error-boundary__card"
        aria-labelledby="app-error-title"
      >
        <span className="app-error-boundary__icon" aria-hidden="true">
          <CircleAlert size={36} strokeWidth={1.8} />
        </span>

        <div className="app-error-boundary__content">
          <span className="page-eyebrow">Erro inesperado</span>
          <h1 id="app-error-title">Não foi possível exibir esta página</h1>
          <p>
            Seus dados continuam seguros. Tente novamente ou volte ao início do
            sistema.
          </p>
        </div>

        {import.meta.env.DEV && (
          <details className="app-error-boundary__details">
            <summary>Detalhes para desenvolvimento</summary>
            <code>{technicalMessage}</code>
          </details>
        )}

        <div className="app-error-boundary__actions">
          <button
            className="btn btn--primary"
            type="button"
            onClick={resetErrorBoundary}
          >
            <RefreshCw size={17} />
            Tentar novamente
          </button>

          <button
            className="btn btn--secondary"
            type="button"
            onClick={handleGoHome}
          >
            <Home size={17} />
            Voltar ao início
          </button>
        </div>
      </section>
    </main>
  )
}

function reportUnhandledError(
  error: unknown,
  info: { componentStack?: string | null },
) {
  console.error('Erro não tratado na interface:', error, info.componentStack)
}

export function AppErrorBoundary({ children }: PropsWithChildren) {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary
          FallbackComponent={AppErrorFallback}
          onError={reportUnhandledError}
          onReset={reset}
        >
          {children}
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  )
}
