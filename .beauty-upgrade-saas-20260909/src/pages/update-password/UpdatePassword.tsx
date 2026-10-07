import { ArrowRight, Eye, EyeOff, LockKeyhole } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { AuthShell } from '../../features/auth/components/AuthShell'
import { useAuth } from '../../features/auth/hooks/useAuth'
import {
  useLogout,
  useUpdatePassword,
} from '../../features/auth/hooks/useAuthMutations'

export function UpdatePassword() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const updatePassword = useUpdatePassword()
  const logout = useLogout()
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)
  const isPending = updatePassword.isPending || logout.isPending

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setValidationError(null)

    if (password.length < 8) {
      setValidationError('A senha deve ter pelo menos 8 caracteres.')
      return
    }

    if (password !== confirmation) {
      setValidationError('As senhas informadas não são iguais.')
      return
    }

    try {
      await updatePassword.mutateAsync({ password })
      await logout.mutateAsync()
      toast.success('Senha alterada. Entre novamente com a nova senha.')
      navigate('/login', { replace: true })
    } catch {
      // A mensagem tratada pela mutation é exibida abaixo do formulário.
    }
  }

  const requestError = updatePassword.error ?? logout.error

  return (
    <AuthShell>
      <div className="login-heading">
        <span className="page-eyebrow">Segurança da conta</span>
        <h2>Defina uma nova senha</h2>
        <p>
          Crie uma senha segura para <strong>{user?.email}</strong>. Depois da
          alteração, você entrará novamente.
        </p>
      </div>

      <form className="login-form" onSubmit={handleSubmit}>
        <label className="field">
          <span className="field__label">Nova senha</span>
          <span className="input-with-icon">
            <LockKeyhole size={18} aria-hidden />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Mínimo de 8 caracteres"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={isPending}
              minLength={8}
              required
              autoFocus
            />
            <button
              type="button"
              aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              onClick={() => setShowPassword((current) => !current)}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </span>
        </label>

        <label className="field">
          <span className="field__label">Confirmar nova senha</span>
          <span className="input-with-icon">
            <LockKeyhole size={18} aria-hidden />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Repita a nova senha"
              autoComplete="new-password"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              disabled={isPending}
              minLength={8}
              required
            />
          </span>
        </label>

        {(validationError || requestError) && (
          <p className="login-form__error" role="alert">
            {validationError ?? requestError?.message}
          </p>
        )}

        <button
          className="btn btn--primary login-submit"
          type="submit"
          disabled={isPending}
        >
          {isPending ? (
            <><span className="btn-spinner" /> Alterando senha...</>
          ) : (
            <>Salvar nova senha <ArrowRight size={18} /></>
          )}
        </button>
      </form>
    </AuthShell>
  )
}
