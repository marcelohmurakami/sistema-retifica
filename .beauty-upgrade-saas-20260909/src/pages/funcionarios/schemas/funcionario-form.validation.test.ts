import { describe, expect, it } from 'vitest'
import { getDefaultSchedule, getEmptyFuncionarioFormValues } from '../utils/funcionarios.utils'
import { validateFuncionarioForm, validateSchedule } from './funcionario-form.validation'

describe('validação de funcionários', () => {
  it('valida identificação e datas', () => {
    const errors = validateFuncionarioForm({ ...getEmptyFuncionarioFormValues(), nome: '', telefone: '1199', dataAdmissao: '2026-05-10', dataDesligamento: '2026-05-01' })
    expect(errors.nome).toBeTruthy()
    expect(errors.telefone).toBeTruthy()
    expect(errors.dataDesligamento).toBeTruthy()
  })
  it('impede jornada e intervalo inválidos', () => {
    const days = getDefaultSchedule()
    days[1].breakStart = '07:00'
    expect(validateSchedule(days)).toBeTruthy()
  })
})
