import {
  CheckCircle2,
  ClipboardList,
  Edit3,
  Eye,
  Plus,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  DataTable,
  FilterBar,
  Pagination,
  SearchInput,
  type DataTableColumn,
} from "../../components_shared";
import { useAccess } from "../../features/access/hooks/useAccess";
import { useAuth } from "../../features/auth/hooks/useAuth";
import { CommandCancelDialog } from "../../features/commercial/components/CommandCancelDialog";
import { CommandCloseDialog } from "../../features/commercial/components/CommandCloseDialog";
import { CommandFormModal } from "../../features/commercial/components/CommandFormModal";
import { CommercialDetailsModal } from "../../features/commercial/components/CommercialDetailsModal";
import {
  useCancelCommand,
  useCloseCommand,
  useCommands,
  useCommercialCatalogs,
  useSaveCommand,
} from "../../features/commercial/hooks/useCommercial";
import type {
  CancelCommandInput,
  CloseCommandInput,
  Command,
  CommandStatus,
  CommandWriteInput,
} from "../../features/commercial/types/commercial.types";
import {
  COMMAND_STATUS_LABELS,
  commandPaymentDisplay,
  formatCommercialCurrency,
  formatCommercialDateTime,
} from "../../features/commercial/utils/commercial.utils";
import "../../features/commercial/commercial.css";

