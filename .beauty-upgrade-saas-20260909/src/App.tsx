import { lazy, Suspense } from 'react'
import { createPortal } from 'react-dom'
import { Navigate, Route, Routes } from 'react-router'
import { Toaster } from 'sonner'
import { AppLayout } from './components_shared/layout/AppLayout'
import {
  AccessBoundary,
  FeatureRoute,
} from './features/access/components/AccessRoutes'
import {
  ProtectedRoute,
  PublicOnlyRoute,
  SessionRoute,
} from './features/auth/components/AuthRoutes'
import './styles/app.css'

const Agendamentos = lazy(() =>
  import('./pages/agendamentos/features/Agendamentos').then((module) => ({
    default: module.Agendamentos,
  })),
)
const Clientes = lazy(() =>
  import('./pages/clientes/Clientes').then((module) => ({
    default: module.Clientes,
  })),
)
const Comandas = lazy(() =>
  import('./pages/comandas/Comandas').then((module) => ({
    default: module.Comandas,
  })),
)
const Comissoes = lazy(() =>
  import('./pages/comissoes/Comissoes').then((module) => ({
    default: module.Comissoes,
  })),
)
const Configuracoes = lazy(() =>
  import('./pages/configuracoes/Configuracoes').then((module) => ({
    default: module.Configuracoes,
  })),
)
const Dashboard = lazy(() =>
  import('./pages/dashboard/Dashboard').then((module) => ({
    default: module.Dashboard,
  })),
)
const Estoque = lazy(() =>
  import('./pages/estoque/Estoque').then((module) => ({
    default: module.Estoque,
  })),
)
const Financeiro = lazy(() =>
  import('./pages/financeiro/Financeiro').then((module) => ({
    default: module.Financeiro,
  })),
)
const ForgotPassword = lazy(() =>
  import('./pages/forgot-password/ForgotPassword').then((module) => ({
    default: module.ForgotPassword,
  })),
)
const Fornecedores = lazy(() =>
  import('./pages/fornecedores/Fornecedores').then((module) => ({
    default: module.Fornecedores,
  })),
)
const Funcionarios = lazy(() =>
  import('./pages/funcionarios/Funcionarios').then((module) => ({
    default: module.Funcionarios,
  })),
)
const Historico = lazy(() =>
  import('./pages/historico/Historico').then((module) => ({
    default: module.Historico,
  })),
)
const Login = lazy(() =>
  import('./pages/login/Login').then((module) => ({
    default: module.Login,
  })),
)
const NoAccess = lazy(() =>
  import('./pages/no-access/NoAccess').then((module) => ({
    default: module.NoAccess,
  })),
)
const NotFound = lazy(() =>
  import('./pages/not-found/NotFound').then((module) => ({
    default: module.NotFound,
  })),
)
const Orcamentos = lazy(() =>
  import('./pages/orcamentos/Orcamentos').then((module) => ({
    default: module.Orcamentos,
  })),
)
const Produtos = lazy(() =>
  import('./pages/produtos/Produtos').then((module) => ({
    default: module.Produtos,
  })),
)
const Servicos = lazy(() =>
  import('./pages/servicos/Servicos').then((module) => ({
    default: module.Servicos,
  })),
)
const UpdatePassword = lazy(() =>
  import('./pages/update-password/UpdatePassword').then((module) => ({
    default: module.UpdatePassword,
  })),
)

function App() {
  return (
    <>
      <Suspense
        fallback={
          <div className="app-loading">
            <span className="app-loading__spinner" />
            <p>Carregando...</p>
          </div>
        }
      >
        <Routes>
          <Route element={<PublicOnlyRoute />}>
            <Route path="/login" element={<Login />} />
            <Route path="/recuperar-senha" element={<ForgotPassword />} />
          </Route>

          <Route element={<SessionRoute />}>
            <Route path="/alterar-senha" element={<UpdatePassword />} />
            <Route path="/sem-acesso" element={<NoAccess />} />
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route element={<AccessBoundary />}>
              <Route element={<AppLayout />}>
                <Route element={<FeatureRoute moduleKey="dashboard" />}>
                  <Route index element={<Dashboard />} />
                </Route>
                <Route element={<FeatureRoute moduleKey="agendamentos" />}>
                  <Route path="agendamentos" element={<Agendamentos />} />
                </Route>
                <Route element={<FeatureRoute moduleKey="clientes" />}>
                  <Route path="clientes" element={<Clientes />} />
                </Route>
                <Route element={<FeatureRoute moduleKey="comandas" />}>
                  <Route path="comandas" element={<Comandas />} />
                </Route>
                <Route element={<FeatureRoute moduleKey="orcamentos" />}>
                  <Route path="orcamentos" element={<Orcamentos />} />
                </Route>
                <Route element={<FeatureRoute moduleKey="financeiro" />}>
                  <Route path="financeiro" element={<Financeiro />} />
                </Route>
                <Route element={<FeatureRoute moduleKey="comissoes" />}>
                  <Route path="comissoes" element={<Comissoes />} />
                </Route>
                <Route element={<FeatureRoute moduleKey="estoque" />}>
                  <Route path="estoque" element={<Estoque />} />
                </Route>
                <Route element={<FeatureRoute moduleKey="produtos" />}>
                  <Route path="produtos" element={<Produtos />} />
                </Route>
                <Route element={<FeatureRoute moduleKey="servicos" />}>
                  <Route path="servicos" element={<Servicos />} />
                </Route>
                <Route element={<FeatureRoute moduleKey="fornecedores" />}>
                  <Route path="fornecedores" element={<Fornecedores />} />
                </Route>
                <Route element={<FeatureRoute moduleKey="funcionarios" />}>
                  <Route path="funcionarios" element={<Funcionarios />} />
                </Route>
                <Route element={<FeatureRoute moduleKey="historico" />}>
                  <Route path="historico" element={<Historico />} />
                </Route>
                <Route element={<FeatureRoute moduleKey="configuracoes" />}>
                  <Route path="configuracoes" element={<Configuracoes />} />
                </Route>
                <Route path="inicio" element={<Navigate to="/" replace />} />
              </Route>
            </Route>
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>

      {createPortal(
        <Toaster position="top-right" richColors closeButton />,
        document.body,
      )}
    </>
  )
}

export default App
