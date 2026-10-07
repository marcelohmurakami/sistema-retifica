import {
  ArrowUpRight,
  CalendarClock,
  ChevronRight,
  Crown,
  PackageX,
  ReceiptText,
  Sparkles,
  Trophy,
  UsersRound,
} from 'lucide-react'
import { Link } from 'react-router'
import { EmptyState } from '../../../components_shared'
import type {
  DashboardAgendaItem,
  DashboardDueAccount,
  DashboardEmployeePerformance,
  DashboardLowStock,
  DashboardTopService,
} from '../types/dashboard.types'
import {
  appointmentStatus,
  dueDateLabel,
  formatDashboardCurrency,
  formatDashboardNumber,
  formatDashboardTime,
  uniqueNames,
} from '../utils/dashboard.utils'

type PanelHeaderProps = {
  eyebrow: string
  title: string
  link?: string
  linkLabel?: string
}

function PanelHeader({ eyebrow, title, link, linkLabel }: PanelHeaderProps) {
  return (
    <header className="live-dashboard-card__header">
      <div><span className="page-eyebrow">{eyebrow}</span><h2>{title}</h2></div>
      {link && <Link className="live-dashboard-link" to={link}>{linkLabel}<ChevronRight size={16} /></Link>}
    </header>
  )
}

