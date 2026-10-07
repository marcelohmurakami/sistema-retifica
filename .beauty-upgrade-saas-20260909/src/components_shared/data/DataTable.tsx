import type { Key, KeyboardEvent, ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { EmptyState } from '../feedback/EmptyState'
import { ErrorState } from '../feedback/ErrorState'
import { Skeleton } from '../feedback/Skeleton'

export type DataTableColumn<T> = {
  id: string
  header: ReactNode
  cell: (row: T, rowIndex: number) => ReactNode
  align?: 'left' | 'center' | 'right'
  width?: string
  hideOnMobile?: boolean
  className?: string
}

export type DataTableProps<T> = {
  data: T[]
  columns: DataTableColumn<T>[]
  rowKey: keyof T | ((row: T, rowIndex: number) => Key)
  caption?: string
  isLoading?: boolean
  loadingRows?: number
  error?: unknown
  onRetry?: () => void
  isRetrying?: boolean
  emptyTitle?: string
  emptyDescription?: string
  emptyIcon?: LucideIcon
  emptyAction?: ReactNode
  onRowClick?: (row: T) => void
  getRowClassName?: (row: T) => string | undefined
}

export function DataTable<T>({
  data,
  columns,
  rowKey,
  caption = 'Tabela de dados',
  isLoading = false,
  loadingRows = 5,
  error,
  onRetry,
  isRetrying,
  emptyTitle = 'Nenhum registro encontrado',
  emptyDescription = 'Os registros aparecerão aqui quando estiverem disponíveis.',
  emptyIcon,
  emptyAction,
  onRowClick,
  getRowClassName,
}: DataTableProps<T>) {
  function getKey(row: T, rowIndex: number) {
    return typeof rowKey === 'function'
      ? rowKey(row, rowIndex)
      : (row[rowKey] as Key)
  }

  function handleRowKeyDown(event: KeyboardEvent, row: T) {
    if (!onRowClick || (event.key !== 'Enter' && event.key !== ' ')) return
    event.preventDefault()
    onRowClick(row)
  }

  if (error) {
    return (
      <div className="data-table-state card">
        <ErrorState
          error={error}
          onRetry={onRetry}
          isRetrying={isRetrying}
          compact
        />
      </div>
    )
  }

  if (!isLoading && data.length === 0) {
    return (
      <div className="data-table-state card">
        <EmptyState
          title={emptyTitle}
          description={emptyDescription}
          icon={emptyIcon}
          action={emptyAction}
          compact
        />
      </div>
    )
  }

  return (
    <div className="table-container" aria-busy={isLoading}>
      <table className="data-table">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.id}
                className={column.className}
                data-align={column.align ?? 'left'}
                data-mobile-hidden={column.hideOnMobile || undefined}
                style={{ width: column.width }}
                scope="col"
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {isLoading
            ? Array.from({ length: Math.max(1, loadingRows) }, (_, rowIndex) => (
                <tr key={`loading-${rowIndex}`}>
                  {columns.map((column) => (
                    <td
                      key={column.id}
                      data-align={column.align ?? 'left'}
                      data-mobile-hidden={column.hideOnMobile || undefined}
                    >
                      <Skeleton height="0.85rem" width="80%" />
                    </td>
                  ))}
                </tr>
              ))
            : data.map((row, rowIndex) => (
                <tr
                  key={getKey(row, rowIndex)}
                  className={`${onRowClick ? 'is-clickable' : ''} ${getRowClassName?.(row) ?? ''}`.trim()}
                  tabIndex={onRowClick ? 0 : undefined}
                  onClick={() => onRowClick?.(row)}
                  onKeyDown={(event) => handleRowKeyDown(event, row)}
                >
                  {columns.map((column) => (
                    <td
                      key={column.id}
                      className={column.className}
                      data-align={column.align ?? 'left'}
                      data-mobile-hidden={column.hideOnMobile || undefined}
                    >
                      {column.cell(row, rowIndex)}
                    </td>
                  ))}
                </tr>
              ))}
        </tbody>
      </table>
    </div>
  )
}
