import { useState } from "react";
import {
  FaChartBar,
  FaChartLine,
  FaClipboardCheck,
  FaClipboardList,
  FaDollarSign,
  FaFileInvoiceDollar,
  FaTools,
  FaUserTie,
  FaWarehouse,
} from "react-icons/fa";
import styled from "styled-components";
import { useGetOrdensDeServico, useGetPagamentosPeriodo, useGetRecebimentosPeriodo, useTopClienteQuantidade, useTopClientesFaturamento, useTopProdutosFaturamento, useTopServicoQuantidade, useTopServicosFaturamento } from "./useRelatorios";

type ResumoRelatorios = {
  faturamentoMes: number;
  osAbertas: number;
  osConcluidas: number;
  valoresAReceber: number;
  lucroAproximado: number;
};

type RankingItem = {
  nome: string;
  quantidade?: number;
  cliente?: string;
  total?: number;
};

type RelatoriosProps = {
  resumo?: ResumoRelatorios;
  servicosMaisVendidos?: RankingItem[];
  pecasMaisUsadas?: RankingItem[];
  clientesMaisCompram?: RankingItem[];
  isLoading?: boolean;
  onPeriodoChange?: (periodo: PeriodoRelatorio) => void;
};

type PeriodoRelatorio = "mes_atual" | "ultimos_3_meses" | "ultimos_6_meses" | "ultimo_ano" | "ultimos_3_anos";

const resumoPadrao: ResumoRelatorios = {
  faturamentoMes: 0,
  osAbertas: 0,
  osConcluidas: 0,
  valoresAReceber: 0,
  lucroAproximado: 0,
};

function formatarMoeda(valor?: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(valor ?? 0));
}

