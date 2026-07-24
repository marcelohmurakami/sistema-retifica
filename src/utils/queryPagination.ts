export function parseSort(
  sortValue: string,
  allowedFields: ReadonlySet<string>,
  fallbackField = "id",
) {
  const [requestedField, requestedDirection] = sortValue.split("-");

  return {
    field: allowedFields.has(requestedField) ? requestedField : fallbackField,
    ascending: requestedDirection === "asc",
  };
}

export function getPaginationRange(page: number, pageSize: number) {
  const safePage = Number.isFinite(page) ? Math.max(Math.trunc(page), 1) : 1;
  const from = (safePage - 1) * pageSize;

  return {
    from,
    to: from + pageSize - 1,
  };
}
