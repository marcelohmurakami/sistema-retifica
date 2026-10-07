import { useQuery } from '@tanstack/react-query'
import { useMemo, type PropsWithChildren } from 'react'
import {
  APP_MODULES,
  FEATURES,
  MODULE_ACCESS,
  type AppModule,
  type FeatureCode,
} from '../access.constants'
import { accessKeys } from '../access.keys'
import {
  getCompanyAccess,
  getCurrentUserModulePermissions,
} from '../api/access.api'
import { useAuth } from '../../auth/hooks/useAuth'
import type {
  SubscriptionAccessStatus,
  SubscriptionWithPlan,
} from '../types/access.types'
import { AccessContext, type AccessContextValue } from './access-context'

function dateHasPassed(value: string | null) {
  if (!value) return false

  const timestamp = Date.parse(value)
  return Number.isFinite(timestamp) && timestamp <= Date.now()
}

function getSubscriptionAccessStatus(
  assinatura: SubscriptionWithPlan | null,
): SubscriptionAccessStatus {
  if (!assinatura) return 'sem_assinatura'
  if (!assinatura.plano?.ativo) return 'plano_indisponivel'

  if (
    assinatura.status === 'teste' &&
    dateHasPassed(assinatura.teste_finaliza_em)
  ) {
    return 'expirada'
  }

  if (
    assinatura.status === 'ativa' &&
    dateHasPassed(assinatura.periodo_atual_fim)
  ) {
    return 'expirada'
  }

  return assinatura.status
}

export function AccessProvider({ children }: PropsWithChildren) {
  const { empresaAtual, vinculoAtual } = useAuth()
  const companyId = empresaAtual?.id
  const cargo = vinculoAtual?.tipo ?? null
  const membershipId = vinculoAtual?.id

  const accessQuery = useQuery({
    queryKey: accessKeys.company(companyId ?? 0),
    queryFn: () => getCompanyAccess(companyId!),
    enabled: Boolean(companyId),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })

  const customPermissionsQuery = useQuery({
    queryKey: [...accessKeys.company(companyId ?? 0), 'usuario', membershipId ?? 0],
    queryFn: () => getCurrentUserModulePermissions(companyId!, membershipId!),
    enabled: Boolean(companyId && membershipId),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })

  const value = useMemo<AccessContextValue>(() => {
    const assinatura = accessQuery.data ?? null
    const plano = assinatura?.plano ?? null
    const permissoes = plano?.permissoes ?? []
    const statusAcesso = getSubscriptionAccessStatus(assinatura)
    const possuiAssinaturaAcessivel =
      statusAcesso === 'ativa' || statusAcesso === 'teste'
    const permissionsByFeature = new Map(
      permissoes.map((permissao) => [permissao.funcionalidade, permissao]),
    )
    const customPermissionsByModule = new Map(
      (customPermissionsQuery.data ?? []).map((permission) => [
        permission.modulo,
        permission.permitido,
      ]),
    )

    function possuiPermissaoPlano(funcionalidade: FeatureCode) {
      return (
        possuiAssinaturaAcessivel &&
        permissionsByFeature.get(funcionalidade)?.ativo === true
      )
    }

    function possuiPermissaoCargo(modulo: AppModule) {
      if (!cargo) return false

      const roleAllows = MODULE_ACCESS[modulo].allowedRoles.some(
        (allowedRole) => allowedRole === cargo,
      )

      if (!roleAllows) return false
      if (cargo === 'dono' && modulo === 'configuracoes') return true
      if (!possuiPermissaoPlano(FEATURES.CUSTOM_PERMISSIONS)) return true

      return customPermissionsByModule.get(modulo) !== false
    }

    function podeAcessarModulo(modulo: AppModule) {
      const { feature } = MODULE_ACCESS[modulo]
      const planoPermite = feature === null || possuiPermissaoPlano(feature)

      return (
        possuiAssinaturaAcessivel &&
        planoPermite &&
        possuiPermissaoCargo(modulo)
      )
    }

    function obterLimite(funcionalidade: FeatureCode) {
      const permissao = permissionsByFeature.get(funcionalidade)

      if (!possuiAssinaturaAcessivel || !permissao?.ativo) return 0
      if (permissao.ilimitado) return null

      return permissao.limite ?? 0
    }

    const primeiroModuloPermitido = APP_MODULES.find(podeAcessarModulo)

    return {
      assinatura,
      plano,
      permissoes,
      cargo,
      statusAcesso,
      possuiAssinaturaAcessivel,
      isLoading:
        Boolean(companyId) &&
        (accessQuery.isPending || customPermissionsQuery.isPending),
      error:
        accessQuery.error instanceof Error
          ? accessQuery.error
          : customPermissionsQuery.error instanceof Error
            ? customPermissionsQuery.error
            : null,
      primeiroCaminhoPermitido: primeiroModuloPermitido
        ? MODULE_ACCESS[primeiroModuloPermitido].path
        : null,
      possuiPermissaoPlano,
      possuiPermissaoCargo,
      podeAcessarModulo,
      obterLimite,
      refetchAccess: accessQuery.refetch,
    }
  }, [
    accessQuery.data,
    accessQuery.error,
    accessQuery.isPending,
    accessQuery.refetch,
    cargo,
    companyId,
    customPermissionsQuery.data,
    customPermissionsQuery.error,
    customPermissionsQuery.isPending,
  ])

  return (
    <AccessContext.Provider value={value}>{children}</AccessContext.Provider>
  )
}
