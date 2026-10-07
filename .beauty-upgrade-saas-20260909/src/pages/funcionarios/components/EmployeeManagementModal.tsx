import { Ban, BriefcaseBusiness, CalendarClock, Clock3, LockKeyhole, RotateCcw, Save } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { CheckboxField, DateTimeRangePicker, EmptyState, ErrorState, LoadingState, Modal, SelectField, TextAreaField, type DateTimeRangeValue } from '../../../components_shared'
import { validateDateRange, validateSchedule } from '../schemas/funcionario-form.validation'
import { useCancelEmployeeAbsence, useCreateEmployeeAbsence, useEmployeeAbsences, useEmployeeSchedule, useEmployeeServices, useSaveEmployeeSchedule, useSaveEmployeeServices } from '../hooks/useEmployees'
import type { EmployeeServiceInput, EmployeeServicesData, Funcionario, FuncionarioHorario, ScheduleDayValue } from '../types/funcionarios.types'
import { formatCurrency, formatDatePeriod, scheduleToValues, toIsoFromLocal, WEEK_DAYS } from '../utils/funcionarios.utils'

type Tab = 'schedule' | 'services' | 'absences'
type Props = { companyId: number; employee: Funcionario; canUseSchedule: boolean; canUseServices: boolean; canUseTimeOff: boolean; onClose: () => void }

function RestrictedFeature({ title }: { title: string }) {
  return <div className="employee-feature-locked"><LockKeyhole size={26} /><div><strong>{title}</strong><p>Este recurso não está disponível no plano atual.</p></div></div>
}

function ScheduleEditor({ companyId, employeeId, initialRows }: { companyId: number; employeeId: number; initialRows: FuncionarioHorario[] }) {
  const [days, setDays] = useState<ScheduleDayValue[]>(() => scheduleToValues(initialRows))
  const [error, setError] = useState<string | null>(null)
  const mutation = useSaveEmployeeSchedule(companyId, employeeId)
  function update(dayIndex: number, changes: Partial<ScheduleDayValue>) { setDays((current) => current.map((day) => day.day === dayIndex ? { ...day, ...changes } : day)); setError(null) }
  async function save() { const validation = validateSchedule(days); setError(validation); if (validation) return; try { await mutation.mutateAsync(days) } catch { return } }
  return <div className="schedule-editor">
    <div className="employee-tab-intro"><div><h3>Jornada semanal</h3><p>Defina os horários disponíveis e o intervalo de cada dia.</p></div><button className="btn btn--primary" type="button" onClick={() => void save()} disabled={mutation.isPending}>{mutation.isPending ? <span className="btn-spinner" /> : <Save size={17} />}{mutation.isPending ? 'Salvando...' : 'Salvar jornada'}</button></div>
    {error && <p className="alert alert--danger" role="alert">{error}</p>}
    <div className="schedule-days">{days.map((day) => <article className="schedule-day" data-enabled={day.enabled || undefined} key={day.day}>
      <div className="schedule-day__name"><label><input type="checkbox" checked={day.enabled} onChange={(event) => update(day.day, { enabled: event.target.checked })} /><span>{WEEK_DAYS[day.day].label}</span></label>{day.enabled && <label className="schedule-day__break-toggle"><input type="checkbox" checked={day.hasBreak} onChange={(event) => update(day.day, { hasBreak: event.target.checked })} /> Intervalo</label>}</div>
      {day.enabled ? <div className="schedule-day__times"><label><span>Início</span><input type="time" value={day.start} onChange={(event) => update(day.day, { start: event.target.value })} /></label><label><span>Fim</span><input type="time" value={day.end} onChange={(event) => update(day.day, { end: event.target.value })} /></label>{day.hasBreak && <><label><span>Início intervalo</span><input type="time" value={day.breakStart} onChange={(event) => update(day.day, { breakStart: event.target.value })} /></label><label><span>Fim intervalo</span><input type="time" value={day.breakEnd} onChange={(event) => update(day.day, { breakEnd: event.target.value })} /></label></>}</div> : <span className="schedule-day__closed">Não trabalha</span>}
    </article>)}</div>
  </div>
}

function ScheduleTab({ companyId, employeeId }: { companyId: number; employeeId: number }) {
  const query = useEmployeeSchedule(companyId, employeeId)
  if (query.isPending) return <LoadingState label="Carregando jornada..." compact />
  if (query.error) return <ErrorState error={query.error} onRetry={() => void query.refetch()} isRetrying={query.isFetching} compact />
  return <ScheduleEditor key={query.data.map((item) => `${item.id}:${item.updated_at}`).join('|') || 'empty'} companyId={companyId} employeeId={employeeId} initialRows={query.data} />
}

