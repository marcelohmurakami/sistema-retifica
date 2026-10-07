import { Search, SlidersHorizontal, X } from 'lucide-react'
import type { ReactNode } from 'react'

export type SearchInputProps = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  label?: string
  disabled?: boolean
  autoFocus?: boolean
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'Buscar...',
  label = 'Buscar',
  disabled = false,
  autoFocus = false,
}: SearchInputProps) {
  return (
    <label className="search-input">
      <span className="sr-only">{label}</span>
      <Search size={18} aria-hidden="true" />
      <input
        type="search"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        autoFocus={autoFocus}
      />
      {value && !disabled && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Limpar busca"
        >
          <X size={17} />
        </button>
      )}
    </label>
  )
}

export type FilterBarProps = {
  children?: ReactNode
  search?: ReactNode
  actions?: ReactNode
  activeFilterCount?: number
  onClearFilters?: () => void
}

export function FilterBar({
  children,
  search,
  actions,
  activeFilterCount = 0,
  onClearFilters,
}: FilterBarProps) {
  return (
    <div className="filter-bar">
      {search && <div className="filter-bar__search">{search}</div>}
      {children && (
        <div className="filter-bar__filters">
          <span className="filter-bar__label">
            <SlidersHorizontal size={16} /> Filtros
            {activeFilterCount > 0 && (
              <span className="badge badge--info">{activeFilterCount}</span>
            )}
          </span>
          {children}
          {onClearFilters && activeFilterCount > 0 && (
            <button
              className="btn btn--ghost filter-bar__clear"
              type="button"
              onClick={onClearFilters}
            >
              Limpar filtros
            </button>
          )}
        </div>
      )}
      {actions && <div className="filter-bar__actions">{actions}</div>}
    </div>
  )
}
