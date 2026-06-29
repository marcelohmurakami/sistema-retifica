import { MainGrid } from './components/mainGrid.tsx';
import { Routes, Route } from 'react-router';
import { Home } from './pages/home/Home.tsx';
import { Clientes } from './pages/clientes/Clientes.tsx';
import { OrdensDeServico } from './pages/ordensDeServico/OrdensDeServico.tsx';
import { Financeiro } from './pages/financeiro/Financeiro.tsx';
import { Configuracoes } from './pages/configuracoes/Configuracoes.tsx';
import { Servicos } from './pages/serviços/Servicos.tsx';
import { Estoque } from './pages/estoque/Estoque.tsx';
import { Orcamento } from './pages/orcamentos/Orcamento.tsx';
import { OsDetalhes } from './pages/ordensDeServico/OsDetalhes.tsx';
import { ClienteDetails } from './pages/clientes/ClienteDetails.tsx';
import { Login } from './pages/login/Login.tsx';
import { ProtectedRoute } from './routes/ProtectedRoute.tsx';
import { OrcamentoPage } from './pages/orcamentos/OrcamentoPage.tsx';
import { ContasAPagar } from './pages/contasemovimentacoes/ContasAPagar.tsx';
import { ContasAReceber } from './pages/contasemovimentacoes/ContasAReceber.tsx';
import { PagamentosRecebidos } from './pages/contasemovimentacoes/PagamentosRecebidos.tsx';
import { PagamentosQuitados } from './pages/contasemovimentacoes/PagamentosQuitados.tsx';
import { Anotacoes } from './pages/anotacoes/Anotacoes.tsx';
import { useAuth } from './contexts/AuthContext.tsx';
import { Spinner } from './components/spinner/Spinner.tsx';
import { Relatorios } from './pages/relatorios/Relatorios.tsx';
import { Auditoria } from './pages/auditoria/Auditoria.tsx';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <Spinner />
  }

  return (
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
            <Route path='/financeiro' element={<Financeiro />} />
            <Route path='/financeiro/contas-receber' element={<ContasAReceber />} />
            <Route path='/financeiro/contas-pagar' element={<ContasAPagar />} />
            <Route path='/financeiro/pagamentos-recebidos' element={<PagamentosRecebidos />} />
            <Route path='/financeiro/pagamentos-quitados' element={<PagamentosQuitados />} />
            <Route path='/anotações' element={<Anotacoes />} />
            <Route path='/relatórios' element={<Relatorios />} />
            <Route path='/histórico' element={<Auditoria />} />
            <Route path='/configurações' element={<Configuracoes />} />
          </Route>
        </Route>
      </Routes>
  )
}

export default App
