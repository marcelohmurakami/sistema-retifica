export type LoadingStateProps = {
  label?: string
  compact?: boolean
  fullPage?: boolean
}

export function LoadingState({
  label = 'Carregando...',
  compact = false,
  fullPage = false,
}: LoadingStateProps) {
  return (
    <div
      className={`loading-state ${compact ? 'loading-state--compact' : ''} ${fullPage ? 'loading-state--page' : ''}`.trim()}
      aria-live="polite"
      aria-busy="true"
      role="status"
    >
      <span className="loading-spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  )
}