export function TodaySchedule({
  appointments,
  timezone,
  personalScope,
}: {
  appointments: DashboardAgendaItem[]
  timezone: string
  personalScope: boolean
}) {
  return (
    <section className="card live-dashboard-card today-schedule-card">
      <PanelHeader eyebrow="Agenda do dia" title={personalScope ? 'Meus próximos atendimentos' : 'Próximos atendimentos'} link="/agendamentos" linkLabel="Ver agenda" />
      {appointments.length === 0 ? (
        <EmptyState compact icon={CalendarClock} title="Agenda livre por enquanto" description="Não há atendimentos ativos para hoje." action={<Link className="btn btn--secondary" to="/agendamentos">Abrir agenda</Link>} />
      ) : (
        <div className="today-schedule-list">
          {appointments.map((appointment) => {
            const status = appointmentStatus(appointment.status)
            const professionals = uniqueNames(appointment.servicos.map((service) => service.profissional))
            const services = uniqueNames(appointment.servicos.map((service) => service.nome))
            const color = appointment.servicos.find((service) => service.cor)?.cor ?? undefined

            return (
              <article className="today-schedule-item" key={appointment.id} style={{ '--schedule-color': color } as React.CSSProperties}>
                <div className="today-schedule-item__time">
                  <strong>{formatDashboardTime(appointment.inicio, timezone)}</strong>
                  <span>{formatDashboardTime(appointment.fim, timezone)}</span>
                </div>
                <span className="today-schedule-item__line" aria-hidden="true" />
                <div className="today-schedule-item__main">
                  <div><strong>{appointment.cliente_nome}</strong><span className={`dashboard-status is-${status.tone}`}>{status.label}</span></div>
                  <p>{services.join(' + ') || 'Serviço não informado'}</p>
                  <small>{professionals.join(', ') || 'Profissional não informado'}</small>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}

export function TopServices({ services }: { services: DashboardTopService[] }) {
  const maximum = Math.max(0, ...services.map((service) => Number(service.faturamento)))

  return (
    <section className="card live-dashboard-card ranking-card">
      <PanelHeader eyebrow="Vendas" title="Serviços mais vendidos" />
      {services.length === 0 ? (
        <EmptyState compact icon={Trophy} title="Sem serviços vendidos" description="O ranking será formado pelas comandas fechadas no período." />
      ) : (
        <ol className="service-ranking">
          {services.map((service, index) => (
            <li key={`${service.id ?? 'snapshot'}-${service.nome}`}>
              <span className="service-ranking__position">{index + 1}</span>
              <div className="service-ranking__content">
                <div><strong>{service.nome}</strong><span>{formatDashboardNumber(service.quantidade)} vendidos</span></div>
                <span className="service-ranking__bar"><i style={{ width: `${maximum > 0 ? (service.faturamento / maximum) * 100 : 0}%` }} /></span>
              </div>
              <strong className="service-ranking__value">{formatDashboardCurrency(service.faturamento)}</strong>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}

export function EmployeePerformance({ employees }: { employees: DashboardEmployeePerformance[] }) {
  return (
    <section className="card live-dashboard-card performance-card">
      <PanelHeader eyebrow="Equipe" title="Desempenho dos funcionários" link="/comissoes" linkLabel="Ver comissões" />
      {employees.length === 0 ? (
        <EmptyState compact icon={UsersRound} title="Sem desempenho calculado" description="Adicione profissionais às comandas para acompanhar os resultados." />
      ) : (
        <div className="performance-list">
          <div className="performance-list__head" aria-hidden="true"><span>Profissional</span><span>Atendimentos</span><span>Serviços</span><span>Faturamento</span><span>Ticket médio</span></div>
          {employees.map((employee, index) => (
            <article key={employee.id}>
              <div className="performance-person"><span style={{ '--employee-color': employee.cor ?? '#3B82F6' } as React.CSSProperties}>{employee.nome.slice(0, 2).toUpperCase()}</span><div><strong>{employee.nome}</strong><small>{index === 0 ? <><Crown size={12} /> Destaque do período</> : employee.cargo ?? 'Profissional'}</small></div></div>
              <span data-label="Atendimentos">{employee.atendimentos}</span>
              <span data-label="Serviços">{formatDashboardNumber(employee.servicos)}</span>
              <strong data-label="Faturamento">{formatDashboardCurrency(employee.faturamento)}</strong>
              <span data-label="Ticket médio">{formatDashboardCurrency(employee.ticket_medio)}</span>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

export function LowStockPanel({ products }: { products: DashboardLowStock[] }) {
  return (
    <section className="card live-dashboard-card alert-list-card">
      <PanelHeader eyebrow="Estoque" title="Produtos em nível crítico" link="/estoque" linkLabel="Ver estoque" />
      {products.length === 0 ? (
        <EmptyState compact icon={PackageX} title="Estoque sob controle" description="Nenhum produto atingiu o estoque mínimo." />
      ) : (
        <div className="dashboard-alert-list">
          {products.map((product) => (
            <article key={product.id}>
              <span className={`dashboard-alert-list__icon ${product.criticidade === 2 ? 'is-danger' : 'is-warning'}`}><PackageX size={17} /></span>
              <div><strong>{product.nome}</strong><small>{product.codigo || 'Sem código'} · mínimo {formatDashboardNumber(product.estoque_minimo)} {product.unidade_medida}</small></div>
              <span className={product.criticidade === 2 ? 'text-danger' : 'text-warning'}>{formatDashboardNumber(product.estoque_atual)} {product.unidade_medida}</span>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

export function DueAccountsPanel({ accounts, referenceDate }: { accounts: DashboardDueAccount[]; referenceDate: string }) {
  return (
    <section className="card live-dashboard-card alert-list-card">
      <PanelHeader eyebrow="Financeiro" title="Contas próximas do vencimento" link="/financeiro" linkLabel="Ver financeiro" />
      {accounts.length === 0 ? (
        <EmptyState compact icon={ReceiptText} title="Nenhum vencimento próximo" description="Não há parcelas em aberto vencidas ou com vencimento nos próximos sete dias." />
      ) : (
        <div className="dashboard-alert-list">
          {accounts.map((account) => {
            const overdue = account.data_vencimento < referenceDate
            return (
              <article key={account.id}>
                <span className={`dashboard-alert-list__icon ${overdue ? 'is-danger' : account.tipo === 'pagar' ? 'is-warning' : 'is-info'}`}><ReceiptText size={17} /></span>
                <div><strong>{account.descricao}</strong><small>{account.contraparte || `Parcela ${account.numero_parcela}`} · {dueDateLabel(account.data_vencimento, referenceDate)}</small></div>
                <span>{formatDashboardCurrency(account.saldo)}</span>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}

export function AdvancedReportsLocked() {
  return (
    <section className="card advanced-reports-locked">
      <span><Sparkles size={21} /></span>
      <div><strong>Relatórios avançados</strong><p>Ranking de serviços e desempenho da equipe estão disponíveis no plano com relatórios avançados.</p></div>
      <Link className="btn btn--secondary" to="/configuracoes"><ArrowUpRight size={16} /> Ver plano</Link>
    </section>
  )
}
