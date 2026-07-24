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
import { useGetOrdensDeServico, useGetPagamentosPeriodo, useGetRecebimentosPeriodo, useTopClienteQuantidade, useTopClientesFaturamento, useTopProdutosFaturamento, useTopServicoQuantidade, useTopServicosFaturamento } from "./useRelatorios";
import {
  PageContainer,
  Header,
  HeaderCopy,
  HeaderBadge,
  PeriodBox,
  CardsGrid,
  MetricCard,
  CardIcon,
  ReportsGrid,
  Panel,
  PanelHeader,
  PanelIcon,
  TableWrapper,
  RankNumber,
  EmptyState,
  HeaderFilters,
} from "./RelatoriosStyled";

type RankingItem = {
  nome: string;
  quantidade?: number;
  cliente?: string;
  total?: number;
};

type RelatoriosProps = {
  isLoading?: boolean;
  onPeriodoChange?: (periodo: PeriodoRelatorio) => void;
};

type PeriodoRelatorio = "mes_atual" | "ultimos_3_meses" | "ultimos_6_meses" | "ultimo_ano" | "ultimos_3_anos";

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

  const totalOS = osData?.length ?? 0;

  const { data: pagamentosRecebidos } = useGetRecebimentosPeriodo(periodoSelecionado);

  const { data: pagamentosQuitados } = useGetPagamentosPeriodo(periodoSelecionado);

  const faturamentoOS =
  osData?.reduce(
    (acc, os) => acc + Number(os.valorServico || 0),
    0
  ) ?? 0;

const totalRecebimentos =
  pagamentosRecebidos?.reduce(
    (acc, pagamento) => acc + Number(pagamento.valor || 0),
    0
  ) ?? 0;

const totalPagamentos =
  pagamentosQuitados?.reduce(
    (acc, pagamento) => acc + Number(pagamento.valor || 0),
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
            mostram onde a oficina está performando melhor.
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
          <span>OS emitidas no período</span>
          <strong>{totalOS}</strong>
          <small>Total de ordens cadastradas no período.</small>
        </MetricCard>

        <MetricCard $variant="purple">
          <CardIcon $variant="purple" aria-hidden="true">
            <FaClipboardCheck />
          </CardIcon>
          <span>Saídas pagas no período</span>
          <strong>{formatarMoeda(totalPagamentos)}</strong>
          <small>Pagamentos efetivamente realizados no período.</small>
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
