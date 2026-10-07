import type { AuditFilters } from './types/admin.types'

export const COMPANY_APPEARANCE_UPDATED_EVENT = 'company-appearance-updated'

export const adminKeys = {
  all: (companyId: number) => ['admin', companyId] as const,
  overview: (companyId: number, planId: number | null) =>
    [...adminKeys.all(companyId), 'overview', planId] as const,
  appearance: (companyId: number) =>
    [...adminKeys.all(companyId), 'appearance'] as const,
  auditRoot: (companyId: number) =>
    [...adminKeys.all(companyId), 'audit'] as const,
  audit: (filters: AuditFilters) =>
    [...adminKeys.auditRoot(filters.companyId), filters] as const,
}
