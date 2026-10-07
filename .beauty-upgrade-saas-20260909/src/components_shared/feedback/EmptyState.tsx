import { Inbox, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

export type EmptyStateProps = {
  title: string
  description: string
  icon?: LucideIcon
  action?: ReactNode
  compact?: boolean
  className?: string
}

export function EmptyState({
  title,
  description,
  icon: Icon = Inbox,
  action,
  compact = false,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={`empty-state ${compact ? 'empty-state--compact' : ''} ${className}`.trim()}
    >
      <span className="empty-state__icon" aria-hidden="true">
        <Icon size={28} />
      </span>
      <div className="empty-state__content">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
      {action && <div className="empty-state__action">{action}</div>}
    </div>
  )
}
