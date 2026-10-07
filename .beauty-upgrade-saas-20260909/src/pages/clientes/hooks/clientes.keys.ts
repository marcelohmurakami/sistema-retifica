import type { ClientesListParams } from '../types/clientes.types'

export const clientKeys = {
  all: (companyId: number) => ['clientes', companyId] as const,
  list: (params: ClientesListParams) => [...clientKeys.all(params.companyId), 'lista', params] as const,
  metrics: (companyId: number) => [...clientKeys.all(companyId), 'resumo'] as const,
  consents: (companyId: number, clientId: number) => [...clientKeys.all(companyId), 'consentimentos', clientId] as const,
}
