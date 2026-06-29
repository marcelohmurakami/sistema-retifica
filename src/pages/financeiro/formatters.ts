export function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function formatDate(date?: string | null) {
  if (!date) return "-";

  const parsed = new Date(date);

  if (isNaN(parsed.getTime())) return "-";

  return new Intl.DateTimeFormat("pt-BR").format(parsed);
}