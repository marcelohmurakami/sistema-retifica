export const commissionKeys = {
  all: (companyId: number) => ["commissions", companyId] as const,
  catalogs: (companyId: number) => [...commissionKeys.all(companyId), "catalogs"] as const,
  rules: (companyId: number) => [...commissionKeys.all(companyId), "rules"] as const,
  launches: (companyId: number) => [...commissionKeys.all(companyId), "launches"] as const,
  payments: (companyId: number) => [...commissionKeys.all(companyId), "payments"] as const,
  report: (companyId: number, start: string, end: string) => [...commissionKeys.all(companyId), "report", start, end] as const,
  weekly: (companyId: number, start: string, end: string) => [...commissionKeys.all(companyId), "weekly", start, end] as const,
};
