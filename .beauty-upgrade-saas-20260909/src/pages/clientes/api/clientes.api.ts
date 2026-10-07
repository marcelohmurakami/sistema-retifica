import { supabase } from '../../../supabase/supabaseApi'
import type {
  Cliente,
  ClienteUpdate,
  ClienteWriteInput,
  ClientesListParams,
  ClientesListResult,
  ClientesMetrics,
  Consentimento,
  ConsentValues,
} from '../types/clientes.types'
import { CONSENT_DEFINITIONS, sanitizeClientSearch } from '../utils/clientes.utils'

function requestError(message: string, cause: unknown) {
  return new Error(message, { cause })
}

export async function listClients(params: ClientesListParams): Promise<ClientesListResult> {
  const page = Math.max(1, params.page)
  const pageSize = Math.min(Math.max(5, params.pageSize), 100)
  const from = (page - 1) * pageSize
  const search = sanitizeClientSearch(params.search)
  let query = supabase
    .from('clientes')
    .select('*', { count: 'exact' })
    .eq('id_empresa', params.companyId)

  if (search) {
    query = query.or(
      `nome.ilike.%${search}%,cpf.ilike.%${search}%,telefone_principal.ilike.%${search}%,email.ilike.%${search}%`,
    )
  }
  if (params.status !== 'todos') query = query.eq('ativo', params.status === 'ativos')

  const { data, error, count } = await query
    .order('ativo', { ascending: false })
    .order('nome')
    .range(from, from + pageSize - 1)
  if (error) throw requestError('Não foi possível carregar os clientes.', error)
  const total = count ?? 0
  return { items: data ?? [], total, totalPages: Math.max(1, Math.ceil(total / pageSize)), page, pageSize }
}

export async function getClientsMetrics(companyId: number): Promise<ClientesMetrics> {
  const month = new Date().getMonth() + 1
  const [total, active, birthdays] = await Promise.all([
    supabase.from('clientes').select('id', { count: 'exact', head: true }).eq('id_empresa', companyId),
    supabase.from('clientes').select('id', { count: 'exact', head: true }).eq('id_empresa', companyId).eq('ativo', true),
    supabase.from('clientes').select('data_nascimento').eq('id_empresa', companyId).not('data_nascimento', 'is', null),
  ])
  if (total.error || active.error || birthdays.error) {
    throw requestError('Não foi possível carregar o resumo de clientes.', total.error ?? active.error ?? birthdays.error)
  }
  const totalCount = total.count ?? 0
  const activeCount = active.count ?? 0
  const birthdaysThisMonth = (birthdays.data ?? []).filter((item) => Number(item.data_nascimento?.slice(5, 7)) === month).length
  return { total: totalCount, active: activeCount, inactive: totalCount - activeCount, birthdaysThisMonth }
}

export async function getClientConsents(companyId: number, clientId: number): Promise<Consentimento[]> {
  const { data, error } = await supabase
    .from('consentimentos_comunicacao')
    .select('*')
    .eq('id_empresa', companyId)
    .eq('id_cliente', clientId)
  if (error) throw requestError('Não foi possível carregar os consentimentos.', error)
  return data ?? []
}

async function saveConsents(companyId: number, clientId: number, values: ConsentValues) {
  const now = new Date().toISOString()
  const rows = Object.entries(values).map(([key, consentiu]) => {
    const definition = CONSENT_DEFINITIONS[key as keyof ConsentValues]
    return {
      id_empresa: companyId,
      id_cliente: clientId,
      canal: definition.canal,
      finalidade: definition.finalidade,
      consentiu,
      origem: 'painel',
      registrado_em: now,
      revogado_em: consentiu ? null : now,
      user_agent: typeof navigator === 'undefined' ? null : navigator.userAgent,
    }
  })
  const { error } = await supabase
    .from('consentimentos_comunicacao')
    .upsert(rows, { onConflict: 'id_empresa,id_cliente,canal,finalidade' })
  if (error) throw requestError('Cliente salvo, mas não foi possível registrar os consentimentos.', error)
}

export async function createClient(companyId: number, input: ClienteWriteInput): Promise<Cliente> {
  const { data, error } = await supabase
    .from('clientes')
    .insert({ ...input.cliente, id_empresa: companyId })
    .select('*')
    .single()
  if (error) throw requestError('Não foi possível cadastrar o cliente.', error)
  await saveConsents(companyId, data.id, input.consentimentos)
  return data
}

export async function updateClient(companyId: number, clientId: number, input: ClienteWriteInput): Promise<Cliente> {
  const { data, error } = await supabase
    .from('clientes')
    .update(input.cliente as ClienteUpdate)
    .eq('id_empresa', companyId)
    .eq('id', clientId)
    .select('*')
    .single()
  if (error) throw requestError('Não foi possível atualizar o cliente.', error)
  await saveConsents(companyId, clientId, input.consentimentos)
  return data
}

export async function toggleClientStatus(companyId: number, clientId: number, active: boolean) {
  const { data, error } = await supabase
    .from('clientes')
    .update({ ativo: active })
    .eq('id_empresa', companyId)
    .eq('id', clientId)
    .select('*')
    .single()
  if (error) throw requestError('Não foi possível alterar o status do cliente.', error)
  return data
}