function RankingTable({
  titulo,
  descricao,
  icon,
  itens = [],
  colunaQuantidade = "Quantidade",
}: {
  titulo: string;
  descricao: string;
  icon: React.ReactNode;
  itens?: RankingItem[];
  colunaQuantidade?: string;
}) {
  return (
    <Panel>
      <PanelHeader>
        <PanelIcon aria-hidden="true">{icon}</PanelIcon>
        <div>
          <h2>{titulo}</h2>
          <p>{descricao}</p>
        </div>
      </PanelHeader>

      {itens.length === 0 ? (
        <EmptyState>Nenhum dado encontrado para este relatório.</EmptyState>
      ) : (
        <TableWrapper>
          <table>
            <thead>
              <tr>
                <th scope="col">Nome</th>
                <th scope="col">{colunaQuantidade}</th>
                <th scope="col">Total</th>
              </tr>
            </thead>
            <tbody>
              {itens.map((item, index) => (
                <tr key={`${item.nome}-${index}`}>
                  <td data-label="Nome">
                    <RankNumber>{index + 1}</RankNumber>
                    {item.nome || item.cliente}
                  </td>
                  <td data-label={colunaQuantidade}>{item.quantidade ?? "-"}</td>
                  <td data-label="Total">{formatarMoeda(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrapper>
      )}
    </Panel>
  );
}

export function Relatorios({
  resumo = resumoPadrao,
  isLoading = false,
  onPeriodoChange,
}: RelatoriosProps) {
  const [periodoSelecionado, setPeriodoSelecionado] =
    useState<PeriodoRelatorio>("ultimo_ano");

  function handlePeriodoChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const novoPeriodo = event.target.value as PeriodoRelatorio;

    setPeriodoSelecionado(novoPeriodo);
    onPeriodoChange?.(novoPeriodo);
  }

  const frasePorPeriodo: Record<PeriodoRelatorio, string> = {
    mes_atual: "no mês atual",
    ultimos_3_meses: "nos últimos 3 meses",
    ultimos_6_meses: "nos últimos 6 meses",
    ultimo_ano: "no último ano",
    ultimos_3_anos: "nos últimos 3 anos",
  };

  const frase = frasePorPeriodo[periodoSelecionado];

  const { data: osData, isLoading: isLoadingOS } = useGetOrdensDeServico(periodoSelecionado);

  const osAbertas = osData?.length ?? 0;

  const { data: pagamentosRecebidos } = useGetRecebimentosPeriodo(periodoSelecionado);

  const { data: pagamentosQuitados } = useGetPagamentosPeriodo(periodoSelecionado);

  const faturamentoOS =
  osData?.reduce(
    (acc: number, os: any) => acc + Number(os.valorServico || 0),
    0
  ) ?? 0;

const totalRecebimentos =
  pagamentosRecebidos?.reduce(
    (acc: number, pagamento: any) => acc + Number(pagamento.valor || 0),
    0
  ) ?? 0;

const totalPagamentos =
  pagamentosQuitados?.reduce(
    (acc: number, pagamento: any) => acc + Number(pagamento.valor || 0),
    0
  ) ?? 0;

  const lucroPeriodo = totalRecebimentos - totalPagamentos;

  const [ qtdItensRanking, setQtdItensRanking ] = useState<number>(10);
  const { data: rankingServicosFaturamento } = useTopServicosFaturamento(periodoSelecionado);
  const topServicosFaturamento = rankingServicosFaturamento?.slice(0, qtdItensRanking)

  const { data: rankingItensFaturamento } = useTopProdutosFaturamento(periodoSelecionado);
  const topProdutosFaturamento = rankingItensFaturamento?.slice(0, qtdItensRanking);

  const { data: rankingClientesFaturamento } = useTopClientesFaturamento(periodoSelecionado);
  const topClientesFaturamento = rankingClientesFaturamento?.slice(0, qtdItensRanking)

  const { data: rankingClientesQuantidade } = useTopClienteQuantidade(periodoSelecionado);
  const topClientesQuantidade = rankingClientesQuantidade?.slice(0, qtdItensRanking)

  const { data: rankingServicosQuantidade } = useTopServicoQuantidade(periodoSelecionado);
  const topServicosQuantidade = rankingServicosQuantidade?.slice(0, qtdItensRanking);
  

  if (isLoading || isLoadingOS) {
    return (
      <PageContainer>
        <Header>
          <HeaderBadge>
            <FaChartBar aria-hidden="true" />
            Relatórios
          </HeaderBadge>
          <h1>Carregando relatórios...</h1>
          <p>Aguarde enquanto buscamos os dados da empresa.</p>
        </Header>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Header>
        <HeaderCopy>
          <h1>Painel de desempenho</h1>
          <p>
            Acompanhe faturamento, recebimentos, pagamentos e os rankings que
            mostram onde a oficina estÃ¡ performando melhor.
          </p>
        </HeaderCopy>
      </Header>

<HeaderFilters>
  <PeriodBox aria-label="Período do relatório">
    <label htmlFor="periodoRelatorio">Período</label>

    <select
      id="periodoRelatorio"
      value={periodoSelecionado}
      onChange={handlePeriodoChange}
    >
      <option value="mes_atual">Mês atual</option>
      <option value="ultimos_3_meses">Últimos 3 meses</option>
      <option value="ultimos_6_meses">Últimos 6 meses</option>
      <option value="ultimo_ano">Último ano</option>
      <option value="ultimos_3_anos">Últimos 3 anos</option>
    </select>
  </PeriodBox>

  <PeriodBox aria-label="Quantidade de itens por tabela">
    <label htmlFor="quantidadeItens">Itens por tabela</label>

    <select
      id="quantidadeItens"
      value={qtdItensRanking}
      onChange={(e) => setQtdItensRanking(Number(e.target.value))}
    >
      <option value={10}>10 itens</option>
      <option value={20}>20 itens</option>
      <option value={30}>30 itens</option>
      <option value={40}>40 itens</option>
      <option value={50}>50 itens</option>
    </select>
  </PeriodBox>
</HeaderFilters>
      <CardsGrid aria-label="Resumo dos relatórios">
        <MetricCard $variant="green">
          <CardIcon $variant="green" aria-hidden="true">
            <FaDollarSign />
          </CardIcon>
          <span>{`Faturamento BRUTO em OS ${frase}`}</span>
          <strong>{formatarMoeda(faturamentoOS)}</strong>
          <small>Total vendido em OS no período.</small>
        </MetricCard>

        <MetricCard $variant="blue">
          <CardIcon $variant="blue" aria-hidden="true">
            <FaClipboardList />
          </CardIcon>
          <span>OS finalizadas no periodo</span>
          <strong>{osAbertas}</strong>
          <small>Serviços em andamento ou pendentes.</small>
        </MetricCard>

        <MetricCard $variant="purple">
          <CardIcon $variant="purple" aria-hidden="true">
            <FaClipboardCheck />
          </CardIcon>
          <span>OS concluídas</span>
          <strong>{resumo.osConcluidas}</strong>
          <small>Ordens finalizadas no período.</small>
        </MetricCard>

        <MetricCard $variant="amber">
          <CardIcon $variant="amber" aria-hidden="true">
            <FaFileInvoiceDollar />
          </CardIcon>
          <span>Valores recebidos no periodo</span>
          <strong>{formatarMoeda(totalRecebimentos)}</strong>
          <small>Recebimentos recebidos em caixa no periodo selecionado.</small>
        </MetricCard>

        <MetricCard $variant="dark">
          <CardIcon $variant="dark" aria-hidden="true">
            <FaChartLine />
          </CardIcon>
          <span>Lucro aproximado</span>
          <strong>{formatarMoeda(lucroPeriodo)}</strong>
          <small>Estimativa usando os recebimentos e pagamentos realizados no periodo.</small>
        </MetricCard>
      </CardsGrid>

      <ReportsGrid>
        <RankingTable
          titulo={`Clientes que mais geraram faturamento ${frase}`}
          descricao="Mostra quais clientes mais geraram faturamento para a empresa."
          icon={<FaTools />}
          itens={topClientesFaturamento}
          colunaQuantidade="Vendidos"
        />

        <RankingTable
          titulo={`Serviços que mais geraram faturamento ${frase}`}
          descricao="Mostra quais serviços mais geraram faturamente para a empresa."
          icon={<FaTools />}
          itens={topServicosFaturamento}
          colunaQuantidade="Vendidos"
        />

        <RankingTable
          titulo={`Peças mais utilizadas ${frase}`}
          descricao="Ajuda a entender quais produtos precisam de mais atenção no estoque."
          icon={<FaWarehouse />}
          itens={topProdutosFaturamento}
          colunaQuantidade="Usadas"
        />

        <RankingTable
          titulo={`Clientes que mais compraram ${frase}`}
          descricao="Lista os clientes com maior volume financeiro em ordens de serviço."
          icon={<FaUserTie />}
          itens={topClientesQuantidade}
          colunaQuantidade="OS"
        />

        <RankingTable
          titulo={`Serviços que mais foram realizados ${frase}`}
          descricao="Lista dos serviços com maior volume financeiro em ordens de serviço."
          icon={<FaUserTie />}
          itens={topServicosQuantidade}
          colunaQuantidade="OS"
        />
      </ReportsGrid>
    </PageContainer>
  );
}

const PageContainer = styled.main`
  width: 100%;
  min-height: 100%;
  padding: clamp(1rem, 3vw, 2rem);
  color: ${({ theme }) => theme.colors.textPrimary};
  background: ${({ theme }) => theme.colors.background};
  overflow-x: hidden;

  @media (max-width: 760px) {
    padding: 0.85rem;
  }
`;

const Header = styled.section`
  max-width: 1180px;
  margin: 0 auto 1rem;
  padding: clamp(1.1rem, 3vw, 1.6rem);
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 1rem;
  background: ${({ theme }) => theme.colors.surface};
  box-shadow: ${({ theme }) => theme.shadow.sm};

  h1 {
    margin: 0;
    color: ${({ theme }) => theme.colors.primaryDark};
    font-size: clamp(1.6rem, 6vw, 2.25rem);
    line-height: 1.15;
    overflow-wrap: anywhere;
  }

  p {
    color: ${({ theme }) => theme.colors.textSecondary};
    line-height: 1.5;
    max-width: 64ch;
    margin: 0.7rem 0 0;
  }

  @media (max-width: 520px) {
    border-radius: 0.85rem;
  }
`;

const HeaderCopy = styled.div`
  min-width: 0;
`;

const HeaderBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  margin-bottom: 0.9rem;
  border: 1px solid #bbf7d0;
  border-radius: 999px;
  color: #166534;
  background: #f0fdf4;
  font-size: 0.9rem;
  font-weight: 700;

  @media (max-width: 420px) {
    width: 100%;
    justify-content: center;
  }
`;

const PeriodBox = styled.div`
  min-width: 0;
  padding: 1rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 0.9rem;
  background: ${({ theme }) => theme.colors.surface};
  box-shadow: ${({ theme }) => theme.shadow.sm};

  label,
  select {
    display: block;
  }

  label {
    color: ${({ theme }) => theme.colors.textSecondary};
    font-size: 0.82rem;
    font-weight: 700;
    text-transform: uppercase;
  }

  select {
    width: 100%;
    margin-top: 0.45rem;
    min-height: 44px;
    padding: 0.7rem 2.35rem 0.7rem 0.85rem;
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: 0.65rem;
    color: ${({ theme }) => theme.colors.textPrimary};
    background:
      linear-gradient(45deg, transparent 50%, ${({ theme }) => theme.colors.textSecondary} 50%) calc(100% - 18px) 52% / 6px 6px no-repeat,
      linear-gradient(135deg, ${({ theme }) => theme.colors.textSecondary} 50%, transparent 50%) calc(100% - 13px) 52% / 6px 6px no-repeat,
      ${({ theme }) => theme.colors.surface};
    appearance: none;
    font: inherit;
    font-weight: 800;
    cursor: pointer;
  }

  select:focus {
    outline: 3px solid rgba(37, 99, 235, 0.22);
    border-color: #2563eb;
  }

  select:hover {
    border-color: #94a3b8;
  }

  @media (max-width: 760px) {
    padding: 0.9rem;

    label {
      font-size: 0.9rem;
    }

    select {
      min-height: 46px;
      font-size: 1rem;
    }
  }
`;

const CardsGrid = styled.section`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
  gap: 1rem;
  max-width: 1180px;
  margin: 0 auto 1.15rem;

  @media (min-width: 1121px) {
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }

  @media (max-width: 620px) {
    grid-template-columns: 1fr;
    gap: 0.85rem;
  }
`;

const MetricCard = styled.article<{ $variant: "green" | "blue" | "purple" | "amber" | "dark" }>`
  position: relative;
  overflow: hidden;
  min-height: 170px;
  padding: 1.15rem;
  border: 1px solid
    ${({ $variant }) =>
      ({
        green: "rgba(34, 197, 94, 0.26)",
        blue: "rgba(37, 99, 235, 0.24)",
        purple: "rgba(124, 58, 237, 0.24)",
        amber: "rgba(217, 119, 6, 0.24)",
        dark: "rgba(15, 23, 42, 0.18)",
      })[$variant]};
  border-radius: 1rem;
  background:
    ${({ theme }) => theme.colors.surface},
    ${({ $variant }) =>
      ({
        green: "linear-gradient(135deg, rgba(22, 163, 74, 0.1), transparent)",
        blue: "linear-gradient(135deg, rgba(37, 99, 235, 0.1), transparent)",
        purple: "linear-gradient(135deg, rgba(124, 58, 237, 0.1), transparent)",
        amber: "linear-gradient(135deg, rgba(217, 119, 6, 0.1), transparent)",
        dark: "linear-gradient(135deg, rgba(15, 23, 42, 0.1), transparent)",
      })[$variant]};
  box-shadow: 0 16px 34px rgba(15, 23, 42, 0.075);
  transition: transform 0.18s ease, box-shadow 0.18s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 22px 45px rgba(15, 23, 42, 0.11);
  }

  &::before {
    content: "";
    position: absolute;
    inset: 0 0 auto;
    height: 0.35rem;
    background: ${({ $variant }) =>
      ({
        green: "#16a34a",
        blue: "#2563eb",
        purple: "#7c3aed",
        amber: "#d97706",
        dark: "#0f172a",
      })[$variant]};
  }

  span {
    display: block;
    margin-top: 0.9rem;
    color: ${({ theme }) => theme.colors.textSecondary};
    font-size: 0.84rem;
    font-weight: 800;
    text-transform: uppercase;
    line-height: 1.35;
    overflow-wrap: anywhere;
  }

  strong {
    display: block;
    margin-top: 0.45rem;
    color: ${({ theme }) => theme.colors.primaryDark};
    font-size: clamp(1.6rem, 3vw, 2.1rem);
    line-height: 1.1;
    overflow-wrap: anywhere;
  }

  small {
    display: block;
    margin-top: 0.55rem;
    color: ${({ theme }) => theme.colors.textSecondary};
    line-height: 1.45;
  }

  @media (max-width: 620px) {
    min-height: auto;
    padding: 1.05rem;

    span {
      font-size: 0.95rem;
    }

    strong {
      font-size: clamp(1.7rem, 9vw, 2.2rem);
    }

    small {
      font-size: 0.95rem;
    }
  }
`;

const CardIcon = styled.div<{ $variant: "green" | "blue" | "purple" | "amber" | "dark" }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.75rem;
  color: #ffffff;
  background: ${({ $variant }) =>
    ({
      green: "#16a34a",
      blue: "#2563eb",
      purple: "#7c3aed",
      amber: "#d97706",
      dark: "#0f172a",
    })[$variant]};
  box-shadow: inset 0 -10px 18px rgba(255, 255, 255, 0.08);
`;

const ReportsGrid = styled.section`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
  max-width: 1180px;
  margin: 0 auto;

  > article:first-child {
    grid-column: 1 / -1;
  }

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }

  @media (max-width: 620px) {
    gap: 0.85rem;
  }
`;

const Panel = styled.article`
  min-width: 0;
  overflow: hidden;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 1rem;
  background: ${({ theme }) => theme.colors.surface};
  box-shadow: ${({ theme }) => theme.shadow.sm};

  @media (max-width: 620px) {
    border-radius: 0.85rem;
  }
`;

const PanelHeader = styled.header`
  display: flex;
  gap: 0.85rem;
  align-items: flex-start;
  padding: 1.15rem 1.15rem 0.85rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surface};

  h2 {
    margin: 0;
    color: ${({ theme }) => theme.colors.primaryDark};
    font-size: 1.15rem;
    line-height: 1.25;
    overflow-wrap: anywhere;
  }

  p {
    margin: 0.35rem 0 0;
    color: ${({ theme }) => theme.colors.textSecondary};
    line-height: 1.45;
  }

  @media (max-width: 620px) {
    padding: 1rem 1rem 0.7rem;

    h2 {
      font-size: 1.25rem;
    }

    p {
      font-size: 0.98rem;
    }
  }

  @media (max-width: 420px) {
    flex-direction: column;
  }
`;

const PanelIcon = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: 2.4rem;
  height: 2.4rem;
  border-radius: 0.8rem;
  color: #0f766e;
  background: #ccfbf1;
`;

const TableWrapper = styled.div`
  overflow-x: auto;
  padding: 0.85rem 1.15rem 1.15rem;
  -webkit-overflow-scrolling: touch;

  table {
    width: 100%;
    min-width: 520px;
    border-collapse: collapse;
  }

  th {
    color: ${({ theme }) => theme.colors.textSecondary};
    background: ${({ theme }) => theme.colors.background};
    font-size: 0.78rem;
    text-align: left;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  th,
  td {
    padding: 0.9rem;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  }

  td {
    color: ${({ theme }) => theme.colors.textPrimary};
    font-weight: 650;
  }

  tbody tr:hover {
    background: ${({ theme }) => theme.colors.background};
  }

  @media (max-width: 620px) {
    overflow: visible;
    padding: 0.35rem 1rem 1rem;

    table,
    tbody,
    tr,
    td {
      display: block;
      width: 100%;
      min-width: 0;
    }

    table {
      border-collapse: separate;
      border-spacing: 0;
    }

    thead {
      display: none;
    }

    tbody {
      display: grid;
      gap: 0.75rem;
    }

    tbody tr {
      padding: 0.9rem;
      border: 1px solid ${({ theme }) => theme.colors.border};
      border-radius: 0.85rem;
      background: ${({ theme }) => theme.colors.surface};
      box-shadow: 0 10px 22px rgba(15, 23, 42, 0.06);
    }

    tbody tr:hover {
      background: ${({ theme }) => theme.colors.surface};
    }

    td {
      display: grid;
      grid-template-columns: minmax(7.5rem, 42%) minmax(0, 1fr);
      align-items: center;
      gap: 0.75rem;
      padding: 0.45rem 0;
      border-bottom: 0;
      font-size: 1.04rem;
      line-height: 1.45;
      overflow-wrap: anywhere;
    }

    td::before {
      content: attr(data-label);
      color: ${({ theme }) => theme.colors.textSecondary};
      font-size: 0.9rem;
      font-weight: 800;
      text-transform: uppercase;
    }
  }

  @media (max-width: 390px) {
    td {
      grid-template-columns: 1fr;
      gap: 0.15rem;
    }
  }
`;

const RankNumber = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.6rem;
  height: 1.6rem;
  margin-right: 0.55rem;
  border-radius: 999px;
  color: #1d4ed8;
  background: #dbeafe;
  font-size: 0.78rem;
  font-weight: 900;

  @media (max-width: 620px) {
    width: 1.8rem;
    height: 1.8rem;
    font-size: 0.85rem;
  }
`;

const EmptyState = styled.p`
  margin: 0;
  padding: 1rem 1.15rem 1.25rem;
  color: ${({ theme }) => theme.colors.textSecondary};

  @media (max-width: 620px) {
    padding: 1rem;
    font-size: 1rem;
    line-height: 1.45;
  }
`;

const HeaderFilters = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(190px, 260px));
  gap: 1rem;
  align-items: center;
  max-width: 1180px;
  margin: 0 auto;
  padding-bottom: 1.15rem;

  @media (max-width: 768px) {
    align-items: stretch;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 520px) {
    grid-template-columns: 1fr;
    gap: 0.75rem;
    padding-bottom: 1rem;
  }
`;
