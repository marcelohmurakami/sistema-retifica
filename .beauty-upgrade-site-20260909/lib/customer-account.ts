export type CustomerPayment = {
  id: number;
  valor: number;
  status: string;
  tipo: string;
  data_pagamento: string;
  provedor: string | null;
  referencia: string | null;
};

export type CustomerBooking = {
  id: number;
  codigo: string;
  status: string;
  inicio: string;
  fim: string;
  valor_total: number;
  sinal_status: string;
  sinal_valor: number | null;
  pagamento_status: string;
  confirmado_em: string | null;
  cancelado_em: string | null;
  motivo_cancelamento: string | null;
  pode_confirmar: boolean;
  pode_cancelar: boolean;
  pode_reagendar: boolean;
  politica: {
    antecedencia_cancelamento_minutos: number;
    antecedencia_reagendamento_minutos: number;
    texto_publico: string | null;
  };
  servico: { id: number; nome: string; duracao_minutos: number; preco: number };
  profissional: { id: number; nome: string; cargo: string };
  unidade: { id: number; nome: string; bairro: string | null; cidade: string | null };
  pagamentos: CustomerPayment[];
};

export type CustomerAccount = {
  empresa: { id: number; nome: string };
  cliente: {
    id: number;
    nome: string;
    email: string | null;
    telefone: string | null;
    data_nascimento: string | null;
    canal_preferido: string | null;
  };
  preferencias: {
    whatsapp: boolean;
    email: boolean;
    sms: boolean;
    push: boolean;
    antecedencias_minutos: number[];
  };
  solicitacao_exclusao: {
    id: number;
    status: string;
    solicitado_em: string;
  } | null;
  agendamentos: CustomerBooking[];
};
