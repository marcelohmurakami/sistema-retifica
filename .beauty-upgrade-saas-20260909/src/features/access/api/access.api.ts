import { supabase } from '../../../supabase/supabaseApi'
import type { AppModule } from '../access.constants'
import type { SubscriptionWithPlan } from '../types/access.types'

export async function getCompanyAccess(
  companyId: number,
): Promise<SubscriptionWithPlan | null> {
  const { data, error } = await supabase
    .from('assinaturas')
    .select(`
      id,
      id_empresa,
      id_plano,
      status,
      inicio,
      periodo_atual_inicio,
      periodo_atual_fim,
      teste_finaliza_em,
      cancelar_ao_fim_periodo,
      plano:planos!assinaturas_plano_fkey (
        id,
        codigo,
        nome,
        versao,
        ativo,
        permissoes:permissoes_planos (
          funcionalidade,
          ativo,
          ilimitado,
          limite
        )
      )
    `)
    .eq('id_empresa', companyId)
    .order('inicio', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    throw new Error('Não foi possível carregar o plano da empresa.', {
      cause: error,
    })
  }

  return data as SubscriptionWithPlan | null
}

export async function getCurrentUserModulePermissions(
  companyId: number,
  membershipId: number,
) {
  const { data, error } = await supabase
    .from('permissoes_usuarios')
    .select('modulo,permitido')
    .eq('id_empresa', companyId)
    .eq('usuario_empresa_id', membershipId)

  if (error) {
    throw new Error('Não foi possível carregar as permissões personalizadas.', {
      cause: error,
    })
  }

  return (data ?? []) as Array<{ modulo: AppModule; permitido: boolean }>
}
