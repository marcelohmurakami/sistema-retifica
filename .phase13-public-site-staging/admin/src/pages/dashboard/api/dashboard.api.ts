import { supabase } from '../../../supabase/supabaseApi'
import type { DashboardData, DashboardQuery } from '../types/dashboard.types'

function dashboardError(cause: unknown) {
  const detail = cause && typeof cause === 'object' && 'message' in cause
    ? String(cause.message)
    : ''

  if (detail.includes('não possui acesso') || detail.includes('não está disponível')) {
    return new Error(detail, { cause })
  }

  return new Error('Não foi possível carregar os indicadores do dashboard.', { cause })
}

export async function getDashboard({
  companyId,
  referenceDate,
  periodDays,
}: DashboardQuery): Promise<DashboardData> {
  const { data, error } = await supabase.rpc('obter_dashboard_empresa', {
    p_id_empresa: companyId,
    p_data_referencia: referenceDate,
    p_dias_periodo: periodDays,
  })

  if (error) throw dashboardError(error)
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('O banco retornou um dashboard em formato inválido.')
  }

  return data as unknown as DashboardData
}