export function Comandas() {
  const { empresaAtual } = useAuth();
  const { cargo } = useAccess();
  const companyId = empresaAtual?.id ?? 0;
  const canManage =
    cargo === "dono" || cargo === "gerente" || cargo === "recepcionista";
  const commandsQuery = useCommands(companyId);
  const catalogsQuery = useCommercialCatalogs(companyId);
  const saveMutation = useSaveCommand(companyId);
  const closeMutation = useCloseCommand(companyId);
  const cancelMutation = useCancelCommand(companyId);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"todos" | CommandStatus>("todos");
  const [page, setPage] = useState(1);
  const [formCommand, setFormCommand] = useState<Command | "new" | null>(null);
  const [detailsCommand, setDetailsCommand] = useState<Command | null>(null);
  const [closingCommand, setClosingCommand] = useState<Command | null>(null);
  const [cancelingCommand, setCancelingCommand] = useState<Command | null>(
    null,
  );
  const commands = useMemo(
    () => commandsQuery.data ?? [],
    [commandsQuery.data],
  );
  const metrics = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    const closed30 = commands.filter(
      (command) =>
        command.status === "fechada" &&
        command.fechada_em &&
        new Date(command.fechada_em) >= cutoff,
    );
    const closedToday = commands.filter(
      (command) =>
        command.status === "fechada" &&
        command.fechada_em?.slice(0, 10) === today,
    );
    return {
      open: commands.filter((command) => command.status === "aberta").length,
      closedToday: closedToday.length,
      totalToday: closedToday.reduce(
        (sum, command) => sum + Number(command.valor_total ?? 0),
        0,
      ),
      average: closed30.length
        ? closed30.reduce(
            (sum, command) => sum + Number(command.valor_total ?? 0),
            0,
          ) / closed30.length
        : 0,
    };
  }, [commands]);
  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("pt-BR");
    return commands.filter((command) => {
      const matches =
        !term ||
        [
          command.cliente?.nome,
          command.responsavel?.nome,
          `#${command.id}`,
          COMMAND_STATUS_LABELS[
            command.status as keyof typeof COMMAND_STATUS_LABELS
          ],
        ].some((value) => value?.toLocaleLowerCase("pt-BR").includes(term));
      return matches && (status === "todos" || command.status === status);
    });
  }, [commands, search, status]);
  const pageSize = 12;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize,
  );
  const columns: DataTableColumn<Command>[] = [
    {
      id: "command",
      header: "Comanda",
      cell: (command) => (
        <div className="commercial-primary-cell">
          <strong>Comanda #{command.id}</strong>
          <span>
            {command.itens.length}{" "}
            {command.itens.length === 1 ? "item" : "itens"} · aberta{" "}
            {formatCommercialDateTime(command.aberta_em)}
          </span>
        </div>
      ),
    },
    {
      id: "client",
      header: "Cliente",
      cell: (command) => command.cliente?.nome ?? "—",
    },
    {
      id: "responsible",
      header: "Responsável",
      cell: (command) => command.responsavel?.nome ?? "—",
      hideOnMobile: true,
    },
    {
      id: "total",
      header: "Total",
      cell: (command) => (
        <strong>{formatCommercialCurrency(command.valor_total)}</strong>
      ),
      align: "right",
    },
    {
      id: "payment",
      header: "Pagamento",
      cell: (command) => {
        const payment = commandPaymentDisplay(command);
        return <span className="payment-badge" data-payment-status={payment.status}>{payment.label}</span>;
      },
    },
    {
      id: "status",
      header: "Status",
      cell: (command) => (
        <span className="status-badge" data-status={command.status}>
          {
            COMMAND_STATUS_LABELS[
              command.status as keyof typeof COMMAND_STATUS_LABELS
            ]
          }
        </span>
      ),
    },
    {
      id: "actions",
      header: <span className="sr-only">Ações</span>,
      align: "right",
      cell: (command) => (
        <div className="commercial-row-actions">
          <button
            className="btn btn--icon btn--ghost"
            type="button"
            onClick={() => setDetailsCommand(command)}
            aria-label={`Ver comanda ${command.id}`}
          >
            <Eye size={17} />
          </button>
          {canManage && command.status === "aberta" && (
            <>
              <button
                className="btn btn--icon btn--ghost"
                type="button"
                onClick={() => setFormCommand(command)}
                aria-label={`Editar comanda ${command.id}`}
              >
                <Edit3 size={17} />
              </button>
              <button
                className="btn btn--icon btn--ghost action-success"
                type="button"
                onClick={() => setClosingCommand(command)}
                aria-label={`Fechar comanda ${command.id}`}
              >
                <CheckCircle2 size={18} />
              </button>
            </>
          )}
          {canManage && command.status !== "cancelada" && (
            <button
              className="btn btn--icon btn--ghost action-danger"
              type="button"
              onClick={() => setCancelingCommand(command)}
              aria-label={`Cancelar comanda ${command.id}`}
            >
              <XCircle size={17} />
            </button>
          )}
        </div>
      ),
    },
  ];
  async function submitCommand(input: CommandWriteInput) {
    await saveMutation.mutateAsync(input);
    setFormCommand(null);
  }
  async function submitClose(input: CloseCommandInput) {
    await closeMutation.mutateAsync(input);
    setClosingCommand(null);
  }
  async function submitCancel(input: CancelCommandInput) {
    await cancelMutation.mutateAsync(input);
    setCancelingCommand(null);
  }
  return (
    <div className="page commercial-page">
      <header className="page-header">
        <div className="page-header__content">
          <span className="page-eyebrow">Atendimento</span>
          <h1>Comandas</h1>
          <p>
            Serviços, produtos, descontos e fechamento operacional do
            atendimento.
          </p>
        </div>
        <div className="page-actions">
          {!canManage && (
            <span className="commercial-read-only">
              <ShieldCheck size={16} /> Somente leitura
            </span>
          )}
          {canManage && (
            <button
              className="btn btn--primary"
              type="button"
              onClick={() => setFormCommand("new")}
            >
              <Plus size={18} /> Nova comanda
            </button>
          )}
        </div>
      </header>
      <section className="commercial-metrics">
        <article data-tone="warning">
          <span>Em aberto</span>
          <strong>{metrics.open}</strong>
          <small>comandas ativas</small>
        </article>
        <article data-tone="success">
          <span>Fechadas hoje</span>
          <strong>{metrics.closedToday}</strong>
          <small>atendimentos concluídos</small>
        </article>
        <article>
          <span>Ticket médio</span>
          <strong>{formatCommercialCurrency(metrics.average)}</strong>
          <small>nos últimos 30 dias</small>
        </article>
        <article>
          <span>Total hoje</span>
          <strong>{formatCommercialCurrency(metrics.totalToday)}</strong>
          <small>valor fechado</small>
        </article>
      </section>
      <section className="card commercial-list-card">
        <FilterBar
          search={
            <SearchInput
              value={search}
              onChange={(value) => {
                setSearch(value);
                setPage(1);
              }}
              placeholder="Buscar número, cliente ou profissional..."
              label="Buscar comandas"
            />
          }
          activeFilterCount={status === "todos" ? 0 : 1}
          onClearFilters={() => {
            setStatus("todos");
            setPage(1);
          }}
        >
          <label className="commercial-filter">
            <span>Status</span>
            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value as typeof status);
                setPage(1);
              }}
            >
              <option value="todos">Todos</option>
              {(
                Object.entries(COMMAND_STATUS_LABELS) as [
                  CommandStatus,
                  string,
                ][]
              ).map(([value, label]) => (
                <option value={value} key={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </FilterBar>
        <DataTable
          data={pageItems}
          columns={columns}
          rowKey="id"
          isLoading={commandsQuery.isPending}
          error={commandsQuery.error}
          onRetry={() => void commandsQuery.refetch()}
          isRetrying={commandsQuery.isFetching}
          emptyIcon={ClipboardList}
          emptyTitle={
            search || status !== "todos"
              ? "Nenhuma comanda encontrada"
              : "Nenhuma comanda criada"
          }
          emptyDescription={
            search || status !== "todos"
              ? "Ajuste a busca ou o filtro de status."
              : "Abra uma comanda para registrar produtos e serviços do atendimento."
          }
          emptyAction={
            canManage && !search && status === "todos" ? (
              <button
                className="btn btn--primary"
                type="button"
                onClick={() => setFormCommand("new")}
              >
                <Plus size={17} /> Nova comanda
              </button>
            ) : undefined
          }
        />
        {!commandsQuery.isPending && !commandsQuery.error && (
          <Pagination
            page={safePage}
            totalPages={totalPages}
            totalItems={filtered.length}
            pageSize={pageSize}
            onPageChange={setPage}
          />
        )}
      </section>
      {formCommand && catalogsQuery.data && (
        <CommandFormModal
          key={formCommand === "new" ? "new" : formCommand.id}
          companyId={companyId}
          command={formCommand === "new" ? undefined : formCommand}
          catalogs={catalogsQuery.data}
          isSubmitting={saveMutation.isPending}
          onClose={() => setFormCommand(null)}
          onSubmit={submitCommand}
        />
      )}
      {detailsCommand && (
        <CommercialDetailsModal
          document={detailsCommand}
          kind="command"
          onClose={() => setDetailsCommand(null)}
          actions={
            <>
              <button
                className="btn btn--secondary"
                type="button"
                onClick={() => setDetailsCommand(null)}
              >
                Fechar
              </button>
              {canManage && detailsCommand.status === "aberta" && (
                <>
                  <button
                    className="btn btn--secondary"
                    type="button"
                    onClick={() => {
                      setFormCommand(detailsCommand);
                      setDetailsCommand(null);
                    }}
                  >
                    <Edit3 size={17} /> Editar
                  </button>
                  <button
                    className="btn btn--primary"
                    type="button"
                    onClick={() => {
                      setClosingCommand(detailsCommand);
                      setDetailsCommand(null);
                    }}
                  >
                    <CheckCircle2 size={17} /> Fechar comanda
                  </button>
                </>
              )}
            </>
          }
        />
      )}
      {closingCommand && catalogsQuery.data && (
        <CommandCloseDialog
          companyId={companyId}
          command={closingCommand}
          catalogs={catalogsQuery.data}
          isSubmitting={closeMutation.isPending}
          onClose={() => setClosingCommand(null)}
          onSubmit={submitClose}
        />
      )}
      {cancelingCommand && (
        <CommandCancelDialog
          companyId={companyId}
          command={cancelingCommand}
          isSubmitting={cancelMutation.isPending}
          onClose={() => setCancelingCommand(null)}
          onSubmit={submitCancel}
        />
      )}
    </div>
  );
}
