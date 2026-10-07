export const inventoryKeys = {
  all: (companyId: number) => ["inventory", companyId] as const,
  products: (companyId: number) =>
    [...inventoryKeys.all(companyId), "products"] as const,
  suppliers: (companyId: number) =>
    [...inventoryKeys.all(companyId), "suppliers"] as const,
  purchases: (companyId: number) =>
    [...inventoryKeys.all(companyId), "purchases"] as const,
  movements: (companyId: number) =>
    [...inventoryKeys.all(companyId), "movements"] as const,
};
