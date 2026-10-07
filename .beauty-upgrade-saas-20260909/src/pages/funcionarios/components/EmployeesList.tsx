import { CalendarCog, Mail, Pencil, Phone, Power, RotateCcw, UserCog } from 'lucide-react'
import type { CSSProperties, ReactNode } from 'react'
import { DataTable, type DataTableColumn } from '../../../components_shared'
import type { Funcionario } from '../types/funcionarios.types'

type Props = { employees: Funcionario[]; isLoading: boolean; error: unknown; isRetrying: boolean; pendingEmployeeId?: number; emptyAction?: ReactNode; onRetry: () => void; onEdit: (employee: Funcionario) => void; onManage: (employee: Funcionario) => void; onChangeStatus: (employee: Funcionario) => void }

function Actions({ employee, disabled, onEdit, onManage, onChangeStatus }: { employee: Funcionario; disabled: boolean; onEdit: Props['onEdit']; onManage: Props['onManage']; onChangeStatus: Props['onChangeStatus'] }) {
  return <div className="employee-actions">
    <button className="btn btn--icon btn--ghost" type="button" title="Gerenciar jornada e serviços" aria-label={`Gerenciar ${employee.nome}`} onClick={(event) => { event.stopPropagation(); onManage(employee) }}><CalendarCog size={17} /></button>
    <button className="btn btn--icon btn--ghost" type="button" title="Editar funcionário" aria-label={`Editar ${employee.nome}`} onClick={(event) => { event.stopPropagation(); onEdit(employee) }}><Pencil size={17} /></button>
    <button className={`btn btn--icon btn--ghost ${employee.ativo ? 'employee-action--danger' : 'employee-action--success'}`} type="button" title={employee.ativo ? 'Desativar' : 'Reativar'} disabled={disabled} onClick={(event) => { event.stopPropagation(); onChangeStatus(employee) }}>{employee.ativo ? <Power size={17} /> : <RotateCcw size={17} />}</button>
  </div>
}

export function EmployeesList(props: Props) {
  const columns: DataTableColumn<Funcionario>[] = [
    { id: 'employee', header: 'Funcionário', cell: (employee) => <div className="employee-name-cell"><span className="employee-avatar" style={{ '--employee-color': employee.cor_agenda ?? '#3b82f6' } as CSSProperties}>{employee.nome.slice(0, 1).toUpperCase()}</span><div><strong>{employee.nome}</strong><span>{employee.cargo || 'Função não informada'}</span></div></div> },
    { id: 'contact', header: 'Contato', cell: (employee) => <div className="employee-contact-cell">{employee.telefone ? <Phone size={15} /> : <Mail size={15} />}<span>{employee.telefone || employee.email || 'Não informado'}</span></div> },
    { id: 'attendance', header: 'Atendimentos', cell: (employee) => employee.atende_clientes ? <span className="badge badge--info">Atende</span> : <span className="text-muted">Interno</span>, width: '8rem', hideOnMobile: true },
    { id: 'status', header: 'Status', cell: (employee) => <span className={`badge ${employee.ativo ? 'badge--success' : ''}`}>{employee.ativo ? 'Ativo' : 'Inativo'}</span>, width: '6.5rem' },
    { id: 'actions', header: <span className="sr-only">Ações</span>, align: 'right', width: '9rem', cell: (employee) => <Actions employee={employee} disabled={props.pendingEmployeeId === employee.id} onEdit={props.onEdit} onManage={props.onManage} onChangeStatus={props.onChangeStatus} /> },
  ]
  return <>
    <div className={`employees-desktop-list ${!props.isLoading && !props.error && props.employees.length ? 'has-data' : ''}`}><DataTable data={props.employees} columns={columns} rowKey="id" caption="Funcionários cadastrados" isLoading={props.isLoading} error={props.error} onRetry={props.onRetry} isRetrying={props.isRetrying} emptyTitle="Nenhum funcionário encontrado" emptyDescription="Cadastre a equipe ou ajuste os filtros da busca." emptyIcon={UserCog} emptyAction={props.emptyAction} onRowClick={props.onManage} getRowClassName={(employee) => employee.ativo ? undefined : 'employee-row--inactive'} /></div>
    {!props.isLoading && !props.error && props.employees.length > 0 && <div className="employees-mobile-list">{props.employees.map((employee) => <article className="employee-mobile-card" data-inactive={!employee.ativo || undefined} key={employee.id}><header><div className="employee-name-cell"><span className="employee-avatar" style={{ '--employee-color': employee.cor_agenda ?? '#3b82f6' } as CSSProperties}>{employee.nome.slice(0, 1).toUpperCase()}</span><div><strong>{employee.nome}</strong><span>{employee.cargo || 'Função não informada'}</span></div></div><span className={`badge ${employee.ativo ? 'badge--success' : ''}`}>{employee.ativo ? 'Ativo' : 'Inativo'}</span></header><p>{employee.telefone || employee.email || 'Contato não informado'}</p><footer><button className="btn btn--primary" type="button" onClick={() => props.onManage(employee)}><CalendarCog size={16} /> Gerenciar</button><button className="btn btn--secondary" type="button" onClick={() => props.onEdit(employee)}><Pencil size={16} /> Editar</button><button className="btn btn--ghost" type="button" onClick={() => props.onChangeStatus(employee)}>{employee.ativo ? <Power size={16} /> : <RotateCcw size={16} />}</button></footer></article>)}</div>}
  </>
}
