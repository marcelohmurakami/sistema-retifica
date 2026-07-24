type UserId = string | null | undefined;

const userScope = (userId: UserId) => userId ?? "anonymous";

export const queryKeys = {
  clientes: {
    root: ["clientes"] as const,
    detail: (userId: UserId, clienteId: number) =>
      ["cliente", userScope(userId), "detail", clienteId] as const,
    ordensServico: (userId: UserId, clienteId: number) =>
      ["OrdemDeServiço", userScope(userId), "cliente", clienteId] as const,
  },
  ordensServico: {
    root: ["OrdemDeServiço"] as const,
    page: (
      userId: UserId,
      sortBy: string,
      page: number,
      searchInput: string,
    ) =>
      [
        "OrdemDeServiço",
        userScope(userId),
        "page",
        sortBy,
        page,
        searchInput,
      ] as const,
    detail: (userId: UserId, ordemId: number) =>
      ["ordem-servico", userScope(userId), ordemId] as const,
  },
  orcamentos: {
    root: ["Orcamentos"] as const,
    page: (
      userId: UserId,
      sortBy: string,
      page: number,
      searchInput: string,
    ) =>
      [
        "Orcamentos",
        userScope(userId),
        "page",
        sortBy,
        page,
        searchInput,
      ] as const,
    detail: (userId: UserId, orcamentoId: number) =>
      ["Orcamento", userScope(userId), orcamentoId] as const,
  },
} as const;
