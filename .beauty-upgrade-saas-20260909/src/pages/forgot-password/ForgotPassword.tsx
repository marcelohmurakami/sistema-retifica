import { ArrowLeft, ArrowRight, Mail, MailCheck } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { AuthShell } from '../../features/auth/components/AuthShell'
import { useRequestPasswordReset } from '../../features/auth/hooks/useAuthMutations'

export function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [wasSent, setWasSent] = useState(false)
  const resetPassword = useRequestPasswordReset()

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    try {
      await resetPassword.mutateAsync(email)
      setWasSent(true)
    } catch {
      // A mensagem tratada pela mutation é exibida abaixo do formulário.
    }
  }

  return (
    <AuthShell>
      {wasSent ? (
        <div className="auth-confirmation" role="status">
          <span className="auth-confirmation__icon">
            <MailCheck size={32} />
          </span>
          <div className="login-heading">
            <span className="page-eyebrow">Confira seu e-mail</span>
            <h2>Enviamos as instruções</h2>
            <p>
              Se existir uma conta para <strong>{email}</strong>, você receberá
              um link para definir uma nova senha.
            </p>
          </div>
          <Link className="btn btn--primary w-full" to="/login">
            Voltar para o login <ArrowRight size={18} />
          </Link>
        </div>
      ) : (
        <>
          <div className="login-heading">
            <Link className="auth-back-link" to="/login">
              <ArrowLeft size={16} /> Voltar para o login
            </Link>
            <span className="page-eyebrow">Recuperar acesso</span>
            <h2>Esqueceu sua senha?</h2>
            <p>Informe seu e-mail e enviaremos um link seguro de recuperação.</p>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            <label className="field">
              <span className="field__label">E-mail</span>
              <span className="input-with-icon">
                <Mail size={18} aria-hidden />
                <input
                  type="email"
                  placeholder="voce@empresa.com"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={resetPassword.isPending}
                  required
                  autoFocus
                />
              </span>
            </label>

            {resetPassword.isError && (
              <p className="login-form__error" role="alert">
                {resetPassword.error.message}
              </p>
            )}

            <button
              className="btn btn--primary login-submit"
              type="submit"
              disabled={resetPassword.isPending}
            >
              {resetPassword.isPending ? (
                <><span className="btn-spinner" /> Enviando...</>
              ) : (
                <>Enviar link de recuperação <ArrowRight size={18} /></>
              )}
            </button>
          </form>
        </>
      )}
    </AuthShell>
  )
}
