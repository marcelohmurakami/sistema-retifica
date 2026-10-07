import { ChevronLeft, ChevronRight } from 'lucide-react'

type PaginationItem = number | 'ellipsis-start' | 'ellipsis-end'

function createPaginationItems(page: number, totalPages: number) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }

  const items: PaginationItem[] = [1]
  const start = Math.max(2, page - 1)
  const end = Math.min(totalPages - 1, page + 1)

  if (start > 2) items.push('ellipsis-start')
  for (let currentPage = start; currentPage <= end; currentPage += 1) {
    items.push(currentPage)
  }
  if (end < totalPages - 1) items.push('ellipsis-end')

  items.push(totalPages)
  return items
}

export type PaginationProps = {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  totalItems?: number
  pageSize?: number
  disabled?: boolean
}

export function Pagination({
  page,
  totalPages,
  onPageChange,
  totalItems,
  pageSize,
  disabled = false,
}: PaginationProps) {
  const safeTotalPages = Math.max(1, totalPages)
  const currentPage = Math.min(Math.max(1, page), safeTotalPages)
  const items = createPaginationItems(currentPage, safeTotalPages)
  const rangeStart =
    totalItems !== undefined && pageSize
      ? Math.min((currentPage - 1) * pageSize + 1, totalItems)
      : null
  const rangeEnd =
    totalItems !== undefined && pageSize
      ? Math.min(currentPage * pageSize, totalItems)
      : null

  return (
    <nav className="pagination" aria-label="Paginação">
      <span className="pagination__summary" aria-live="polite">
        {rangeStart !== null && rangeEnd !== null && totalItems !== undefined
          ? `${rangeStart}–${rangeEnd} de ${totalItems}`
          : `Página ${currentPage} de ${safeTotalPages}`}
      </span>
      <div className="pagination__controls">
        <button
          className="pagination__button pagination__button--navigation"
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={disabled || currentPage === 1}
          aria-label="Página anterior"
        >
          <ChevronLeft size={17} />
          <span>Anterior</span>
        </button>

        <div className="pagination__pages">
          {items.map((item) =>
            typeof item === 'number' ? (
              <button
                key={item}
                className="pagination__button"
                type="button"
                onClick={() => onPageChange(item)}
                disabled={disabled}
                aria-label={`Ir para a página ${item}`}
                aria-current={item === currentPage ? 'page' : undefined}
              >
                {item}
              </button>
            ) : (
              <span className="pagination__ellipsis" key={item} aria-hidden="true">
                …
              </span>
            ),
          )}
        </div>

        <button
          className="pagination__button pagination__button--navigation"
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={disabled || currentPage === safeTotalPages}
          aria-label="Próxima página"
        >
          <span>Próxima</span>
          <ChevronRight size={17} />
        </button>
      </div>
    </nav>
  )
}
