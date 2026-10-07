import { onlyDigits } from '../../../components_shared/forms/masks'
import type {
  ClienteFormErrors,
  ClienteFormValues,
} from '../types/clientes.types'

export function isValidCpf(value: string) {
  const cpf = onlyDigits(value)
  if (!cpf) return true
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false

  const calculateDigit = (length: number) => {
    const sum = cpf
      .slice(0, length)
      .split('')
      .reduce((total, digit, index) => total + Number(digit) * (length + 1 - index), 0)
    const remainder = (sum * 10) % 11
    return remainder === 10 ? 0 : remainder
  }

  return calculateDigit(9) === Number(cpf[9]) && calculateDigit(10) === Number(cpf[10])
}

export function validateClienteForm(values: ClienteFormValues): ClienteFormErrors {
  const errors: ClienteFormErrors = {}
  const phoneDigits = onlyDigits(values.telefonePrincipal)
  const secondaryDigits = onlyDigits(values.telefoneSecundario)

  if (values.nome.trim().length < 2) errors.nome = 'Informe o nome do cliente.'
  if (values.nome.trim().length > 160) errors.nome = 'Use no máximo 160 caracteres.'
  if (!isValidCpf(values.cpf)) errors.cpf = 'Informe um CPF válido.'
  if (phoneDigits && ![10, 11].includes(phoneDigits.length)) {
    errors.telefonePrincipal = 'Informe DDD e número do telefone.'
  }
  if (secondaryDigits && ![10, 11].includes(secondaryDigits.length)) {
    errors.telefoneSecundario = 'Informe DDD e número do telefone.'
  }
  if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    errors.email = 'Informe um e-mail válido.'
  }
  if (values.dataNascimento && values.dataNascimento > new Date().toISOString().slice(0, 10)) {
    errors.dataNascimento = 'A data de nascimento não pode estar no futuro.'
  }
  return errors
}

export function hasClienteFormErrors(errors: ClienteFormErrors) {
  return Object.keys(errors).length > 0
}
