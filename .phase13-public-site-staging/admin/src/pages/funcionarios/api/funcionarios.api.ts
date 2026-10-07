import { supabase } from '../../../supabase/supabaseApi'
import type { AbsenceInput, BlockInput, BloqueioAgenda, EmployeeServiceInput, EmployeeServicesData, Funcionario, FuncionarioAusencia, FuncionarioHorario, FuncionariosListParams, FuncionariosListResult, FuncionariosMetrics, FuncionarioWriteInput, ScheduleDayValue } from '../types/funcionarios.types'
import { sanitizeEmployeeSearch } from '../utils/funcionarios.utils'

const requestError = (message: string, cause: unknown) => new Error(message, { cause })

export async function listEmployees(params: FuncionariosListParams): Promise<FuncionariosListResult> {
  const page = Math.max(1, params.page), pageSize = Math.min(Math.max(5, params.pageSize), 100), from = (page - 1) * pageSize
  const search = sanitizeEmployeeSearch(params.search)
  let query = supabase.from('funcionarios').select('*', { count: 'exact' }).eq('id_empresa', params.companyId)
  if (search) query = query.or(`nome.ilike.%${search}%,cpf.ilike.%${search}%,telefone.ilike.%${search}%,email.ilike.%${search}%,cargo.ilike.%${search}%`)
  if (params.status !== 'todos') query = query.eq('ativo', params.status === 'ativos')
  const { data, error, count } = await query.order('ativo', { ascending: false }).order('nome').range(from, from + pageSize - 1)
  if (error) throw requestError('Não foi possível carregar os funcionários.', error)
  const total = count ?? 0
  return { items: data ?? [], total, totalPages: Math.max(1, Math.ceil(total / pageSize)), page, pageSize }
}

export async function getEmployeesMetrics(companyId: number): Promise<FuncionariosMetrics> {
  const [total, active, attending] = await Promise.all([
    supabase.from('funcionarios').select('id', { count: 'exact', head: true }).eq('id_empresa', companyId),
    supabase.from('funcionarios').select('id', { count: 'exact', head: true }).eq('id_empresa', companyId).eq('ativo', true),
    supabase.from('funcionarios').select('id', { count: 'exact', head: true }).eq('id_empresa', companyId).eq('ativo', true).eq('atende_clientes', true),
  ])
  if (total.error || active.error || attending.error) throw requestError('Não foi possível carregar o resumo de funcionários.', total.error ?? active.error ?? attending.error)
  const totalCount = total.count ?? 0, activeCount = active.count ?? 0
  return { total: totalCount, active: activeCount, attending: attending.count ?? 0, inactive: totalCount - activeCount }
}

export async function createEmployee(companyId: number, input: FuncionarioWriteInput): Promise<Funcionario> {
  const { data, error } = await supabase.from('funcionarios').insert({ ...input, id_empresa: companyId }).select('*').single()
  if (error) throw requestError('Não foi possível cadastrar o funcionário.', error)
  return data
}
export async function updateEmployee(companyId: number, employeeId: number, input: FuncionarioWriteInput): Promise<Funcionario> {
  const { data, error } = await supabase.from('funcionarios').update(input).eq('id_empresa', companyId).eq('id', employeeId).select('*').single()
  if (error) throw requestError('Não foi possível atualizar o funcionário.', error)
  return data
}
export async function toggleEmployeeStatus(companyId: number, employeeId: number, active: boolean) {
  const { data, error } = await supabase.from('funcionarios').update({ ativo: active }).eq('id_empresa', companyId).eq('id', employeeId).select('*').single()
  if (error) throw requestError('Não foi possível alterar o status do funcionário.', error)
  return data
}

export async function getEmployeeSchedule(companyId: number, employeeId: number): Promise<FuncionarioHorario[]> {
  const { data, error } = await supabase.from('funcionarios_horarios').select('*').eq('id_empresa', companyId).eq('id_funcionario', employeeId).eq('ativo', true).order('dia_semana')
  if (error) throw requestError('Não foi possível carregar a jornada.', error)
  return data ?? []
}
export async function saveEmployeeSchedule(companyId: number, employeeId: number, days: ScheduleDayValue[]) {
  const { error: deactivateError } = await supabase.from('funcionarios_horarios').update({ ativo: false }).eq('id_empresa', companyId).eq('id_funcionario', employeeId).eq('ativo', true)
  if (deactivateError) throw requestError('Não foi possível atualizar a jornada.', deactivateError)
  const rows = days.filter((day) => day.enabled).map((day) => ({ id_empresa: companyId, id_funcionario: employeeId, dia_semana: day.day, hora_inicio: day.start, hora_fim: day.end, intervalo_inicio: day.hasBreak ? day.breakStart : null, intervalo_fim: day.hasBreak ? day.breakEnd : null, ativo: true }))
  if (!rows.length) return
  const { error } = await supabase.from('funcionarios_horarios').upsert(rows, { onConflict: 'id_empresa,id_funcionario,dia_semana,hora_inicio,hora_fim' })
  if (error) throw requestError('Não foi possível salvar a jornada.', error)
}

