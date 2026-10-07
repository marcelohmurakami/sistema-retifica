import { supabase } from '../../../supabase/supabaseApi'
import type {
  LoginCredentials,
  UpdatePasswordInput,
  VinculoUsuarioEmpresa,
} from '../types/auth.types'
import { AuthApplicationError, translateAuthError } from './auth.errors'

export async function signInWithPassword(credentials: LoginCredentials) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: credentials.email.trim().toLowerCase(),
    password: credentials.password,
  })

  if (error) {
    throw translateAuthError(error)
  }

  return data
}

export async function signOutCurrentSession() {
  const { error } = await supabase.auth.signOut({ scope: 'local' })

  if (error) {
    throw translateAuthError(error)
  }
}

export async function requestPasswordReset(email: string) {
  const redirectTo = new URL('/alterar-senha', window.location.origin).toString()
  const { error } = await supabase.auth.resetPasswordForEmail(
    email.trim().toLowerCase(),
    { redirectTo },
  )

  if (error) {
    throw translateAuthError(error)
  }
}

export async function updatePassword({ password }: UpdatePasswordInput) {
  const { data, error } = await supabase.auth.updateUser({ password })

  if (error) {
    throw translateAuthError(error)
  }

  return data.user
}

export async function getActiveCompanyMemberships(userId: string) {
  const { error: inviteError } = await supabase.rpc('aceitar_convites_pendentes')

  if (inviteError) {
    throw new AuthApplicationError(
      'Não foi possível verificar convites pendentes.',
      inviteError.code,
      inviteError,
    )
  }

  const { data, error } = await supabase
    .from('usuarios_empresas')
    .select(`
      id,
      empresa_id,
      tipo,
      status,
      user_id,
      empresa:empresas!usuarios_empresas_empresa_id_fkey (
        id,
        fantasia,
        status,
        fuso_horario
      )
    `)
    .eq('user_id', userId)
    .eq('status', 'ativo')
    .eq('empresa.status', 'ativo')
    .order('id', { ascending: true })

  if (error) {
    throw new AuthApplicationError(
      'Não foi possível carregar o acesso à empresa.',
      error.code,
      error,
    )
  }

  return (data ?? []).filter(
    (vinculo): vinculo is VinculoUsuarioEmpresa => vinculo.empresa !== null,
  )
}
