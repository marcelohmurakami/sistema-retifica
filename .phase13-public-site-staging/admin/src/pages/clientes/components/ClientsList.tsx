import { Cake, Mail, Pencil, Phone, Power, RotateCcw, UserRound } from 'lucide-react'
import type { ReactNode } from 'react'
import { DataTable, type DataTableColumn } from '../../../components_shared'
import type { Cliente } from '../types/clientes.types'
import { formatClientContact } from '../utils/clientes.utils'

type Props = {
  clients: Cliente[]
  isLoading: boolean
  error: unknown
  isRetrying: boolean
  canManage: boolean
  pendingClientId?: number
  emptyAction?: ReactNode
  onRetry: () => void
  onEdit: (client: Cliente) => void
  onChangeStatus: (client: Cliente) => void
}

function ClientActions({ client, disabled, onEdit, onChangeStatus }: { client: Cliente; disabled: boolean; onEdit: (client: Cliente) => void; onChangeStatus: (client: Cliente) => void }) {
  return <div className="client-actions">
    <button className="btn btn--icon btn--ghost" type="button" title="Editar cliente" aria-label={`Editar ${client.nome}`} disabled={disabled} onClick={(event) => { event.stopPropagation(); onEdit(client) }}><Pencil size={17} /></button>
    <button className={`btn btn--icon btn--ghost ${client.ativo ? 'client-action--danger' : 'client-action--success'}`} type="button" title={client.ativo ? 'Arquivar cliente' : 'Reativar cliente'} aria-label={`${client.ativo ? 'Arquivar' : 'Reativar'} ${client.nome}`} disabled={disabled} onClick={(event) => { event.stopPropagation(); onChangeStatus(client) }}>{client.ativo ? <Power size={17} /> : <RotateCcw size={17} />}</button>
  </div>
}

export function ClientsList(props: Props) {
  const columns: DataTableColumn<Cliente>[] = [
    { id: 'client', header: 'Cliente', cell: (client) => <div className="client-name-cell"><strong>{client.nome}</strong><span>{client.cpf || 'CPF não informado'}</span></div> },
    { id: 'contact', header: 'Contato', cell: (client) => <div className="client-contact-cell">{client.telefone_principal ? <Phone size={15} /> : <Mail size={15} />}<span>{formatClientContact(client)}</span></div> },
    { id: 'birthday', header: 'Nascimento', cell: (client) => client.data_nascimento ? new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(new Date(`${client.data_nascimento}T00:00:00Z`)) : <span className="text-muted">Não informado</span>, width: '9rem', hideOnMobile: true },
    { id: 'channel', header: 'Preferência', cell: (client) => client.bloqueado_comunicacao_em ? <span className="badge badge--danger">Bloqueado</span> : <span className="text-capitalize">{client.canal_preferido || 'Não informada'}</span>, width: '8.5rem', hideOnMobile: true },
    { id: 'status', header: 'Status', cell: (client) => <span className={`badge ${client.ativo ? 'badge--success' : ''}`}>{client.ativo ? 'Ativo' : 'Inativo'}</span>, width: '6.5rem' },
  ]
  if (props.canManage) columns.push({ id: 'actions', header: <span className="sr-only">Ações</span>, align: 'right', width: '6.5rem', cell: (client) => <ClientActions client={client} disabled={props.pendingClientId === client.id} onEdit={props.onEdit} onChangeStatus={props.onChangeStatus} /> })

  return <>
    <div className={`clients-desktop-list ${!props.isLoading && !props.error && props.clients.length ? 'has-data' : ''}`}>
      <DataTable data={props.clients} columns={columns} rowKey="id" caption="Clientes cadastrados" isLoading={props.isLoading} error={props.error} onRetry={props.onRetry} isRetrying={props.isRetrying} emptyTitle="Nenhum cliente encontrado" emptyDescription="Cadastre o primeiro cliente ou ajuste os filtros da busca." emptyIcon={UserRound} emptyAction={props.emptyAction} onRowClick={props.canManage ? props.onEdit : undefined} getRowClassName={(client) => client.ativo ? undefined : 'client-row--inactive'} />
    </div>
    {!props.isLoading && !props.error && props.clients.length > 0 && <div className="clients-mobile-list" aria-label="Clientes cadastrados">
      {props.clients.map((client) => <article className="client-mobile-card" data-inactive={!client.ativo || undefined} key={client.id}>
        <header><div><strong>{client.nome}</strong><span>{formatClientContact(client)}</span></div><span className={`badge ${client.ativo ? 'badge--success' : ''}`}>{client.ativo ? 'Ativo' : 'Inativo'}</span></header>
        <div className="client-mobile-card__details"><span><Cake size={15} />{client.data_nascimento ? new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(new Date(`${client.data_nascimento}T00:00:00Z`)) : 'Nascimento não informado'}</span><span>{client.canal_preferido ? `Prefere ${client.canal_preferido}` : 'Sem preferência de contato'}</span></div>
        {props.canManage && <footer><button className="btn btn--secondary" type="button" onClick={() => props.onEdit(client)}><Pencil size={16} /> Editar</button><button className="btn btn--ghost" type="button" onClick={() => props.onChangeStatus(client)}>{client.ativo ? <Power size={16} /> : <RotateCcw size={16} />}{client.ativo ? 'Arquivar' : 'Reativar'}</button></footer>}
      </article>)}
    </div>}
  </>
}
