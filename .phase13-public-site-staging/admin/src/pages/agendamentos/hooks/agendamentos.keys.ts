import type { AgendaQueryParams } from '../types/agendamento.types'
export const appointmentKeys = {
  all: (companyId: number) => ['agendamentos', companyId] as const,
  range: (params: AgendaQueryParams) => [...appointmentKeys.all(params.companyId), 'periodo', params.startIso, params.endIso] as const,
  availability: (params: AgendaQueryParams) => [...appointmentKeys.all(params.companyId), 'disponibilidade', params.startIso, params.endIso] as const,
  options: (companyId: number) => [...appointmentKeys.all(companyId), 'opcoes'] as const,
}
