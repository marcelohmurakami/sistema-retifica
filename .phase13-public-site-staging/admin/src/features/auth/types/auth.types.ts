import type { Session, User } from '@supabase/supabase-js'
import type { Tables } from '../../../types/database.types'

type Empresa = Tables<'empresas'>
type UsuarioEmpresa = Tables<'usuarios_empresas'>

export type EmpresaDoUsuario = Pick<
  Empresa,
  'id' | 'fantasia' | 'status' | 'fuso_horario'
>

export type VinculoUsuarioEmpresa = Pick<
  UsuarioEmpresa,
  'id' | 'empresa_id' | 'tipo' | 'status' | 'user_id'
> & {
  empresa: EmpresaDoUsuario
}

export type AuthContextValue = {
  session: Session | null
  user: User | null
  vinculos: VinculoUsuarioEmpresa[]
  vinculoAtual: VinculoUsuarioEmpresa | null
  empresaAtual: EmpresaDoUsuario | null
  isSessionLoading: boolean
  isLoading: boolean
  accessError: Error | null
  refetchAccess: () => Promise<unknown>
}

export type LoginCredentials = {
  email: string
  password: string
}

export type UpdatePasswordInput = {
  password: string
}
