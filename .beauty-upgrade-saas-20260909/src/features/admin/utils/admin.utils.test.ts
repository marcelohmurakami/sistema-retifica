import { describe, expect, it } from 'vitest'
import { changedValues, isHexColor, isValidEmail, validateCompanyName } from './admin.utils'

describe('admin utils', () => {
  it('valida cores hexadecimais completas', () => {
    expect(isHexColor('#226FE7')).toBe(true)
    expect(isHexColor('#fff')).toBe(false)
    expect(isHexColor('226FE7')).toBe(false)
  })

  it('valida e-mails sem aceitar espaços', () => {
    expect(isValidEmail('gestao@empresa.com.br')).toBe(true)
    expect(isValidEmail('usuario @empresa.com')).toBe(false)
  })

  it('exige um nome de empresa útil', () => {
    expect(validateCompanyName('A')).toBe(false)
    expect(validateCompanyName('Studio')).toBe(true)
  })

  it('normaliza snapshots nulos da auditoria', () => {
    expect(changedValues(null, { status: 'ativo' })).toEqual({
      before: {},
      after: { status: 'ativo' },
    })
  })
})
