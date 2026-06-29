import {
  FaBoxes,
  FaClipboardList,
  FaClock,
  FaDollarSign,
  FaTools,
  FaUsers,
  FaWrench,
} from "react-icons/fa";

import {
  PageContainer,
  Header,
  WelcomeSection,
  PageTitle,
  PageSubtitle,
  CardsGrid,
  SummaryCard,
  CardIcon,
  CardContent,
  CardLabel,
  CardValue,
  CardHelper,
  MainGrid,
  SectionCard,
  SectionHeader,
  SectionTitle,
  SectionAction,
  RecentList,
  RecentItem,
  RecentInfo,
  RecentTitle,
  RecentMeta,
  StatusBadge,
  QuickActionsGrid,
  QuickActionCard,
  QuickActionIcon,
  QuickActionTitle,
  QuickActionText,
  ChartHeader,
  ChartWrapper,
  SectionSubtitle,
  ChartTotal,
  FinanceSummaryGrid,
  FinanceSummaryItem,
  FinanceSummaryResult,
} from "./HomeStyled";
import { useGetAllClientes } from "../clientes/useClientes";
import { useGetAllOs } from "../ordensDeServico/useOs";
import { useGetContasReceber } from "../financeiro/useContasReceber";
import { useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { formatDate } from "../../utils/formatDate";
import { CreateClienteModal } from "../../components/createForms/CreateClienteModal";
import { CreateOS } from "../../components/createForms/CreateOS";
import { CreateCliente } from "../../components/createForms/CreateCliente";
import { Link } from "react-router";
import { useGetPagamentoRecebido } from "../financeiro/usePagamentoRecebido";
import { useGetPagamentoQuitado } from "../financeiro/usePagamentoQuitado";
import { useEmpresaAtual } from "../../components/empresas/useEmpresas";

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function Home() {
  const { count: countClientes } = useGetAllClientes();
  const { data: os, count: countOs } = useGetAllOs();
  const { data: contasReceber } = useGetContasReceber();
  const { data: pagamentosQuitados } = useGetPagamentoQuitado();
  const { data: pagamentosRecebidos } = useGetPagamentoRecebido();

  const [ isCreateOpen, setIsCreateOpen ] = useState(false);
  const [ isCreateClienteOpen, setIsCreateClienteOpen ] = useState(false);
  
const hoje = new Date();
const mesAtual = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`;
const ultimasOs = os?.slice(0, 5) || [];

function getAnoMes(date?: string | null) {
  if (!date) return null;

  return date.slice(0, 7);
}

function somarValores<T>(
  lista: T[] | undefined,
  campoData: keyof T,
  campoValor: keyof T,
  anoMes = mesAtual
) {
  return (
    lista
      ?.filter((item: any) => getAnoMes(item[campoData]) === anoMes)
      .reduce(
        (total: number, item: any) => total + Number(item[campoValor] || 0),
        0
      ) || 0
  );
}

let faturamentoOSmes = somarValores(os, "dataServico", "valorServico");

let faturamentoMes = somarValores(
  contasReceber,
  "dataVencimento",
  "valor"
);

let totalRecebido = somarValores(
  pagamentosQuitados,
  "dataPagamento",
  "valor"
);

let totalQuitado = somarValores(
  pagamentosRecebidos,
  "dataPagamento",
  "valor"
);

const { data: user } = useEmpresaAtual();
const isAdmin = user?.role === "financeiro_master";
const isComunUser = user?.role === "user";

if (!isAdmin) {
  faturamentoOSmes = 0;
  faturamentoMes = 0;
  totalRecebido = 0;
  totalQuitado = 0;
}

const resultado = totalRecebido - totalQuitado;

const resultadoLabel = resultado >= 0 ? "Lucro" : "Prejuízo";

const faturamentoUltimos12Meses = useMemo(() => {
  const meses = [];

  for (let i = 11; i >= 0; i--) {
    const data = new Date();
    data.setMonth(data.getMonth() - i);

    const anoMes = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}`;

    const label = data.toLocaleDateString("pt-BR", {
      month: "short",
      year: "2-digit",
    });

    meses.push({
      mes: label,
      faturamento: somarValores(os, "dataServico", "valorServico", anoMes),
    });
  }

  return meses;
}, [os]);

  return (
    <>
    <PageContainer>
      <Header>
        <WelcomeSection>
          <PageTitle>Dashboard</PageTitle>
          <PageSubtitle>
            Visão geral da sua retífica com os principais indicadores do sistema.
          </PageSubtitle>
        </WelcomeSection>
      </Header>

      <CardsGrid>
        <SummaryCard>
          <CardIcon $variant="blue">
            <FaUsers />
          </CardIcon>
          <CardContent>
            <CardLabel>Clientes cadastrados</CardLabel>
            <CardValue>{countClientes}</CardValue>
            <CardHelper>Base total de clientes no sistema</CardHelper>
          </CardContent>
        </SummaryCard>

        <SummaryCard>
          <CardIcon $variant="orange">
            <FaWrench />
          </CardIcon>
          <CardContent>
            <CardLabel>Ordens de serviço</CardLabel>
            <CardValue>{countOs}</CardValue>
            <CardHelper>Total geral de OS cadastradas</CardHelper>
          </CardContent>
        </SummaryCard>

        {isAdmin && 
          <SummaryCard>
            <CardIcon $variant="green">
              <FaDollarSign />
            </CardIcon>
            <CardContent>
              <CardLabel>Faturamento bruto do mês</CardLabel>
              <CardValue>{formatCurrency(Number(faturamentoOSmes))}</CardValue>
              <CardHelper>Entradas registradas no período</CardHelper>
            </CardContent>
          </SummaryCard>
        }
        
        {isAdmin && 
        <SummaryCard>
          <CardIcon $variant="red">
            <FaBoxes />
          </CardIcon>
          <CardContent>
            <CardLabel>Faturamento líquido do mês</CardLabel>
            <CardValue>{formatCurrency((Number(faturamentoMes) + Number(faturamentoOSmes)) * 0.8)}</CardValue>
            <CardHelper>Entradas menos saídas no período</CardHelper>
          </CardContent>
        </SummaryCard>}
      </CardsGrid>

      <MainGrid>
        {isAdmin && 
        <SectionCard>
          <ChartHeader>
            <div>
              <SectionTitle>Faturamento dos últimos 12 meses</SectionTitle>
              <SectionSubtitle>
                Soma mensal das ordens de serviço concluídas no período.
              </SectionSubtitle>
            </div>

            <ChartTotal>
              <span>Total no período</span>
              <strong>{formatCurrency(faturamentoUltimos12Meses.reduce((acc, item) => acc + item.faturamento, 0))}</strong>
            </ChartTotal>
          </ChartHeader>

          <ChartWrapper>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={faturamentoUltimos12Meses}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis
                  tickFormatter={(value) =>
                    Number(value).toLocaleString("pt-BR", {
                      notation: "compact",
                    })
                  }
                />
                <Tooltip
                  formatter={(value) =>
                    Number(value).toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })
                  }
                  labelFormatter={(label) => `Mês: ${label}`}
                />
                <Bar
                  dataKey="faturamento"
                  name="Faturamento"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartWrapper>
        </SectionCard>}

        <SectionCard>
          <SectionHeader>
            <SectionTitle>
              <FaClock />
              Ordens recentes
            </SectionTitle>
            <SectionAction>Ver todas</SectionAction>
          </SectionHeader>

          <RecentList>
            {ultimasOs.map((ordem: any) => (
              <RecentItem key={ordem.id}>
                <RecentInfo>
                  <RecentTitle>{ordem.Clientes.cliente}</RecentTitle>
                  <RecentMeta>
                    {ordem.motor} • {formatDate(ordem.dataServico)}
                  </RecentMeta>
                </RecentInfo>

                <StatusBadge $status="concluída">
                  {`R$ ${ordem.valorServico.toFixed(2)}`}
                </StatusBadge>
              </RecentItem>
            ))}
          </RecentList>
        </SectionCard>

        <SectionCard>
          <SectionHeader>
            <SectionTitle>
              <FaClipboardList />
              Ações rápidas
            </SectionTitle>
          </SectionHeader>

          <QuickActionsGrid>
            <QuickActionCard disabled={isComunUser} onClick={() => setIsCreateOpen(true)}>
              <QuickActionIcon $variant="orange">
                <FaClipboardList />
              </QuickActionIcon>
              <QuickActionTitle>Nova OS</QuickActionTitle>
              <QuickActionText>
                Criar uma nova ordem de serviço rapidamente.
              </QuickActionText>
            </QuickActionCard>

            <QuickActionCard disabled={isComunUser} onClick={() => setIsCreateClienteOpen(true)}>
              <QuickActionIcon $variant="blue">
                <FaUsers />
              </QuickActionIcon>
              <QuickActionTitle>Novo cliente</QuickActionTitle>
              <QuickActionText>
                Cadastrar cliente e vincular aos serviços.
              </QuickActionText>
            </QuickActionCard>

            <Link to="/financeiro">
              <QuickActionCard disabled={isComunUser}>
                <QuickActionIcon $variant="green">
                  <FaDollarSign />
                </QuickActionIcon>
                <QuickActionTitle>Financeiro</QuickActionTitle>
                <QuickActionText>
                  Conferir entradas, saídas e contas pendentes.
                </QuickActionText>
              </QuickActionCard>
            </Link>

            <Link to="/estoque">
              <QuickActionCard disabled={isComunUser}>
                <QuickActionIcon $variant="red">
                  <FaTools />
                </QuickActionIcon>
                <QuickActionTitle>Estoque</QuickActionTitle>
                <QuickActionText>
                  Ver peças com estoque baixo e reposição.
                </QuickActionText>
              </QuickActionCard>
            </Link>
          </QuickActionsGrid>
        </SectionCard>

       {isAdmin &&  
       <SectionCard>
            <SectionHeader>
              <div>
                <SectionTitle>Resultado financeiro</SectionTitle>
                <SectionSubtitle>
                  Comparativo entre pagamentos recebidos e pagamentos quitados.
                </SectionSubtitle>
              </div>
            </SectionHeader>

            <FinanceSummaryGrid>
              <FinanceSummaryItem>
                <span>Entradas recebidas</span>
                <strong>{formatCurrency(totalRecebido)}</strong>
              </FinanceSummaryItem>

              <FinanceSummaryItem>
                <span>Saídas quitadas</span>
                <strong>{formatCurrency(totalQuitado)}</strong>
              </FinanceSummaryItem>

              <FinanceSummaryResult $isPositive={resultado >= 0}>
                <span>{resultadoLabel}</span>
                <strong>{formatCurrency(Math.abs(resultado))}</strong>
              </FinanceSummaryResult>
            </FinanceSummaryGrid>
        </SectionCard>}
      </MainGrid>
    </PageContainer>

    <CreateClienteModal open={isCreateOpen} onClose={() => setIsCreateOpen(false)}>
        <CreateOS />
    </CreateClienteModal>

    <CreateClienteModal
        open={isCreateClienteOpen}
        onClose={() => {
            setIsCreateClienteOpen(false);
        }}
        >
        <CreateCliente setIsCreateOpen={setIsCreateOpen} />
    </CreateClienteModal>
  </>
  );
}