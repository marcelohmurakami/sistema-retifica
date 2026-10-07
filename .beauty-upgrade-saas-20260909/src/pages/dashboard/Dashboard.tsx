import {
  CalendarDays,
  CalendarPlus,
  CheckCircle2,
  Gauge,
  RefreshCw,
  UserPlus,
  Users,
  WalletCards,
} from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { ErrorState } from '../../components_shared'
import { useAccess } from '../../features/access/hooks/useAccess'
import { useAuth } from '../../features/auth/hooks/useAuth'
import { AdvancedReportsLocked, DueAccountsPanel, EmployeePerformance, LowStockPanel, TodaySchedule, TopServices } from './components/DashboardPanels'
import { DashboardMetricCard } from './components/DashboardMetricCard'
import { DashboardSkeleton } from './components/DashboardSkeleton'
import { RevenueChart } from './components/RevenueChart'
import { useDashboard } from './hooks/useDashboard'
import type { DashboardPeriod } from './types/dashboard.types'
import {
  formatDashboardCurrency,
  formatDashboardLongDate,
  formatDashboardNumber,
  minutesLabel,
  todayInputValue,
  trendTone,
} from './utils/dashboard.utils'
import './dashboard.css'

const periodOptions: Array<{ value: DashboardPeriod; label: string }> = [
  { value: 7, label: 'Últimos 7 dias' },
  { value: 30, label: 'Últimos 30 dias' },
  { value: 90, label: 'Últimos 90 dias' },
]

function greeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Bom dia'
  if (hour < 18) return 'Boa tarde'
  return 'Boa noite'
}

export function Dashboard() {
  const { user, empresaAtual } = useAuth()
  const { cargo, podeAcessarModulo } = useAccess()
  const [period, setPeriod] = useState<DashboardPeriod>(30)
  const referenceDate = todayInputValue()
  const companyId = empresaAtual?.id ?? 0
  const query = useDashboard({ companyId, referenceDate, periodDays: period })
  const firstName = (
    typeof user?.user_metadata.full_name === 'string'
      ? user.user_metadata.full_name
      : user?.email?.split('@')[0]
  )?.trim().split(/\s+/)[0] || 'Olá'
  const canManage = cargo === 'dono' || cargo === 'gerente'
  const data = query.data

  return (
    <div className="page live-dashboard-page">
      <header className="page-header live-dashboard-heading">
        <div className="page-header__content">
          <span className="page-eyebrow">{formatDashboardLongDate(referenceDate)}</span>
          <h1>{greeting()}, {firstName}! 👋</h1>
          <p>{data?.meta.escopo_pessoal ? 'Acompanhe sua agenda e seus atendimentos de hoje.' : 'Uma visão clara da operação, das vendas e dos pontos que pedem atenção.'}</p>
        </div>
        <div className="live-dashboard-actions">
          <label className="live-dashboard-period">
            <span>Período dos relatórios</span>
            <select value={period} onChange={(event) => setPeriod(Number(event.target.value) as DashboardPeriod)}>
              {periodOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          <button className="btn btn--icon btn--secondary" type="button" aria-label="Atualizar dashboard" title="Atualizar dashboard" disabled={query.isFetching} onClick={() => void query.refetch()}>
            <RefreshCw size={17} className={query.isFetching ? 'is-spinning' : ''} />
          </button>
          {podeAcessarModulo('clientes') && <Link className="btn btn--secondary live-dashboard-action-secondary" to="/clientes"><Users size={17} /> Novo cliente</Link>}
          {podeAcessarModulo('agendamentos') && <Link className="btn btn--primary" to="/agendamentos"><CalendarPlus size={18} /> Novo agendamento</Link>}
        </div>
      </header>

      {query.isPending && <DashboardSkeleton />}
      {query.error && <ErrorState error={query.error} onRetry={() => void query.refetch()} isRetrying={query.isFetching} />}

      {data && (
        <div className="live-dashboard-content">
          <section className="live-dashboard-metrics" aria-label="Indicadores reais da empresa">
            <DashboardMetricCard
              icon={CalendarDays}
              tone="blue"
              label="Agendamentos hoje"
              value={data.indicadores.agendamentos_hoje}
              trend={{ label: `${data.indicadores.confirmados_hoje} confirmados`, tone: 'neutral' }}
              detail={`${data.indicadores.concluidos_hoje} atendimentos concluídos`}
            />
            {data.meta.pode_ver_financeiro ? (
              <DashboardMetricCard
                icon={WalletCards}
                tone="green"
                label="Faturamento hoje"
                value={formatDashboardCurrency(data.indicadores.faturamento_hoje)}
                trend={{
                  label: `${data.indicadores.variacao_faturamento > 0 ? '+' : ''}${formatDashboardNumber(data.indicadores.variacao_faturamento)}%`,
                  tone: trendTone(data.indicadores.variacao_faturamento),
                }}
                detail={`Ontem: ${formatDashboardCurrency(data.indicadores.faturamento_ontem)}`}
              />
            ) : (
              <DashboardMetricCard
                icon={CheckCircle2}
                tone="green"
                label="Concluídos hoje"
                value={data.indicadores.concluidos_hoje}
                detail="Atendimentos já finalizados"
              />
            )}
            <DashboardMetricCard
              icon={UserPlus}
              tone="purple"
              label={`Clientes novos em ${period} dias`}
              value={data.indicadores.clientes_novos}
              trend={{
                label: `${data.indicadores.variacao_clientes > 0 ? '+' : ''}${formatDashboardNumber(data.indicadores.variacao_clientes)}%`,
                tone: trendTone(data.indicadores.variacao_clientes),
              }}
              detail={`${data.indicadores.clientes_ativos} clientes ativos na base`}
            />
            <DashboardMetricCard
              icon={Gauge}
              tone="orange"
              label="Taxa de ocupação"
              value={`${formatDashboardNumber(data.indicadores.taxa_ocupacao)}%`}
              progress={data.indicadores.taxa_ocupacao}
              detail={`${minutesLabel(data.indicadores.ocupados_minutos)} ocupados de ${minutesLabel(data.indicadores.capacidade_minutos)}`}
            />
          </section>

          <div className={`live-dashboard-primary-grid ${data.meta.pode_ver_financeiro ? '' : 'is-single'}`}>
            <TodaySchedule appointments={data.agenda} timezone={data.meta.fuso_horario} personalScope={data.meta.escopo_pessoal} />
            {data.meta.pode_ver_financeiro && <RevenueChart points={data.faturamento_serie} />}
          </div>

          {data.meta.relatorios_avancados ? (
            <div className="live-dashboard-reports-grid">
              <TopServices services={data.servicos_mais_vendidos} />
              <EmployeePerformance employees={data.desempenho_funcionarios} />
            </div>
          ) : canManage ? <AdvancedReportsLocked /> : null}

          {(data.meta.pode_ver_estoque || data.meta.pode_ver_contas) && (
            <div className="live-dashboard-alerts-grid">
              {data.meta.pode_ver_estoque && <LowStockPanel products={data.estoque_baixo} />}
              {data.meta.pode_ver_contas && <DueAccountsPanel accounts={data.contas_vencimento} referenceDate={data.meta.data_referencia} />}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
