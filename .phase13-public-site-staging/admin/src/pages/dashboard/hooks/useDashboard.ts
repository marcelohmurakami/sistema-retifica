import { useQuery } from '@tanstack/react-query'
import { getDashboard } from '../api/dashboard.api'
import type { DashboardQuery } from '../types/dashboard.types'
import { dashboardKeys } from './dashboard.keys'

export function useDashboard(query: DashboardQuery) {
  return useQuery({
    queryKey: dashboardKeys.report(
      query.companyId,
      query.referenceDate,
      query.periodDays,
    ),
    queryFn: () => getDashboard(query),
    enabled: query.companyId > 0,
    staleTime: 60_000,
    refetchInterval: 5 * 60_000,
  })
}