type ServiceSelection = { active: boolean; duration: string; price: string }
function ServicesEditor({ companyId, employeeId, data }: { companyId: number; employeeId: number; data: EmployeeServicesData }) {
  const [search, setSearch] = useState('')
  const [selection, setSelection] = useState<Record<number, ServiceSelection>>(() => Object.fromEntries(data.services.map((service) => { const assignment = data.assignments.find((item) => item.id_servico === service.id); return [service.id, { active: assignment?.ativo ?? false, duration: assignment?.duracao_personalizada?.toString() ?? '', price: assignment?.valor_personalizado?.toString() ?? '' }] })))
  const mutation = useSaveEmployeeServices(companyId, employeeId)
  const filtered = data.services.filter((service) => service.nome.toLowerCase().includes(search.toLowerCase()))
  function update(serviceId: number, changes: Partial<ServiceSelection>) { setSelection((current) => ({ ...current, [serviceId]: { ...current[serviceId], ...changes } })) }
  async function save() {
    const input: EmployeeServiceInput[] = data.services.map((service) => ({ serviceId: service.id, active: selection[service.id]?.active ?? false, customDuration: selection[service.id]?.duration ? Number(selection[service.id].duration) : null, customPrice: selection[service.id]?.price ? Number(selection[service.id].price.replace(',', '.')) : null }))
    try { await mutation.mutateAsync(input) } catch { return }
  }
  return <div className="employee-services-editor">
    <div className="employee-tab-intro"><div><h3>Serviços executados</h3><p>Escolha o que este profissional realiza e personalize duração ou preço se necessário.</p></div><button className="btn btn--primary" type="button" onClick={() => void save()} disabled={mutation.isPending}>{mutation.isPending ? <span className="btn-spinner" /> : <Save size={17} />}{mutation.isPending ? 'Salvando...' : 'Salvar serviços'}</button></div>
    <label className="employee-service-search"><span className="sr-only">Buscar serviço</span><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar serviço..." /></label>
    <div className="employee-service-list">{filtered.map((service) => { const value = selection[service.id]; return <article className="employee-service-item" data-selected={value.active || undefined} key={service.id}><label className="employee-service-item__main"><input type="checkbox" checked={value.active} onChange={(event) => update(service.id, { active: event.target.checked })} /><span><strong>{service.nome}</strong><small>{service.duracao_minutos} min · {formatCurrency(service.preco)}</small></span></label>{value.active && <div className="employee-service-item__custom"><label><span>Duração personalizada</span><input type="number" min={1} max={1440} value={value.duration} onChange={(event) => update(service.id, { duration: event.target.value })} placeholder={`${service.duracao_minutos} min`} /></label><label><span>Preço personalizado</span><input type="number" min={0} step="0.01" value={value.price} onChange={(event) => update(service.id, { price: event.target.value })} placeholder={service.preco.toFixed(2)} /></label></div>}</article> })}</div>
    {!filtered.length && <EmptyState title="Nenhum serviço encontrado" description="Ajuste o termo da busca." compact />}
  </div>
}

function ServicesTab({ companyId, employeeId }: { companyId: number; employeeId: number }) {
  const query = useEmployeeServices(companyId, employeeId)
  if (query.isPending) return <LoadingState label="Carregando serviços..." compact />
  if (query.error) return <ErrorState error={query.error} onRetry={() => void query.refetch()} isRetrying={query.isFetching} compact />
  return <ServicesEditor key={query.data.assignments.map((item) => `${item.id}:${item.updated_at}`).join('|') || 'empty'} companyId={companyId} employeeId={employeeId} data={query.data} />
}

function getInitialRange(): DateTimeRangeValue {
  const date = new Date().toISOString().slice(0, 10)
  return { start: { date, time: '09:00' }, end: { date, time: '18:00' } }
}

