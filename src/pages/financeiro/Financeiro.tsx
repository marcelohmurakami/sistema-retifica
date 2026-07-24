import { useState } from "react";
import {
  PageContainer,
  Header,
  HeaderLeft,
  PageTitle,
  PageSubtitle,
  HeaderActions,
  ActionButton,
  CardsGrid,
  SummaryCard,
  CardIconWrapper,
  CardContent,
  CardLabel,
  CardValue,
  CardHelper,
  TopSection,
  FluxoCard,
  SectionHeader,
  SectionTitle,
  SectionBadge,
  FluxoItem,
  FluxoInfo,
  ProgressBar,
  ProgressFill,
  FluxoFooter,
  ContentGrid,
  SectionCard,
  ItemsList,
  FinanceItem,
  FinanceItemMain,
  FinanceTitle,
  FinanceMeta,
  Dot,
  FinanceItemAside,
  FinanceValue,
  StatusBadge,
  EmptyState,
  BottomSection,
  MovementsTableWrapper,
  MovementsTable,
  TableValue,
  SideInfoCard,
  InfoList,
  InfoItem,
  VerTodosButton,
  MonthInput
} from "./FinanceiroStyled";
import {
  FaArrowDown,
  FaArrowUp,
  FaCalendarAlt,
  FaCheckCircle,
  FaClipboardList,
  FaDollarSign,
  FaExclamationTriangle,
  FaFileInvoiceDollar,
  FaTools,
  FaWallet
} from "react-icons/fa";
import { useGetContasPagar } from "./useContasPagar";
import { useGetContasReceber } from "./useContasReceber";
import { useGetPagamentoQuitado } from "./usePagamentoQuitado";
import { useGetPagamentoRecebido } from "./usePagamentoRecebido";
import { useNavigate } from "react-router";
import { formatDate } from "../../utils/formatDate";
import type { FinanceStatus } from "../../models/financeiro";

function formatCurrency(value: number) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function getStatusLabel(status: FinanceStatus) {
  switch (status) {
    case "pago":
      return "Pago";
    case "pendente":
      return "Pendente";
    case "atrasado":
      return "Atrasado";
    default:
      return status;
  }
}

