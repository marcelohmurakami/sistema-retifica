import { onlyDigits } from '../../../components_shared/forms/masks'
import type { FuncionarioFormErrors, FuncionarioFormValues, ScheduleDayValue } from '../types/funcionarios.types'

export function validateFuncionarioForm(values: FuncionarioFormValues): FuncionarioFormErrors {
  const errors: FuncionarioFormErrors = {}
  if (values.nome.trim().length < 2) errors.nome = 'Informe o nome do funcionário.'
  if (values.cpf && onlyDigits(values.cpf).length !== 11) errors.cpf = 'Informe os 11 dígitos do CPF.'
  if (values.telefone && ![10, 11].includes(onlyDigits(values.telefone).length)) errors.telefone = 'Informe DDD e número do telefone.'
  if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) errors.email = 'Informe um e-mail válido.'
  if (values.dataNascimento && values.dataNascimento > new Date().toISOString().slice(0, 10)) errors.dataNascimento = 'A data não pode estar no futuro.'
  if (values.dataAdmissao && values.dataDesligamento && values.dataDesligamento < values.dataAdmissao) errors.dataDesligamento = 'O desligamento deve ser posterior à admissão.'
  return errors
}

export function hasFuncionarioFormErrors(errors: FuncionarioFormErrors) { return Object.keys(errors).length > 0 }

export function validateSchedule(days: ScheduleDayValue[]) {
  for (const day of days.filter((item) => item.enabled)) {
    if (day.end <= day.start) return 'O fim da jornada deve ser posterior ao início.'
    if (day.hasBreak && (day.breakStart <= day.start || day.breakEnd >= day.end || day.breakEnd <= day.breakStart)) return 'O intervalo deve estar totalmente dentro da jornada.'
  }
  return null
}

export function validateDateRange(start: string, end: string) {
  if (!start || !end) return 'Informe o início e o fim.'
  if (new Date(end).getTime() <= new Date(start).getTime()) return 'O fim deve ser posterior ao início.'
  return null
}
