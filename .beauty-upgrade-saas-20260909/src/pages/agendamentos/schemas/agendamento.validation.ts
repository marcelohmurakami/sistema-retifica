import type { AgendaOptions, AppointmentFormValues } from '../types/agendamento.types'
import { employeeCanPerformService, isAppointmentDateTimePast } from '../utils/agenda.utils'

export type AppointmentFormErrors = { clientId?: string; dateTime?: string; items?: string }

export function validateAppointmentForm(values: AppointmentFormValues, options: AgendaOptions): AppointmentFormErrors {
  const errors: AppointmentFormErrors = {}
  if (!values.clientId) errors.clientId = 'Selecione o cliente.'
  if (!values.date || !values.time) errors.dateTime = 'Informe data e horário.'
  else if (isAppointmentDateTimePast(values.date, values.time)) errors.dateTime = 'Escolha um dia e horário futuros.'
  if (!values.items.length) errors.items = 'Adicione pelo menos um serviço.'
  else if (values.items.some((item) => !item.serviceId || !item.employeeId)) errors.items = 'Selecione o serviço e o profissional em todos os itens.'
  else if (values.items.some((item) => item.durationMinutes <= 0 || item.price < 0)) errors.items = 'Revise a duração e o preço dos serviços.'
  else if (values.items.some((item) => !employeeCanPerformService(options, Number(item.employeeId), Number(item.serviceId)))) errors.items = 'Um dos profissionais não está habilitado para o serviço selecionado.'
  return errors
}

export function hasAppointmentFormErrors(errors: AppointmentFormErrors) { return Object.keys(errors).length > 0 }
