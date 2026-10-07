import { describe, expect, it } from 'vitest'
import {
  hasServicoFormErrors,
  validateServicoForm,
} from './servico-form.validation'
import { getEmptyServicoFormValues } from '../utils/servicos.utils'

describe('validateServicoForm', () => {
  it('aceita um serviço válido', () => {
    const values = {
      ...getEmptyServicoFormValues(),
      nome: 'Consulta inicial',
      preco: 'R$ 150,00',
    }

    expect(hasServicoFormErrors(validateServicoForm(values))).toBe(false)
  })

  it('valida nome, duração e intervalo', () => {
    const errors = validateServicoForm({
      ...getEmptyServicoFormValues(),
      nome: 'A',
      duracaoMinutos: '0',
      intervaloMinutos: '-1',
    })

    expect(errors.nome).toBeDefined()
    expect(errors.duracaoMinutos).toBeDefined()
    expect(errors.intervaloMinutos).toBeDefined()
  })

  it('não aceita sinal percentual acima de 100%', () => {
    const errors = validateServicoForm({
      ...getEmptyServicoFormValues(),
      nome: 'Procedimento',
      preco: 'R$ 200,00',
      exigeSinal: true,
      sinalTipo: 'percentual',
      sinalValor: '120',
    })

    expect(errors.sinalValor).toContain('100%')
  })

  it('não aceita sinal fixo maior que o preço', () => {
    const errors = validateServicoForm({
      ...getEmptyServicoFormValues(),
      nome: 'Procedimento',
      preco: 'R$ 50,00',
      exigeSinal: true,
      sinalTipo: 'valor_fixo',
      sinalValor: 'R$ 60,00',
    })

    expect(errors.sinalValor).toContain('maior que o preço')
  })
})