export function Financeiro() {
  const navigate = useNavigate();

  const { data: contasPagar  } = useGetContasPagar();
  const { data: contasReceber } = useGetContasReceber();
  const { data: pagamentosQuitados } = useGetPagamentoQuitado();
  const { data: pagamentosRecebidos } = useGetPagamentoRecebido();

  const [ mesSelecionado, setMesSelecionado ] = useState(() => {
    const hoje = new Date();
    return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`;
  })

  function isSameMonth(date?: string | null) {
    if (!date) return false;

    return date.slice(0, 7) === mesSelecionado;
  }

  const totalReceber =
    contasReceber
      .filter((item) => item.status !== "pago")
      .filter((pagamento) =>
        isSameMonth(pagamento?.dataPagamento)
      )
      .reduce(
        (acc, item) => acc + Math.max(Number(item.valor || 0) - Number(item.valorRecebido || 0), 0),
        0,
      );

  const totalPagar =
    contasPagar
      .filter((item) => item.status !== "pago")
      .filter((item) =>
        isSameMonth(item.dataVencimento)
      )
      .reduce(
        (acc, item) => acc + Math.max(Number(item.valor || 0) - Number(item.valor_parcial_pago || 0), 0),
        0,
      );

  const totalRecebidoMes =
    pagamentosRecebidos
      .filter((item) =>
        isSameMonth(item.dataRecebimento)
      )
      .reduce((acc, item) => acc + Number(item.valor || 0), 0);

  const totalSaidasMes =
    pagamentosQuitados
      .filter((item) =>
        isSameMonth(item.dataPagamento)
      )
      .reduce((acc, item) => acc + Number(item.valor || 0), 0);

  const saldoMes = totalReceber - totalPagar;
  const saldoCaixaMes = totalRecebidoMes - totalSaidasMes;

  const contasAtrasadas =
    contasPagar.filter((conta) => {
      if (!conta.dataVencimento) return false
      if (conta?.valor_parcial_pago >= conta?.valor) return false

      const hoje = new Date()
      const vencimento = new Date(conta.dataVencimento)

      hoje.setHours(0, 0, 0, 0)
      vencimento.setHours(0, 0, 0, 0)

      return hoje > vencimento
    }).length

  const contasReceberAtrasadas =
    contasReceber.filter((conta) => {
      if (!conta.dataPagamento) return false
      if (conta?.valorRecebido >= conta?.valor) return false

      const hoje = new Date()
      const pagamento = new Date(conta.dataPagamento)

      hoje.setHours(0, 0, 0, 0)
      pagamento.setHours(0, 0, 0, 0)

      return hoje > pagamento
    }).length

  return (
    <PageContainer>
      <Header>
        <HeaderLeft>
          <PageTitle>Financeiro</PageTitle>
          <PageSubtitle>
            Controle de entradas, saídas, pendências e fluxo da sua retífica.
          </PageSubtitle>
        </HeaderLeft>

        <HeaderActions>
          <MonthInput
            type="month"
            value={mesSelecionado}
            onChange={(e) => setMesSelecionado(e.target.value)}
          />

          <ActionButton $variant="secondary">
            <FaFileInvoiceDollar />
            Gerar relatório
          </ActionButton>
        </HeaderActions>
      </Header>

      <CardsGrid>
        <SummaryCard>
          <CardIconWrapper>
            <FaDollarSign />
          </CardIconWrapper>
          <CardContent>
            <CardLabel>Saldo do mês</CardLabel>
            <CardValue $positive={saldoMes >= 0}>
              {`R$ ${saldoMes?.toFixed(2)}`}
            </CardValue>
            <CardHelper>
              Entradas {formatCurrency(totalReceber)} • Saídas{" "}
              {formatCurrency(totalPagar)}
            </CardHelper>
          </CardContent>
        </SummaryCard>

        <SummaryCard>
          <CardIconWrapper $type="success">
            <FaArrowUp />
          </CardIconWrapper>
          <CardContent>
            <CardLabel>Contas a receber</CardLabel>
            <CardValue>{formatCurrency(totalReceber)}</CardValue>
            <CardHelper>
              Valores ainda pendentes de clientes e ordens de serviço
            </CardHelper>
          </CardContent>
        </SummaryCard>

        <SummaryCard>
          <CardIconWrapper $type="warning">
            <FaArrowDown />
          </CardIconWrapper>
          <CardContent>
            <CardLabel>Contas a pagar</CardLabel>
            <CardValue>{formatCurrency(totalPagar)}</CardValue>
            <CardHelper>
              Despesas fixas, fornecedores e custos operacionais
            </CardHelper>
          </CardContent>
        </SummaryCard>

        <SummaryCard>
          <CardIconWrapper $type="danger">
            <FaExclamationTriangle />
          </CardIconWrapper>
          <CardContent>
            <CardLabel>Pendências críticas</CardLabel>
            <CardValue>{contasAtrasadas}</CardValue>
            <CardHelper>
              Contas atrasadas exigindo atenção imediata
            </CardHelper>
          </CardContent>
        </SummaryCard>
      </CardsGrid>

      <TopSection>
        <FluxoCard>
          <SectionHeader>
            <SectionTitle>
              <FaWallet />
              Fluxo rápido do mês
            </SectionTitle>
          </SectionHeader>

          <FluxoItem>
            <FluxoInfo>
              <span>Entradas</span>
              <strong>{formatCurrency(totalRecebidoMes)}</strong>
            </FluxoInfo>
            <ProgressBar>
              <ProgressFill $width={100} $variant="success" />
            </ProgressBar>
          </FluxoItem>

          <FluxoItem>
            <FluxoInfo>
              <span>Saídas</span>
              <strong>{formatCurrency(totalSaidasMes)}</strong>
            </FluxoInfo>
            <ProgressBar>
              <ProgressFill
                $width={
                  totalRecebidoMes > 0
                    ? Math.min((totalSaidasMes / totalRecebidoMes) * 100, 100)
                    : 0
                }
                $variant="danger"
              />
            </ProgressBar>
          </FluxoItem>

          <FluxoFooter $positive={saldoCaixaMes >= 0}>
            Resultado do mês: <strong>{formatCurrency(saldoCaixaMes)}</strong>
          </FluxoFooter>
        </FluxoCard>

        <SideInfoCard>
          <SectionHeader>
            <SectionTitle>
              <FaCheckCircle />
              Resumo rápido
            </SectionTitle>
          </SectionHeader>

          <InfoList>
            <InfoItem>
              <span>Contas a receber atrasadas:</span>
              <strong>
                {
                  contasReceberAtrasadas || 0
                }
              </strong>
            </InfoItem>

            <InfoItem>
              <span>Despesas atrasadas:</span>
              <strong>
                {
                  contasAtrasadas
                }
              </strong>
            </InfoItem>

            <InfoItem>
              <span>Resultado do mês:</span>
              <strong>
                {formatCurrency(saldoMes)}
              </strong>
            </InfoItem>

            <InfoItem>
              <span>Resultado de caixa do mês:</span>
              <strong>
                {formatCurrency(saldoCaixaMes)}
              </strong>
            </InfoItem>
          </InfoList>
        </SideInfoCard>
      </TopSection>

      <ContentGrid>
        <SectionCard>
          <SectionHeader>
            <SectionTitle>
              <FaClipboardList />
              Contas a receber
            </SectionTitle>
            <SectionBadge>{contasReceber?.length}</SectionBadge>
          </SectionHeader>

          <ItemsList>
            {contasReceber.slice(0, 4).map((conta) => (
              <FinanceItem key={conta.id}>
                <FinanceItemMain>
                  <FinanceTitle>{conta.descricao}</FinanceTitle>
                  <FinanceMeta>
                    <span>{conta?.OrdensServico?.Clientes?.cliente ?? "Sem cliente"}</span>
                    <Dot />
                    <span>{conta?.categoria}</span>
                    <Dot />
                    <span>
                      <FaCalendarAlt />
                      {formatDate(conta.dataPagamento)}
                    </span>
                  </FinanceMeta>
                </FinanceItemMain>

                <FinanceItemAside>
                  <FinanceValue>{formatCurrency(conta.valor)}</FinanceValue>
                  <StatusBadge $status={conta.status}>
                    {getStatusLabel(conta.status)}
                  </StatusBadge>
                </FinanceItemAside>
              </FinanceItem>
            ))}

            {contasReceber?.length === 0 && (
              <EmptyState>Nenhuma conta a receber encontrada.</EmptyState>
            )}
          </ItemsList>

          <VerTodosButton onClick={() => navigate("/financeiro/contas-receber")}>
            Ver todos
          </VerTodosButton>
        </SectionCard>

        <SectionCard>
          <SectionHeader>
            <SectionTitle>
              <FaTools />
              Contas a pagar
            </SectionTitle>
            <SectionBadge>{contasPagar?.length}</SectionBadge>
          </SectionHeader>

          <ItemsList>
            {contasPagar.slice(0, 4).map((conta) => (
              <FinanceItem key={conta.id}>
                <FinanceItemMain>
                  <FinanceTitle>{conta.descricao}</FinanceTitle>
                  <FinanceMeta>
                    <span>{conta.categoria}</span>
                    <Dot />
                    <span>
                      <FaCalendarAlt />
                      {formatDate(conta.dataVencimento)}
                    </span>
                  </FinanceMeta>
                </FinanceItemMain>

                <FinanceItemAside>
                  <FinanceValue>{formatCurrency(conta.valor)}</FinanceValue>
                  <StatusBadge $status={conta.status}>
                    {getStatusLabel(conta.status)}
                  </StatusBadge>
                </FinanceItemAside>
              </FinanceItem>
            ))}

            {contasPagar?.length === 0 && (
              <EmptyState>Nenhuma conta a pagar encontrada.</EmptyState>
            )}
          </ItemsList>

          <VerTodosButton onClick={() => navigate("/financeiro/contas-pagar")}>
            Ver todos
          </VerTodosButton>
        </SectionCard>
      </ContentGrid>

      <BottomSection>
        <SectionCard>
          <SectionHeader>
            <SectionTitle>
              <FaFileInvoiceDollar />
              Pagamentos quitados recentes
            </SectionTitle>
          </SectionHeader>

          <MovementsTableWrapper>
            <MovementsTable>
              <thead>
                <tr>
                  <th>Descrição</th>
                  <th>Forma de pagamento</th>
                  <th>Data</th>
                  <th>Observações</th>
                  <th>Valor</th>
                </tr>
              </thead>

              <tbody>
                {pagamentosQuitados.slice(0, 4).map((item) => (
                  <tr key={item.id}>
                    <td>{item.descricao}</td>
                    <td>{item.formaPagamento ?? "-"}</td>
                    <td>{formatDate(item.dataPagamento)}</td>
                    <td>{item.observacoes ?? "-"}</td>
                    <td>
                      <TableValue $type={"saida"}>
                        {"-"}
                        {formatCurrency(item.valor)}
                      </TableValue>
                    </td>
                  </tr>
                ))}
              </tbody>

              <VerTodosButton onClick={() => navigate("/financeiro/pagamentos-quitados")}>
                Ver todos
              </VerTodosButton>
            </MovementsTable>
          </MovementsTableWrapper>
        </SectionCard>

        <SectionCard>
          <SectionHeader>
            <SectionTitle>
              <FaFileInvoiceDollar />
              Pagamentos recebidos recentes
            </SectionTitle>
          </SectionHeader>

          <MovementsTableWrapper>
            <MovementsTable>
              <thead>
                <tr>
                  <th>Descrição</th>
                  <th>Forma de pagamento</th>
                  <th>Data</th>
                  <th>Observações</th>
                  <th>Valor</th>
                </tr>
              </thead>

              <tbody>
                {pagamentosRecebidos.slice(0, 4).map((item) => (
                  <tr key={item.id}>
                    <td>{item.descricao}</td>
                    <td>{item.metodoPag ?? "-"}</td>
                    <td>{formatDate(item.dataRecebimento)}</td>
                    <td>{item.observacoes ?? "-"}</td>
                    <td>
                      <TableValue $type={"entrada"}>
                        {"+"}
                        {formatCurrency(item.valor)}
                      </TableValue>
                    </td>
                  </tr>
                ))}
              </tbody>

              <VerTodosButton onClick={() => navigate("/financeiro/pagamentos-recebidos")}>
                Ver todos
              </VerTodosButton>
            </MovementsTable>
          </MovementsTableWrapper>
        </SectionCard>
      </BottomSection>
    </PageContainer>
  );
}
