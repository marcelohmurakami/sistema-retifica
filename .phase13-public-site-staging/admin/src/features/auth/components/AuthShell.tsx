import {
  CalendarCheck2,
  Check,
  Command,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import type { PropsWithChildren } from 'react'

export function AuthShell({ children }: PropsWithChildren) {
  return (
    <main className="login-page">
      <section className="login-visual" aria-label="Benefícios da plataforma">
        <div className="login-visual__glow" />
        <div className="login-brand">
          <span className="brand__mark">
            <Command size={22} strokeWidth={2.4} />
          </span>
          <strong>AgendaPro</strong>
        </div>

        <div className="login-visual__content">
          <span className="login-kicker">
            <Sparkles size={15} /> Gestão simples. Resultados melhores.
          </span>
          <h1>Toda a sua operação em um único lugar.</h1>
          <p>
            Agenda, clientes, equipe e financeiro conectados para você
            trabalhar com mais tranquilidade.
          </p>

          <ul className="login-benefits">
            <li>
              <span><CalendarCheck2 size={18} /></span>
              <div>
                <strong>Agenda inteligente</strong>
                <small>Evite conflitos e reduza horários ociosos.</small>
              </div>
            </li>
            <li>
              <span><ShieldCheck size={18} /></span>
              <div>
                <strong>Informações protegidas</strong>
                <small>Dados isolados e seguros para cada empresa.</small>
              </div>
            </li>
            <li>
              <span><Check size={18} /></span>
              <div>
                <strong>Controle completo</strong>
                <small>Acompanhe tudo em tempo real.</small>
              </div>
            </li>
          </ul>
        </div>

        <small className="login-visual__footer">
          © 2026 AgendaPro. Gestão inteligente para o seu negócio.
        </small>
      </section>

      <section className="login-panel">
        <div className="login-mobile-brand">
          <span className="brand__mark"><Command size={20} /></span>
          <strong>AgendaPro</strong>
        </div>

        <div className="login-form-wrap">{children}</div>
      </section>
    </main>
  )
}
