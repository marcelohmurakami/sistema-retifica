import type { CSSProperties } from 'react'
import type { Json } from '../../../types/database.types'
import type { CompanySettings } from '../types/admin.types'

export const DEFAULT_APPEARANCE = {
  tema_preferido: 'sistema',
  cor_primaria: '#226FE7',
  cor_destaque: '#10B981',
  raio_interface: 'medio',
  densidade_interface: 'confortavel',
  logo_url: null,
  idioma: 'pt-BR',
  moeda: 'BRL',
  semana_inicia: 0,
  duracao_slot_minutos: 30,
} as const

export const TABLE_LABELS: Record<string, string> = {
  empresas: 'Empresa',
  usuarios_empresas: 'Usuários',
  convites_empresa: 'Convites',
  permissoes_usuarios: 'Permissões',
  configuracoes_empresas: 'Preferências',
  integracoes: 'Integrações',
  clientes: 'Clientes',
  funcionarios: 'Funcionários',
  servicos: 'Serviços',
  produtos: 'Produtos',
  agendamentos: 'Agendamentos',
  comandas: 'Comandas',
  orcamentos: 'Orçamentos',
  contas: 'Financeiro',
  lancamentos_comissao: 'Comissões',
}

export const ACTION_LABELS: Record<string, string> = {
  INSERT: 'Criação',
  UPDATE: 'Alteração',
  DELETE: 'Exclusão',
}

export function isHexColor(value: string) {
  return /^#[0-9a-f]{6}$/i.test(value)
}

export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

export function validateCompanyName(value: string) {
  return value.trim().length >= 2
}

export function getAppearance(settings: CompanySettings | null | undefined) {
  return {
    ...DEFAULT_APPEARANCE,
    ...(settings ?? {}),
  }
}

export function appearanceStyles(settings: CompanySettings | null | undefined) {
  const appearance = getAppearance(settings)
  const radius = {
    discreto: ['0.35rem', '0.5rem', '0.7rem'],
    medio: ['0.5rem', '0.75rem', '1rem'],
    arredondado: ['0.7rem', '1rem', '1.3rem'],
  }[appearance.raio_interface] ?? ['0.5rem', '0.75rem', '1rem']

  return {
    '--primary': appearance.cor_primaria,
    '--primary-hover': `color-mix(in srgb, ${appearance.cor_primaria} 84%, black)`,
    '--primary-active': `color-mix(in srgb, ${appearance.cor_primaria} 72%, black)`,
    '--primary-subtle': `color-mix(in srgb, ${appearance.cor_primaria} 12%, transparent)`,
    '--focus-ring': `color-mix(in srgb, ${appearance.cor_primaria} 28%, transparent)`,
    '--company-accent': appearance.cor_destaque,
    '--company-accent-subtle': `color-mix(in srgb, ${appearance.cor_destaque} 14%, transparent)`,
    '--radius-sm': radius[0],
    '--radius-md': radius[1],
    '--radius-lg': radius[2],
    '--density-scale': appearance.densidade_interface === 'compacta' ? '0.86' : '1',
  } as CSSProperties
}

export function formatAdminDate(value: string | null, includeTime = true) {
  if (!value) return 'Nunca'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Data inválida'
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    ...(includeTime ? { timeStyle: 'short' as const } : {}),
  }).format(date)
}

export function formatPlanPrice(value: number, cycle: 'mensal' | 'anual' = 'mensal') {
  const formatted = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
  return `${formatted}/${cycle === 'mensal' ? 'mês' : 'ano'}`
}

export function changedValues(before: Json | null, after: Json | null) {
  const objectBefore = before && typeof before === 'object' && !Array.isArray(before) ? before : {}
  const objectAfter = after && typeof after === 'object' && !Array.isArray(after) ? after : {}
  return { before: objectBefore, after: objectAfter }
}
