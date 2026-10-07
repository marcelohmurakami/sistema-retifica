import { CalendarRange, Download, Eye, FileClock, History, Search, ShieldCheck, UserRound } from 'lucide-react'
import { useDeferredValue, useMemo, useState } from 'react'
import {
  DataTable, FilterBar, Modal, Pagination, SearchInput, type DataTableColumn,
} from '../../../components_shared'
import { useAuth } from '../../auth/hooks/useAuth'
import { useAudit } from '../hooks/useAdmin'
import type { AuditEvent } from '../types/admin.types'
import {
  ACTION_LABELS, TABLE_LABELS, changedValues, formatAdminDate,
} from '../utils/admin.utils'
import '../admin.css'

const PAGE_SIZE = 20

function initialStartDate() {
  const date = new Date()
  date.setDate(date.getDate() - 30)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function today() {
  const date = new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function actionClass(action: string) {
  if (action === 'INSERT') return 'badge--success'
  if (action === 'DELETE') return 'badge--danger'
  return 'badge--info'
}

function exportAudit(rows: AuditEvent[]) {
  const quote = (value: unknown) => `"${String(value ?? '').replaceAll('"', '""')}"`
  const lines = [
    ['Data', 'Ação', 'Área', 'Registro', 'Responsável', 'E-mail', 'Campos'].map(quote).join(','),
    ...rows.map((row) => [
      formatAdminDate(row.created_at), ACTION_LABELS[row.acao] ?? row.acao,
      TABLE_LABELS[row.tabela] ?? row.tabela, row.registro_id,
      row.usuario_nome, row.usuario_email, row.campos_alterados?.join(' | ') ?? '',
    ].map(quote).join(',')),
  ]
  const blob = new Blob([`\uFEFF${lines.join('\n')}`], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `auditoria-${today()}.csv`
  anchor.click()
  URL.revokeObjectURL(url)
}

function AuditDetails({ event, onClose }: { event: AuditEvent | null; onClose: () => void }) {
  const snapshots = changedValues(event?.dados_anteriores ?? null, event?.dados_novos ?? null)
  const fields = event?.campos_alterados?.length
    ? event.campos_alterados
    : Array.from(new Set([...Object.keys(snapshots.before), ...Object.keys(snapshots.after)]))

  return <Modal open={Boolean(event)} onClose={onClose} title="Detalhes da alteração" description={event ? `${TABLE_LABELS[event.tabela] ?? event.tabela} · registro ${event.registro_id}` : undefined} size="xl">
    {event && <div className="audit-details">
      <dl className="audit-metadata">
        <div><dt>Data</dt><dd>{formatAdminDate(event.created_at)}</dd></div>
        <div><dt>Ação</dt><dd><span className={`badge ${actionClass(event.acao)}`}>{ACTION_LABELS[event.acao] ?? event.acao}</span></dd></div>
        <div><dt>Responsável</dt><dd>{event.usuario_nome}<small>{event.usuario_email ?? event.origem}</small></dd></div>
        <div><dt>Papel técnico</dt><dd>{event.papel_execucao ?? 'sistema'}</dd></div>
      </dl>
      {fields.length > 0 ? <div className="audit-changes">
        <header><span>Campo</span><span>Antes</span><span>Depois</span></header>
        {fields.map((field) => <div key={field}><strong>{field.replaceAll('_', ' ')}</strong><code>{JSON.stringify(snapshots.before[field]) ?? '—'}</code><code>{JSON.stringify(snapshots.after[field]) ?? '—'}</code></div>)}
      </div> : <div className="alert alert--info">Este evento não possui diferenças de campos para exibir.</div>}
      <details className="audit-raw"><summary>Ver snapshots técnicos</summary><div><pre>{JSON.stringify(event.dados_anteriores, null, 2) ?? 'null'}</pre><pre>{JSON.stringify(event.dados_novos, null, 2) ?? 'null'}</pre></div></details>
    </div>}
  </Modal>
}

export function AuditPage() {
  const { empresaAtual } = useAuth()
  const companyId = empresaAtual?.id ?? 0
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search)
  const [action, setAction] = useState('todos')
  const [table, setTable] = useState('todas')
  const [start, setStart] = useState(initialStartDate)
  const [end, setEnd] = useState(today)
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<AuditEvent | null>(null)
  const query = useAudit({ companyId, search: deferredSearch, action, table, start, end, page, pageSize: PAGE_SIZE })
  const rows = query.data?.rows ?? []
  const total = query.data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const updated = rows.filter((row) => row.acao === 'UPDATE').length
  const actors = new Set(rows.map((row) => row.usuario_id).filter(Boolean)).size
  const columns: DataTableColumn<AuditEvent>[] = useMemo(() => [
    { id: 'date', header: 'Data e hora', width: '10rem', cell: (row) => <div className="audit-date"><strong>{formatAdminDate(row.created_at)}</strong><small>{row.origem === 'sistema' ? 'Automático' : 'Usuário'}</small></div> },
    { id: 'action', header: 'Ação', cell: (row) => <span className={`badge ${actionClass(row.acao)}`}>{ACTION_LABELS[row.acao] ?? row.acao}</span> },
    { id: 'area', header: 'Área', cell: (row) => <div className="audit-area"><strong>{TABLE_LABELS[row.tabela] ?? row.tabela}</strong><small>Registro #{row.registro_id}</small></div> },
    { id: 'actor', header: 'Responsável', cell: (row) => <div className="audit-area"><strong>{row.usuario_nome}</strong><small>{row.usuario_email ?? row.origem}</small></div>, hideOnMobile: true },
    { id: 'fields', header: 'Campos alterados', cell: (row) => row.campos_alterados?.length ? <span className="audit-fields">{row.campos_alterados.slice(0, 3).join(', ')}{row.campos_alterados.length > 3 ? ` +${row.campos_alterados.length - 3}` : ''}</span> : '—', hideOnMobile: true },
    { id: 'view', header: '', align: 'right', cell: () => <Eye size={17} /> },
  ], [])
  const activeFilterCount = [action !== 'todos', table !== 'todas', Boolean(start), Boolean(end)].filter(Boolean).length

  function resetFilters() { setAction('todos'); setTable('todas'); setStart(''); setEnd(''); setPage(1) }

  return <div className="page audit-page">
    <header className="page-header"><div className="page-header__content"><span className="eyebrow">Controle</span><h1>Histórico e auditoria</h1><p>Rastreie alterações importantes, responsáveis e valores anteriores.</p></div><div className="page-actions"><button className="btn btn--secondary" type="button" onClick={() => exportAudit(rows)} disabled={rows.length === 0}><Download size={17} /> Exportar página</button></div></header>
    <section className="admin-metrics audit-metrics" aria-label="Resumo da auditoria"><article><History size={19} /><div><strong>{total}</strong><span>eventos no período</span></div></article><article><FileClock size={19} /><div><strong>{updated}</strong><span>alterações nesta página</span></div></article><article><UserRound size={19} /><div><strong>{actors}</strong><span>responsáveis nesta página</span></div></article><article><ShieldCheck size={19} /><div><strong>Imutável</strong><span>proteção ativa no banco</span></div></article></section>
    <section className="audit-list card">
      <FilterBar search={<SearchInput value={search} onChange={(value) => { setSearch(value); setPage(1) }} placeholder="Buscar área, registro ou usuário..." />} activeFilterCount={activeFilterCount} onClearFilters={resetFilters}>
        <select className="select" aria-label="Filtrar por ação" value={action} onChange={(e) => { setAction(e.target.value); setPage(1) }}><option value="todos">Todas as ações</option><option value="INSERT">Criações</option><option value="UPDATE">Alterações</option><option value="DELETE">Exclusões</option></select>
        <select className="select" aria-label="Filtrar por área" value={table} onChange={(e) => { setTable(e.target.value); setPage(1) }}><option value="todas">Todas as áreas</option>{Object.entries(TABLE_LABELS).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select>
        <label className="audit-date-filter"><CalendarRange size={15} /><input className="input" type="date" aria-label="Data inicial" value={start} onChange={(e) => { setStart(e.target.value); setPage(1) }} /></label>
        <label className="audit-date-filter"><span>até</span><input className="input" type="date" aria-label="Data final" value={end} onChange={(e) => { setEnd(e.target.value); setPage(1) }} /></label>
      </FilterBar>
      <DataTable data={rows} columns={columns} rowKey="id" isLoading={query.isPending} error={query.error} onRetry={() => void query.refetch()} isRetrying={query.isFetching} onRowClick={(row) => setSelected(row)} emptyIcon={Search} emptyTitle="Nenhum evento encontrado" emptyDescription="Ajuste os filtros ou aguarde novas ações no sistema." />
      <Pagination page={page} totalPages={totalPages} totalItems={total} pageSize={PAGE_SIZE} onPageChange={setPage} disabled={query.isFetching} />
    </section>
    <AuditDetails event={selected} onClose={() => setSelected(null)} />
  </div>
}
