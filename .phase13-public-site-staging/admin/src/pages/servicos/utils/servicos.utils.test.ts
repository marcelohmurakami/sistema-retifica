import { describe, expect, it } from 'vitest'
import {
  canManageServices,
  formatDuration,
  isServiceLimitReached,
  sanitizeServiceSearch,
} from './servicos.utils'

describe('permissões de serviços', () => {
  it('permite alterações somente para dono e gerente', () => {
    expect(canManageServices('dono')).toBe(true)
    expect(canManageServices('gerente')).toBe(true)
    expect(canManageServices('recepcionista')).toBe(false)
    expect(canManageServices('profissional')).toBe(false)
    expect(canManageServices(null)).toBe(false)
  })

  it('respeita limite e plano ilimitado', () => {
    expect(isServiceLimitReached(3, 3)).toBe(true)
    expect(isServiceLimitReached(2, 3)).toBe(false)
    expect(isServiceLimitReached(100, null)).toBe(false)
  })
})

describe('utilitários de serviços', () => {
  it('remove operadores do PostgREST da busca', () => {
    expect(sanitizeServiceSearch(" corte,*.ilike.'teste' ")).toBe(
      'corte ilike teste',
    )
  })

  it('formata durações em minutos e horas', () => {
    expect(formatDuration(45)).toBe('45 min')
    expect(formatDuration(60)).toBe('1h')
    expect(formatDuration(90)).toBe('1h 30min')
  })
})
