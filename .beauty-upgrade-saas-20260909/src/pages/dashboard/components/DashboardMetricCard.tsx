import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

type DashboardMetricCardProps = {
  icon: LucideIcon
  tone: 'blue' | 'green' | 'purple' | 'orange'
  label: string
  value: ReactNode
  detail: string
  trend?: {
    label: string
    tone: 'positive' | 'negative' | 'neutral'
  }
  progress?: number
}

export function DashboardMetricCard({
  icon: Icon,
  tone,
  label,
  value,
  detail,
  trend,
  progress,
}: DashboardMetricCardProps) {
  return (
    <article className="live-metric-card">
      <div className="live-metric-card__top">
        <span className={`live-metric-card__icon is-${tone}`} aria-hidden="true">
          <Icon size={20} />
        </span>
        {trend && (
          <span className={`live-metric-card__trend is-${trend.tone}`}>
            {trend.label}
          </span>
        )}
      </div>
      <div className="live-metric-card__value">
        <strong>{value}</strong>
        <span>{label}</span>
      </div>
      {typeof progress === 'number' && (
        <span className="live-metric-card__progress" aria-hidden="true">
          <i style={{ width: `${Math.min(100, Math.max(0, progress))}%` }} />
        </span>
      )}
      <small>{detail}</small>
    </article>
  )
}
