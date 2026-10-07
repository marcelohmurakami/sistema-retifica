import type { UserRole } from '../../../features/access/types/access.types'
import { formatMoneyInput, parseMoney } from '../../../components_shared/forms/masks'
import type {
  Servico,
  ServicoFormValues,
} from '../types/servicos.types'

const managementRoles: readonly UserRole[] = ['dono', 'gerente']

export function canManageServices(role: UserRole | null) {
  return role !== null && managementRoles.includes(role)
}

export function isServiceLimitReached(
  activeServices: number,
  serviceLimit: number | null,
) {
  return serviceLimit !== null && activeServices >= serviceLimit
}

export function sanitizeServiceSearch(value: string) {
  return value
    .trim()
    .replace(/[\\%_,().*"']/g, ' ')
    .replace(/\s+/g, ' ')
    .slice(0, 80)
    .trim()
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} min`

  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return remainingMinutes > 0
    ? `${hours}h ${remainingMinutes}min`
    : `${hours}h`
}

function moneyValueToInput(value: number | null) {
  if (value === null) return ''
  return formatMoneyInput(String(Math.round(value * 100)))
}

export function getEmptyServicoFormValues(): ServicoFormValues {
  return {
    nome: '',
    descricao: '',
    preco: formatMoneyInput('0'),
    duracaoMinutos: '60',
    intervaloMinutos: '0',
    permiteAgendamentoOnline: false,
    exigeSinal: false,
    sinalTipo: '',
    sinalValor: '',
    ativo: true,
  }
}

export function serviceToFormValues(service: Servico): ServicoFormValues {
  return {
    nome: service.nome,
    descricao: service.descricao ?? '',
    preco: moneyValueToInput(service.preco),
    duracaoMinutos: String(service.duracao_minutos),
    intervaloMinutos: String(service.intervalo_minutos),
    permiteAgendamentoOnline: service.permite_agendamento_online,
    exigeSinal: service.exige_sinal,
    sinalTipo:
      service.sinal_tipo === 'percentual' ||
      service.sinal_tipo === 'valor_fixo'
        ? service.sinal_tipo
        : '',
    sinalValor:
      service.sinal_tipo === 'percentual'
        ? service.sinal_valor?.toString() ?? ''
        : moneyValueToInput(service.sinal_valor),
    ativo: service.ativo,
  }
}

export function serviceFormToPayload(values: ServicoFormValues) {
  const signalValue =
    values.sinalTipo === 'percentual'
      ? Number(values.sinalValor)
      : parseMoney(values.sinalValor)

  return {
    nome: values.nome.trim(),
    descricao: values.descricao.trim() || null,
    preco: parseMoney(values.preco),
    duracao_minutos: Number(values.duracaoMinutos),
    intervalo_minutos: Number(values.intervaloMinutos),
    permite_agendamento_online: values.permiteAgendamentoOnline,
    exige_sinal: values.exigeSinal,
    sinal_tipo: values.exigeSinal ? values.sinalTipo || null : null,
    sinal_valor: values.exigeSinal ? signalValue : null,
    ativo: values.ativo,
  }
}
