import { onlyDigits } from '../../../components_shared/forms/masks'
import type { Funcionario, FuncionarioFormValues, FuncionarioHorario, FuncionarioWriteInput, ScheduleDayValue } from '../types/funcionarios.types'

export const WEEK_DAYS = [
  { value: 0, label: 'Domingo' }, { value: 1, label: 'Segunda-feira' }, { value: 2, label: 'Terça-feira' },
  { value: 3, label: 'Quarta-feira' }, { value: 4, label: 'Quinta-feira' }, { value: 5, label: 'Sexta-feira' }, { value: 6, label: 'Sábado' },
] as const

export function getEmptyFuncionarioFormValues(): FuncionarioFormValues {
  return { nome: '', cpf: '', telefone: '', email: '', cargo: '', dataNascimento: '', dataAdmissao: '', dataDesligamento: '', endereco: '', observacoes: '', corAgenda: '#3b82f6', atendeClientes: true, ativo: true }
}

export function employeeToFormValues(employee: Funcionario): FuncionarioFormValues {
  return { nome: employee.nome, cpf: employee.cpf ?? '', telefone: employee.telefone ?? '', email: employee.email ?? '', cargo: employee.cargo ?? '', dataNascimento: employee.data_nascimento ?? '', dataAdmissao: employee.data_admissao ?? '', dataDesligamento: employee.data_desligamento ?? '', endereco: employee.endereco ?? '', observacoes: employee.observacoes ?? '', corAgenda: employee.cor_agenda ?? '#3b82f6', atendeClientes: employee.atende_clientes, ativo: employee.ativo }
}

const optionalText = (value: string) => value.trim() || null

export function employeeFormToInput(values: FuncionarioFormValues): FuncionarioWriteInput {
  return { nome: values.nome.trim(), cpf: optionalText(onlyDigits(values.cpf)), telefone: optionalText(values.telefone), email: optionalText(values.email.toLowerCase()), cargo: optionalText(values.cargo), data_nascimento: optionalText(values.dataNascimento), data_admissao: optionalText(values.dataAdmissao), data_desligamento: optionalText(values.dataDesligamento), endereco: optionalText(values.endereco), observacoes: optionalText(values.observacoes), cor_agenda: values.corAgenda, atende_clientes: values.atendeClientes, ativo: values.ativo }
}

export function sanitizeEmployeeSearch(value: string) { return value.trim().replace(/[,%()]/g, ' ').replace(/\s+/g, ' ') }
export function canManageEmployees(role: string | null | undefined) { return role === 'dono' || role === 'gerente' }
export function employeeLimitReached(active: number, limit: number | null) { return limit !== null && limit > 0 && active >= limit }

export function getDefaultSchedule(): ScheduleDayValue[] {
  return WEEK_DAYS.map(({ value }) => ({ day: value, enabled: value >= 1 && value <= 5, start: '08:00', end: '18:00', hasBreak: value >= 1 && value <= 5, breakStart: '12:00', breakEnd: '13:00' }))
}

export function scheduleToValues(rows: FuncionarioHorario[]): ScheduleDayValue[] {
  const defaults = getDefaultSchedule().map((day) => ({ ...day, enabled: false, hasBreak: false }))
  for (const row of rows.filter((item) => item.ativo)) {
    defaults[row.dia_semana] = { day: row.dia_semana, enabled: true, start: row.hora_inicio.slice(0, 5), end: row.hora_fim.slice(0, 5), hasBreak: Boolean(row.intervalo_inicio && row.intervalo_fim), breakStart: row.intervalo_inicio?.slice(0, 5) ?? '12:00', breakEnd: row.intervalo_fim?.slice(0, 5) ?? '13:00' }
  }
  return defaults
}

export function toIsoFromLocal(date: string, time: string) { return new Date(`${date}T${time}`).toISOString() }
export function formatDateTime(value: string) { return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value)) }
export function formatDatePeriod(start: string, end: string, wholeDay: boolean) {
  if (!wholeDay) return `${formatDateTime(start)} até ${formatDateTime(end)}`
  const formatter = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' })
  const startLabel = formatter.format(new Date(start))
  const endLabel = formatter.format(new Date(end))
  return startLabel === endLabel ? `${startLabel} · dia inteiro` : `${startLabel} até ${endLabel} · dias inteiros`
}
export function formatCurrency(value: number | null) { return value === null ? 'Padrão' : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value) }
