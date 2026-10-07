import {
  ArrowDownCircle,
  ArrowDownToLine,
  ArrowUpCircle,
  ArrowUpFromLine,
  Banknote,
  BarChart3,
  CalendarClock,
  CircleDollarSign,
  CreditCard,
  Edit3,
  Eye,
  Landmark,
  Plus,
  ReceiptText,
  RotateCcw,
  Settings2,
  WalletCards,
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
import { useAccess } from "../../features/access/hooks/useAccess";
import { useAuth } from "../../features/auth/hooks/useAuth";
import { AccountDetailsModal } from "../../features/finance/components/AccountDetailsModal";
import { AccountFormModal } from "../../features/finance/components/AccountFormModal";
import { CashCloseModal } from "../../features/finance/components/CashCloseModal";
import { CashMovementModal } from "../../features/finance/components/CashMovementModal";
import { CashOpenModal } from "../../features/finance/components/CashOpenModal";
import {
  FinancialCatalogModal,
  type CatalogModalState,
} from "../../features/finance/components/FinancialCatalogModal";
import { PaymentModal } from "../../features/finance/components/PaymentModal";
import { ReasonDialog } from "../../features/finance/components/ReasonDialog";
import {
  useCancelFinancialAccount,
  useCashSessions,
  useCloseCashSession,
  useCreateCashMovement,
  useFinancialAccounts,
  useFinancialCatalogs,
  useFinancialPayments,
  useFinancialReport,
  useOpenCashSession,
  useRegisterPayment,
  useReverseCashMovement,
  useReversePayment,
  useSaveCashDrawer,
  useSaveFinancialAccount,
  useSaveFinancialCategory,
  useSavePaymentMethod,
} from "../../features/finance/hooks/useFinance";
import type {
  AccountInstallment,
  AccountWriteInput,
  CashCloseInput,
  CashDrawerWriteInput,
  CashMovement,
  CashMovementInput,
  CashOpenInput,
  CashSession,
  CategoryWriteInput,
  FinancialAccount,
  FinancialPayment,
  PaymentMethodWriteInput,
  PaymentWriteInput,
} from "../../features/finance/types/finance.types";
import {
  ACCOUNT_STATUS_LABELS,
  ACCOUNT_TYPE_LABELS,
  CASH_MOVEMENT_LABELS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
  accountBalance,
  accountCounterparty,
  formatFinancialCurrency,
  formatFinancialDate,
  formatFinancialDateTime,
  formatMonth,
  installmentBalance,
  localDateInput,
  nextOpenInstallment,
  reportTotals,
} from "../../features/finance/utils/finance.utils";
import "../../features/finance/finance.css";

type FinanceTab = "overview" | "accounts" | "payments" | "cash" | "settings";
type PaymentTarget = {
  account: FinancialAccount;
  installment: AccountInstallment;
};
type MovementRow = CashMovement & { session: CashSession };
const PAGE_SIZE = 10;

function initialReportRange() {
  const today = new Date();
  return {
    start: localDateInput(
      new Date(today.getFullYear(), today.getMonth() - 5, 1),
    ),
    end: localDateInput(new Date(today.getFullYear(), today.getMonth() + 1, 0)),
  };
}

function paymentAccount(payment: FinancialPayment) {
  return payment.alocacoes[0]?.parcela?.conta ?? null;
}

export function Financeiro() {
  const { empresaAtual } = useAuth();
  const { cargo } = useAccess();
  const companyId = empresaAtual?.id ?? 0;
  const canManage = cargo === "dono" || cargo === "gerente";
  const [tab, setTab] = useState<FinanceTab>("overview");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [typeFilter, setTypeFilter] = useState("todos");
  const [page, setPage] = useState(1);
  const [{ start, end }, setReportRange] = useState(initialReportRange);
  const [accountForm, setAccountForm] = useState<
    FinancialAccount | "new" | null
  >(null);
  const [detailsAccount, setDetailsAccount] = useState<FinancialAccount | null>(
    null,
  );
  const [paymentTarget, setPaymentTarget] = useState<PaymentTarget | null>(
    null,
  );
  const [cancelingAccount, setCancelingAccount] =
    useState<FinancialAccount | null>(null);
  const [reversingPayment, setReversingPayment] =
    useState<FinancialPayment | null>(null);
  const [cashOpen, setCashOpen] = useState(false);
  const [cashClose, setCashClose] = useState<CashSession | null>(null);
  const [cashMovement, setCashMovement] = useState<{
    session: CashSession;
    type: CashMovementInput["type"];
  } | null>(null);
  const [reversingMovement, setReversingMovement] =
    useState<MovementRow | null>(null);
  const [catalogModal, setCatalogModal] = useState<CatalogModalState | null>(
    null,
  );

  const catalogsQuery = useFinancialCatalogs(companyId);
  const accountsQuery = useFinancialAccounts(companyId);
  const paymentsQuery = useFinancialPayments(companyId);
  const sessionsQuery = useCashSessions(companyId);
  const reportQuery = useFinancialReport(companyId, start, end);
  const saveAccountMutation = useSaveFinancialAccount(companyId);
  const cancelAccountMutation = useCancelFinancialAccount(companyId);
  const paymentMutation = useRegisterPayment(companyId);
  const reversePaymentMutation = useReversePayment(companyId);
  const openCashMutation = useOpenCashSession(companyId);
  const closeCashMutation = useCloseCashSession(companyId);
  const cashMovementMutation = useCreateCashMovement(companyId);
  const reverseMovementMutation = useReverseCashMovement(companyId);
  const categoryMutation = useSaveFinancialCategory(companyId);
  const methodMutation = useSavePaymentMethod(companyId);
  const drawerMutation = useSaveCashDrawer(companyId);
  const catalogs = catalogsQuery.data ?? {
    categories: [],
    paymentMethods: [],
    cashDrawers: [],
    clients: [],
    suppliers: [],
  };
  const accounts = useMemo(
    () => accountsQuery.data ?? [],
    [accountsQuery.data],
  );
  const payments = useMemo(
    () => paymentsQuery.data ?? [],
    [paymentsQuery.data],
  );
  const sessions = useMemo(
    () => sessionsQuery.data ?? [],
    [sessionsQuery.data],
  );
  const report = useMemo(() => reportQuery.data ?? [], [reportQuery.data]);
  const openSessions = sessions.filter(
    (session) => session.status === "aberta",
  );
  const movements = useMemo<MovementRow[]>(
    () =>
      sessions
        .flatMap((session) =>
          session.movimentos.map((movement) => ({ ...movement, session })),
        )
        .sort((a, b) => b.ocorrido_em.localeCompare(a.ocorrido_em)),
    [sessions],
  );
  const normalizedSearch = search.trim().toLocaleLowerCase("pt-BR");

  const filteredAccounts = useMemo(
    () =>
      accounts.filter((account) => {
        const matchesSearch =
          !normalizedSearch ||
          [
            account.descricao,
            account.documento,
            accountCounterparty(account),
            account.categoria?.nome,
            `#${account.id}`,
          ].some((value) =>
            value?.toLocaleLowerCase("pt-BR").includes(normalizedSearch),
          );
        return (
          matchesSearch &&
          (typeFilter === "todos" || account.tipo === typeFilter) &&
          (statusFilter === "todos" || account.status === statusFilter)
        );
      }),
    [accounts, normalizedSearch, statusFilter, typeFilter],
  );
  const filteredPayments = useMemo(
    () =>
      payments.filter((payment) => {
        const account = paymentAccount(payment);
        const matchesSearch =
          !normalizedSearch ||
          [
            payment.referencia,
            payment.forma?.nome,
            account?.descricao,
            `#${payment.id}`,
          ].some((value) =>
            value?.toLocaleLowerCase("pt-BR").includes(normalizedSearch),
          );
        return (
          matchesSearch &&
          (typeFilter === "todos" || payment.tipo === typeFilter) &&
          (statusFilter === "todos" || payment.status === statusFilter)
        );
      }),
    [payments, normalizedSearch, statusFilter, typeFilter],
  );
  const pagedAccounts = filteredAccounts.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );
  const pagedPayments = filteredPayments.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const confirmedThisMonth = payments.filter(
    (payment) =>
      payment.status === "confirmado" &&
      payment.data_pagamento.slice(0, 7) === currentMonth,
  );
  const receivedThisMonth = confirmedThisMonth
    .filter((payment) => payment.tipo === "entrada")
    .reduce((sum, payment) => sum + Number(payment.valor), 0);
  const paidThisMonth = confirmedThisMonth
    .filter((payment) => payment.tipo === "saida")
    .reduce((sum, payment) => sum + Number(payment.valor), 0);
  const receivable = accounts
    .filter(
      (account) =>
        account.tipo === "receber" &&
        !["paga", "cancelada"].includes(account.status),
    )
    .reduce((sum, account) => sum + accountBalance(account), 0);
  const overdue = accounts
    .flatMap((account) => account.parcelas)
    .filter((installment) => installment.status === "atrasada")
    .reduce((sum, installment) => sum + installmentBalance(installment), 0);
  const openCashBalance = openSessions.reduce(
    (sum, session) => sum + Number(session.saldo_esperado ?? 0),
    0,
  );
  const totals = reportTotals(report);
  const chartMax = Math.max(
    1,
    ...report.flatMap((row) => [
      Number(row.receitas_realizadas),
      Number(row.despesas_realizadas),
    ]),
  );
  const upcoming = accounts
    .flatMap((account) =>
      account.parcelas.map((installment) => ({ account, installment })),
    )
    .filter(
      ({ installment }) => !["paga", "cancelada"].includes(installment.status),
    )
    .sort((a, b) =>
      a.installment.data_vencimento.localeCompare(
        b.installment.data_vencimento,
      ),
    )
    .slice(0, 7);
  const loading =
    catalogsQuery.isPending ||
    accountsQuery.isPending ||
    paymentsQuery.isPending ||
    sessionsQuery.isPending;
  const queryError =
    catalogsQuery.error ??
    accountsQuery.error ??
    paymentsQuery.error ??
    sessionsQuery.error;

  const accountColumns: DataTableColumn<FinancialAccount>[] = [
    {
      id: "account",
      header: "Conta",
      cell: (account) => (
        <div className="finance-primary-cell">
          <strong>{account.descricao}</strong>
          <span>
            #{account.id} · {accountCounterparty(account)}
            {account.categoria ? ` · ${account.categoria.nome}` : ""}
          </span>
        </div>
      ),
    },
    {
      id: "type",
      header: "Tipo",
      cell: (account) => (
        <span
          className="finance-kind"
          data-direction={account.tipo === "receber" ? "in" : "out"}
        >
          {account.tipo === "receber" ? (
            <ArrowDownCircle size={16} />
          ) : (
            <ArrowUpCircle size={16} />
          )}
          {
            ACCOUNT_TYPE_LABELS[
              account.tipo as keyof typeof ACCOUNT_TYPE_LABELS
            ]
          }
        </span>
      ),
      hideOnMobile: true,
    },
    {
      id: "due",
      header: "Próximo vencimento",
      cell: (account) =>
        formatFinancialDate(nextOpenInstallment(account)?.data_vencimento),
      hideOnMobile: true,
    },
    {
      id: "total",
      header: "Total",
      cell: (account) => formatFinancialCurrency(account.valor_total),
      align: "right",
      hideOnMobile: true,
    },
    {
      id: "balance",
      header: "Saldo",
      cell: (account) => (
        <strong>{formatFinancialCurrency(accountBalance(account))}</strong>
      ),
      align: "right",
    },
    {
      id: "status",
      header: "Status",
      cell: (account) => (
        <span className="status-badge" data-status={account.status}>
          {ACCOUNT_STATUS_LABELS[
            account.status as keyof typeof ACCOUNT_STATUS_LABELS
          ] ?? account.status}
        </span>
      ),
    },
    {
      id: "actions",
      header: <span className="sr-only">Ações</span>,
      align: "right",
      cell: (account) => (
        <div className="finance-row-actions">
          <button
            className="btn btn--icon btn--ghost"
            type="button"
            onClick={() => setDetailsAccount(account)}
            aria-label={`Ver conta ${account.id}`}
          >
            <Eye size={17} />
          </button>
          {canManage && nextOpenInstallment(account) && (
            <button
              className="btn btn--icon btn--ghost action-success"
              type="button"
              onClick={() =>
                setPaymentTarget({
                  account,
                  installment: nextOpenInstallment(account)!,
                })
              }
              aria-label={
                account.tipo === "receber" ? "Receber parcela" : "Pagar parcela"
              }
            >
              <CircleDollarSign size={18} />
            </button>
          )}
        </div>
      ),
    },
  ];
  const paymentColumns: DataTableColumn<FinancialPayment>[] = [
    {
      id: "date",
      header: "Data",
      cell: (payment) => formatFinancialDateTime(payment.data_pagamento),
    },
    {
      id: "payment",
      header: "Pagamento",
      cell: (payment) => (
        <div className="finance-primary-cell">
          <strong>
            {paymentAccount(payment)?.descricao ??
              payment.referencia ??
              `Pagamento #${payment.id}`}
          </strong>
          <span>
            #{payment.id} · {payment.forma?.nome ?? "Forma removida"}
            {payment.sessao?.caixa ? ` · ${payment.sessao.caixa.nome}` : ""}
          </span>
        </div>
      ),
    },
    {
      id: "type",
      header: "Tipo",
      cell: (payment) => (
        <span
          className="finance-kind"
          data-direction={payment.tipo === "entrada" ? "in" : "out"}
        >
          {payment.tipo === "entrada" ? "Entrada" : "Saída"}
        </span>
      ),
      hideOnMobile: true,
    },
    {
      id: "amount",
      header: "Valor",
      cell: (payment) => (
        <strong
          className="finance-money"
          data-direction={payment.tipo === "entrada" ? "in" : "out"}
        >
          {payment.tipo === "entrada" ? "+" : "−"}
          {formatFinancialCurrency(payment.valor)}
        </strong>
      ),
      align: "right",
    },
    {
      id: "status",
      header: "Status",
      cell: (payment) => (
        <span className="status-badge" data-status={payment.status}>
          {PAYMENT_STATUS_LABELS[
            payment.status as keyof typeof PAYMENT_STATUS_LABELS
          ] ?? payment.status}
        </span>
      ),
    },
    {
      id: "actions",
      header: <span className="sr-only">Ações</span>,
      align: "right",
      cell: (payment) =>
        canManage && payment.status === "confirmado" ? (
          <button
            className="btn btn--icon btn--ghost action-danger"
            type="button"
            onClick={() => setReversingPayment(payment)}
            aria-label={`Estornar pagamento ${payment.id}`}
          >
            <RotateCcw size={17} />
          </button>
        ) : null,
    },
  ];
  const movementColumns: DataTableColumn<MovementRow>[] = [
    {
      id: "date",
      header: "Data",
      cell: (movement) => formatFinancialDateTime(movement.ocorrido_em),
    },
    {
      id: "movement",
      header: "Movimento",
      cell: (movement) => (
        <div className="finance-primary-cell">
          <strong>{movement.descricao}</strong>
          <span>
            {movement.session.caixa?.nome ?? "Caixa"} ·{" "}
            {CASH_MOVEMENT_LABELS[
              movement.tipo as keyof typeof CASH_MOVEMENT_LABELS
            ] ?? movement.tipo}
          </span>
        </div>
      ),
    },
    {
      id: "origin",
      header: "Origem",
      cell: (movement) =>
        movement.origem === "manual" ? "Manual" : "Pagamento",
      hideOnMobile: true,
    },
    {
      id: "amount",
      header: "Valor",
      cell: (movement) => {
        const incoming = ["entrada", "suprimento", "ajuste_entrada"].includes(
          movement.tipo,
        );
        return (
          <strong
            className="finance-money"
            data-direction={incoming ? "in" : "out"}
          >
            {incoming ? "+" : "−"}
            {formatFinancialCurrency(movement.valor)}
          </strong>
        );
      },
      align: "right",
    },
    {
      id: "status",
      header: "Status",
      cell: (movement) => (
        <span className="status-badge" data-status={movement.status}>
          {movement.status === "ativo" ? "Ativo" : "Estornado"}
        </span>
      ),
    },
    {
      id: "actions",
      header: <span className="sr-only">Ações</span>,
      align: "right",
      cell: (movement) =>
        canManage &&
        movement.origem === "manual" &&
        movement.status === "ativo" &&
        movement.session.status === "aberta" ? (
          <button
            className="btn btn--icon btn--ghost action-danger"
            type="button"
            onClick={() => setReversingMovement(movement)}
            aria-label={`Estornar movimento ${movement.id}`}
          >
            <RotateCcw size={17} />
          </button>
        ) : null,
    },
  ];

  function changeTab(next: FinanceTab) {
    setTab(next);
    setSearch("");
    setStatusFilter("todos");
    setTypeFilter("todos");
    setPage(1);
  }
  function changeSearch(value: string) {
    setSearch(value);
    setPage(1);
  }
  function changeTypeFilter(value: string) {
    setTypeFilter(value);
    setPage(1);
  }
  function changeStatusFilter(value: string) {
    setStatusFilter(value);
    setPage(1);
  }
  function clearFilters() {
    setTypeFilter("todos");
    setStatusFilter("todos");
    setPage(1);
  }
  async function submitAccount(input: AccountWriteInput) {
    await saveAccountMutation.mutateAsync(input);
    setAccountForm(null);
  }
  async function submitPayment(input: PaymentWriteInput) {
    await paymentMutation.mutateAsync(input);
    setPaymentTarget(null);
    setDetailsAccount(null);
  }
  async function submitCashOpen(input: CashOpenInput) {
    await openCashMutation.mutateAsync(input);
    setCashOpen(false);
  }
  async function submitCashClose(input: CashCloseInput) {
    await closeCashMutation.mutateAsync(input);
    setCashClose(null);
  }
  async function submitCashMovement(input: CashMovementInput) {
    await cashMovementMutation.mutateAsync(input);
    setCashMovement(null);
  }
  async function saveCategory(input: CategoryWriteInput) {
    await categoryMutation.mutateAsync(input);
    setCatalogModal(null);
  }
  async function saveMethod(input: PaymentMethodWriteInput) {
    await methodMutation.mutateAsync(input);
    setCatalogModal(null);
  }
  async function saveDrawer(input: CashDrawerWriteInput) {
    await drawerMutation.mutateAsync(input);
    setCatalogModal(null);
  }
  async function retryAll() {
    await Promise.all([
      catalogsQuery.refetch(),
      accountsQuery.refetch(),
      paymentsQuery.refetch(),
      sessionsQuery.refetch(),
      reportQuery.refetch(),
    ]);
  }

  return (
    <div className="page finance-page">
      <header className="page-header">
        <div className="page-header__content">
          <span className="page-eyebrow">Gestão</span>
          <h1>Financeiro</h1>
          <p>Contas, recebimentos e caixa reunidos em uma visão confiável.</p>
        </div>
        {canManage && (
          <div className="page-actions">
            <button
              className="btn btn--primary"
              type="button"
              onClick={() => setAccountForm("new")}
            >
              <Plus size={18} /> Nova conta
            </button>
          </div>
        )}
      </header>
      <section className="finance-metrics" aria-label="Resumo financeiro">
        <article>
          <span>Receitas no mês</span>
          <strong>{formatFinancialCurrency(receivedThisMonth)}</strong>
          <small>pagamentos confirmados</small>
        </article>
        <article data-tone="danger">
          <span>Despesas no mês</span>
          <strong>{formatFinancialCurrency(paidThisMonth)}</strong>
          <small>pagamentos confirmados</small>
        </article>
        <article data-tone={overdue > 0 ? "warning" : undefined}>
          <span>A receber</span>
          <strong>{formatFinancialCurrency(receivable)}</strong>
          <small>
            {overdue > 0
              ? `${formatFinancialCurrency(overdue)} em atraso`
              : "nenhuma parcela atrasada"}
          </small>
        </article>
        <article>
          <span>Caixas abertos</span>
          <strong>{formatFinancialCurrency(openCashBalance)}</strong>
          <small>
            {openSessions.length}{" "}
            {openSessions.length === 1 ? "sessão aberta" : "sessões abertas"}
          </small>
        </article>
      </section>
      <nav className="finance-tabs" aria-label="Seções financeiras">
        <button
          type="button"
          data-active={tab === "overview"}
          onClick={() => changeTab("overview")}
        >
          <BarChart3 size={17} /> Visão geral
        </button>
        <button
          type="button"
          data-active={tab === "accounts"}
          onClick={() => changeTab("accounts")}
        >
          <ReceiptText size={17} /> Contas
        </button>
        <button
          type="button"
          data-active={tab === "payments"}
          onClick={() => changeTab("payments")}
        >
          <CreditCard size={17} /> Pagamentos
        </button>
        <button
          type="button"
          data-active={tab === "cash"}
          onClick={() => changeTab("cash")}
        >
          <Banknote size={17} /> Caixa
        </button>
        {canManage && (
          <button
            type="button"
            data-active={tab === "settings"}
            onClick={() => changeTab("settings")}
          >
            <Settings2 size={17} /> Cadastros
          </button>
        )}
      </nav>

      {queryError && (
        <ErrorState
          error={queryError}
          onRetry={() => void retryAll()}
          isRetrying={loading}
        />
      )}
      {!queryError && tab === "overview" && (
        <section className="finance-overview">
          <article className="card finance-report-card">
            <header>
              <div>
                <span className="page-eyebrow">Fluxo financeiro</span>
                <h2>Realizado por mês</h2>
                <p>Compare entradas e saídas confirmadas no período.</p>
              </div>
              <div className="finance-date-range">
                <label>
                  De
                  <input
                    className="input"
                    type="date"
                    value={start}
                    max={end}
                    onChange={(event) =>
                      setReportRange((range) => ({
                        ...range,
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
                      setReportRange((range) => ({
                        ...range,
                        end: event.target.value,
                      }))
                    }
                  />
                </label>
              </div>
            </header>
            {reportQuery.error ? (
              <ErrorState
                error={reportQuery.error}
                onRetry={() => void reportQuery.refetch()}
              />
            ) : reportQuery.isPending ? (
              <div className="finance-chart finance-chart--loading" />
            ) : report.length === 0 ? (
              <EmptyState
                icon={BarChart3}
                title="Sem dados no período"
                description="Os valores previstos e realizados aparecerão após os primeiros lançamentos."
                compact
              />
            ) : (
              <>
                <div
                  className="finance-chart"
                  aria-label="Gráfico de receitas e despesas realizadas"
                >
                  {report.map((row) => (
                    <div className="finance-chart__month" key={row.mes}>
                      <div className="finance-chart__bars">
                        <span
                          data-kind="income"
                          style={{
                            height: `${Math.max(3, (Number(row.receitas_realizadas) / chartMax) * 100)}%`,
                          }}
                          title={`Receitas: ${formatFinancialCurrency(row.receitas_realizadas)}`}
                        />
                        <span
                          data-kind="expense"
                          style={{
                            height: `${Math.max(3, (Number(row.despesas_realizadas) / chartMax) * 100)}%`,
                          }}
                          title={`Despesas: ${formatFinancialCurrency(row.despesas_realizadas)}`}
                        />
                      </div>
                      <small>{formatMonth(row.mes)}</small>
                    </div>
                  ))}
                </div>
                <div className="finance-chart-legend">
                  <span data-kind="income" />
                  Receitas
                  <span data-kind="expense" />
                  Despesas
                </div>
              </>
            )}
          </article>
          <aside className="card finance-summary-card">
            <header>
              <span className="page-eyebrow">Período selecionado</span>
              <h2>Resumo</h2>
            </header>
            <dl>
              <div>
                <dt>Receitas previstas</dt>
                <dd>{formatFinancialCurrency(totals.expectedIncome)}</dd>
              </div>
              <div>
                <dt>Receitas realizadas</dt>
                <dd data-tone="positive">
                  {formatFinancialCurrency(totals.received)}
                </dd>
              </div>
              <div>
                <dt>Despesas previstas</dt>
                <dd>{formatFinancialCurrency(totals.expectedExpense)}</dd>
              </div>
              <div>
                <dt>Despesas realizadas</dt>
                <dd data-tone="negative">
                  {formatFinancialCurrency(totals.paid)}
                </dd>
              </div>
              <div className="finance-summary-card__balance">
                <dt>Resultado realizado</dt>
                <dd
                  data-tone={
                    totals.received - totals.paid >= 0 ? "positive" : "negative"
                  }
                >
                  {formatFinancialCurrency(totals.received - totals.paid)}
                </dd>
              </div>
            </dl>
          </aside>
          <article className="card finance-due-card">
            <header>
              <div>
                <span className="page-eyebrow">Próximos compromissos</span>
                <h2>Vencimentos</h2>
              </div>
              <button
                className="btn btn--ghost btn--small"
                type="button"
                onClick={() => changeTab("accounts")}
              >
                Ver contas
              </button>
            </header>
            {!loading && upcoming.length === 0 ? (
              <EmptyState
                icon={CalendarClock}
                title="Nenhum vencimento em aberto"
                description="As próximas parcelas aparecerão aqui."
                compact
              />
            ) : (
              <div className="finance-due-list">
                {upcoming.map(({ account, installment }) => (
                  <button
                    type="button"
                    key={installment.id}
                    onClick={() => setDetailsAccount(account)}
                  >
                    <span
                      className="finance-due-icon"
                      data-direction={account.tipo === "receber" ? "in" : "out"}
                    >
                      {account.tipo === "receber" ? (
                        <ArrowDownToLine size={17} />
                      ) : (
                        <ArrowUpFromLine size={17} />
                      )}
                    </span>
                    <span>
                      <strong>{account.descricao}</strong>
                      <small>
                        {formatFinancialDate(installment.data_vencimento)} ·
                        parcela {installment.numero_parcela}
                      </small>
                    </span>
                    <strong>
                      {formatFinancialCurrency(installmentBalance(installment))}
                    </strong>
                    <span
                      className="status-badge"
                      data-status={installment.status}
                    >
                      {installment.status === "atrasada"
                        ? "Atrasada"
                        : "Em aberto"}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </article>
        </section>
      )}

      {!queryError && tab === "accounts" && (
        <section className="card finance-list-card">
          <FilterBar
            search={
              <SearchInput
                value={search}
                onChange={changeSearch}
                placeholder="Buscar conta, cliente ou fornecedor..."
                label="Buscar contas"
              />
            }
            activeFilterCount={
              Number(typeFilter !== "todos") + Number(statusFilter !== "todos")
            }
            onClearFilters={clearFilters}
            actions={
              canManage ? (
                <button
                  className="btn btn--secondary"
                  type="button"
                  onClick={() => setAccountForm("new")}
                >
                  <Plus size={17} /> Nova conta
                </button>
              ) : undefined
            }
          >
            <label className="finance-filter">
              <span>Tipo</span>
              <select
                className="select"
                value={typeFilter}
                onChange={(event) => changeTypeFilter(event.target.value)}
              >
                <option value="todos">Todos</option>
                <option value="receber">A receber</option>
                <option value="pagar">A pagar</option>
              </select>
            </label>
            <label className="finance-filter">
              <span>Status</span>
              <select
                className="select"
                value={statusFilter}
                onChange={(event) => changeStatusFilter(event.target.value)}
              >
                <option value="todos">Todos</option>
                <option value="aberta">Em aberto</option>
                <option value="parcial">Parcial</option>
                <option value="vencida">Vencida</option>
                <option value="paga">Paga</option>
                <option value="cancelada">Cancelada</option>
              </select>
            </label>
          </FilterBar>
          <DataTable
            data={pagedAccounts}
            columns={accountColumns}
            rowKey="id"
            isLoading={accountsQuery.isPending}
            emptyIcon={ReceiptText}
            emptyTitle="Nenhuma conta encontrada"
            emptyDescription={
              search || typeFilter !== "todos" || statusFilter !== "todos"
                ? "Ajuste os filtros para encontrar outro lançamento."
                : "Crie uma conta a pagar ou receber para começar."
            }
            emptyAction={
              canManage && !search ? (
                <button
                  className="btn btn--primary"
                  type="button"
                  onClick={() => setAccountForm("new")}
                >
                  <Plus size={17} /> Nova conta
                </button>
              ) : undefined
            }
          />
          <Pagination
            page={page}
            totalPages={Math.ceil(filteredAccounts.length / PAGE_SIZE)}
            totalItems={filteredAccounts.length}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
            disabled={accountsQuery.isFetching}
          />
        </section>
      )}

      {!queryError && tab === "payments" && (
        <section className="card finance-list-card">
          <FilterBar
            search={
              <SearchInput
                value={search}
                onChange={changeSearch}
                placeholder="Buscar pagamento, conta ou referência..."
                label="Buscar pagamentos"
              />
            }
            activeFilterCount={
              Number(typeFilter !== "todos") + Number(statusFilter !== "todos")
            }
            onClearFilters={clearFilters}
          >
            <label className="finance-filter">
              <span>Tipo</span>
              <select
                className="select"
                value={typeFilter}
                onChange={(event) => changeTypeFilter(event.target.value)}
              >
                <option value="todos">Todos</option>
                <option value="entrada">Entradas</option>
                <option value="saida">Saídas</option>
              </select>
            </label>
            <label className="finance-filter">
              <span>Status</span>
              <select
                className="select"
                value={statusFilter}
                onChange={(event) => changeStatusFilter(event.target.value)}
              >
                <option value="todos">Todos</option>
                <option value="confirmado">Confirmados</option>
                <option value="estornado">Estornados</option>
              </select>
            </label>
          </FilterBar>
          <DataTable
            data={pagedPayments}
            columns={paymentColumns}
            rowKey="id"
            isLoading={paymentsQuery.isPending}
            emptyIcon={CreditCard}
            emptyTitle="Nenhum pagamento encontrado"
            emptyDescription="Os recebimentos e pagamentos confirmados nas parcelas aparecerão aqui."
          />
          <Pagination
            page={page}
            totalPages={Math.ceil(filteredPayments.length / PAGE_SIZE)}
            totalItems={filteredPayments.length}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
            disabled={paymentsQuery.isFetching}
          />
        </section>
      )}

      {!queryError && tab === "cash" && (
        <section className="finance-cash-section">
          <div className="finance-section-heading">
            <div>
              <span className="page-eyebrow">Operação física</span>
              <h2>Sessões de caixa</h2>
              <p>Abra, confira e feche cada caixa separadamente.</p>
            </div>
            {canManage && (
              <button
                className="btn btn--primary"
                type="button"
                onClick={() => setCashOpen(true)}
              >
                <Landmark size={18} /> Abrir caixa
              </button>
            )}
          </div>
          {sessionsQuery.isPending ? (
            <div className="card finance-cash-empty" />
          ) : openSessions.length === 0 ? (
            <EmptyState
              icon={Landmark}
              title="Nenhum caixa aberto"
              description="Abra uma sessão para registrar dinheiro, sangrias e suprimentos."
              action={
                canManage ? (
                  <button
                    className="btn btn--primary"
                    type="button"
                    onClick={() => setCashOpen(true)}
                  >
                    Abrir caixa
                  </button>
                ) : undefined
              }
            />
          ) : (
            <div className="finance-open-sessions">
              {openSessions.map((session) => (
                <article className="card" key={session.id}>
                  <header>
                    <span className="finance-cash-icon">
                      <Landmark size={20} />
                    </span>
                    <div>
                      <strong>
                        {session.caixa?.nome ?? `Caixa #${session.id_caixa}`}
                      </strong>
                      <small>
                        Aberto em {formatFinancialDateTime(session.aberta_em)}
                      </small>
                    </div>
                    <span className="status-badge" data-status="aberta">
                      Aberto
                    </span>
                  </header>
                  <div className="finance-cash-balance">
                    <span>Saldo esperado</span>
                    <strong>
                      {formatFinancialCurrency(session.saldo_esperado)}
                    </strong>
                  </div>
                  <dl>
                    <div>
                      <dt>Entradas</dt>
                      <dd>{formatFinancialCurrency(session.total_entradas)}</dd>
                    </div>
                    <div>
                      <dt>Saídas</dt>
                      <dd>{formatFinancialCurrency(session.total_saidas)}</dd>
                    </div>
                    <div>
                      <dt>Suprimentos</dt>
                      <dd>
                        {formatFinancialCurrency(session.total_suprimentos)}
                      </dd>
                    </div>
                    <div>
                      <dt>Sangrias</dt>
                      <dd>{formatFinancialCurrency(session.total_sangrias)}</dd>
                    </div>
                  </dl>
                  {canManage && (
                    <footer>
                      <button
                        className="btn btn--secondary btn--small"
                        type="button"
                        onClick={() =>
                          setCashMovement({ session, type: "suprimento" })
                        }
                      >
                        <ArrowDownToLine size={16} /> Suprimento
                      </button>
                      <button
                        className="btn btn--secondary btn--small"
                        type="button"
                        onClick={() =>
                          setCashMovement({ session, type: "sangria" })
                        }
                      >
                        <ArrowUpFromLine size={16} /> Sangria
                      </button>
                      <button
                        className="btn btn--primary btn--small"
                        type="button"
                        onClick={() => setCashClose(session)}
                      >
                        Fechar caixa
                      </button>
                    </footer>
                  )}
                </article>
              ))}
            </div>
          )}
          <div className="card finance-list-card">
            <div className="finance-list-heading">
              <div>
                <span className="page-eyebrow">Histórico</span>
                <h2>Movimentações de caixa</h2>
              </div>
            </div>
            <DataTable
              data={movements.slice(0, 100)}
              columns={movementColumns}
              rowKey="id"
              isLoading={sessionsQuery.isPending}
              emptyIcon={WalletCards}
              emptyTitle="Nenhuma movimentação"
              emptyDescription="Pagamentos em dinheiro e movimentos manuais aparecerão aqui."
            />
          </div>
        </section>
      )}

      {!queryError && tab === "settings" && canManage && (
        <section className="finance-settings">
          <CatalogSection
            icon={ReceiptText}
            title="Categorias financeiras"
            description="Classifique receitas e despesas nos relatórios."
            onAdd={() => setCatalogModal({ kind: "category" })}
          >
            {catalogs.categories.map((category) => (
              <CatalogItem
                key={category.id}
                name={category.nome}
                detail={
                  category.tipo === "entrada"
                    ? "Receitas"
                    : category.tipo === "saida"
                      ? "Despesas"
                      : "Receitas e despesas"
                }
                active={category.ativo}
                onEdit={() =>
                  setCatalogModal({ kind: "category", item: category })
                }
              />
            ))}
          </CatalogSection>
          <CatalogSection
            icon={CreditCard}
            title="Formas de pagamento"
            description="Configure PIX, dinheiro, cartões, taxas e prazos."
            onAdd={() => setCatalogModal({ kind: "method" })}
          >
            {catalogs.paymentMethods.map((method) => (
              <CatalogItem
                key={method.id}
                name={method.nome}
                detail={`${PAYMENT_METHOD_LABELS[method.tipo as keyof typeof PAYMENT_METHOD_LABELS] ?? method.tipo}${Number(method.taxa_percentual) ? ` · taxa ${method.taxa_percentual}%` : ""}`}
                active={method.ativo}
                onEdit={() => setCatalogModal({ kind: "method", item: method })}
              />
            ))}
          </CatalogSection>
          <CatalogSection
            icon={Landmark}
            title="Caixas"
            description="Separe balcões ou pontos de recebimento físico."
            onAdd={() => setCatalogModal({ kind: "drawer" })}
          >
            {catalogs.cashDrawers.map((drawer) => (
              <CatalogItem
                key={drawer.id}
                name={drawer.nome}
                detail={
                  [drawer.codigo, drawer.localizacao]
                    .filter(Boolean)
                    .join(" · ") || "Sem código ou localização"
                }
                active={drawer.ativo}
                onEdit={() => setCatalogModal({ kind: "drawer", item: drawer })}
              />
            ))}
          </CatalogSection>
        </section>
      )}

      {accountForm && (
        <AccountFormModal
          key={accountForm === "new" ? "new" : accountForm.id}
          companyId={companyId}
          account={accountForm === "new" ? undefined : accountForm}
          catalogs={catalogs}
          isSubmitting={saveAccountMutation.isPending}
          onClose={() => setAccountForm(null)}
          onSubmit={submitAccount}
        />
      )}
      {detailsAccount && (
        <AccountDetailsModal
          account={detailsAccount}
          canManage={canManage}
          onClose={() => setDetailsAccount(null)}
          onPay={(installment) =>
            setPaymentTarget({ account: detailsAccount, installment })
          }
          onEdit={() => {
            setAccountForm(detailsAccount);
            setDetailsAccount(null);
          }}
          onCancel={() => {
            setCancelingAccount(detailsAccount);
            setDetailsAccount(null);
          }}
        />
      )}
      {paymentTarget && (
        <PaymentModal
          key={paymentTarget.installment.id}
          companyId={companyId}
          account={paymentTarget.account}
          installment={paymentTarget.installment}
          catalogs={catalogs}
          sessions={sessions}
          isSubmitting={paymentMutation.isPending}
          onClose={() => setPaymentTarget(null)}
          onSubmit={submitPayment}
        />
      )}
      {cancelingAccount && (
        <ReasonDialog
          title="Cancelar conta"
          description={`A conta “${cancelingAccount.descricao}” e suas parcelas abertas serão canceladas.`}
          confirmLabel="Cancelar conta"
          isSubmitting={cancelAccountMutation.isPending}
          onClose={() => setCancelingAccount(null)}
          onConfirm={async (reason) => {
            await cancelAccountMutation.mutateAsync({
              companyId,
              accountId: cancelingAccount.id,
              reason,
            });
            setCancelingAccount(null);
          }}
        />
      )}
      {reversingPayment && (
        <ReasonDialog
          title="Estornar pagamento"
          description={`O valor de ${formatFinancialCurrency(reversingPayment.valor)} voltará para o saldo das parcelas.`}
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
      {cashOpen && (
        <CashOpenModal
          companyId={companyId}
          catalogs={catalogs}
          sessions={sessions}
          isSubmitting={openCashMutation.isPending}
          onClose={() => setCashOpen(false)}
          onSubmit={submitCashOpen}
        />
      )}
      {cashClose && (
        <CashCloseModal
          companyId={companyId}
          session={cashClose}
          isSubmitting={closeCashMutation.isPending}
          onClose={() => setCashClose(null)}
          onSubmit={submitCashClose}
        />
      )}
      {cashMovement && (
        <CashMovementModal
          key={`${cashMovement.session.id}-${cashMovement.type}`}
          companyId={companyId}
          session={cashMovement.session}
          initialType={cashMovement.type}
          isSubmitting={cashMovementMutation.isPending}
          onClose={() => setCashMovement(null)}
          onSubmit={submitCashMovement}
        />
      )}
      {reversingMovement && (
        <ReasonDialog
          title="Estornar movimento"
          description={`O movimento de ${formatFinancialCurrency(reversingMovement.valor)} será desfeito no caixa aberto.`}
          confirmLabel="Estornar movimento"
          isSubmitting={reverseMovementMutation.isPending}
          onClose={() => setReversingMovement(null)}
          onConfirm={async (reason) => {
            await reverseMovementMutation.mutateAsync({
              companyId,
              id: reversingMovement.id,
              reason,
            });
            setReversingMovement(null);
          }}
        />
      )}
      {catalogModal && (
        <FinancialCatalogModal
          key={`${catalogModal.kind}-${catalogModal.item?.id ?? "new"}`}
          companyId={companyId}
          state={catalogModal}
          isSubmitting={
            categoryMutation.isPending ||
            methodMutation.isPending ||
            drawerMutation.isPending
          }
          onClose={() => setCatalogModal(null)}
          onSaveCategory={saveCategory}
          onSaveMethod={saveMethod}
          onSaveDrawer={saveDrawer}
        />
      )}
    </div>
  );
}

function CatalogSection({
  icon: Icon,
  title,
  description,
  onAdd,
  children,
}: {
  icon: typeof ReceiptText;
  title: string;
  description: string;
  onAdd: () => void;
  children: ReactNode;
}) {
  return (
    <article className="card finance-catalog">
      <header>
        <span className="finance-catalog__icon">
          <Icon size={20} />
        </span>
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        <button
          className="btn btn--icon btn--secondary"
          type="button"
          onClick={onAdd}
          aria-label={`Adicionar em ${title}`}
        >
          <Plus size={18} />
        </button>
      </header>
      <div className="finance-catalog__list">{children}</div>
    </article>
  );
}

function CatalogItem({
  name,
  detail,
  active,
  onEdit,
}: {
  name: string;
  detail: string;
  active: boolean;
  onEdit: () => void;
}) {
  return (
    <div className="finance-catalog__item">
      <div>
        <strong>{name}</strong>
        <span>{detail}</span>
      </div>
      <span
        className="status-badge"
        data-status={active ? "active" : "cancelada"}
      >
        {active ? "Ativo" : "Inativo"}
      </span>
      <button
        className="btn btn--icon btn--ghost"
        type="button"
        onClick={onEdit}
        aria-label={`Editar ${name}`}
      >
        <Edit3 size={16} />
      </button>
    </div>
  );
}
