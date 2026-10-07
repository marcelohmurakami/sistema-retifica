import type { Tables, TablesInsert, TablesUpdate } from '../../../types/database.types'

export type Funcionario = Tables<'funcionarios'>
export type FuncionarioInsert = TablesInsert<'funcionarios'>
export type FuncionarioUpdate = TablesUpdate<'funcionarios'>
export type FuncionarioHorario = Tables<'funcionarios_horarios'>
export type FuncionarioAusencia = Tables<'funcionarios_ausencias'>
export type FuncionarioServico = Tables<'funcionarios_servicos'>
export type BloqueioAgenda = Tables<'bloqueios_agenda'>
export type Servico = Tables<'servicos'>

export type FuncionarioStatusFilter = 'todos' | 'ativos' | 'inativos'
export type FuncionariosListParams = { companyId: number; search: string; status: FuncionarioStatusFilter; page: number; pageSize: number }
export type FuncionariosListResult = { items: Funcionario[]; total: number; totalPages: number; page: number; pageSize: number }
export type FuncionariosMetrics = { total: number; active: number; attending: number; inactive: number }

export type FuncionarioFormValues = {
  nome: string; cpf: string; telefone: string; email: string; cargo: string
  dataNascimento: string; dataAdmissao: string; dataDesligamento: string
  endereco: string; observacoes: string; corAgenda: string; atendeClientes: boolean; ativo: boolean
}
export type FuncionarioFormErrors = Partial<Record<keyof FuncionarioFormValues, string>>
export type FuncionarioWriteInput = Omit<FuncionarioInsert, 'id_empresa'>
export type UpdateFuncionarioVariables = { employeeId: number; input: FuncionarioWriteInput }
export type ToggleFuncionarioStatusVariables = { employeeId: number; active: boolean }

export type ScheduleDayValue = {
  day: number; enabled: boolean; start: string; end: string; hasBreak: boolean; breakStart: string; breakEnd: string
}

export type EmployeeServicesData = { services: Servico[]; assignments: FuncionarioServico[] }
export type EmployeeServiceInput = { serviceId: number; active: boolean; customDuration: number | null; customPrice: number | null }

export type AbsenceInput = { tipo: string; inicio: string; fim: string; diaInteiro: boolean; motivo: string | null }
export type BlockInput = { employeeId: number | null; tipo: string; inicio: string; fim: string; diaInteiro: boolean; motivo: string | null }
