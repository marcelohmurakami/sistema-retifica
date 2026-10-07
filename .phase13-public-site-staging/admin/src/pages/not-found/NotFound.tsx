import { ArrowLeft, Home, SearchX } from 'lucide-react'
import { Link, useNavigate } from 'react-router'

export function NotFound() {
  const navigate = useNavigate()

  return (
    <main className="not-found">
      <div className="not-found__card">
        <span className="not-found__icon"><SearchX size={34} /></span>
        <span className="page-eyebrow">Erro 404</span>
        <h1>Página não encontrada</h1>
        <p>O endereço informado não existe ou foi movido para outro lugar.</p>
        <div className="cluster">
          <button className="btn btn--secondary" type="button" onClick={() => navigate(-1)}>
            <ArrowLeft size={17} /> Voltar
          </button>
          <Link className="btn btn--primary" to="/">
            <Home size={17} /> Ir para o início
          </Link>
        </div>
      </div>
    </main>
  )
}
