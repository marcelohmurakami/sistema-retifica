import type { ServicosListParams } from '../types/servicos.types'

export const serviceKeys = {
  all: (companyId: number) => ['services', companyId] as const,
  lists: (companyId: number) => [...serviceKeys.all(companyId), 'list'] as const,
  list: (params: ServicosListParams) =>
    [...serviceKeys.lists(params.companyId), params] as const,
  metrics: (companyId: number) =>
    [...serviceKeys.all(companyId), 'metrics'] as const,
}
