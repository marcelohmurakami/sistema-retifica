export type DashboardPeriod = 7 | 30 | 90

export type DashboardMeta = {
  data_referencia: string
  inicio_periodo: string
  dias_periodo: number
  fuso_horario: string
  escopo_pessoal: boolean
  pode_ver_financeiro: boolean
  relatorios_avancados: boolean
  pode_ver_estoque: boolean
  pode_ver_contas: boolean
}

export type DashboardIndicators = {
  agendamentos_hoje: number
  confirmados_hoje: number
  concluidos_hoje: number
  faturamento_hoje: number
  faturamento_ontem: number
  variacao_faturamento: number
  clientes_ativos: number
  clientes_novos: number
  clientes_novos_anterior: number
  variacao_clientes: number
  capacidade_minutos: number
  ocupados_minutos: number
  taxa_ocupacao: number
}

export type DashboardAgendaService = {
  id: number
  nome: string
  profissional: string
  cor: string | null
  inicio: string
  fim: string
}

export type DashboardAgendaItem = {
  id: number
  inicio: string
  fim: string
  status: string
  cliente_id: number
  cliente_nome: string
  servicos: DashboardAgendaService[]
}

export type DashboardRevenuePoint = {
  data: string
  valor: number
}

export type DashboardTopService = {
  id: number | null
  nome: string
  quantidade: number
  faturamento: number
}

export type DashboardEmployeePerformance = {
  id: number
  nome: string
  cargo: string | null
  cor: string | null
  atendimentos: number
  servicos: number
  faturamento: number
  ticket_medio: number
}

export type DashboardLowStock = {
  id: number
  nome: string
  codigo: string | null
  estoque_atual: number
  estoque_minimo: number
  unidade_medida: string
  criticidade: 1 | 2
}

export type DashboardDueAccount = {
  id: number
  conta_id: number
  tipo: 'pagar' | 'receber'
  descricao: string
  numero_parcela: number
  data_vencimento: string
  saldo: number
  status: string
  contraparte: string | null
}

export type DashboardData = {
  meta: DashboardMeta
  indicadores: DashboardIndicators
  agenda: DashboardAgendaItem[]
  faturamento_serie: DashboardRevenuePoint[]
  servicos_mais_vendidos: DashboardTopService[]
  desempenho_funcionarios: DashboardEmployeePerformance[]
  estoque_baixo: DashboardLowStock[]
  contas_vencimento: DashboardDueAccount[]
}

export type DashboardQuery = {
  companyId: number
  referenceDate: string
  periodDays: DashboardPeriod
}
