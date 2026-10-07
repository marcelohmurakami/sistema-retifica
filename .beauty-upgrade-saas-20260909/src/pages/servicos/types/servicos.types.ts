import type {
  Tables,
  TablesInsert,
  TablesUpdate,
} from '../../../types/database.types'

export type Servico = Tables<'servicos'>
export type ServicoInsert = TablesInsert<'servicos'>
export type ServicoUpdate = TablesUpdate<'servicos'>
export type ServicoInsumo = Tables<'servicos_insumos'> & {
  produto: Pick<
    Tables<'produtos'>,
    'id' | 'nome' | 'codigo' | 'unidade_medida' | 'estoque_atual' | 'custo_medio' | 'ativo' | 'controla_estoque'
  > | null
}

export type ProdutoInsumo = Pick<
  Tables<'produtos'>,
  'id' | 'nome' | 'codigo' | 'unidade_medida' | 'estoque_atual' | 'custo_medio' | 'ativo' | 'controla_estoque'
>

export type ServicoInsumoInput = {
  id_produto: number
  quantidade: number
  descontar_comissao: boolean
}

export type ServicoStatusFilter = 'todos' | 'ativos' | 'inativos'
export type ServicoSignalType = '' | 'percentual' | 'valor_fixo'

export type ServicosListParams = {
  companyId: number
  search: string
  status: ServicoStatusFilter
  page: number
  pageSize: number
}

export type ServicosListResult = {
  items: Servico[]
  total: number
  totalPages: number
  page: number
  pageSize: number
}

export type ServicosMetrics = {
  total: number
  active: number
  inactive: number
}

export type ServicoFormValues = {
  nome: string
  descricao: string
  preco: string
  duracaoMinutos: string
  intervaloMinutos: string
  permiteAgendamentoOnline: boolean
  exigeSinal: boolean
  sinalTipo: ServicoSignalType
  sinalValor: string
  ativo: boolean
}

export type ServicoFormErrors = Partial<
  Record<keyof ServicoFormValues, string>
>

export type ServicoWritePayload = Omit<ServicoInsert, 'id_empresa'>

export type UpdateServicoVariables = {
  serviceId: number
  input: ServicoUpdate
}

export type ToggleServicoStatusVariables = {
  serviceId: number
  active: boolean
}
