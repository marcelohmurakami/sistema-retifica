const portugueseNameCollator = new Intl.Collator("pt-BR", {
  sensitivity: "base",
  numeric: true,
});

export function sortByName<T>(
  items: readonly T[],
  getName: (item: T) => string | null | undefined,
) {
  return [...items].sort((first, second) =>
    portugueseNameCollator.compare(
      getName(first)?.trim() ?? "",
      getName(second)?.trim() ?? "",
    ),
  );
}
