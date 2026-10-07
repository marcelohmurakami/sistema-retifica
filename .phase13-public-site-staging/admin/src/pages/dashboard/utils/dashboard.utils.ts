const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

const numberFormatter = new Intl.NumberFormat('pt-BR', {
  maximumFractionDigits: 1,
})

const STATUS_LABELS: Record<string, string> = {
  aguardando_confirmacao: 'Aguardando confirmação',
  aguardando_pagamento: 'Aguardando pagamento',
  confirmado: 'Confirmado',
  em_atendimento: 'Em atendimento',
  finalizado: 'Finalizado',
  no_show: 'Não compareceu',
}

const STATUS_TONES: Record<string, string> = {
  aguardando_confirmacao: 'warning',
  aguardando_pagamento: 'warning',
  confirmado: 'info',
  em_atendimento: 'progress',
  finalizado: 'success',
  no_show: 'danger',
}

export function todayInputValue(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function formatDashboardCurrency(value: number) {
  return currencyFormatter.format(Number(value) || 0)
}

export function formatDashboardNumber(value: number) {
  return numberFormatter.format(Number(value) || 0)
}

export function formatDashboardTime(value: string, timezone: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: timezone,
  }).format(new Date(value))
}

export function formatDashboardDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
  }).format(new Date(`${value.slice(0, 10)}T12:00:00`))
}

export function formatDashboardLongDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  }).format(new Date(`${value.slice(0, 10)}T12:00:00`))
}

export function appointmentStatus(status: string) {
  return {
    label: STATUS_LABELS[status] ?? status.replaceAll('_', ' '),
    tone: STATUS_TONES[status] ?? 'neutral',
  }
}

export function uniqueNames(values: string[]) {
  return [...new Set(values.filter(Boolean))]
}

export function minutesLabel(minutes: number) {
  if (minutes <= 0) return 'Jornadas não configuradas'
  if (minutes < 60) return `${minutes} min`

  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest > 0 ? `${hours}h ${rest}min` : `${hours}h`
}

export function trendTone(value: number) {
  if (value > 0) return 'positive'
  if (value < 0) return 'negative'
  return 'neutral'
}

export function dueDateLabel(dueDate: string, referenceDate: string) {
  const due = new Date(`${dueDate.slice(0, 10)}T12:00:00`)
  const reference = new Date(`${referenceDate.slice(0, 10)}T12:00:00`)
  const days = Math.round((due.getTime() - reference.getTime()) / 86_400_000)

  if (days < 0) return `${Math.abs(days)}d em atraso`
  if (days === 0) return 'Vence hoje'
  if (days === 1) return 'Vence amanhã'
  return `Vence em ${days}d`
}

export function revenueBarHeight(value: number, maximum: number) {
  if (maximum <= 0 || value <= 0) return 4
  return Math.max(8, Math.round((value / maximum) * 100))
}
