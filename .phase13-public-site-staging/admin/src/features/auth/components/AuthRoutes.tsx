import { CircleAlert, RefreshCw } from 'lucide-react'
import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuth } from '../hooks/useAuth'
import { AuthLoadingScreen } from './AuthLoadingScreen'

type RouteState = {
  from?: string
}

function AccessLoadError() {
  const { accessError, refetchAccess } = useAuth()

  return (
    <main className="auth-state-page" role="alert">
      <section className="auth-state-card">
        <span className="auth-state-card__icon auth-state-card__icon--danger">
          <CircleAlert size={32} />
        </span>
        <span className="page-eyebrow">Falha de conexão</span>
        <h1>Não foi possível verificar seu acesso</h1>
        <p>{accessError?.message ?? 'Tente novamente em alguns instantes.'}</p>
        <button
          className="btn btn--primary"
          type="button"
          onClick={() => void refetchAccess()}
        >
          <RefreshCw size={17} /> Tentar novamente
        </button>
      </section>
    </main>
  )
}

export function ProtectedRoute() {
  const { session, vinculoAtual, isLoading, accessError } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return <AuthLoadingScreen />
  }

  if (!session) {
    const from = `${location.pathname}${location.search}${location.hash}`
    return <Navigate to="/login" replace state={{ from }} />
  }

  if (accessError) {
    return <AccessLoadError />
  }

  if (!vinculoAtual) {
    return <Navigate to="/sem-acesso" replace />
  }

  return <Outlet />
}

export function SessionRoute() {
  const { session, isSessionLoading } = useAuth()
  const location = useLocation()

  if (isSessionLoading) {
    return <AuthLoadingScreen />
  }

  if (!session) {
    const from = `${location.pathname}${location.search}${location.hash}`
    return <Navigate to="/login" replace state={{ from }} />
  }

  return <Outlet />
}

export function PublicOnlyRoute() {
  const { session, vinculoAtual, isLoading, accessError } = useAuth()
  const location = useLocation()
  const state = location.state as RouteState | null

  if (isLoading) {
    return <AuthLoadingScreen />
  }

  if (!session) {
    return <Outlet />
  }

  if (accessError) {
    return <AccessLoadError />
  }

  if (!vinculoAtual) {
    return <Navigate to="/sem-acesso" replace />
  }

  return <Navigate to={state?.from ?? '/'} replace />
}
