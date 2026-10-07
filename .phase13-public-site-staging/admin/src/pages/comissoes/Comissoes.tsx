import {
  BadgeDollarSign,
  BarChart3,
  CheckCircle2,
  CircleDollarSign,
  Edit3,
  Eye,
  FileClock,
  Plus,
  ReceiptText,
  RotateCcw,
  Settings2,
  TrendingUp,
  UserRound,
  UsersRound,
} from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import {
  DataTable,
  EmptyState,
  ErrorState,
  FilterBar,
  Pagination,
  SearchInput,
  type DataTableColumn,
} from "../../components_shared";
import { FEATURES } from "../../features/access/access.constants";
import { useAccess } from "../../features/access/hooks/useAccess";
import { useAuth } from "../../features/auth/hooks/useAuth";
import { CommissionAdjustmentModal } from "../../features/commissions/components/CommissionAdjustmentModal";
import { CommissionPaymentDetailsModal } from "../../features/commissions/components/CommissionPaymentDetailsModal";
import { CommissionPaymentModal } from "../../features/commissions/components/CommissionPaymentModal";
import { CommissionReasonDialog } from "../../features/commissions/components/CommissionReasonDialog";
import { CommissionRuleModal } from "../../features/commissions/components/CommissionRuleModal";
import {
  useCommissionCatalogs,
  useCommissionLaunches,
  useCommissionPayments,
  useCommissionReport,
  useCommissionRules,
  useCreateCommissionAdjustment,
  useRegisterCommissionPayment,
  useReverseCommissionLaunch,
  useReverseCommissionPayment,
  useSaveCommissionRule,
} from "../../features/commissions/hooks/useCommissions";
import type {
  CommissionAdjustmentInput,
  CommissionLaunch,
  CommissionPayment,
  CommissionPaymentInput,
  CommissionReportRow,
  CommissionRule,
  RuleWriteInput,
} from "../../features/commissions/types/commission.types";
import {
  COMMISSION_BASE_LABELS,
  COMMISSION_PAYMENT_STATUS_LABELS,
  COMMISSION_RELEASE_LABELS,
  COMMISSION_STATUS_LABELS,
  commissionBalance,
  commissionReportTotals,
  formatCommissionCurrency,
  formatCommissionDate,
  formatCommissionDateTime,
  localCommissionDate,
  ruleCalculation,
  ruleScope,
} from "../../features/commissions/utils/commission.utils";
import "../../features/commissions/commissions.css";

type CommissionTab = "overview" | "rules" | "launches" | "payments" | "report";
const PAGE_SIZE = 10;

function initialPeriod() {
  const now = new Date();
  return {
    start: localCommissionDate(new Date(now.getFullYear(), now.getMonth(), 1)),
    end: localCommissionDate(
      new Date(now.getFullYear(), now.getMonth() + 1, 0),
    ),
  };
}

function ruleToInput(
  rule: CommissionRule,
  active = rule.ativo,
): RuleWriteInput {
  return {
    ruleId: rule.id,
    companyId: rule.id_empresa,
    employeeId: rule.id_funcionario,
    itemType: rule.tipo_item as RuleWriteInput["itemType"],
    serviceId: rule.id_servico,
    productId: rule.id_produto,
    calculationType: rule.tipo_calculo as RuleWriteInput["calculationType"],
    percentage: rule.percentual,
    fixedValue: rule.valor_fixo,
    base: rule.base_calculo as RuleWriteInput["base"],
    releaseMoment: rule.momento_liberacao as RuleWriteInput["releaseMoment"],
    validFrom: rule.vigente_de,
    validUntil: rule.vigente_ate,
    priority: rule.prioridade,
    active,
  };
}

