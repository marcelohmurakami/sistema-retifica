import { describe, expect, it } from 'vitest'
import {
  appointmentStatus,
  dueDateLabel,
  minutesLabel,
  revenueBarHeight,
  trendTone,
  uniqueNames,
} from './dashboard.utils'

describe('dashboard utils', () => {
  it('resume minutos em uma duração legível', () => {
    expect(minutesLabel(0)).toBe('Jornadas não configuradas')
    expect(minutesLabel(45)).toBe('45 min')
    expect(minutesLabel(150)).toBe('2h 30min')
  })

  it('classifica tendências e status operacionais', () => {
    expect(trendTone(12)).toBe('positive')
    expect(trendTone(-2)).toBe('negative')
    expect(appointmentStatus('em_atendimento')).toEqual({
      label: 'Em atendimento',
      tone: 'progress',
    })
  })

  it('calcula textos de vencimento sem depender do horário local', () => {
    expect(dueDateLabel('2026-08-27', '2026-08-28')).toBe('1d em atraso')
    expect(dueDateLabel('2026-08-28', '2026-08-28')).toBe('Vence hoje')
    expect(dueDateLabel('2026-08-30', '2026-08-28')).toBe('Vence em 2d')
  })

  it('normaliza rankings e alturas das barras', () => {
    expect(uniqueNames(['Ana', 'Bruna', 'Ana'])).toEqual(['Ana', 'Bruna'])
    expect(revenueBarHeight(50, 100)).toBe(50)
    expect(revenueBarHeight(0, 100)).toBe(4)
  })
})
