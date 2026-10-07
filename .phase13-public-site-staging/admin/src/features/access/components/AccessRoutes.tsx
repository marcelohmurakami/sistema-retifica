import {
  CircleAlert,
  CreditCard,
  LogOut,
  RefreshCw,
  ShieldX,
} from 'lucide-react'
import { Link, Outlet, useLocation } from 'react-router'
import { toast } from 'sonner'
import {
  MODULE_ACCESS,
  ROLE_LABELS,
  type AppModule,
} from '../access.constants'
import { useLogout } from '../../auth/hooks/useAuthMutations'
import { AuthLoadingScreen } from '../../auth/components/AuthLoadingScreen'
import { useAccess } from '../hooks/useAccess'
import type { SubscriptionAccessStatus } from '../types/access.types'

type BlockedSubscriptionStatus = Exclude<
  SubscriptionAccessStatus,
  'ativa' | 'teste'
>

const subscriptionStatusCopy: Record<
  BlockedSubscriptionStatus,
  { eyebrow: string; title: string; description: string }
> = {
  sem_assinatura: {
    eyebrow: 'Assinatura necessária',
    title: 'Esta empresa ainda não possui um plano',
    description:
      'Cadastre uma assinatura ativa ou de teste para liberar os recursos do sistema.',
  },
  inadimplente: {
    eyebrow: 'Pagamento pendente',
    title: 'A assinatura está inadimplente',
    description:
      'Regularize o pagamento para restaurar o acesso aos recursos contratados.',
  },
  suspensa: {
    eyebrow: 'Assinatura suspensa',
    title: 'O acesso desta empresa está temporariamente suspenso',
    description:
      'Verifique a situação da assinatura ou entre em contato com o suporte.',
  },
  cancelada: {
    eyebrow: 'Assinatura cancelada',
    title: 'O plano desta empresa foi cancelado',
    description:
      'Reative a assinatura para voltar a utilizar os módulos do sistema.',
  },
  expirada: {
    eyebrow: 'Assinatura expirada',
    title: 'O período de acesso chegou ao fim',
    description:
      'Renove o plano ou o período de testes para continuar utilizando o sistema.',
  },
  plano_indisponivel: {
    eyebrow: 'Plano indisponível',
    title: 'Não foi possível validar o plano contratado',
    description:
      'Atualize a página e, se o problema continuar, entre em contato com o suporte.',
  },
}

function AccessLoadError() {
  const { refetchAccess } = useAccess()

  return (
    <main className="auth-state-page" role="alert">
      <section className="auth-state-card">
        <span className="auth-state-card__icon auth-state-card__icon--danger">
          <CircleAlert size={32} />
        </span>
        <span className="page-eyebrow">Falha de conexão</span>
        <h1>Não foi possível verificar o plano da empresa</h1>
        <p>Tente novamente. Nenhum recurso será liberado sem essa validação.</p>
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

function SubscriptionBlocked() {
  const { statusAcesso, plano, refetchAccess } = useAccess()
  const logout = useLogout()

  if (statusAcesso === 'ativa' || statusAcesso === 'teste') return null

  const copy = subscriptionStatusCopy[statusAcesso]

  async function handleLogout() {
    try {
      await logout.mutateAsync()
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
          <CreditCard size={34} />
        </span>
        <span className="page-eyebrow">{copy.eyebrow}</span>
        <h1>{copy.title}</h1>
        <p>{copy.description}</p>
        {plano && <small>Plano identificado: {plano.nome}</small>}
        <div className="auth-state-card__actions">
          <button
            className="btn btn--primary"
            type="button"
            onClick={() => void refetchAccess()}
          >
            <RefreshCw size={17} /> Verificar novamente
          </button>
          <button
            className="btn btn--secondary"
            type="button"
            onClick={() => void handleLogout()}
            disabled={logout.isPending}
          >
            {logout.isPending ? <span className="btn-spinner" /> : <LogOut size={17} />}
            Sair
          </button>
        </div>
      </section>
    </main>
  )
}

export function AccessBoundary() {
  const { isLoading, error, possuiAssinaturaAcessivel } = useAccess()

  if (isLoading) return <AuthLoadingScreen />
  if (error) return <AccessLoadError />
  if (!possuiAssinaturaAcessivel) return <SubscriptionBlocked />

  return <Outlet />
}

type FeatureRouteProps = {
  moduleKey: AppModule
}

export function FeatureRoute({ moduleKey }: FeatureRouteProps) {
  const location = useLocation()
  const {
    plano,
    cargo,
    primeiroCaminhoPermitido,
    possuiPermissaoPlano,
    podeAcessarModulo,
  } = useAccess()

  if (podeAcessarModulo(moduleKey)) return <Outlet />

  const rule = MODULE_ACCESS[moduleKey]
  const planDenied =
    rule.feature !== null && !possuiPermissaoPlano(rule.feature)
  const fallbackPath =
    primeiroCaminhoPermitido !== location.pathname
      ? primeiroCaminhoPermitido
      : null

  return (
    <main className="access-state-page" role="alert">
      <section className="auth-state-card">
        <span className="auth-state-card__icon auth-state-card__icon--warning">
          <ShieldX size={34} />
        </span>
        <span className="page-eyebrow">Acesso restrito</span>
        <h1>Você não pode acessar {rule.label}</h1>
        <p>
          {planDenied
            ? `O módulo não está disponível no plano ${plano?.nome ?? 'atual'}.`
            : `O cargo ${cargo ? ROLE_LABELS[cargo] : 'atual'} não possui acesso a este módulo.`}
        </p>
        {fallbackPath && (
          <Link className="btn btn--primary" to={fallbackPath} replace>
            Ir para uma área disponível
          </Link>
        )}
      </section>
    </main>
  )
}
