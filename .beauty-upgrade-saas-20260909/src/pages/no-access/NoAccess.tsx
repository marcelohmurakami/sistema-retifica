import { LogOut, ShieldX } from 'lucide-react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { useAuth } from '../../features/auth/hooks/useAuth'
import { useLogout } from '../../features/auth/hooks/useAuthMutations'

export function NoAccess() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const logout = useLogout()

  async function handleLogout() {
    try {
      await logout.mutateAsync()
      navigate('/login', { replace: true })
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Não foi possível sair.',
      )
    }
  }

  return (
    <main className="auth-state-page">
      <section className="auth-state-card">
        <span className="auth-state-card__icon auth-state-card__icon--warning">
          <ShieldX size={34} />
        </span>
        <span className="page-eyebrow">Acesso pendente</span>
        <h1>Sua conta não possui uma empresa ativa</h1>
        <p>
          O usuário <strong>{user?.email}</strong> foi autenticado, mas ainda não
          está vinculado a uma empresa ativa. Peça ao administrador para liberar
          seu acesso.
        </p>
        <button
          className="btn btn--secondary"
          type="button"
          onClick={() => void handleLogout()}
          disabled={logout.isPending}
        >
          {logout.isPending ? <span className="btn-spinner" /> : <LogOut size={17} />}
          Sair da conta
        </button>
      </section>
    </main>
  )
}
