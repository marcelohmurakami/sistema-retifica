import type { DashboardPeriod } from '../types/dashboard.types'

export const dashboardKeys = {
  all: ['dashboard'] as const,
  company: (companyId: number) => [...dashboardKeys.all, companyId] as const,
  report: (companyId: number, referenceDate: string, period: DashboardPeriod) =>
    [...dashboardKeys.company(companyId), referenceDate, period] as const,
}
