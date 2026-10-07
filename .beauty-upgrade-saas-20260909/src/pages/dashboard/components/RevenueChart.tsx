import { BarChart3 } from 'lucide-react'
import { EmptyState } from '../../../components_shared'
import type { DashboardRevenuePoint } from '../types/dashboard.types'
import {
  formatDashboardCurrency,
  formatDashboardDate,
  revenueBarHeight,
} from '../utils/dashboard.utils'

export function RevenueChart({ points }: { points: DashboardRevenuePoint[] }) {
  const maximum = Math.max(0, ...points.map((point) => Number(point.valor)))
  const total = points.reduce((sum, point) => sum + Number(point.valor), 0)

  return (
    <section className="card live-dashboard-card revenue-card">
      <header className="live-dashboard-card__header">
        <div>
          <span className="page-eyebrow">Faturamento</span>
          <h2>Evolução do período</h2>
          <p>Comandas fechadas, agrupadas pela data da venda.</p>
        </div>
        <div className="revenue-card__total">
          <span>Total no período</span>
          <strong>{formatDashboardCurrency(total)}</strong>
        </div>
      </header>

      {total <= 0 ? (
        <EmptyState
          compact
          icon={BarChart3}
          title="Ainda não há faturamento"
          description="As comandas fechadas neste período aparecerão neste gráfico."
        />
      ) : (
        <div className="revenue-chart" role="img" aria-label={`Faturamento total de ${formatDashboardCurrency(total)} no período`}>
          <div className="revenue-chart__plot">
            {points.map((point) => (
              <span
                className="revenue-chart__column"
                key={point.data}
                title={`${formatDashboardDate(point.data)}: ${formatDashboardCurrency(point.valor)}`}
              >
                <i style={{ height: `${revenueBarHeight(point.valor, maximum)}%` }} />
              </span>
            ))}
          </div>
          <div className="revenue-chart__axis" aria-hidden="true">
            <span>{formatDashboardDate(points[0]?.data ?? '')}</span>
            <span>{formatDashboardDate(points[Math.floor(points.length / 2)]?.data ?? '')}</span>
            <span>{formatDashboardDate(points.at(-1)?.data ?? '')}</span>
          </div>
        </div>
      )}
    </section>
  )
}
