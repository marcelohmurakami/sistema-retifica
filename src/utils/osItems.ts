type PricedItem = {
  valor: number;
  quantidade: number;
};

type SelectableItem = {
  id?: number;
};

export function calculateOsItemsTotal(items: readonly PricedItem[]) {
  return items.reduce((total, item) => {
    const value = Number(item.valor);
    const quantity = Number(item.quantidade);

    if (!Number.isFinite(value) || !Number.isFinite(quantity)) return total;
    return total + value * quantity;
  }, 0);
}

export function resolveSelectedItemId(
  items: readonly SelectableItem[],
  currentId: number,
) {
  const currentExists = items.some((item) => item.id === currentId);
  if (currentExists) return currentId;

  return items.find((item) => item.id != null)?.id ?? 0;
}
