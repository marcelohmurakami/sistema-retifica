type ErrorWithCode = {
  code?: string
  message?: string
}

export class AuthApplicationError extends Error {
  readonly code?: string

  constructor(message: string, code?: string, cause?: unknown) {
    super(message, { cause })
    this.name = 'AuthApplicationError'
    this.code = code
  }
}

export function translateAuthError(error: unknown): AuthApplicationError {
  const authError = error as ErrorWithCode

  switch (authError.code) {
    case 'invalid_credentials':
      return new AuthApplicationError(
        'E-mail ou senha incorretos.',
        authError.code,
        error,
      )
    case 'email_not_confirmed':
      return new AuthApplicationError(
        'Confirme seu e-mail antes de entrar.',
        authError.code,
        error,
      )
    case 'user_banned':
      return new AuthApplicationError(
        'Este acesso está temporariamente bloqueado. Fale com o suporte.',
        authError.code,
        error,
      )
    case 'over_request_rate_limit':
    case 'over_email_send_rate_limit':
      return new AuthApplicationError(
        'Muitas tentativas em pouco tempo. Aguarde alguns minutos.',
        authError.code,
        error,
      )
    case 'weak_password':
      return new AuthApplicationError(
        'Escolha uma senha mais forte, com pelo menos 8 caracteres.',
        authError.code,
        error,
      )
    case 'same_password':
      return new AuthApplicationError(
        'A nova senha deve ser diferente da senha atual.',
        authError.code,
        error,
      )
    case 'session_not_found':
    case 'refresh_token_not_found':
    case 'refresh_token_already_used':
      return new AuthApplicationError(
        'Sua sessão expirou. Entre novamente para continuar.',
        authError.code,
        error,
      )
    case 'otp_expired':
    case 'flow_state_expired':
    case 'flow_state_not_found':
      return new AuthApplicationError(
        'Este link expirou. Solicite uma nova recuperação de senha.',
        authError.code,
        error,
      )
    default:
      return new AuthApplicationError(
        'Não foi possível concluir a autenticação. Tente novamente.',
        authError.code,
        error,
      )
  }
}
