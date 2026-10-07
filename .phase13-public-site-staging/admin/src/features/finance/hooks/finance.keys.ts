export const financeKeys = {
  all: (companyId: number) => ["finance", companyId] as const,
  catalogs: (companyId: number) => [...financeKeys.all(companyId), "catalogs"] as const,
  accounts: (companyId: number) => [...financeKeys.all(companyId), "accounts"] as const,
  payments: (companyId: number) => [...financeKeys.all(companyId), "payments"] as const,
  sessions: (companyId: number) => [...financeKeys.all(companyId), "sessions"] as const,
  report: (companyId: number, start: string, end: string) => [...financeKeys.all(companyId), "report", start, end] as const,
};
