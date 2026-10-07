import type { Tables, TablesInsert, TablesUpdate } from '../../../types/database.types'

export type Cliente = Tables<'clientes'>
export type ClienteInsert = TablesInsert<'clientes'>
export type ClienteUpdate = TablesUpdate<'clientes'>
export type Consentimento = Tables<'consentimentos_comunicacao'>

export type ClienteStatusFilter = 'todos' | 'ativos' | 'inativos'

export type ClientesListParams = {
  companyId: number
  search: string
  status: ClienteStatusFilter
  page: number
  pageSize: number
}

export type ClientesListResult = {
  items: Cliente[]
  total: number
  totalPages: number
  page: number
  pageSize: number
}

export type ClientesMetrics = {
  total: number
  active: number
  inactive: number
  birthdaysThisMonth: number
}

export type ConsentKey =
  | 'whatsapp_lembrete'
  | 'whatsapp_marketing'
  | 'email_lembrete'
  | 'email_marketing'
  | 'sms_lembrete'

export type ConsentValues = Record<ConsentKey, boolean>

export type ClienteFormValues = {
  nome: string
  cpf: string
  telefonePrincipal: string
  telefoneSecundario: string
  email: string
  dataNascimento: string
  genero: string
  endereco: string
  canalPreferido: string
  observacoes: string
  ativo: boolean
  bloquearComunicacao: boolean
  consentimentos: ConsentValues
}

export type ClienteFormErrors = Partial<Record<keyof ClienteFormValues, string>>

export type ClienteWriteInput = {
  cliente: Omit<ClienteInsert, 'id_empresa'>
  consentimentos: ConsentValues
}

export type UpdateClienteVariables = {
  clientId: number
  input: ClienteWriteInput
}

export type ToggleClienteStatusVariables = {
  clientId: number
  active: boolean
}
