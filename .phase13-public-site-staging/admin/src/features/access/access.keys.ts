export const accessKeys = {
  all: ['access'] as const,
  company: (companyId: number) =>
    [...accessKeys.all, 'empresa', companyId] as const,
}
