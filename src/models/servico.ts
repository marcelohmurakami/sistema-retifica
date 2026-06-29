export type ServicoType = {
    id?: number | undefined,
    servico: string,
    valor: number,
    linha: "leve" | "pesada",
    tipo: "servico" | "peca",
}