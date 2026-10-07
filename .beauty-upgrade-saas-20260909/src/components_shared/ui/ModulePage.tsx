import { Filter, Plus, type LucideIcon } from 'lucide-react'
import { useState } from 'react'
import { EmptyState } from '../feedback/EmptyState'
import { FilterBar, SearchInput } from '../filters/SearchAndFilters'

type Metric = {
  label: string
  value: string
  detail: string
  tone?: 'default' | 'success' | 'warning' | 'danger'
}

type ModulePageProps = {
  eyebrow: string
  title: string
  description: string
  actionLabel: string
  icon: LucideIcon
  metrics: Metric[]
  emptyTitle: string
  emptyDescription: string
}

export function ModulePage({
  eyebrow,
  title,
  description,
  actionLabel,
  icon: Icon,
  metrics,
  emptyTitle,
  emptyDescription,
}: ModulePageProps) {
  const [search, setSearch] = useState('')

  return (
    <div className="page module-page">
      <header className="page-header">
        <div className="page-header__content">
          <span className="page-eyebrow">{eyebrow}</span>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        <div className="page-actions">
          <button className="btn btn--primary" type="button">
            <Plus size={18} /> {actionLabel}
          </button>
        </div>
      </header>

      <section className="metrics-grid" aria-label="Resumo">
        {metrics.map((metric) => (
          <article
            className="metric-card"
            data-tone={metric.tone ?? 'default'}
            key={metric.label}
            aria-label={`${metric.label}: ${metric.value}. ${metric.detail}`}
          >
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
          </article>
        ))}
      </section>

      <section className="card module-list-card">
        <FilterBar
          search={
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder={`Buscar em ${title.toLowerCase()}...`}
            />
          }
          actions={
            <button className="btn btn--secondary" type="button">
              <Filter size={17} /> Filtros
            </button>
          }
        />

        <EmptyState
          className="module-empty-state"
          title={emptyTitle}
          description={emptyDescription}
          icon={Icon}
          compact
        />
      </section>
    </div>
  )
}
