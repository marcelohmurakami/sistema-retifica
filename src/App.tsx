import { lazy, Suspense } from 'react';
import { MainGrid } from './components/mainGrid.tsx';
import { Routes, Route } from 'react-router';
import { ProtectedRoute } from './routes/ProtectedRoute.tsx';
import { useAuth } from './contexts/AuthContext.tsx';
import { LoadingContainer } from './components/spinner/LoadingContainer.tsx';

const Home = lazy(() => import('./pages/home/Home.tsx').then(({ Home }) => ({ default: Home })));
const Clientes = lazy(() => import('./pages/clientes/Clientes.tsx').then(({ Clientes }) => ({ default: Clientes })));
const ClienteDetails = lazy(() => import('./pages/clientes/ClienteDetails.tsx').then(({ ClienteDetails }) => ({ default: ClienteDetails })));
const OrdensDeServico = lazy(() => import('./pages/ordensDeServico/OrdensDeServico.tsx').then(({ OrdensDeServico }) => ({ default: OrdensDeServico })));
const OsDetalhes = lazy(() => import('./pages/ordensDeServico/OsDetalhes.tsx').then(({ OsDetalhes }) => ({ default: OsDetalhes })));
const Orcamento = lazy(() => import('./pages/orcamentos/Orcamento.tsx').then(({ Orcamento }) => ({ default: Orcamento })));
const OrcamentoPage = lazy(() => import('./pages/orcamentos/OrcamentoPage.tsx').then(({ OrcamentoPage }) => ({ default: OrcamentoPage })));
const Servicos = lazy(() => import('./pages/serviços/Servicos.tsx').then(({ Servicos }) => ({ default: Servicos })));
const Estoque = lazy(() => import('./pages/estoque/Estoque.tsx').then(({ Estoque }) => ({ default: Estoque })));
const Financeiro = lazy(() => import('./pages/financeiro/Financeiro.tsx').then(({ Financeiro }) => ({ default: Financeiro })));
const ContasAReceber = lazy(() => import('./pages/contasemovimentacoes/ContasAReceber.tsx').then(({ ContasAReceber }) => ({ default: ContasAReceber })));
const ContasAPagar = lazy(() => import('./pages/contasemovimentacoes/ContasAPagar.tsx').then(({ ContasAPagar }) => ({ default: ContasAPagar })));
const PagamentosRecebidos = lazy(() => import('./pages/contasemovimentacoes/PagamentosRecebidos.tsx').then(({ PagamentosRecebidos }) => ({ default: PagamentosRecebidos })));
const PagamentosQuitados = lazy(() => import('./pages/contasemovimentacoes/PagamentosQuitados.tsx').then(({ PagamentosQuitados }) => ({ default: PagamentosQuitados })));
const Anotacoes = lazy(() => import('./pages/anotacoes/Anotacoes.tsx').then(({ Anotacoes }) => ({ default: Anotacoes })));
const Relatorios = lazy(() => import('./pages/relatorios/Relatorios.tsx').then(({ Relatorios }) => ({ default: Relatorios })));
const Auditoria = lazy(() => import('./pages/auditoria/Auditoria.tsx').then(({ Auditoria }) => ({ default: Auditoria })));
const Configuracoes = lazy(() => import('./pages/configuracoes/Configuracoes.tsx').then(({ Configuracoes }) => ({ default: Configuracoes })));
const Login = lazy(() => import('./pages/login/Login.tsx').then(({ Login }) => ({ default: Login })));

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingContainer fullScreen text="Preparando seu painel..." />
  }

  return (
    <Suspense fallback={<LoadingContainer fullScreen text="Carregando módulo..." />}>
      <Routes>
        <Route path='/login' element={<Login />} />

        <Route element={<ProtectedRoute />} key={user?.id}>
          <Route element={<MainGrid />}>
            <Route path='/' element={<Home />} />
            <Route path='/clientes' element={<Clientes />} />
            <Route path='/clientes/:id' element={<ClienteDetails />} />
            <Route path='/ordens-de-serviço' element={<OrdensDeServico />} />
            <Route path='/ordens-de-serviço/:id' element={<OsDetalhes />} />
            <Route path='/orcamentos' element={<Orcamento />} />
            <Route path='/orcamentos/:id' element={<OrcamentoPage />} />
            <Route path='/serviços' element={<Servicos />} />
            <Route path='/estoque' element={<Estoque />} />
            <Route path='/anotações' element={<Anotacoes />} />
            <Route path='/histórico' element={<Auditoria />} />
            <Route path='/configurações' element={<Configuracoes />} />
            <Route element={<ProtectedRoute allowedRoles={['financeiro_master']} />}>
              <Route path='/financeiro' element={<Financeiro />} />
              <Route path='/financeiro/contas-receber' element={<ContasAReceber />} />
              <Route path='/financeiro/contas-pagar' element={<ContasAPagar />} />
              <Route path='/financeiro/pagamentos-recebidos' element={<PagamentosRecebidos />} />
              <Route path='/financeiro/pagamentos-quitados' element={<PagamentosQuitados />} />
              <Route path='/relatórios' element={<Relatorios />} />
            </Route>
          </Route>
        </Route>
      </Routes>
    </Suspense>
  )
}

export default App
