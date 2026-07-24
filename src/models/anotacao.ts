export type PrioridadeAnotacao = "baixo" | "medio" | "alto";

export type AnotacaoDiariaInput = {
  titulo: string;
  data: string;
  prioridade: PrioridadeAnotacao;
};

export type AnotacaoDiaria = AnotacaoDiariaInput & {
  id: number;
  concluida: boolean;
  created_at?: string;
};

export type AnotacaoGeralInput = {
  titulo: string;
  descricao?: string;
  cliente?: string;
};

export type AnotacaoGeral = AnotacaoGeralInput & {
  id: number;
  valorTotal?: number | null;
  created_at?: string;
};
