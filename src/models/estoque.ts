export type EstoqueItem = {
  id: number;
  nome: string;
  custo: number;
  valor: number;
  qtdEstoque: number;
};

export type EstoqueFormData = {
  nome: string;
  custo: number | string;
  valor: number | string;
  qtdEstoque: number | string;
};

export type EstoqueUpdate = EstoqueFormData & { id: number };
