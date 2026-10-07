import { createContext } from 'react'
import type { AppModule, FeatureCode } from '../access.constants'
import type {
  PlanPermission,
  PlanWithPermissions,
  SubscriptionAccessStatus,
  SubscriptionWithPlan,
  UserRole,
} from '../types/access.types'

export type AccessContextValue = {
  assinatura: SubscriptionWithPlan | null
  plano: PlanWithPermissions | null
  permissoes: PlanPermission[]
  cargo: UserRole | null
  statusAcesso: SubscriptionAccessStatus
  possuiAssinaturaAcessivel: boolean
  isLoading: boolean
  error: Error | null
  primeiroCaminhoPermitido: string | null
  possuiPermissaoPlano: (funcionalidade: FeatureCode) => boolean
  possuiPermissaoCargo: (modulo: AppModule) => boolean
  podeAcessarModulo: (modulo: AppModule) => boolean
  obterLimite: (funcionalidade: FeatureCode) => number | null
  refetchAccess: () => Promise<unknown>
}

export const AccessContext = createContext<AccessContextValue | undefined>(
  undefined,
)
