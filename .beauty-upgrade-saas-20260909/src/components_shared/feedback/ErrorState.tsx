import { RefreshCw, TriangleAlert } from 'lucide-react'
import { getErrorMessage } from './error.utils'

export type ErrorStateProps = {
  error?: unknown
  title?: string
  description?: string
  retryLabel?: string
  onRetry?: () => void
  isRetrying?: boolean
  compact?: boolean
}

export function ErrorState({
  error,
  title = 'Não foi possível carregar os dados',
  description,
  retryLabel = 'Tentar novamente',
  onRetry,
  isRetrying = false,
  compact = false,
}: ErrorStateProps) {
  return (
    <div
      className={`error-state ${compact ? 'error-state--compact' : ''}`}
      role="alert"
    >
      <span className="error-state__icon" aria-hidden="true">
        <TriangleAlert size={28} />
      </span>
      <div className="error-state__content">
        <h3>{title}</h3>
        <p>{description ?? getErrorMessage(error)}</p>
      </div>
      {onRetry && (
        <button
          className="btn btn--secondary"
          type="button"
          onClick={onRetry}
          disabled={isRetrying}
        >
          {isRetrying ? <span className="btn-spinner" /> : <RefreshCw size={17} />}
          {isRetrying ? 'Tentando...' : retryLabel}
        </button>
      )}
    </div>
  )
}