function AbsencesTab({ companyId, employeeId }: { companyId: number; employeeId: number }) {
  const query = useEmployeeAbsences(companyId, employeeId)
  const createMutation = useCreateEmployeeAbsence(companyId, employeeId)
  const cancelMutation = useCancelEmployeeAbsence(companyId, employeeId)
  const [type, setType] = useState('folga')
  const [range, setRange] = useState<DateTimeRangeValue>(getInitialRange)
  const [wholeDay, setWholeDay] = useState(false)
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  async function create(event: FormEvent) {
    event.preventDefault()
    const start = toIsoFromLocal(range.start.date, wholeDay ? '00:00' : range.start.time)
    const end = toIsoFromLocal(range.end.date, wholeDay ? '23:59' : range.end.time)
    const validation = validateDateRange(start, end); setError(validation); if (validation) return
    try { await createMutation.mutateAsync({ tipo: type, inicio: start, fim: end, diaInteiro: wholeDay, motivo: reason.trim() || null }); setReason('') } catch { return }
  }
  return <div className="absences-panel"><form className="absence-form" onSubmit={(event) => void create(event)}><div className="employee-tab-intro"><div><h3>Nova ausência</h3><p>Férias, folgas, atestados e indisponibilidades do profissional.</p></div></div><div className="absence-form__grid"><SelectField label="Tipo" value={type} onChange={(event) => setType(event.target.value)} options={[{ value: 'folga', label: 'Folga' }, { value: 'ferias', label: 'Férias' }, { value: 'atestado', label: 'Atestado' }, { value: 'bloqueio', label: 'Bloqueio' }, { value: 'outro', label: 'Outro' }]} /><CheckboxField label="Dia inteiro" description="Bloqueia todo o período selecionado." checked={wholeDay} onChange={(event) => { setWholeDay(event.target.checked); setError(null) }} /></div><DateTimeRangePicker value={range} onChange={(value) => { setRange(value); setError(null) }} showTime={!wholeDay} error={error ?? undefined} required /><TextAreaField label="Motivo ou observação" value={reason} onChange={(event) => setReason(event.target.value)} rows={2} maxLength={500} /><button className="btn btn--primary" type="submit" disabled={createMutation.isPending}>{createMutation.isPending ? <span className="btn-spinner" /> : <Ban size={17} />}{createMutation.isPending ? 'Registrando...' : 'Registrar ausência'}</button></form>
    <section className="absence-list"><h3>Ausências registradas</h3>{query.isPending ? <LoadingState label="Carregando ausências..." compact /> : query.error ? <ErrorState error={query.error} onRetry={() => void query.refetch()} compact /> : !query.data.length ? <EmptyState title="Nenhuma ausência" description="Os períodos indisponíveis aparecerão aqui." icon={CalendarClock} compact /> : query.data.map((absence) => <article className="absence-item" key={absence.id}><div><strong className="text-capitalize">{absence.tipo}</strong><span>{formatDatePeriod(absence.inicio, absence.fim, absence.dia_inteiro)}</span>{absence.motivo && <small>{absence.motivo}</small>}</div><div><span className={`badge ${absence.status === 'aprovado' ? 'badge--success' : ''}`}>{absence.status}</span>{absence.status !== 'cancelado' && <button className="btn btn--icon btn--ghost" type="button" title="Cancelar ausência" disabled={cancelMutation.isPending} onClick={() => void cancelMutation.mutateAsync(absence.id).catch(() => undefined)}><RotateCcw size={16} /></button>}</div></article>)}</section>
  </div>
}

export function EmployeeManagementModal({ companyId, employee, canUseSchedule, canUseServices, canUseTimeOff, onClose }: Props) {
  const firstTab: Tab = canUseSchedule ? 'schedule' : canUseServices ? 'services' : 'absences'
  const [tab, setTab] = useState<Tab>(firstTab)
  return <Modal open onClose={onClose} title={`Gerenciar ${employee.nome}`} description="Disponibilidade, ausências e serviços executados." size="xl" footer={<button className="btn btn--secondary" type="button" onClick={onClose}>Fechar</button>}>
    <div className="employee-management"><nav className="employee-management__tabs" aria-label="Configurações do funcionário"><button className={tab === 'schedule' ? 'is-active' : ''} type="button" onClick={() => setTab('schedule')}><Clock3 size={17} /> Jornada{!canUseSchedule && <LockKeyhole size={13} />}</button><button className={tab === 'services' ? 'is-active' : ''} type="button" onClick={() => setTab('services')}><BriefcaseBusiness size={17} /> Serviços{!canUseServices && <LockKeyhole size={13} />}</button><button className={tab === 'absences' ? 'is-active' : ''} type="button" onClick={() => setTab('absences')}><CalendarClock size={17} /> Ausências{!canUseTimeOff && <LockKeyhole size={13} />}</button></nav>
      <div className="employee-management__content">{tab === 'schedule' && (canUseSchedule ? <ScheduleTab companyId={companyId} employeeId={employee.id} /> : <RestrictedFeature title="Jornada individual" />)}{tab === 'services' && (canUseServices ? <ServicesTab companyId={companyId} employeeId={employee.id} /> : <RestrictedFeature title="Serviços por profissional" />)}{tab === 'absences' && (canUseTimeOff ? <AbsencesTab companyId={companyId} employeeId={employee.id} /> : <RestrictedFeature title="Ausências e folgas" />)}</div>
    </div>
  </Modal>
}
