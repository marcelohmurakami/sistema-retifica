import type { Json, Tables } from '../../../types/database.types'

export type Agendamento = Tables<'agendamentos'>
export type AgendamentoServico = Tables<'agendamentos_servicos'>
export type Cliente = Pick<Tables<'clientes'>, 'id' | 'nome' | 'telefone_principal' | 'email' | 'ativo'>
export type Funcionario = Pick<Tables<'funcionarios'>, 'id' | 'nome' | 'cargo' | 'cor_agenda' | 'atende_clientes' | 'ativo'>
export type Servico = Pick<Tables<'servicos'>, 'id' | 'nome' | 'preco' | 'duracao_minutos' | 'intervalo_minutos' | 'exige_sinal' | 'sinal_tipo' | 'sinal_valor' | 'ativo'>
export type FuncionarioServico = Tables<'funcionarios_servicos'>
export type FuncionarioHorario = Pick<Tables<'funcionarios_horarios'>, 'id_funcionario' | 'dia_semana' | 'hora_inicio' | 'hora_fim' | 'intervalo_inicio' | 'intervalo_fim' | 'ativo'>

export type AgendaItem = AgendamentoServico & {
  funcionario: Funcionario | null
  servico: Servico | null
}

export type AppointmentPayment = {
  id: number
  valor: number
  status: string
  provedor: string | null
  identificador_externo: string | null
  provedor_status: string | null
  provedor_status_detalhe: string | null
  expira_em: string | null
  data_pagamento: string
}

export type AppointmentRefund = {
  id: number
  valor: number
  status: string
  motivo: string
  provedor_status: string | null
  provedor_status_detalhe: string | null
  ultimo_erro: string | null
  created_at: string
}

export type AgendaAppointment = Agendamento & {
  cliente: Cliente | null
  itens: AgendaItem[]
  pagamentos: AppointmentPayment[]
  estornos: AppointmentRefund[]
}

export type AgendaView = 'day' | 'week' | 'month'
export type AppointmentStatus =
  | 'aguardando_confirmacao'
  | 'aguardando_pagamento'
  | 'confirmado'
  | 'em_atendimento'
  | 'finalizado'
  | 'no_show'
  | 'cancelado'

export type AgendaQueryParams = {
  companyId: number
  startIso: string
  endIso: string
}

export type AvailabilityBusyInterval = {
  employeeId: number | null
  start: string
  end: string
  appointmentId?: number
  source: 'appointment' | 'absence' | 'block'
}

export type AgendaOptions = {
  clients: Cliente[]
  employees: Funcionario[]
  services: Servico[]
  assignments: FuncionarioServico[]
  schedules: FuncionarioHorario[]
}

export type AppointmentFormItem = {
  id?: number
  serviceId: string
  employeeId: string
  durationMinutes: number
  intervalMinutes: number
  price: number
  notes: string
}

export type AppointmentFormValues = {
  clientId: string
  date: string
  time: string
  notes: string
  items: AppointmentFormItem[]
}

export type AppointmentWriteInput = {
  appointmentId?: number
  companyId: number
  clientId: number
  notes: string
  signalStatus: string
  signalValue: number | null
  services: Json
}

export type UpdateAppointmentStatusInput = {
  appointmentId: number
  status: AppointmentStatus
  cancellationReason?: string
}

export type ResendAppointmentConfirmationInput = {
  appointmentId: number
}
