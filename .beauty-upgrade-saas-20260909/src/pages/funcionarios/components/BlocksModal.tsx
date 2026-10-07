import { Ban, Building2, CalendarOff, RotateCcw } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { CheckboxField, DateTimeRangePicker, EmptyState, ErrorState, LoadingState, Modal, SelectField, TextAreaField, TextField, type DateTimeRangeValue } from '../../../components_shared'
import { useBlocks, useCancelBlock, useCreateBlock, useEmployees } from '../hooks/useEmployees'
import { validateDateRange } from '../schemas/funcionario-form.validation'
import { formatDatePeriod, toIsoFromLocal } from '../utils/funcionarios.utils'

function initialRange(): DateTimeRangeValue { const date = new Date().toISOString().slice(0, 10); return { start: { date, time: '08:00' }, end: { date, time: '18:00' } } }

export function BlocksModal({ companyId, onClose }: { companyId: number; onClose: () => void }) {
  const employeesQuery = useEmployees({ companyId, search: '', status: 'ativos', page: 1, pageSize: 100 })
  const blocksQuery = useBlocks(companyId)
  const createMutation = useCreateBlock(companyId)
  const cancelMutation = useCancelBlock(companyId)
  const [employeeId, setEmployeeId] = useState('global')
  const [type, setType] = useState('indisponibilidade')
  const [range, setRange] = useState<DateTimeRangeValue>(initialRange)
  const [wholeDay, setWholeDay] = useState(false)
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [cancelTarget, setCancelTarget] = useState<number | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const employees = employeesQuery.data?.items ?? []
  const employeeNames = new Map(employees.map((employee) => [employee.id, employee.nome]))

  async function create(event: FormEvent) {
    event.preventDefault()
    const start = toIsoFromLocal(range.start.date, wholeDay ? '00:00' : range.start.time)
    const end = toIsoFromLocal(range.end.date, wholeDay ? '23:59' : range.end.time)
    const validation = validateDateRange(start, end); setError(validation); if (validation) return
    try { await createMutation.mutateAsync({ employeeId: employeeId === 'global' ? null : Number(employeeId), tipo: type, inicio: start, fim: end, diaInteiro: wholeDay, motivo: reason.trim() || null }); setReason('') } catch { return }
  }

  async function cancelBlock() {
    if (!cancelTarget || !cancelReason.trim()) return
    try { await cancelMutation.mutateAsync({ blockId: cancelTarget, reason: cancelReason }); setCancelTarget(null); setCancelReason('') } catch { return }
  }

  return <Modal open onClose={onClose} title="Bloqueios da agenda" description="Feche horários da empresa inteira ou de um profissional específico." size="xl" footer={<button className="btn btn--secondary" type="button" onClick={onClose}>Fechar</button>}>
    <div className="blocks-layout"><form className="block-form" onSubmit={(event) => void create(event)}><div className="employee-tab-intro"><div><h3>Novo bloqueio</h3><p>Feriados, manutenção, eventos ou indisponibilidades.</p></div></div>
      <SelectField label="Aplicar a" value={employeeId} onChange={(event) => setEmployeeId(event.target.value)} options={[{ value: 'global', label: 'Toda a empresa' }, ...employees.map((employee) => ({ value: String(employee.id), label: employee.nome }))]} />
      <SelectField label="Tipo" value={type} onChange={(event) => setType(event.target.value)} options={[{ value: 'indisponibilidade', label: 'Indisponibilidade' }, { value: 'feriado', label: 'Feriado' }, { value: 'manutencao', label: 'Manutenção' }, { value: 'evento', label: 'Evento' }, { value: 'outro', label: 'Outro' }]} />
      <CheckboxField label="Dia inteiro" description="Ignora os horários e bloqueia o dia selecionado." checked={wholeDay} onChange={(event) => { setWholeDay(event.target.checked); setError(null) }} />
      <DateTimeRangePicker value={range} onChange={(value) => { setRange(value); setError(null) }} showTime={!wholeDay} error={error ?? undefined} required />
      <TextAreaField label="Motivo" value={reason} onChange={(event) => setReason(event.target.value)} rows={2} maxLength={500} />
      <button className="btn btn--primary" type="submit" disabled={createMutation.isPending}>{createMutation.isPending ? <span className="btn-spinner" /> : <Ban size={17} />}{createMutation.isPending ? 'Criando...' : 'Criar bloqueio'}</button>
    </form>
    <section className="blocks-list"><h3>Bloqueios recentes</h3>{blocksQuery.isPending ? <LoadingState label="Carregando bloqueios..." compact /> : blocksQuery.error ? <ErrorState error={blocksQuery.error} onRetry={() => void blocksQuery.refetch()} compact /> : !blocksQuery.data.length ? <EmptyState title="Nenhum bloqueio" description="A agenda está livre de bloqueios cadastrados." icon={CalendarOff} compact /> : blocksQuery.data.map((block) => <article className="block-item" data-cancelled={block.status === 'cancelado' || undefined} key={block.id}><span className="block-item__icon">{block.id_funcionario ? <CalendarOff size={17} /> : <Building2 size={17} />}</span><div><strong className="text-capitalize">{block.tipo}</strong><span>{block.id_funcionario ? employeeNames.get(block.id_funcionario) ?? 'Profissional' : 'Toda a empresa'}</span><small>{formatDatePeriod(block.inicio, block.fim, block.dia_inteiro)}</small>{block.motivo && <small>{block.motivo}</small>}</div><div><span className={`badge ${block.status === 'ativo' ? 'badge--success' : ''}`}>{block.status}</span>{block.status === 'ativo' && <button className="btn btn--icon btn--ghost" type="button" title="Cancelar bloqueio" onClick={() => setCancelTarget(block.id)}><RotateCcw size={16} /></button>}</div></article>)}</section></div>
    {cancelTarget && <div className="block-cancel-bar"><TextField label="Motivo do cancelamento" value={cancelReason} onChange={(event) => setCancelReason(event.target.value)} placeholder="Informe por que o bloqueio está sendo cancelado" autoFocus /><div><button className="btn btn--ghost" type="button" onClick={() => { setCancelTarget(null); setCancelReason('') }}>Voltar</button><button className="btn btn--danger" type="button" onClick={() => void cancelBlock()} disabled={!cancelReason.trim() || cancelMutation.isPending}>{cancelMutation.isPending ? <span className="btn-spinner" /> : <RotateCcw size={16} />} Confirmar cancelamento</button></div></div>}
  </Modal>
}
