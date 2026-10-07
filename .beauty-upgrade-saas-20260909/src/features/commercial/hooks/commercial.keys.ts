export const commercialKeys = {
  all: (companyId: number) => ["commercial", companyId] as const,
  catalogs: (companyId: number) => [...commercialKeys.all(companyId), "catalogs"] as const,
  quotes: (companyId: number) => [...commercialKeys.all(companyId), "quotes"] as const,
  commands: (companyId: number) => [...commercialKeys.all(companyId), "commands"] as const,
};
