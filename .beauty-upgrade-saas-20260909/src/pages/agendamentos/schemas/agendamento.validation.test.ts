import { afterEach, describe, expect, it, vi } from 'vitest'
import type { AgendaOptions } from '../types/agendamento.types'
import { getEmptyAppointmentFormValues } from '../utils/agenda.utils'
import { validateAppointmentForm } from './agendamento.validation'

const options: AgendaOptions = { clients: [], employees: [], services: [], assignments: [], schedules: [] }
describe('validação do agendamento', () => {
  afterEach(() => vi.useRealTimers())
  it('exige cliente, data futura e serviço completo', () => {
    const values = getEmptyAppointmentFormValues('2020-01-01')
    const errors = validateAppointmentForm(values, options)
    expect(errors.clientId).toBeTruthy(); expect(errors.dateTime).toBeTruthy(); expect(errors.items).toBeTruthy()
  })
  it('bloqueia um horário que já passou no dia atual', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 7, 24, 15, 2))
    const values = { ...getEmptyAppointmentFormValues('2026-08-24', '15:00'), clientId: '1' }
    expect(validateAppointmentForm(values, options).dateTime).toBe('Escolha um dia e horário futuros.')
  })
})
