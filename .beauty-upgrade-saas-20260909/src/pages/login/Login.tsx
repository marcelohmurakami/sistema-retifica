import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { AuthShell } from '../../features/auth/components/AuthShell'
import { useLogin } from '../../features/auth/hooks/useAuthMutations'

type LoginLocationState = {
  from?: string
}

export function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const login = useLogin()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    try {
      await login.mutateAsync({ email, password })
      const state = location.state as LoginLocationState | null
      toast.success('Bem-vindo de volta!')
      navigate(state?.from ?? '/', { replace: true })
    } catch {
      // A mensagem tratada pela mutation é exibida abaixo do formulário.
    }
  }

  return (
    <AuthShell>
      <div className="login-heading">
        <span className="page-eyebrow">Bem-vindo de volta</span>
        <h2>Acesse sua conta</h2>
        <p>Informe seus dados para entrar na plataforma.</p>
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
              disabled={login.isPending}
              aria-invalid={login.isError}
              required
              autoFocus
            />
          </span>
        </label>

        <label className="field">
          <span className="field__label">Senha</span>
          <span className="input-with-icon">
            <LockKeyhole size={18} aria-hidden />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Digite sua senha"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={login.isPending}
              aria-invalid={login.isError}
              required
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

        <div className="login-form__options login-form__options--end">
          <Link to="/recuperar-senha">Esqueci minha senha</Link>
        </div>

        {login.isError && (
          <p className="login-form__error" role="alert">
            {login.error.message}
          </p>
        )}

        <button
          className="btn btn--primary login-submit"
          type="submit"
          disabled={login.isPending}
        >
          {login.isPending ? (
            <><span className="btn-spinner" /> Entrando...</>
          ) : (
            <>Entrar na plataforma <ArrowRight size={18} /></>
          )}
        </button>
      </form>

      <p className="login-support">
        Precisa de ajuda? <button type="button">Fale com o suporte</button>
      </p>
    </AuthShell>
  )
}
