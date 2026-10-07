import { supabase } from '../../../supabase/supabaseApi'
import type {
  Servico,
  ServicoUpdate,
  ServicoWritePayload,
  ServicosListParams,
  ServicosListResult,
  ServicosMetrics,
} from '../types/servicos.types'
import { sanitizeServiceSearch } from '../utils/servicos.utils'

function serviceRequestError(message: string, cause: unknown) {
  return new Error(message, { cause })
}

export async function listServices({
  companyId,
  search,
  status,
  page,
  pageSize,
}: ServicosListParams): Promise<ServicosListResult> {
  const safePage = Math.max(1, page)
  const safePageSize = Math.min(Math.max(5, pageSize), 100)
  const from = (safePage - 1) * safePageSize
  const to = from + safePageSize - 1
  const safeSearch = sanitizeServiceSearch(search)

  let query = supabase
    .from('servicos')
    .select('*', { count: 'exact' })
    .eq('id_empresa', companyId)

  if (safeSearch) {
    query = query.or(
      `nome.ilike.%${safeSearch}%,descricao.ilike.%${safeSearch}%`,
    )
  }

  if (status !== 'todos') {
    query = query.eq('ativo', status === 'ativos')
  }

  const { data, error, count } = await query
    .order('ativo', { ascending: false })
    .order('nome', { ascending: true })
    .range(from, to)

  if (error) {
    throw serviceRequestError('Não foi possível carregar os serviços.', error)
  }

  const total = count ?? 0

  return {
    items: data ?? [],
    total,
    totalPages: Math.max(1, Math.ceil(total / safePageSize)),
    page: safePage,
    pageSize: safePageSize,
  }
}

export async function getServicesMetrics(
  companyId: number,
): Promise<ServicosMetrics> {
  const [totalResult, activeResult] = await Promise.all([
    supabase
      .from('servicos')
      .select('id', { count: 'exact', head: true })
      .eq('id_empresa', companyId),
    supabase
      .from('servicos')
      .select('id', { count: 'exact', head: true })
      .eq('id_empresa', companyId)
      .eq('ativo', true),
  ])

  if (totalResult.error || activeResult.error) {
    throw serviceRequestError(
      'Não foi possível carregar o resumo dos serviços.',
      totalResult.error ?? activeResult.error,
    )
  }

  const total = totalResult.count ?? 0
  const active = activeResult.count ?? 0

  return { total, active, inactive: Math.max(0, total - active) }
}

export async function createService(
  companyId: number,
  input: ServicoWritePayload,
): Promise<Servico> {
  const { data, error } = await supabase
    .from('servicos')
    .insert({ ...input, id_empresa: companyId })
    .select('*')
    .single()

  if (error) {
    throw serviceRequestError('Não foi possível cadastrar o serviço.', error)
  }

  return data
}

export async function updateService(
  companyId: number,
  serviceId: number,
  input: ServicoUpdate,
): Promise<Servico> {
  const { data, error } = await supabase
    .from('servicos')
    .update(input)
    .eq('id_empresa', companyId)
    .eq('id', serviceId)
    .select('*')
    .single()

  if (error) {
    throw serviceRequestError('Não foi possível atualizar o serviço.', error)
  }

  return data
}

export function toggleServiceStatus(
  companyId: number,
  serviceId: number,
  active: boolean,
) {
  return updateService(companyId, serviceId, { ativo: active })
}
