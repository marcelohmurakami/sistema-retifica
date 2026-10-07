import { describe, expect, it } from 'vitest'
import { getEmptyClienteFormValues } from '../utils/clientes.utils'
import { isValidCpf, validateClienteForm } from './cliente-form.validation'

describe('validação de clientes', () => {
  it('valida CPF com dígitos verificadores', () => {
    expect(isValidCpf('529.982.247-25')).toBe(true)
    expect(isValidCpf('111.111.111-11')).toBe(false)
  })

  it('exige nome e valida os dados de contato', () => {
    const errors = validateClienteForm({
      ...getEmptyClienteFormValues(),
      email: 'invalido',
      telefonePrincipal: '1199',
    })
    expect(errors.nome).toBeTruthy()
    expect(errors.email).toBeTruthy()
    expect(errors.telefonePrincipal).toBeTruthy()
  })
})
