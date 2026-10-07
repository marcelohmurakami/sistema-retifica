import { supabase } from '../../../supabase/supabaseApi'
import type { AgendaAppointment, AgendaOptions, AgendaQueryParams, AppointmentStatus, AppointmentWriteInput, AvailabilityBusyInterval } from '../types/agendamento.types'

function agendaError(message: string, cause: unknown) {
  const details = cause && typeof cause === 'object' && 'message' in cause ? String(cause.message) : ''
  if (details.includes('agendamentos_servicos_sem_conflito_profissional') || details.includes('conflicting key value violates exclusion constraint')) return new Error('O profissional já possui outro atendimento nesse horário.', { cause })
  if (details.includes('horário está bloqueado')) return new Error('Esse horário está bloqueado na agenda.', { cause })
  if (details.includes('está ausente')) return new Error('O profissional está ausente nesse período.', { cause })
  if (details.includes('fora da jornada') || details.includes('fora do horário')) return new Error('O horário escolhido está fora da jornada do profissional.', { cause })
  if (details.includes('não está habilitado')) return new Error('O profissional não está habilitado para esse serviço.', { cause })
  return new Error(message, { cause })
}

export async function listAppointments({ companyId, startIso, endIso }: AgendaQueryParams): Promise<AgendaAppointment[]> {
  const { data, error } = await supabase
    .from('agendamentos')
    .select(`*, cliente:clientes!agendamentos_cliente_empresa_fkey(id,nome,telefone_principal,email,ativo), itens:agendamentos_servicos(*, funcionario:funcionarios!agendamentos_servicos_funcionario_empresa_fkey(id,nome,cargo,cor_agenda,atende_clientes,ativo), servico:servicos!agendamentos_servicos_servico_empresa_fkey(id,nome,preco,duracao_minutos,intervalo_minutos,exige_sinal,sinal_tipo,sinal_valor,ativo))`)
    .eq('id_empresa', companyId)
    .lt('inicio', endIso)
    .gt('fim', startIso)
    .order('inicio')
  if (error) throw agendaError('Não foi possível carregar a agenda.', error)
  return (data ?? []) as unknown as AgendaAppointment[]
}

export async function getAgendaOptions(companyId: number): Promise<AgendaOptions> {
  const [clients, employees, services, assignments, schedules] = await Promise.all([
    supabase.from('clientes').select('id,nome,telefone_principal,email,ativo').eq('id_empresa', companyId).order('nome').limit(500),
    supabase.from('funcionarios').select('id,nome,cargo,cor_agenda,atende_clientes,ativo').eq('id_empresa', companyId).eq('atende_clientes', true).order('nome').limit(200),
    supabase.from('servicos').select('id,nome,preco,duracao_minutos,intervalo_minutos,exige_sinal,sinal_tipo,sinal_valor,ativo').eq('id_empresa', companyId).order('nome').limit(500),
    supabase.from('funcionarios_servicos').select('*').eq('id_empresa', companyId),
    supabase.from('funcionarios_horarios').select('id_funcionario,dia_semana,hora_inicio,hora_fim,intervalo_inicio,intervalo_fim,ativo').eq('id_empresa', companyId).eq('ativo', true),
  ])
  const error = clients.error ?? employees.error ?? services.error ?? assignments.error ?? schedules.error
  if (error) throw agendaError('Não foi possível carregar as opções do agendamento.', error)
  const activeEmployeeIds = new Set((employees.data ?? []).filter((employee) => employee.ativo).map((employee) => employee.id))
  return { clients: clients.data ?? [], employees: employees.data ?? [], services: services.data ?? [], assignments: assignments.data ?? [], schedules: (schedules.data ?? []).filter((schedule) => activeEmployeeIds.has(schedule.id_funcionario)) }
}

export async function getDayAvailability({ companyId, startIso, endIso }: AgendaQueryParams): Promise<AvailabilityBusyInterval[]> {
  const [appointments, absences, blocks] = await Promise.all([
    supabase
      .from('agendamentos_servicos')
      .select('id_agendamento,id_funcionario,inicio,fim,status')
      .eq('id_empresa', companyId)
      .neq('status', 'cancelado')
      .lt('inicio', endIso)
      .gt('fim', startIso),
    supabase
      .from('funcionarios_ausencias')
      .select('id_funcionario,inicio,fim,status')
      .eq('id_empresa', companyId)
      .eq('status', 'aprovado')
      .lt('inicio', endIso)
      .gt('fim', startIso),
    supabase
      .from('bloqueios_agenda')
      .select('id_funcionario,inicio,fim,status')
      .eq('id_empresa', companyId)
      .eq('status', 'ativo')
      .lt('inicio', endIso)
      .gt('fim', startIso),
  ])
  const error = appointments.error ?? absences.error ?? blocks.error
  if (error) throw agendaError('Não foi possível consultar os horários disponíveis.', error)

  return [
    ...(appointments.data ?? []).map((item) => ({
      employeeId: item.id_funcionario,
      start: item.inicio,
      end: item.fim,
      appointmentId: item.id_agendamento,
      source: 'appointment' as const,
    })),
    ...(absences.data ?? []).map((item) => ({
      employeeId: item.id_funcionario,
      start: item.inicio,
      end: item.fim,
      source: 'absence' as const,
    })),
    ...(blocks.data ?? []).map((item) => ({
      employeeId: item.id_funcionario,
      start: item.inicio,
      end: item.fim,
      source: 'block' as const,
    })),
  ]
}

export async function saveAppointment(input: AppointmentWriteInput) {
  const { data, error } = await supabase.rpc('salvar_agendamento', {
    p_agendamento_id: input.appointmentId ?? (null as unknown as number),
    p_id_empresa: input.companyId,
    p_id_cliente: input.clientId,
    p_observacoes: input.notes,
    p_sinal_status: input.signalStatus,
    p_sinal_valor: input.signalValue ?? (null as unknown as number),
    p_servicos: input.services,
  })
  if (error) throw agendaError(input.appointmentId ? 'Não foi possível atualizar o agendamento.' : 'Não foi possível criar o agendamento.', error)
  return data
}

export async function updateAppointmentStatus(companyId: number, appointmentId: number, status: AppointmentStatus, cancellationReason?: string) {
  const { data, error } = await supabase
    .from('agendamentos')
    .update({ status, motivo_cancelamento: status === 'cancelado' ? cancellationReason?.trim() : undefined })
    .eq('id_empresa', companyId)
    .eq('id', appointmentId)
    .select('*')
    .single()
  if (error) throw agendaError('Não foi possível alterar o status do agendamento.', error)
  return data
}
