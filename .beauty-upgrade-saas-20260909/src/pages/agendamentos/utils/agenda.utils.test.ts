import { describe, expect, it } from 'vitest'
import { allowedStatusActions, appointmentItems, appointmentProfessionalSummary, getAgendaRange, getAvailableStartTimes, getDayHourSections, getHalfHourSlots, getMinimumAppointmentDate, getMinimumAppointmentTime, getTimeSlots, getVisibleDays, getWeekdayLabels, isAppointmentDateTimePast, startOfWeek } from './agenda.utils'
import type { AgendaAppointment, AppointmentFormItem, AvailabilityBusyInterval, FuncionarioHorario } from '../types/agendamento.types'

describe('utilitários da agenda', () => {
  it('inicia a semana na segunda-feira', () => { expect(startOfWeek('2026-08-24')).toBe('2026-08-24'); expect(startOfWeek('2026-08-30')).toBe('2026-08-24') })
  it('respeita o primeiro dia da semana configurado', () => {
    expect(startOfWeek('2026-08-30', 0)).toBe('2026-08-30')
    expect(getAgendaRange('week', '2026-08-30', 0).days.at(-1)).toBe('2026-09-05')
    expect(getWeekdayLabels(0)).toEqual(['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'])
  })
  it('monta 42 dias no calendário mensal', () => { expect(getVisibleDays('month', '2026-08-24')).toHaveLength(42); expect(getAgendaRange('week', '2026-08-24').days).toHaveLength(7) })
  it('mantém estados finais sem novas ações', () => { expect(allowedStatusActions('finalizado')).toEqual({ confirm: false, start: false, finish: false, noShow: false, cancel: false, edit: false }); expect(allowedStatusActions('confirmado').start).toBe(true) })
  it('separa expediente e hora extra conforme a jornada ativa do dia', () => {
    const schedules: FuncionarioHorario[] = [
      { id_funcionario: 1, dia_semana: 1, hora_inicio: '08:00:00', hora_fim: '18:00:00', intervalo_inicio: null, intervalo_fim: null, ativo: true },
      { id_funcionario: 2, dia_semana: 1, hora_inicio: '09:00:00', hora_fim: '19:00:00', intervalo_inicio: null, intervalo_fim: null, ativo: true },
    ]
    const sections = getDayHourSections('2026-08-24', schedules)
    expect(sections.businessHours).toEqual([8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18])
    expect(sections.overtimeHours).toEqual([19, 20, 21, 22, 23, 0, 1, 2, 3, 4, 5, 6, 7])
    expect([sections.businessStart, sections.businessEnd]).toEqual(['08:00', '19:00'])
  })
  it('mantém serviços cancelados para exibição do histórico e dos profissionais', () => {
    const appointment = {
      itens: [
        { ordem: 1, status: 'cancelado', funcionario: { nome: 'Beatriz' } },
        { ordem: 2, status: 'cancelado', funcionario: { nome: 'Diego' } },
      ],
    } as unknown as AgendaAppointment
    expect(appointmentItems(appointment)).toHaveLength(2)
    expect(appointmentProfessionalSummary(appointment)).toBe('Beatriz → Diego')
  })
  it('calcula o próximo horário permitido em intervalos de cinco minutos', () => {
    const now = new Date(2026, 7, 24, 15, 2)
    expect(getMinimumAppointmentDate(now)).toBe('2026-08-24')
    expect(getMinimumAppointmentTime('2026-08-24', now)).toBe('15:05')
    expect(isAppointmentDateTimePast('2026-08-24', '15:00', now)).toBe(true)
    expect(isAppointmentDateTimePast('2026-08-24', '15:05', now)).toBe(false)
  })
  it('divide cada hora da agenda diária em intervalos de trinta minutos', () => {
    expect(getHalfHourSlots([8, 9])).toEqual(['08:00', '08:30', '09:00', '09:30'])
  })
  it('aplica o intervalo configurado inclusive quando ele não divide uma hora', () => {
    expect(getTimeSlots([8, 9, 10], 45)).toEqual(['08:00', '08:45', '09:30', '10:15'])
  })
  it('oferece apenas horários dentro da jornada, fora do intervalo e sem conflito', () => {
    const items: AppointmentFormItem[] = [
      { serviceId: '1', employeeId: '1', durationMinutes: 30, intervalMinutes: 0, price: 50, notes: '' },
    ]
    const schedules: FuncionarioHorario[] = [
      { id_funcionario: 1, dia_semana: 1, hora_inicio: '08:00:00', hora_fim: '12:00:00', intervalo_inicio: '10:00:00', intervalo_fim: '10:30:00', ativo: true },
    ]
    const busyIntervals: AvailabilityBusyInterval[] = [
      { employeeId: 1, start: '2026-08-24T09:00:00', end: '2026-08-24T09:30:00', source: 'appointment' },
    ]
    const times = getAvailableStartTimes({ date: '2026-08-24', items, schedules, busyIntervals, now: new Date('2026-08-23T12:00:00.000Z'), stepMinutes: 30 })
    expect(times).toEqual(['08:00', '08:30', '09:30', '10:30', '11:00', '11:30'])
  })
  it('valida a sequência de serviços em profissionais diferentes', () => {
    const items: AppointmentFormItem[] = [
      { serviceId: '1', employeeId: '1', durationMinutes: 60, intervalMinutes: 0, price: 80, notes: '' },
      { serviceId: '2', employeeId: '2', durationMinutes: 30, intervalMinutes: 0, price: 40, notes: '' },
    ]
    const schedules: FuncionarioHorario[] = [
      { id_funcionario: 1, dia_semana: 1, hora_inicio: '08:00:00', hora_fim: '12:00:00', intervalo_inicio: null, intervalo_fim: null, ativo: true },
      { id_funcionario: 2, dia_semana: 1, hora_inicio: '08:00:00', hora_fim: '12:00:00', intervalo_inicio: null, intervalo_fim: null, ativo: true },
    ]
    const busyIntervals: AvailabilityBusyInterval[] = [
      { employeeId: 2, start: '2026-08-24T09:00:00', end: '2026-08-24T09:30:00', source: 'appointment' },
    ]
    const times = getAvailableStartTimes({ date: '2026-08-24', items, schedules, busyIntervals, now: new Date('2026-08-23T12:00:00.000Z') })
    expect(times).not.toContain('08:00')
    expect(times).toContain('08:30')
  })
})
