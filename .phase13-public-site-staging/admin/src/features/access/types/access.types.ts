import type { Tables } from '../../../types/database.types'

export type UserRole = Tables<'usuarios_empresas'>['tipo']
export type SubscriptionStatus = Tables<'assinaturas'>['status']

export type PlanPermission = Pick<
  Tables<'permissoes_planos'>,
  'funcionalidade' | 'ativo' | 'ilimitado' | 'limite'
>

export type PlanWithPermissions = Pick<
  Tables<'planos'>,
  'id' | 'codigo' | 'nome' | 'versao' | 'ativo'
> & {
  permissoes: PlanPermission[]
}

export type SubscriptionWithPlan = Pick<
  Tables<'assinaturas'>,
  | 'id'
  | 'id_empresa'
  | 'id_plano'
  | 'status'
  | 'inicio'
  | 'periodo_atual_inicio'
  | 'periodo_atual_fim'
  | 'teste_finaliza_em'
  | 'cancelar_ao_fim_periodo'
> & {
  plano: PlanWithPermissions | null
}

export type SubscriptionAccessStatus =
  | SubscriptionStatus
  | 'sem_assinatura'
  | 'plano_indisponivel'
