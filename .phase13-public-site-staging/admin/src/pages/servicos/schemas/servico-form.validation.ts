import { parseMoney } from '../../../components_shared/forms/masks'
import type {
  ServicoFormErrors,
  ServicoFormValues,
} from '../types/servicos.types'

export function validateServicoForm(values: ServicoFormValues) {
  const errors: ServicoFormErrors = {}
  const name = values.nome.trim()
  const price = parseMoney(values.preco)
  const duration = Number(values.duracaoMinutos)
  const interval = Number(values.intervaloMinutos)

  if (name.length < 2) {
    errors.nome = 'Informe um nome com pelo menos 2 caracteres.'
  } else if (name.length > 120) {
    errors.nome = 'Use no máximo 120 caracteres.'
  }

  if (values.descricao.trim().length > 500) {
    errors.descricao = 'Use no máximo 500 caracteres.'
  }

  if (!Number.isFinite(price) || price < 0) {
    errors.preco = 'Informe um preço válido.'
  }

  if (!Number.isInteger(duration) || duration < 5 || duration > 1440) {
    errors.duracaoMinutos = 'A duração deve ficar entre 5 e 1.440 minutos.'
  }

  if (!Number.isInteger(interval) || interval < 0 || interval > 480) {
    errors.intervaloMinutos = 'O intervalo deve ficar entre 0 e 480 minutos.'
  }

  if (values.exigeSinal) {
    if (!values.sinalTipo) {
      errors.sinalTipo = 'Escolha como o sinal será calculado.'
    }

    const signalValue =
      values.sinalTipo === 'percentual'
        ? Number(values.sinalValor)
        : parseMoney(values.sinalValor)

    if (!Number.isFinite(signalValue) || signalValue <= 0) {
      errors.sinalValor = 'Informe um valor de sinal maior que zero.'
    } else if (values.sinalTipo === 'percentual' && signalValue > 100) {
      errors.sinalValor = 'O percentual do sinal não pode passar de 100%.'
    } else if (values.sinalTipo === 'valor_fixo' && signalValue > price) {
      errors.sinalValor = 'O sinal não pode ser maior que o preço do serviço.'
    }
  }

  return errors
}

export function hasServicoFormErrors(errors: ServicoFormErrors) {
  return Object.keys(errors).length > 0
}