export function Comissoes() {
  const { empresaAtual } = useAuth();
  const { cargo, possuiPermissaoPlano } = useAccess();
  const companyId = empresaAtual?.id ?? 0;
  const canManage = cargo === "dono" || cargo === "gerente";
  const advancedRules = possuiPermissaoPlano(
    FEATURES.ADVANCED_COMMISSION_RULES,
  );
  const [tab, setTab] = useState<CommissionTab>("overview");
  const [search, setSearch] = useState("");
  const [employeeFilter, setEmployeeFilter] = useState("todos");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [page, setPage] = useState(1);
  const [{ start, end }, setPeriod] = useState(initialPeriod);
  const [ruleModal, setRuleModal] = useState<CommissionRule | "new" | null>(
    null,
  );
  const [adjustmentOpen, setAdjustmentOpen] = useState(false);
  const [paymentEmployeeId, setPaymentEmployeeId] = useState<number | null>(
    null,
  );
  const [reversingLaunch, setReversingLaunch] =
    useState<CommissionLaunch | null>(null);
  const [paymentDetails, setPaymentDetails] =
    useState<CommissionPayment | null>(null);
  const [reversingPayment, setReversingPayment] =
    useState<CommissionPayment | null>(null);

  const catalogsQuery = useCommissionCatalogs(companyId);
  const rulesQuery = useCommissionRules(companyId);
  const launchesQuery = useCommissionLaunches(companyId);
  const paymentsQuery = useCommissionPayments(companyId);
  const reportQuery = useCommissionReport(companyId, start, end);
  const saveRuleMutation = useSaveCommissionRule(companyId);
  const adjustmentMutation = useCreateCommissionAdjustment(companyId);
  const paymentMutation = useRegisterCommissionPayment(companyId);
  const reverseLaunchMutation = useReverseCommissionLaunch(companyId);
  const reversePaymentMutation = useReverseCommissionPayment(companyId);
  const catalogs = catalogsQuery.data ?? {
    employees: [],
    services: [],
    products: [],
    paymentMethods: [],
    cashSessions: [],
  };
  const rules = useMemo(() => rulesQuery.data ?? [], [rulesQuery.data]);
  const launches = useMemo(
    () => launchesQuery.data ?? [],
    [launchesQuery.data],
  );
  const payments = useMemo(
    () => paymentsQuery.data ?? [],
    [paymentsQuery.data],
  );
  const report = useMemo(() => reportQuery.data ?? [], [reportQuery.data]);
  const normalizedSearch = search.trim().toLocaleLowerCase("pt-BR");
  const monthKey = localCommissionDate().slice(0, 7);
  const expectedTotal = launches
    .filter((launch) => launch.status === "prevista")
    .reduce((sum, launch) => sum + commissionBalance(launch), 0);
  const releasedTotal = launches
    .filter((launch) => ["liberada", "parcial"].includes(launch.status))
    .reduce((sum, launch) => sum + commissionBalance(launch), 0);
  const paidThisMonth = payments
    .filter(
      (payment) =>
        payment.status === "confirmado" &&
        payment.pago_em?.slice(0, 7) === monthKey,
    )
    .reduce((sum, payment) => sum + Number(payment.valor_total), 0);
  const professionalsWithRules = rules.some(
    (rule) => rule.ativo && rule.id_funcionario === null,
  )
    ? catalogs.employees.filter((employee) => employee.ativo).length
    : new Set(
        rules
          .filter((rule) => rule.ativo && rule.id_funcionario)
          .map((rule) => rule.id_funcionario),
      ).size;
  const reportTotals = commissionReportTotals(report);
  const releasedLaunches = launches
    .filter(
      (launch) =>
        ["liberada", "parcial"].includes(launch.status) &&
        commissionBalance(launch) > 0,
    )
    .sort((a, b) => b.competencia.localeCompare(a.competencia));
  const topEmployees = [...report]
    .sort(
      (a, b) =>
        Number(b.comissoes_pagas) +
        Number(b.saldo_a_pagar) -
        Number(a.comissoes_pagas) -
        Number(a.saldo_a_pagar),
    )
    .slice(0, 6);
  const queryError =
    catalogsQuery.error ??
    rulesQuery.error ??
    launchesQuery.error ??
    paymentsQuery.error;
  const loading =
    catalogsQuery.isPending ||
    rulesQuery.isPending ||
    launchesQuery.isPending ||
    paymentsQuery.isPending;

  const filteredRules = useMemo(
    () =>
      rules.filter((rule) => {
        const matchesSearch =
          !normalizedSearch ||
          [ruleScope(rule), rule.funcionario?.cargo, `#${rule.id}`].some(
            (value) =>
              value?.toLocaleLowerCase("pt-BR").includes(normalizedSearch),
          );
        return (
          matchesSearch &&
          (employeeFilter === "todos" ||
            rule.id_funcionario === Number(employeeFilter)) &&
          (statusFilter === "todos" ||
            (statusFilter === "ativa" ? rule.ativo : !rule.ativo))
        );
      }),
    [employeeFilter, normalizedSearch, rules, statusFilter],
  );
  const filteredLaunches = useMemo(
    () =>
      launches.filter((launch) => {
        const matchesSearch =
          !normalizedSearch ||
          [
            launch.descricao_snapshot,
            launch.funcionario?.nome,
            `#${launch.id}`,
            launch.id_comanda ? `#${launch.id_comanda}` : "ajuste",
          ].some((value) =>
            value?.toLocaleLowerCase("pt-BR").includes(normalizedSearch),
          );
        return (
          matchesSearch &&
          (employeeFilter === "todos" ||
            launch.id_funcionario === Number(employeeFilter)) &&
          (statusFilter === "todos" || launch.status === statusFilter)
        );
      }),
    [employeeFilter, launches, normalizedSearch, statusFilter],
  );
  const filteredPayments = useMemo(
    () =>
      payments.filter((payment) => {
        const matchesSearch =
          !normalizedSearch ||
          [
            payment.funcionario?.nome,
            payment.forma?.nome,
            `#${payment.id}`,
          ].some((value) =>
            value?.toLocaleLowerCase("pt-BR").includes(normalizedSearch),
          );
        return (
          matchesSearch &&
          (employeeFilter === "todos" ||
            payment.id_funcionario === Number(employeeFilter)) &&
          (statusFilter === "todos" || payment.status === statusFilter)
        );
      }),
    [employeeFilter, normalizedSearch, payments, statusFilter],
  );
  const pageSlice = <T,>(items: T[]) =>
    items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const ruleColumns: DataTableColumn<CommissionRule>[] = [
    {
      id: "scope",
      header: "Escopo",
      cell: (rule) => (
        <div className="commission-primary-cell">
          <strong>{ruleScope(rule)}</strong>
          <span>
            Regra #{rule.id}
            {rule.id_funcionario ? " · individual" : " · geral"}
          </span>
        </div>
      ),
    },
    {
      id: "calculation",
      header: "Comissão",
      cell: (rule) => (
        <strong className="commission-value">{ruleCalculation(rule)}</strong>
      ),
    },
    {
      id: "base",
      header: "Base",
      cell: (rule) =>
        COMMISSION_BASE_LABELS[
          rule.base_calculo as keyof typeof COMMISSION_BASE_LABELS
        ] ?? rule.base_calculo,
      hideOnMobile: true,
    },
    {
      id: "release",
      header: "Liberação",
      cell: (rule) =>
        COMMISSION_RELEASE_LABELS[
          rule.momento_liberacao as keyof typeof COMMISSION_RELEASE_LABELS
        ] ?? rule.momento_liberacao,
      hideOnMobile: true,
    },
    {
      id: "validity",
      header: "Vigência",
      cell: (rule) => (
        <div className="commission-date-cell">
          <span>{formatCommissionDate(rule.vigente_de)}</span>
          <small>
            {rule.vigente_ate
              ? `até ${formatCommissionDate(rule.vigente_ate)}`
              : "sem data final"}
          </small>
        </div>
      ),
      hideOnMobile: true,
    },
    {
      id: "priority",
      header: "Prioridade",
      cell: (rule) => rule.prioridade,
      align: "center",
      hideOnMobile: true,
    },
    {
      id: "status",
      header: "Status",
      cell: (rule) => (
        <span
          className="commission-status"
          data-status={rule.ativo ? "ativa" : "inativa"}
        >
          {rule.ativo ? "Ativa" : "Inativa"}
        </span>
      ),
    },
    {
      id: "actions",
      header: <span className="sr-only">Ações</span>,
      align: "right",
      cell: (rule) =>
        canManage ? (
          <div className="commission-row-actions">
            <button
              className="btn btn--icon btn--ghost"
              type="button"
              onClick={() => setRuleModal(rule)}
              aria-label={`Editar regra ${rule.id}`}
            >
              <Edit3 size={17} />
            </button>
            <button
              className="btn btn--icon btn--ghost"
              type="button"
              onClick={() =>
                void saveRuleMutation
                  .mutateAsync(ruleToInput(rule, !rule.ativo))
                  .catch(() => undefined)
              }
              aria-label={rule.ativo ? "Desativar regra" : "Ativar regra"}
            >
              {rule.ativo ? (
                <RotateCcw size={17} />
              ) : (
                <CheckCircle2 size={17} />
              )}
            </button>
          </div>
        ) : null,
    },
  ];
  const launchColumns: DataTableColumn<CommissionLaunch>[] = [
    {
      id: "launch",
      header: "Lançamento",
      cell: (launch) => (
        <div className="commission-primary-cell">
          <strong>{launch.descricao_snapshot}</strong>
          <span>
            #{launch.id} ·{" "}
            {launch.tipo_origem === "ajuste_manual"
              ? "Ajuste manual"
              : `Comanda #${launch.id_comanda}`}
          </span>
        </div>
      ),
    },
    {
      id: "employee",
      header: "Funcionário",
      cell: (launch) => launch.funcionario?.nome ?? "Funcionário removido",
    },
    {
      id: "competence",
      header: "Competência",
      cell: (launch) => formatCommissionDate(launch.competencia),
      hideOnMobile: true,
    },
    {
      id: "calculation",
      header: "Cálculo",
      cell: (launch) =>
        launch.tipo_calculo === "percentual"
          ? `${Number(launch.percentual_snapshot).toLocaleString("pt-BR")}% sobre ${formatCommissionCurrency(launch.base_calculo)}`
          : "Valor fixo",
      hideOnMobile: true,
    },
    {
      id: "amount",
      header: "Comissão",
      cell: (launch) => (
        <strong>{formatCommissionCurrency(launch.valor_comissao)}</strong>
      ),
      align: "right",
    },
    {
      id: "balance",
      header: "Saldo",
      cell: (launch) => formatCommissionCurrency(commissionBalance(launch)),
      align: "right",
      hideOnMobile: true,
    },
    {
      id: "status",
      header: "Status",
      cell: (launch) => (
        <span className="commission-status" data-status={launch.status}>
          {COMMISSION_STATUS_LABELS[
            launch.status as keyof typeof COMMISSION_STATUS_LABELS
          ] ?? launch.status}
        </span>
      ),
    },
    {
      id: "actions",
      header: <span className="sr-only">Ações</span>,
      align: "right",
      cell: (launch) =>
        canManage &&
        !["paga", "parcial", "estornada"].includes(launch.status) &&
        Number(launch.valor_pago) === 0 ? (
          <button
            className="btn btn--icon btn--ghost action-danger"
            type="button"
            onClick={() => setReversingLaunch(launch)}
            aria-label={`Estornar comissão ${launch.id}`}
          >
            <RotateCcw size={17} />
          </button>
        ) : null,
    },
  ];
  const paymentColumns: DataTableColumn<CommissionPayment>[] = [
    {
      id: "payment",
      header: "Pagamento",
      cell: (payment) => (
        <div className="commission-primary-cell">
          <strong>Pagamento #{payment.id}</strong>
          <span>
            {payment.itens.length}{" "}
            {payment.itens.length === 1 ? "lançamento" : "lançamentos"}
            {payment.forma ? ` · ${payment.forma.nome}` : ""}
          </span>
        </div>
      ),
    },
    {
      id: "employee",
      header: "Funcionário",
      cell: (payment) => payment.funcionario?.nome ?? "Funcionário removido",
    },
    {
      id: "date",
      header: "Pago em",
      cell: (payment) => formatCommissionDateTime(payment.pago_em),
      hideOnMobile: true,
    },
    {
      id: "period",
      header: "Período",
      cell: (payment) =>
        `${formatCommissionDate(payment.periodo_inicio)} a ${formatCommissionDate(payment.periodo_fim)}`,
      hideOnMobile: true,
    },
    {
      id: "amount",
      header: "Total",
      cell: (payment) => (
        <strong>{formatCommissionCurrency(payment.valor_total)}</strong>
      ),
      align: "right",
    },
    {
      id: "status",
      header: "Status",
      cell: (payment) => (
        <span className="commission-status" data-status={payment.status}>
          {COMMISSION_PAYMENT_STATUS_LABELS[
            payment.status as keyof typeof COMMISSION_PAYMENT_STATUS_LABELS
          ] ?? payment.status}
        </span>
      ),
    },
    {
      id: "actions",
      header: <span className="sr-only">Ações</span>,
      align: "right",
      cell: (payment) => (
        <div className="commission-row-actions">
          <button
            className="btn btn--icon btn--ghost"
            type="button"
            onClick={() => setPaymentDetails(payment)}
            aria-label={`Ver pagamento ${payment.id}`}
          >
            <Eye size={17} />
          </button>
          {canManage && payment.status === "confirmado" && (
            <button
              className="btn btn--icon btn--ghost action-danger"
              type="button"
              onClick={() => setReversingPayment(payment)}
              aria-label={`Estornar pagamento ${payment.id}`}
            >
              <RotateCcw size={17} />
            </button>
          )}
        </div>
      ),
    },
  ];
  const reportColumns: DataTableColumn<CommissionReportRow>[] = [
    {
      id: "employee",
      header: "Funcionário",
      cell: (row) => <strong>{row.funcionario_nome}</strong>,
    },
    {
      id: "generated",
      header: "Geradas",
      cell: (row) => formatCommissionCurrency(row.comissoes_geradas),
      align: "right",
      hideOnMobile: true,
    },
    {
      id: "expected",
      header: "Previstas",
      cell: (row) => formatCommissionCurrency(row.comissoes_previstas),
      align: "right",
      hideOnMobile: true,
    },
    {
      id: "released",
      header: "Liberadas",
      cell: (row) => (
        <strong className="commission-warning-value">
          {formatCommissionCurrency(row.comissoes_liberadas)}
        </strong>
      ),
      align: "right",
    },
    {
      id: "paid",
      header: "Pagas",
      cell: (row) => (
        <strong className="commission-success-value">
          {formatCommissionCurrency(row.comissoes_pagas)}
        </strong>
      ),
      align: "right",
    },
    {
      id: "adjustments",
      header: "Ajustes",
      cell: (row) => formatCommissionCurrency(row.ajustes_manuais),
      align: "right",
      hideOnMobile: true,
    },
    {
      id: "balance",
      header: "A pagar",
      cell: (row) => (
        <strong>{formatCommissionCurrency(row.saldo_a_pagar)}</strong>
      ),
      align: "right",
    },
  ];

  function changeTab(next: CommissionTab) {
    setTab(next);
    setSearch("");
    setEmployeeFilter("todos");
    setStatusFilter("todos");
    setPage(1);
  }
  function changeSearch(value: string) {
    setSearch(value);
    setPage(1);
  }
  function changeEmployee(value: string) {
    setEmployeeFilter(value);
    setPage(1);
  }
  function changeStatus(value: string) {
    setStatusFilter(value);
    setPage(1);
  }
  function clearFilters() {
    setEmployeeFilter("todos");
    setStatusFilter("todos");
    setPage(1);
  }
  async function retryAll() {
    await Promise.all([
      catalogsQuery.refetch(),
      rulesQuery.refetch(),
      launchesQuery.refetch(),
      paymentsQuery.refetch(),
      reportQuery.refetch(),
    ]);
  }
  async function submitRule(input: RuleWriteInput) {
    await saveRuleMutation.mutateAsync(input);
    setRuleModal(null);
  }
  async function submitAdjustment(input: CommissionAdjustmentInput) {
    await adjustmentMutation.mutateAsync(input);
    setAdjustmentOpen(false);
  }
  async function submitPayment(input: CommissionPaymentInput) {
    await paymentMutation.mutateAsync(input);
    setPaymentEmployeeId(null);
  }

  return (
    <div className="page commissions-page">
      <header className="page-header">
        <div className="page-header__content">
          <span className="page-eyebrow">Equipe</span>
          <h1>Comissões</h1>
          <p>
            Regras, valores liberados e pagamentos da equipe em um fluxo
            auditável.
          </p>
        </div>
        {canManage && (
          <div className="page-actions">
            {tab === "launches" && (
              <button
                className="btn btn--secondary"
                type="button"
                onClick={() => setAdjustmentOpen(true)}
              >
                <Plus size={17} /> Novo ajuste
              </button>
            )}
            {tab === "payments" ? (
              <button
                className="btn btn--primary"
                type="button"
                onClick={() => setPaymentEmployeeId(0)}
              >
                <CircleDollarSign size={18} /> Pagar comissões
              </button>
            ) : (
              <button
                className="btn btn--primary"
                type="button"
                onClick={() => setRuleModal("new")}
              >
                <Plus size={18} /> Nova regra
              </button>
            )}
          </div>
        )}
      </header>
      <section className="commission-metrics" aria-label="Resumo de comissões">
        <article>
          <span>Previstas</span>
          <strong>{formatCommissionCurrency(expectedTotal)}</strong>
          <small>aguardando liberação</small>
        </article>
        <article data-tone="warning">
          <span>Liberadas</span>
          <strong>{formatCommissionCurrency(releasedTotal)}</strong>
          <small>disponíveis para pagamento</small>
        </article>
        <article data-tone="success">
          <span>Pagas no mês</span>
          <strong>{formatCommissionCurrency(paidThisMonth)}</strong>
          <small>pagamentos confirmados</small>
        </article>
        <article>
          <span>Profissionais</span>
          <strong>{professionalsWithRules}</strong>
          <small>cobertos por regra ativa</small>
        </article>
      </section>
      <nav className="commission-tabs" aria-label="Seções de comissões">
        <button
          type="button"
          data-active={tab === "overview"}
          onClick={() => changeTab("overview")}
        >
          <BarChart3 size={17} /> Visão geral
        </button>
        <button
          type="button"
          data-active={tab === "rules"}
          onClick={() => changeTab("rules")}
        >
          <Settings2 size={17} /> Regras
        </button>
        <button
          type="button"
          data-active={tab === "launches"}
          onClick={() => changeTab("launches")}
        >
          <FileClock size={17} /> Lançamentos
        </button>
        <button
          type="button"
          data-active={tab === "payments"}
          onClick={() => changeTab("payments")}
        >
          <ReceiptText size={17} /> Pagamentos
        </button>
        <button
          type="button"
          data-active={tab === "report"}
          onClick={() => changeTab("report")}
        >
          <TrendingUp size={17} /> Relatório
        </button>
      </nav>
      {queryError && (
        <ErrorState
          error={queryError}
          onRetry={() => void retryAll()}
          isRetrying={loading}
        />
      )}

      {!queryError && tab === "overview" && (
        <section className="commission-overview">
          <article className="card commission-overview-card">
            <header>
              <div>
                <span className="page-eyebrow">Equipe</span>
                <h2>Resumo do mês</h2>
              </div>
              <button
                className="btn btn--ghost btn--small"
                type="button"
                onClick={() => changeTab("report")}
              >
                Ver relatório
              </button>
            </header>
            {reportQuery.error ? (
              <ErrorState
                error={reportQuery.error}
                onRetry={() => void reportQuery.refetch()}
                compact
              />
            ) : !reportQuery.isPending && topEmployees.length === 0 ? (
              <EmptyState
                icon={UsersRound}
                title="Sem comissões no período"
                description="Os profissionais aparecerão após os primeiros lançamentos."
                compact
              />
            ) : (
              <div className="commission-employee-summary">
                {topEmployees.map((employee) => (
                  <article key={employee.id_funcionario}>
                    <span className="commission-avatar">
                      <UserRound size={17} />
                    </span>
                    <div>
                      <strong>{employee.funcionario_nome}</strong>
                      <small>
                        Pago{" "}
                        {formatCommissionCurrency(employee.comissoes_pagas)}
                      </small>
                    </div>
                    <div>
                      <span>A pagar</span>
                      <strong>
                        {formatCommissionCurrency(employee.saldo_a_pagar)}
                      </strong>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </article>
          <article className="card commission-overview-card">
            <header>
              <div>
                <span className="page-eyebrow">Próximo pagamento</span>
                <h2>Valores liberados</h2>
              </div>
              <button
                className="btn btn--ghost btn--small"
                type="button"
                onClick={() => changeTab("launches")}
              >
                Ver todos
              </button>
            </header>
            {!loading && releasedLaunches.length === 0 ? (
              <EmptyState
                icon={BadgeDollarSign}
                title="Nenhuma comissão liberada"
                description="Valores liberados ao fechar comandas ou receber dos clientes aparecerão aqui."
                compact
              />
            ) : (
              <div className="commission-released-list">
                {releasedLaunches.slice(0, 6).map((launch) => (
                  <article key={launch.id}>
                    <span className="commission-release-icon">
                      <BadgeDollarSign size={17} />
                    </span>
                    <div>
                      <strong>
                        {launch.funcionario?.nome ?? "Funcionário removido"}
                      </strong>
                      <small>
                        {launch.descricao_snapshot} ·{" "}
                        {formatCommissionDate(launch.competencia)}
                      </small>
                    </div>
                    <strong>
                      {formatCommissionCurrency(commissionBalance(launch))}
                    </strong>
                    <button
                      className="btn btn--small btn--secondary"
                      type="button"
                      onClick={() =>
                        setPaymentEmployeeId(launch.id_funcionario)
                      }
                    >
                      Pagar
                    </button>
                  </article>
                ))}
              </div>
            )}
          </article>
        </section>
      )}

      {!queryError && tab === "rules" && (
        <CommissionListSection
          search={search}
          onSearch={changeSearch}
          employeeFilter={employeeFilter}
          onEmployee={changeEmployee}
          statusFilter={statusFilter}
          onStatus={changeStatus}
          onClear={clearFilters}
          catalogs={catalogs}
          statusOptions={[
            { value: "todos", label: "Todas" },
            { value: "ativa", label: "Ativas" },
            { value: "inativa", label: "Inativas" },
          ]}
          action={
            canManage ? (
              <button
                className="btn btn--secondary"
                type="button"
                onClick={() => setRuleModal("new")}
              >
                <Plus size={17} /> Nova regra
              </button>
            ) : undefined
          }
          searchPlaceholder="Buscar regra ou funcionário..."
        >
          <DataTable
            data={pageSlice(filteredRules)}
            columns={ruleColumns}
            rowKey="id"
            isLoading={rulesQuery.isPending}
            emptyIcon={Settings2}
            emptyTitle="Nenhuma regra encontrada"
            emptyDescription="Cadastre uma regra geral ou específica para iniciar o cálculo automático."
            emptyAction={
              canManage ? (
                <button
                  className="btn btn--primary"
                  type="button"
                  onClick={() => setRuleModal("new")}
                >
                  <Plus size={17} /> Nova regra
                </button>
              ) : undefined
            }
          />
          <Pagination
            page={page}
            totalPages={Math.ceil(filteredRules.length / PAGE_SIZE)}
            totalItems={filteredRules.length}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
        </CommissionListSection>
      )}

      {!queryError && tab === "launches" && (
        <CommissionListSection
          search={search}
          onSearch={changeSearch}
          employeeFilter={employeeFilter}
          onEmployee={changeEmployee}
          statusFilter={statusFilter}
          onStatus={changeStatus}
          onClear={clearFilters}
          catalogs={catalogs}
          statusOptions={[
            { value: "todos", label: "Todos" },
            { value: "prevista", label: "Previstas" },
            { value: "liberada", label: "Liberadas" },
            { value: "parcial", label: "Parciais" },
            { value: "paga", label: "Pagas" },
            { value: "estornada", label: "Estornadas" },
          ]}
          action={
            canManage ? (
              <button
                className="btn btn--secondary"
                type="button"
                onClick={() => setAdjustmentOpen(true)}
              >
                <Plus size={17} /> Novo ajuste
              </button>
            ) : undefined
          }
          searchPlaceholder="Buscar lançamento, comanda ou funcionário..."
        >
          <DataTable
            data={pageSlice(filteredLaunches)}
            columns={launchColumns}
            rowKey="id"
            isLoading={launchesQuery.isPending}
            emptyIcon={FileClock}
            emptyTitle="Nenhum lançamento encontrado"
            emptyDescription="As comissões calculadas ao fechar comandas aparecerão aqui."
          />
          <Pagination
            page={page}
            totalPages={Math.ceil(filteredLaunches.length / PAGE_SIZE)}
            totalItems={filteredLaunches.length}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
        </CommissionListSection>
      )}

      {!queryError && tab === "payments" && (
        <CommissionListSection
          search={search}
          onSearch={changeSearch}
          employeeFilter={employeeFilter}
          onEmployee={changeEmployee}
          statusFilter={statusFilter}
          onStatus={changeStatus}
          onClear={clearFilters}
          catalogs={catalogs}
          statusOptions={[
            { value: "todos", label: "Todos" },
            { value: "confirmado", label: "Confirmados" },
            { value: "cancelado", label: "Estornados" },
          ]}
          action={
            canManage ? (
              <button
                className="btn btn--secondary"
                type="button"
                onClick={() => setPaymentEmployeeId(0)}
              >
                <CircleDollarSign size={17} /> Pagar comissões
              </button>
            ) : undefined
          }
          searchPlaceholder="Buscar pagamento ou funcionário..."
        >
          <DataTable
            data={pageSlice(filteredPayments)}
            columns={paymentColumns}
            rowKey="id"
            isLoading={paymentsQuery.isPending}
            emptyIcon={ReceiptText}
            emptyTitle="Nenhum pagamento encontrado"
            emptyDescription="Agrupe as comissões liberadas para registrar o pagamento ao funcionário."
            emptyAction={
              canManage ? (
                <button
                  className="btn btn--primary"
                  type="button"
                  onClick={() => setPaymentEmployeeId(0)}
                >
                  <CircleDollarSign size={17} /> Novo pagamento
                </button>
              ) : undefined
            }
          />
          <Pagination
            page={page}
            totalPages={Math.ceil(filteredPayments.length / PAGE_SIZE)}
            totalItems={filteredPayments.length}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
        </CommissionListSection>
      )}

      {!queryError && tab === "report" && (
        <section className="commission-report-section">
          <div className="card commission-report-header">
            <div>
              <span className="page-eyebrow">Desempenho da equipe</span>
              <h2>Relatório por funcionário</h2>
              <p>
                Valores gerados pela competência e pagamentos confirmados no
                período.
              </p>
            </div>
            <div className="commission-date-range">
              <label>
                De
                <input
                  className="input"
                  type="date"
                  value={start}
                  max={end}
                  onChange={(event) =>
                    setPeriod((current) => ({
                      ...current,
                      start: event.target.value,
                    }))
                  }
                />
              </label>
              <label>
                Até
                <input
                  className="input"
                  type="date"
                  value={end}
                  min={start}
                  onChange={(event) =>
                    setPeriod((current) => ({
                      ...current,
                      end: event.target.value,
                    }))
                  }
                />
              </label>
            </div>
          </div>
          <section className="commission-report-metrics">
            <article>
              <span>Geradas</span>
              <strong>
                {formatCommissionCurrency(reportTotals.generated)}
              </strong>
            </article>
            <article data-tone="warning">
              <span>Liberadas</span>
              <strong>{formatCommissionCurrency(reportTotals.released)}</strong>
            </article>
            <article data-tone="success">
              <span>Pagas</span>
              <strong>{formatCommissionCurrency(reportTotals.paid)}</strong>
            </article>
            <article>
              <span>Saldo a pagar</span>
              <strong>{formatCommissionCurrency(reportTotals.balance)}</strong>
            </article>
          </section>
          <div className="card commission-list-card">
            <DataTable
              data={report}
              columns={reportColumns}
              rowKey="id_funcionario"
              isLoading={reportQuery.isPending}
              error={reportQuery.error}
              onRetry={() => void reportQuery.refetch()}
              emptyIcon={BarChart3}
              emptyTitle="Sem dados no período"
              emptyDescription="Selecione outro período ou aguarde os primeiros lançamentos."
            />
          </div>
        </section>
      )}

      {ruleModal && (
        <CommissionRuleModal
          key={ruleModal === "new" ? "new" : ruleModal.id}
          companyId={companyId}
          rule={ruleModal === "new" ? undefined : ruleModal}
          catalogs={catalogs}
          advanced={advancedRules}
          isSubmitting={saveRuleMutation.isPending}
          onClose={() => setRuleModal(null)}
          onSubmit={submitRule}
        />
      )}
      {adjustmentOpen && (
        <CommissionAdjustmentModal
          companyId={companyId}
          catalogs={catalogs}
          isSubmitting={adjustmentMutation.isPending}
          onClose={() => setAdjustmentOpen(false)}
          onSubmit={submitAdjustment}
        />
      )}
      {paymentEmployeeId !== null && (
        <CommissionPaymentModal
          key={paymentEmployeeId || "new"}
          companyId={companyId}
          catalogs={catalogs}
          launches={launches}
          initialEmployeeId={paymentEmployeeId || undefined}
          isSubmitting={paymentMutation.isPending}
          onClose={() => setPaymentEmployeeId(null)}
          onSubmit={submitPayment}
        />
      )}
      {reversingLaunch && (
        <CommissionReasonDialog
          title="Estornar comissão"
          description={`O lançamento “${reversingLaunch.descricao_snapshot}” no valor de ${formatCommissionCurrency(reversingLaunch.valor_comissao)} será invalidado.`}
          confirmLabel="Estornar comissão"
          isSubmitting={reverseLaunchMutation.isPending}
          onClose={() => setReversingLaunch(null)}
          onConfirm={async (reason) => {
            await reverseLaunchMutation.mutateAsync({
              companyId,
              id: reversingLaunch.id,
              reason,
            });
            setReversingLaunch(null);
          }}
        />
      )}
      {paymentDetails && (
        <CommissionPaymentDetailsModal
          payment={paymentDetails}
          onClose={() => setPaymentDetails(null)}
          onReverse={() => {
            setReversingPayment(paymentDetails);
            setPaymentDetails(null);
          }}
        />
      )}
      {reversingPayment && (
        <CommissionReasonDialog
          title="Estornar pagamento"
          description={`O pagamento de ${formatCommissionCurrency(reversingPayment.valor_total)} será estornado no financeiro e o saldo voltará aos lançamentos.`}
          confirmLabel="Estornar pagamento"
          isSubmitting={reversePaymentMutation.isPending}
          onClose={() => setReversingPayment(null)}
          onConfirm={async (reason) => {
            await reversePaymentMutation.mutateAsync({
              companyId,
              id: reversingPayment.id,
              reason,
            });
            setReversingPayment(null);
          }}
        />
      )}
    </div>
  );
}

type ListSectionProps = {
  search: string;
  onSearch: (value: string) => void;
  employeeFilter: string;
  onEmployee: (value: string) => void;
  statusFilter: string;
  onStatus: (value: string) => void;
  onClear: () => void;
  catalogs: { employees: Array<{ id: number; nome: string }> };
  statusOptions: Array<{ value: string; label: string }>;
  action?: ReactNode;
  searchPlaceholder: string;
  children: ReactNode;
};
function CommissionListSection({
  search,
  onSearch,
  employeeFilter,
  onEmployee,
  statusFilter,
  onStatus,
  onClear,
  catalogs,
  statusOptions,
  action,
  searchPlaceholder,
  children,
}: ListSectionProps) {
  return (
    <section className="card commission-list-card">
      <FilterBar
        search={
          <SearchInput
            value={search}
            onChange={onSearch}
            placeholder={searchPlaceholder}
            label="Buscar"
          />
        }
        activeFilterCount={
          Number(employeeFilter !== "todos") + Number(statusFilter !== "todos")
        }
        onClearFilters={onClear}
        actions={action}
      >
        <label className="commission-filter">
          <span>Funcionário</span>
          <select
            className="select"
            value={employeeFilter}
            onChange={(event) => onEmployee(event.target.value)}
          >
            <option value="todos">Todos</option>
            {catalogs.employees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.nome}
              </option>
            ))}
          </select>
        </label>
        <label className="commission-filter">
          <span>Status</span>
          <select
            className="select"
            value={statusFilter}
            onChange={(event) => onStatus(event.target.value)}
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </FilterBar>
      {children}
    </section>
  );
}
