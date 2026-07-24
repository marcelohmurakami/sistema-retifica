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
import { useTheme } from "styled-components";
import { formatDate } from "../../utils/formatDate";
import { AppModal } from "../../components/modal/AppModal";
import { CreateOS } from "../../components/createForms/CreateOS";
import { CreateCliente } from "../../components/createForms/CreateCliente";
import { Link } from "react-router";
import { useEmpresaAtual } from "../../components/empresas/useEmpresas";
import { useGetPagamentosPeriodo, useGetRecebimentosPeriodo } from "../relatorios/useRelatorios";

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function somarValores<T>(
  lista: T[] | undefined,
  getData: (item: T) => string | null | undefined,
  getValor: (item: T) => number | string | null | undefined,
  anoMes: string,
) {
  return (lista ?? [])
    .filter((item) => getData(item)?.slice(0, 7) === anoMes)
    .reduce((total, item) => total + Number(getValor(item) || 0), 0);
}

export function Home() {
  const theme = useTheme();
  const { count: countClientes } = useGetAllClientes();
  const { data: os, count: countOs } = useGetAllOs();
  const { data: user } = useEmpresaAtual();
  const isAdmin = user?.role === "financeiro_master";
  const isComunUser = user?.role === "user";
  const { data: pagamentosQuitados } = useGetPagamentosPeriodo("mes_atual", isAdmin);
  const { data: pagamentosRecebidos } = useGetRecebimentosPeriodo("mes_atual", isAdmin);

  const [ isCreateOpen, setIsCreateOpen ] = useState(false);
  const [ isCreateClienteOpen, setIsCreateClienteOpen ] = useState(false);
  
const hoje = new Date();
const mesAtual = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`;
const ultimasOs = os?.slice(0, 5) || [];

let faturamentoOSmes = somarValores(
  os,
  (item) => item.dataServico,
  (item) => item.valorServico,
  mesAtual,
);

let totalRecebido = pagamentosRecebidos?.reduce(
  (total, item) => total + Number(item.valor || 0),
  0,
) ?? 0;

let totalQuitado = pagamentosQuitados?.reduce(
  (total, item) => total + Number(item.valor || 0),
  0,
) ?? 0;

if (!isAdmin) {
  faturamentoOSmes = 0;
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
      faturamento: somarValores(
        os,
        (item) => item.dataServico,
        (item) => item.valorServico,
        anoMes,
      ),
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
              <CardLabel>Resultado líquido do mês</CardLabel>
              <CardValue>{formatCurrency(resultado)}</CardValue>
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
                <CartesianGrid stroke={theme.colors.border} strokeDasharray="4 6" vertical={false} />
                <XAxis dataKey="mes" axisLine={false} tickLine={false} />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) =>
                    Number(value).toLocaleString("pt-BR", {
                      notation: "compact",
                    })
                  }
                />
                <Tooltip
                  cursor={{ fill: theme.colors.accentSoft }}
                  contentStyle={{
                    background: theme.colors.surfaceElevated,
                    border: `1px solid ${theme.colors.border}`,
                    borderRadius: 14,
                    boxShadow: theme.shadow.md,
                    color: theme.colors.textPrimary,
                  }}
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
                  fill={theme.colors.accent}
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
            <SectionAction as={Link} to="/ordens-de-serviço">Ver todas</SectionAction>
          </SectionHeader>

          <RecentList>
            {ultimasOs.map((ordem) => (
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

            {isAdmin && <Link to="/financeiro">
              <QuickActionCard>
                <QuickActionIcon $variant="green">
                  <FaDollarSign />
                </QuickActionIcon>
                <QuickActionTitle>Financeiro</QuickActionTitle>
                <QuickActionText>
                  Conferir entradas, saídas e contas pendentes.
                </QuickActionText>
              </QuickActionCard>
            </Link>}

            <Link to="/estoque">
              <QuickActionCard>
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

    {isCreateOpen && (
      <AppModal open onClose={() => setIsCreateOpen(false)}>
        <CreateOS />
      </AppModal>
    )}

    {isCreateClienteOpen && (
      <AppModal
        open
        onClose={() => {
            setIsCreateClienteOpen(false);
        }}
        >
        <CreateCliente setIsCreateOpen={setIsCreateClienteOpen} />
      </AppModal>
    )}
  </>
  );
}
