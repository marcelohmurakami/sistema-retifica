export type MaskType = 'telefone' | 'cpf' | 'cnpj' | 'dinheiro'

export function onlyDigits(value: string) {
  return value.replace(/\D/g, '')
}

export function formatPhone(value: string) {
  const digits = onlyDigits(value).slice(0, 11)

  if (!digits) return ''
  if (digits.length <= 2) return digits.replace(/^(\d{0,2})/, '($1')
  if (digits.length <= 6) return digits.replace(/^(\d{2})(\d+)/, '($1) $2')
  if (digits.length <= 10) {
    return digits.replace(/^(\d{2})(\d{4})(\d+)/, '($1) $2-$3')
  }

  return digits.replace(/^(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
}

export function formatCpf(value: string) {
  return onlyDigits(value)
    .slice(0, 11)
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1-$2')
}

export function formatCnpj(value: string) {
  return onlyDigits(value)
    .slice(0, 14)
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
}

export function formatMoneyInput(value: string) {
  const digits = onlyDigits(value)
  const amount = Number(digits || '0') / 100

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  }).format(amount)
}

export function parseMoney(value: string) {
  const normalizedValue = value
    .replace(/[^\d,-]/g, '')
    .replace(/\./g, '')
    .replace(',', '.')

  const amount = Number(normalizedValue)
  return Number.isFinite(amount) ? amount : 0
}

export function applyMask(value: string, mask: MaskType) {
  switch (mask) {
    case 'telefone':
      return formatPhone(value)
    case 'cpf':
      return formatCpf(value)
    case 'cnpj':
      return formatCnpj(value)
    case 'dinheiro':
      return formatMoneyInput(value)
  }
}
