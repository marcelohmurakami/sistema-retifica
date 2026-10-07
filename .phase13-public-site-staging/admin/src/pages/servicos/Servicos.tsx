import { Plus, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import {
  FilterBar,
  Pagination,
  SearchInput,
  Skeleton,
} from '../../components_shared'
import { FEATURES } from '../../features/access/access.constants'
import { useAccess } from '../../features/access/hooks/useAccess'
import { useAuth } from '../../features/auth/hooks/useAuth'
import { ServiceFormModal } from './components/ServiceFormModal'
import { ServicesList } from './components/ServicesList'
import { ServiceStatusDialog } from './components/ServiceStatusDialog'
import { useDebouncedValue } from './hooks/useDebouncedValue'
import {
  useCreateService,
  useServices,
  useServicesMetrics,
  useToggleServiceStatus,
  useUpdateService,
} from './hooks/useServices'
import type {
  Servico,
  ServicoStatusFilter,
  ServicoWritePayload,
} from './types/servicos.types'
import {
  canManageServices,
  isServiceLimitReached,
} from './utils/servicos.utils'
import './servicos.css'

type ServiceFormState =
  | { mode: 'create' }
  | { mode: 'edit'; service: Servico }
  | null

export function Servicos() {
  const { empresaAtual } = useAuth()
  const { cargo, obterLimite, possuiPermissaoPlano } = useAccess()
  const companyId = empresaAtual?.id ?? 0
  const canManage = canManageServices(cargo)
  const canUseOnlineScheduling = possuiPermissaoPlano(
    FEATURES.ONLINE_SCHEDULING,
  )
  const serviceLimit = obterLimite(FEATURES.SERVICES)

  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<ServicoStatusFilter>('todos')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [formState, setFormState] = useState<ServiceFormState>(null)
  const [serviceToDeactivate, setServiceToDeactivate] =
    useState<Servico | null>(null)
  const debouncedSearch = useDebouncedValue(search)

  const listQuery = useServices({
    companyId,
    search: debouncedSearch,
    status,
    page,
    pageSize,
  })
  const metricsQuery = useServicesMetrics(companyId)
  const createMutation = useCreateService(companyId)
  const updateMutation = useUpdateService(companyId)
  const statusMutation = useToggleServiceStatus(companyId)

  const metrics = metricsQuery.data ?? { total: 0, active: 0, inactive: 0 }
  const limitReached = isServiceLimitReached(metrics.active, serviceLimit)
  const currentFormService =
    formState?.mode === 'edit' ? formState.service : undefined
  const isSaving = createMutation.isPending || updateMutation.isPending

  function openCreateForm() {
    if (limitReached) {
      toast.info(
        `O plano atual permite ${serviceLimit} serviço${serviceLimit === 1 ? '' : 's'} ativo${serviceLimit === 1 ? '' : 's'}.`,
      )
      return
    }

    setFormState({ mode: 'create' })
  }

  async function saveService(input: ServicoWritePayload) {
    if (!formState) return

    if (formState.mode === 'create') {
      await createMutation.mutateAsync(input)
    } else {
      await updateMutation.mutateAsync({
        serviceId: formState.service.id,
        input,
      })
    }

    setFormState(null)
  }

  function requestStatusChange(service: Servico) {
    if (service.ativo) {
      setServiceToDeactivate(service)
      return
    }

    if (limitReached) {
      toast.info('Desative outro serviço antes de reativar este item.')
      return
    }

    void statusMutation
      .mutateAsync({ serviceId: service.id, active: true })
      .then(() => setPage(1))
      .catch(() => undefined)
  }

  async function confirmDeactivation() {
    if (!serviceToDeactivate) return
    await statusMutation.mutateAsync({
      serviceId: serviceToDeactivate.id,
      active: false,
    })
    setServiceToDeactivate(null)
    setPage(1)
  }

  function changeSearch(value: string) {
    setSearch(value)
    setPage(1)
  }

  function changeStatus(value: ServicoStatusFilter) {
    setStatus(value)
    setPage(1)
  }

  function changePageSize(value: number) {
    setPageSize(value)
    setPage(1)
  }

  const createButton = canManage && !limitReached && (
    <button className="btn btn--primary" type="button" onClick={openCreateForm}>
      <Plus size={18} /> Novo serviço
    </button>
  )

  return (
    <div className="page services-page">
      <header className="page-header">
        <div className="page-header__content">
          <span className="page-eyebrow">Catálogo</span>
          <h1>Serviços</h1>
          <p>Gerencie preços, duração e disponibilidade para agendamentos.</p>
        </div>
        <div className="page-actions">
          {!canManage && (
            <span className="services-read-only">
              <ShieldCheck size={16} /> Somente leitura
            </span>
          )}
          {canManage && (
            <button
              className="btn btn--primary"
              type="button"
              onClick={openCreateForm}
              disabled={limitReached}
              title={
                limitReached
                  ? 'Limite de serviços ativos do plano atingido'
                  : undefined
              }
            >
              <Plus size={18} /> Novo serviço
            </button>
          )}
        </div>
      </header>

      <section className="services-metrics" aria-label="Resumo dos serviços">
        {[
          { label: 'Total', value: metrics.total, detail: 'cadastrados' },
          { label: 'Ativos', value: metrics.active, detail: 'disponíveis' },
          { label: 'Inativos', value: metrics.inactive, detail: 'arquivados' },
        ].map((metric) => (
          <article className="service-metric-card" key={metric.label}>
            <span className="service-metric-card__label">{metric.label}</span>
            {metricsQuery.isPending ? (
              <Skeleton
                className="service-metric-card__value-skeleton"
                width="3rem"
                height="1.5rem"
              />
            ) : (
              <strong className="service-metric-card__value">
                {metric.value}
              </strong>
            )}
            <small className="service-metric-card__detail">
              {metric.detail}
            </small>
          </article>
        ))}
        <article className="service-metric-card service-metric-card--plan">
          <span className="service-metric-card__label">Limite do plano</span>
          <strong className="service-metric-card__value">
            {serviceLimit === null ? 'Ilimitado' : serviceLimit}
          </strong>
          <small className="service-metric-card__detail">serviços ativos</small>
        </article>
      </section>

      {limitReached && canManage && (
        <div className="alert alert--info services-limit-alert" role="status">
          O limite de serviços ativos do plano foi atingido. Você ainda pode
          editar ou desativar serviços existentes.
        </div>
      )}

      <section className="card services-list-card">
        <FilterBar
          search={
            <SearchInput
              value={search}
              onChange={changeSearch}
              placeholder="Buscar por nome ou descrição..."
              label="Buscar serviços"
            />
          }
          activeFilterCount={status === 'todos' ? 0 : 1}
          onClearFilters={() => changeStatus('todos')}
        >
          <label className="services-filter-select">
            <span>Status</span>
            <select
              value={status}
              onChange={(event) =>
                changeStatus(event.target.value as ServicoStatusFilter)
              }
            >
              <option value="todos">Todos</option>
              <option value="ativos">Ativos</option>
              <option value="inativos">Inativos</option>
            </select>
          </label>
          <label className="services-filter-select services-filter-select--size">
            <span>Por página</span>
            <select
              value={pageSize}
              onChange={(event) => changePageSize(Number(event.target.value))}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </label>
        </FilterBar>

        {listQuery.isFetching && !listQuery.isPending && (
          <div className="services-refreshing" role="status">
            Atualizando lista...
          </div>
        )}

        <ServicesList
          services={listQuery.data?.items ?? []}
          isLoading={listQuery.isPending}
          error={listQuery.error}
          isRetrying={listQuery.isFetching}
          canManage={canManage}
          emptyAction={createButton}
          pendingServiceId={statusMutation.variables?.serviceId}
          onRetry={() => void listQuery.refetch()}
          onEdit={(service) => setFormState({ mode: 'edit', service })}
          onChangeStatus={requestStatusChange}
        />

        {!listQuery.isPending && !listQuery.error && (
          <Pagination
            page={listQuery.data?.page ?? page}
            totalPages={listQuery.data?.totalPages ?? 1}
            totalItems={listQuery.data?.total ?? 0}
            pageSize={pageSize}
            onPageChange={setPage}
            disabled={listQuery.isFetching}
          />
        )}
      </section>

      {formState && (
        <ServiceFormModal
          key={currentFormService?.id ?? 'new-service'}
          service={currentFormService}
          canUseOnlineScheduling={canUseOnlineScheduling}
          canActivate={Boolean(currentFormService?.ativo) || !limitReached}
          isSubmitting={isSaving}
          onClose={() => setFormState(null)}
          onSubmit={saveService}
        />
      )}

      {serviceToDeactivate && (
        <ServiceStatusDialog
          service={serviceToDeactivate}
          isSubmitting={statusMutation.isPending}
          onClose={() => setServiceToDeactivate(null)}
          onConfirm={confirmDeactivation}
        />
      )}
    </div>
  )
}