export async function getEmployeeServices(companyId: number, employeeId: number): Promise<EmployeeServicesData> {
  const [services, assignments] = await Promise.all([
    supabase.from('servicos').select('*').eq('id_empresa', companyId).eq('ativo', true).order('nome'),
    supabase.from('funcionarios_servicos').select('*').eq('id_empresa', companyId).eq('id_funcionario', employeeId),
  ])
  if (services.error || assignments.error) throw requestError('Não foi possível carregar os serviços do funcionário.', services.error ?? assignments.error)
  return { services: services.data ?? [], assignments: assignments.data ?? [] }
}
export async function saveEmployeeServices(companyId: number, employeeId: number, inputs: EmployeeServiceInput[]) {
  const rows = inputs.map((item) => ({ id_empresa: companyId, id_funcionario: employeeId, id_servico: item.serviceId, ativo: item.active, duracao_personalizada: item.customDuration, valor_personalizado: item.customPrice }))
  if (!rows.length) return
  const { error } = await supabase.from('funcionarios_servicos').upsert(rows, { onConflict: 'id_empresa,id_funcionario,id_servico' })
  if (error) throw requestError('Não foi possível salvar os serviços do funcionário.', error)
}

export async function listEmployeeAbsences(companyId: number, employeeId: number): Promise<FuncionarioAusencia[]> {
  const { data, error } = await supabase.from('funcionarios_ausencias').select('*').eq('id_empresa', companyId).eq('id_funcionario', employeeId).order('inicio', { ascending: false })
  if (error) throw requestError('Não foi possível carregar as ausências.', error)
  return data ?? []
}
export async function createEmployeeAbsence(companyId: number, employeeId: number, input: AbsenceInput) {
  const { data, error } = await supabase.from('funcionarios_ausencias').insert({ id_empresa: companyId, id_funcionario: employeeId, tipo: input.tipo, inicio: input.inicio, fim: input.fim, dia_inteiro: input.diaInteiro, motivo: input.motivo, status: 'aprovado' }).select('*').single()
  if (error) throw requestError('Não foi possível registrar a ausência.', error)
  return data
}
export async function cancelEmployeeAbsence(companyId: number, absenceId: number) {
  const { data, error } = await supabase.from('funcionarios_ausencias').update({ status: 'cancelado' }).eq('id_empresa', companyId).eq('id', absenceId).select('*').single()
  if (error) throw requestError('Não foi possível cancelar a ausência.', error)
  return data
}

export async function listBlocks(companyId: number): Promise<BloqueioAgenda[]> {
  const { data, error } = await supabase.from('bloqueios_agenda').select('*').eq('id_empresa', companyId).order('inicio', { ascending: false }).limit(100)
  if (error) throw requestError('Não foi possível carregar os bloqueios.', error)
  return data ?? []
}
export async function createBlock(companyId: number, input: BlockInput) {
  const { data, error } = await supabase.from('bloqueios_agenda').insert({ id_empresa: companyId, id_funcionario: input.employeeId, tipo: input.tipo, inicio: input.inicio, fim: input.fim, dia_inteiro: input.diaInteiro, motivo: input.motivo, status: 'ativo' }).select('*').single()
  if (error) throw requestError('Não foi possível criar o bloqueio.', error)
  return data
}
export async function cancelBlock(companyId: number, blockId: number, reason: string) {
  const { data, error } = await supabase.from('bloqueios_agenda').update({ status: 'cancelado', cancelado_em: new Date().toISOString(), motivo_cancelamento: reason.trim() }).eq('id_empresa', companyId).eq('id', blockId).select('*').single()
  if (error) throw requestError('Não foi possível cancelar o bloqueio.', error)
  return data
}
