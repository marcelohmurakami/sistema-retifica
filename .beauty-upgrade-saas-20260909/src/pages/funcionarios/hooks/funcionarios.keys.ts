import type { FuncionariosListParams } from '../types/funcionarios.types'
export const employeeKeys = {
  all: (companyId: number) => ['funcionarios', companyId] as const,
  list: (params: FuncionariosListParams) => [...employeeKeys.all(params.companyId), 'lista', params] as const,
  metrics: (companyId: number) => [...employeeKeys.all(companyId), 'resumo'] as const,
  schedule: (companyId: number, employeeId: number) => [...employeeKeys.all(companyId), employeeId, 'jornada'] as const,
  services: (companyId: number, employeeId: number) => [...employeeKeys.all(companyId), employeeId, 'servicos'] as const,
  absences: (companyId: number, employeeId: number) => [...employeeKeys.all(companyId), employeeId, 'ausencias'] as const,
  blocks: (companyId: number) => [...employeeKeys.all(companyId), 'bloqueios'] as const,
}
