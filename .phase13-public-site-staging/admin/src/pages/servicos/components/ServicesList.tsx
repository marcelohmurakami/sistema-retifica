import { CalendarCheck2, Pencil, Power, RotateCcw, Sparkles } from 'lucide-react'
import type { ReactNode } from 'react'
import {
  DataTable,
  type DataTableColumn,
} from '../../../components_shared'
import type { Servico } from '../types/servicos.types'
import { formatCurrency, formatDuration } from '../utils/servicos.utils'

type ServicesListProps = {
  services: Servico[]
  isLoading: boolean
  error: unknown
  isRetrying: boolean
  canManage: boolean
  emptyAction?: ReactNode
  pendingServiceId?: number
  onRetry: () => void
  onEdit: (service: Servico) => void
  onChangeStatus: (service: Servico) => void
}

function ServiceActions({
  service,
  disabled,
  onEdit,
  onChangeStatus,
}: {
  service: Servico
  disabled: boolean
  onEdit: (service: Servico) => void
  onChangeStatus: (service: Servico) => void
}) {
  return (
    <div className="service-actions">
      <button
        className="btn btn--icon btn--ghost"
        type="button"
        onClick={(event) => {
          event.stopPropagation()
          onEdit(service)
        }}
        disabled={disabled}
        aria-label={`Editar ${service.nome}`}
        title="Editar serviço"
      >
        <Pencil size={17} />
      </button>
      <button
        className={`btn btn--icon btn--ghost ${service.ativo ? 'service-action--danger' : 'service-action--success'}`}
        type="button"
        onClick={(event) => {
          event.stopPropagation()
          onChangeStatus(service)
        }}
        disabled={disabled}
        aria-label={`${service.ativo ? 'Desativar' : 'Ativar'} ${service.nome}`}
        title={service.ativo ? 'Desativar serviço' : 'Ativar serviço'}
      >
        {service.ativo ? <Power size={17} /> : <RotateCcw size={17} />}
      </button>
    </div>
  )
}

export function ServicesList({
  services,
  isLoading,
  error,
  isRetrying,
  canManage,
  emptyAction,
  pendingServiceId,
  onRetry,
  onEdit,
  onChangeStatus,
}: ServicesListProps) {
  const columns: DataTableColumn<Servico>[] = [
    {
      id: 'service',
      header: 'Serviço',
      cell: (service) => (
        <div className="service-name-cell">
          <strong>{service.nome}</strong>
          {service.descricao && <span>{service.descricao}</span>}
        </div>
      ),
    },
    {
      id: 'price',
      header: 'Preço',
      cell: (service) => formatCurrency(service.preco),
      width: '8.5rem',
    },
    {
      id: 'duration',
      header: 'Duração',
      cell: (service) => (
        <span className="service-duration">
          {formatDuration(service.duracao_minutos)}
          {service.intervalo_minutos > 0 && (
            <small>+ {service.intervalo_minutos} min</small>
          )}
        </span>
      ),
      width: '8.5rem',
    },
    {
      id: 'online',
      header: 'Online',
      cell: (service) =>
        service.permite_agendamento_online ? (
          <span className="service-online" title="Agendamento online habilitado">
            <CalendarCheck2 size={16} /> Sim
          </span>
        ) : (
          <span className="text-muted">Não</span>
        ),
      width: '7.5rem',
    },
    {
      id: 'status',
      header: 'Status',
      cell: (service) => (
        <span className={`badge ${service.ativo ? 'badge--success' : ''}`}>
          {service.ativo ? 'Ativo' : 'Inativo'}
        </span>
      ),
      width: '7rem',
    },
  ]

  if (canManage) {
    columns.push({
      id: 'actions',
      header: <span className="sr-only">Ações</span>,
      align: 'right',
      width: '6.5rem',
      cell: (service) => (
        <ServiceActions
          service={service}
          disabled={pendingServiceId === service.id}
          onEdit={onEdit}
          onChangeStatus={onChangeStatus}
        />
      ),
    })
  }

  return (
    <>
      <div
        className={`services-desktop-list ${!isLoading && !error && services.length > 0 ? 'has-data' : ''}`.trim()}
      >
        <DataTable
          data={services}
          columns={columns}
          rowKey="id"
          caption="Serviços cadastrados"
          isLoading={isLoading}
          error={error}
          onRetry={onRetry}
          isRetrying={isRetrying}
          emptyTitle="Nenhum serviço encontrado"
          emptyDescription="Cadastre um serviço ou ajuste os filtros da busca."
          emptyIcon={Sparkles}
          emptyAction={emptyAction}
          onRowClick={canManage ? onEdit : undefined}
          getRowClassName={(service) =>
            service.ativo ? undefined : 'service-row--inactive'
          }
        />
      </div>

      {!isLoading && !error && services.length > 0 && (
        <div className="services-mobile-list" aria-label="Serviços cadastrados">
          {services.map((service) => (
            <article
              className="service-mobile-card"
              data-inactive={!service.ativo || undefined}
              key={service.id}
            >
              <header>
                <div>
                  <strong>{service.nome}</strong>
                  <span>{formatCurrency(service.preco)}</span>
                </div>
                <span className={`badge ${service.ativo ? 'badge--success' : ''}`}>
                  {service.ativo ? 'Ativo' : 'Inativo'}
                </span>
              </header>
              {service.descricao && <p>{service.descricao}</p>}
              <dl>
                <div>
                  <dt>Duração</dt>
                  <dd>{formatDuration(service.duracao_minutos)}</dd>
                </div>
                <div>
                  <dt>Intervalo</dt>
                  <dd>{service.intervalo_minutos} min</dd>
                </div>
                <div>
                  <dt>Online</dt>
                  <dd>{service.permite_agendamento_online ? 'Sim' : 'Não'}</dd>
                </div>
              </dl>
              {canManage && (
                <footer>
                  <button
                    className="btn btn--secondary"
                    type="button"
                    onClick={() => onEdit(service)}
                    disabled={pendingServiceId === service.id}
                  >
                    <Pencil size={16} /> Editar
                  </button>
                  <button
                    className="btn btn--ghost"
                    type="button"
                    onClick={() => onChangeStatus(service)}
                    disabled={pendingServiceId === service.id}
                  >
                    {service.ativo ? <Power size={16} /> : <RotateCcw size={16} />}
                    {service.ativo ? 'Desativar' : 'Ativar'}
                  </button>
                </footer>
              )}
            </article>
          ))}
        </div>
      )}
    </>
  )
}
