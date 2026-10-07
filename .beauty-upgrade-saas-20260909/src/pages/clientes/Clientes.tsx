import { Cake, Plus, ShieldCheck, UserCheck, UserRound, UserX } from 'lucide-react'
import { useState } from 'react'
import { FilterBar, Modal, Pagination, SearchInput, Skeleton, ErrorState } from '../../components_shared'
import { useAccess } from '../../features/access/hooks/useAccess'
import { useAuth } from '../../features/auth/hooks/useAuth'
import { ClientFormModal } from './components/ClientFormModal'
import { ClientsList } from './components/ClientsList'
import { ClientStatusDialog } from './components/ClientStatusDialog'
import { useClientConsents, useClients, useClientsMetrics, useCreateClient, useToggleClientStatus, useUpdateClient } from './hooks/useClients'
import { useDebouncedValue } from './hooks/useDebouncedValue'
import type { Cliente, ClienteStatusFilter, ClienteWriteInput } from './types/clientes.types'
import { canManageClients } from './utils/clientes.utils'
import './clientes.css'

type FormState = { mode: 'create' } | { mode: 'edit'; client: Cliente } | null

export function Clientes() {
  const { empresaAtual } = useAuth()
  const { cargo } = useAccess()
  const companyId = empresaAtual?.id ?? 0
  const canManage = canManageClients(cargo)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<ClienteStatusFilter>('todos')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [formState, setFormState] = useState<FormState>(null)
  const [clientToArchive, setClientToArchive] = useState<Cliente | null>(null)
  const debouncedSearch = useDebouncedValue(search)
  const selectedClientId = formState?.mode === 'edit' ? formState.client.id : 0
  const listQuery = useClients({ companyId, search: debouncedSearch, status, page, pageSize })
  const metricsQuery = useClientsMetrics(companyId)
  const consentsQuery = useClientConsents(companyId, selectedClientId)
  const createMutation = useCreateClient(companyId)
  const updateMutation = useUpdateClient(companyId)
  const statusMutation = useToggleClientStatus(companyId)
  const metrics = metricsQuery.data ?? { total: 0, active: 0, inactive: 0, birthdaysThisMonth: 0 }

  async function saveClient(input: ClienteWriteInput) {
    if (!formState) return
    if (formState.mode === 'create') await createMutation.mutateAsync(input)
    else await updateMutation.mutateAsync({ clientId: formState.client.id, input })
    setFormState(null)
  }

  function changeStatus(client: Cliente) {
    if (client.ativo) setClientToArchive(client)
    else void statusMutation.mutateAsync({ clientId: client.id, active: true }).catch(() => undefined)
  }

  async function archiveClient() {
    if (!clientToArchive) return
    await statusMutation.mutateAsync({ clientId: clientToArchive.id, active: false })
    setClientToArchive(null)
  }

  const emptyAction = canManage && <button className="btn btn--primary" type="button" onClick={() => setFormState({ mode: 'create' })}><Plus size={18} /> Novo cliente</button>
  return <div className="page clients-page">
    <header className="page-header"><div className="page-header__content"><span className="page-eyebrow">Relacionamento</span><h1>Clientes</h1><p>Cadastros, contatos e consentimentos organizados com segurança.</p></div><div className="page-actions">{!canManage && <span className="clients-read-only"><ShieldCheck size={16} /> Somente leitura</span>}{canManage && <button className="btn btn--primary" type="button" onClick={() => setFormState({ mode: 'create' })}><Plus size={18} /> Novo cliente</button>}</div></header>
    <section className="clients-metrics" aria-label="Resumo dos clientes">
      {[{ label: 'Total', value: metrics.total, icon: UserRound }, { label: 'Ativos', value: metrics.active, icon: UserCheck }, { label: 'Inativos', value: metrics.inactive, icon: UserX }, { label: 'Aniversários no mês', value: metrics.birthdaysThisMonth, icon: Cake }].map(({ label, value, icon: Icon }) => <article className="client-metric-card" key={label}><span className="client-metric-card__icon"><Icon size={18} /></span><div><span>{label}</span>{metricsQuery.isPending ? <Skeleton width="2.5rem" height="1.4rem" /> : <strong>{value}</strong>}</div></article>)}
    </section>
    <section className="card clients-list-card"><FilterBar search={<SearchInput value={search} onChange={(value) => { setSearch(value); setPage(1) }} placeholder="Buscar por nome, CPF, telefone ou e-mail..." label="Buscar clientes" />} activeFilterCount={status === 'todos' ? 0 : 1} onClearFilters={() => { setStatus('todos'); setPage(1) }}><label className="clients-filter-select"><span>Status</span><select value={status} onChange={(event) => { setStatus(event.target.value as ClienteStatusFilter); setPage(1) }}><option value="todos">Todos</option><option value="ativos">Ativos</option><option value="inativos">Inativos</option></select></label><label className="clients-filter-select"><span>Por página</span><select value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1) }}><option value={10}>10</option><option value={20}>20</option><option value={50}>50</option></select></label></FilterBar>
      {listQuery.isFetching && !listQuery.isPending && <div className="clients-refreshing">Atualizando lista...</div>}
      <ClientsList clients={listQuery.data?.items ?? []} isLoading={listQuery.isPending} error={listQuery.error} isRetrying={listQuery.isFetching} canManage={canManage} pendingClientId={statusMutation.variables?.clientId} emptyAction={emptyAction} onRetry={() => void listQuery.refetch()} onEdit={(client) => setFormState({ mode: 'edit', client })} onChangeStatus={changeStatus} />
      {!listQuery.isPending && !listQuery.error && <Pagination page={listQuery.data?.page ?? page} totalPages={listQuery.data?.totalPages ?? 1} totalItems={listQuery.data?.total ?? 0} pageSize={pageSize} onPageChange={setPage} disabled={listQuery.isFetching} />}
    </section>
    {formState?.mode === 'create' && <ClientFormModal key="new-client" isSubmitting={createMutation.isPending} onClose={() => setFormState(null)} onSubmit={saveClient} />}
    {formState?.mode === 'edit' && consentsQuery.data && <ClientFormModal key={formState.client.id} client={formState.client} consents={consentsQuery.data} isSubmitting={updateMutation.isPending} onClose={() => setFormState(null)} onSubmit={saveClient} />}
    {formState?.mode === 'edit' && consentsQuery.isPending && <Modal open onClose={() => setFormState(null)} title="Editar cliente" description="Carregando preferências de comunicação..." size="lg"><div className="client-form-loading"><Skeleton height="3rem" /><Skeleton height="3rem" /><Skeleton height="8rem" /></div></Modal>}
    {formState?.mode === 'edit' && consentsQuery.error && <Modal open onClose={() => setFormState(null)} title="Não foi possível abrir o cliente" size="sm"><ErrorState error={consentsQuery.error} onRetry={() => void consentsQuery.refetch()} isRetrying={consentsQuery.isFetching} compact /></Modal>}
    {clientToArchive && <ClientStatusDialog client={clientToArchive} isSubmitting={statusMutation.isPending} onClose={() => setClientToArchive(null)} onConfirm={archiveClient} />}
  </div>
}
