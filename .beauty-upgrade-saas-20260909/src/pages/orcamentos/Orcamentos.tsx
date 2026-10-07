import {
  ArrowRight,
  CheckCircle2,
  Edit3,
  Eye,
  FileText,
  Plus,
  Send,
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
import { CommercialDetailsModal } from "../../features/commercial/components/CommercialDetailsModal";
import { QuoteConversionModal } from "../../features/commercial/components/QuoteConversionModal";
import { QuoteFormModal } from "../../features/commercial/components/QuoteFormModal";
import { QuoteStatusDialog } from "../../features/commercial/components/QuoteStatusDialog";
import {
  useChangeQuoteStatus,
  useCommercialCatalogs,
  useConvertQuote,
  useQuotes,
  useSaveQuote,
} from "../../features/commercial/hooks/useCommercial";
import type {
  Quote,
  QuoteConversionInput,
  QuoteStatus,
  QuoteWriteInput,
} from "../../features/commercial/types/commercial.types";
import {
  formatCommercialCurrency,
  formatCommercialDate,
  formatCommercialDateTime,
  QUOTE_STATUS_LABELS,
  quoteCanConvert,
  quoteCanEdit,
  quoteEffectiveStatus,
} from "../../features/commercial/utils/commercial.utils";
import "../../features/commercial/commercial.css";

type StatusAction = {
  quote: Quote;
  status: "enviado" | "aprovado" | "recusado" | "cancelado";
} | null;

export function Orcamentos() {
  const { empresaAtual } = useAuth();
  const { cargo } = useAccess();
  const companyId = empresaAtual?.id ?? 0;
  const canManage =
    cargo === "dono" || cargo === "gerente" || cargo === "recepcionista";
  const quotesQuery = useQuotes(companyId);
  const catalogsQuery = useCommercialCatalogs(companyId);
  const saveMutation = useSaveQuote(companyId);
  const statusMutation = useChangeQuoteStatus(companyId);
  const convertMutation = useConvertQuote(companyId);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"todos" | QuoteStatus>("todos");
  const [page, setPage] = useState(1);
  const [formQuote, setFormQuote] = useState<Quote | "new" | null>(null);
  const [detailsQuote, setDetailsQuote] = useState<Quote | null>(null);
  const [statusAction, setStatusAction] = useState<StatusAction>(null);
  const [convertQuote, setConvertQuote] = useState<Quote | null>(null);
  const quotes = useMemo(() => quotesQuery.data ?? [], [quotesQuery.data]);
  const metrics = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    const approved = quotes.filter(
      (quote) => quote.aprovado_em && new Date(quote.aprovado_em) >= cutoff,
    ).length;
    const converted = quotes.filter(
      (quote) => quote.status === "convertido",
    ).length;
    const concluded = quotes.filter((quote) =>
      ["aprovado", "recusado", "convertido"].includes(quote.status),
    ).length;
    return {
      open: quotes.filter((quote) =>
        ["rascunho", "enviado"].includes(quoteEffectiveStatus(quote)),
      ).length,
      approved,
      openValue: quotes
        .filter((quote) =>
          ["rascunho", "enviado"].includes(quoteEffectiveStatus(quote)),
        )
        .reduce((sum, quote) => sum + Number(quote.valor_total ?? 0), 0),
      conversion: concluded ? Math.round((converted / concluded) * 100) : 0,
    };
  }, [quotes]);
  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("pt-BR");
    return quotes.filter((quote) => {
      const effective = quoteEffectiveStatus(quote);
      const matches =
        !term ||
        [
          quote.cliente?.nome,
          `#${quote.id}`,
          QUOTE_STATUS_LABELS[effective],
        ].some((value) => value?.toLocaleLowerCase("pt-BR").includes(term));
      return matches && (status === "todos" || effective === status);
    });
  }, [quotes, search, status]);
  const pageSize = 12;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize,
  );

  const columns: DataTableColumn<Quote>[] = [
    {
      id: "quote",
      header: "Orçamento",
      cell: (quote) => (
        <div className="commercial-primary-cell">
          <strong>Orçamento #{quote.id}</strong>
          <span>
            {quote.itens.length} {quote.itens.length === 1 ? "item" : "itens"} ·
            criado {formatCommercialDateTime(quote.created_at)}
          </span>
        </div>
      ),
    },
    {
      id: "client",
      header: "Cliente",
      cell: (quote) => quote.cliente?.nome ?? "—",
    },
    {
      id: "validity",
      header: "Validade",
      cell: (quote) => formatCommercialDate(quote.validade),
      hideOnMobile: true,
    },
    {
      id: "total",
      header: "Total",
      cell: (quote) => (
        <strong>{formatCommercialCurrency(quote.valor_total)}</strong>
      ),
      align: "right",
    },
    {
      id: "status",
      header: "Status",
      cell: (quote) => {
        const effective = quoteEffectiveStatus(quote);
        return (
          <span className="status-badge" data-status={effective}>
            {QUOTE_STATUS_LABELS[effective]}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: <span className="sr-only">Ações</span>,
      align: "right",
      cell: (quote) => {
        const effective = quoteEffectiveStatus(quote);
        return (
          <div className="commercial-row-actions">
            <button
              className="btn btn--icon btn--ghost"
              type="button"
              onClick={() => setDetailsQuote(quote)}
              aria-label={`Ver orçamento ${quote.id}`}
            >
              <Eye size={17} />
            </button>
            {canManage && quoteCanEdit(quote) && (
              <button
                className="btn btn--icon btn--ghost"
                type="button"
                onClick={() => setFormQuote(quote)}
                aria-label={`Editar orçamento ${quote.id}`}
              >
                <Edit3 size={17} />
              </button>
            )}
            {canManage && effective === "rascunho" && (
              <button
                className="btn btn--icon btn--ghost action-primary"
                type="button"
                onClick={() => setStatusAction({ quote, status: "enviado" })}
                aria-label={`Marcar orçamento ${quote.id} como enviado`}
              >
                <Send size={17} />
              </button>
            )}
            {canManage && effective === "enviado" && (
              <>
                <button
                  className="btn btn--icon btn--ghost action-success"
                  type="button"
                  onClick={() => setStatusAction({ quote, status: "aprovado" })}
                  aria-label={`Aprovar orçamento ${quote.id}`}
                >
                  <CheckCircle2 size={17} />
                </button>
                <button
                  className="btn btn--icon btn--ghost action-danger"
                  type="button"
                  onClick={() => setStatusAction({ quote, status: "recusado" })}
                  aria-label={`Recusar orçamento ${quote.id}`}
                >
                  <XCircle size={17} />
                </button>
              </>
            )}
            {canManage && quoteCanConvert(quote) && (
              <button
                className="btn btn--icon btn--ghost action-success"
                type="button"
                onClick={() => setConvertQuote(quote)}
                aria-label={`Converter orçamento ${quote.id}`}
              >
                <ArrowRight size={18} />
              </button>
            )}
            {canManage && ["rascunho", "aprovado"].includes(effective) && (
              <button
                className="btn btn--icon btn--ghost action-danger"
                type="button"
                onClick={() => setStatusAction({ quote, status: "cancelado" })}
                aria-label={`Cancelar orçamento ${quote.id}`}
              >
                <XCircle size={17} />
              </button>
            )}
          </div>
        );
      },
    },
  ];

  async function submitQuote(input: QuoteWriteInput) {
    await saveMutation.mutateAsync(input);
    setFormQuote(null);
  }
  async function submitStatus(observation: string) {
    if (!statusAction) return;
    await statusMutation.mutateAsync({
      companyId,
      quoteId: statusAction.quote.id,
      status: statusAction.status,
      observation,
    });
    setStatusAction(null);
  }
  async function submitConversion(input: QuoteConversionInput) {
    await convertMutation.mutateAsync(input);
    setConvertQuote(null);
  }

  return (
    <div className="page commercial-page">
      <header className="page-header">
        <div className="page-header__content">
          <span className="page-eyebrow">Comercial</span>
          <h1>Orçamentos</h1>
          <p>
            Propostas com aprovação, validade e conversão direta em atendimento.
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
              onClick={() => setFormQuote("new")}
            >
              <Plus size={18} /> Novo orçamento
            </button>
          )}
        </div>
      </header>
      <section className="commercial-metrics">
        <article data-tone="warning">
          <span>Em aberto</span>
          <strong>{metrics.open}</strong>
          <small>aguardando andamento</small>
        </article>
        <article data-tone="success">
          <span>Aprovados</span>
          <strong>{metrics.approved}</strong>
          <small>nos últimos 30 dias</small>
        </article>
        <article>
          <span>Valor em aberto</span>
          <strong>{formatCommercialCurrency(metrics.openValue)}</strong>
          <small>potencial de receita</small>
        </article>
        <article>
          <span>Conversão</span>
          <strong>{metrics.conversion}%</strong>
          <small>documentos concluídos</small>
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
              placeholder="Buscar número, cliente ou status..."
              label="Buscar orçamentos"
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
                Object.entries(QUOTE_STATUS_LABELS) as [QuoteStatus, string][]
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
          isLoading={quotesQuery.isPending}
          error={quotesQuery.error}
          onRetry={() => void quotesQuery.refetch()}
          isRetrying={quotesQuery.isFetching}
          emptyIcon={FileText}
          emptyTitle={
            search || status !== "todos"
              ? "Nenhum orçamento encontrado"
              : "Nenhum orçamento criado"
          }
          emptyDescription={
            search || status !== "todos"
              ? "Ajuste a busca ou o filtro de status."
              : "Crie uma proposta para apresentar produtos e serviços ao cliente."
          }
          emptyAction={
            canManage && !search && status === "todos" ? (
              <button
                className="btn btn--primary"
                type="button"
                onClick={() => setFormQuote("new")}
              >
                <Plus size={17} /> Novo orçamento
              </button>
            ) : undefined
          }
        />
        {!quotesQuery.isPending && !quotesQuery.error && (
          <Pagination
            page={safePage}
            totalPages={totalPages}
            totalItems={filtered.length}
            pageSize={pageSize}
            onPageChange={setPage}
          />
        )}
      </section>
      {formQuote && catalogsQuery.data && (
        <QuoteFormModal
          key={formQuote === "new" ? "new" : formQuote.id}
          companyId={companyId}
          quote={formQuote === "new" ? undefined : formQuote}
          catalogs={catalogsQuery.data}
          isSubmitting={saveMutation.isPending}
          onClose={() => setFormQuote(null)}
          onSubmit={submitQuote}
        />
      )}
      {detailsQuote && (
        <CommercialDetailsModal
          document={detailsQuote}
          kind="quote"
          onClose={() => setDetailsQuote(null)}
          actions={
            <>
              <button
                className="btn btn--secondary"
                type="button"
                onClick={() => setDetailsQuote(null)}
              >
                Fechar
              </button>
              {canManage && quoteCanEdit(detailsQuote) && (
                <button
                  className="btn btn--primary"
                  type="button"
                  onClick={() => {
                    setFormQuote(detailsQuote);
                    setDetailsQuote(null);
                  }}
                >
                  <Edit3 size={17} /> Editar
                </button>
              )}
              {canManage && quoteCanConvert(detailsQuote) && (
                <button
                  className="btn btn--primary"
                  type="button"
                  onClick={() => {
                    setConvertQuote(detailsQuote);
                    setDetailsQuote(null);
                  }}
                >
                  <ArrowRight size={17} /> Converter
                </button>
              )}
              {canManage &&
                ["rascunho", "aprovado"].includes(
                  quoteEffectiveStatus(detailsQuote),
                ) && (
                  <button
                    className="btn btn--danger"
                    type="button"
                    onClick={() => {
                      setStatusAction({
                        quote: detailsQuote,
                        status: "cancelado",
                      });
                      setDetailsQuote(null);
                    }}
                  >
                    <XCircle size={17} /> Cancelar
                  </button>
                )}
            </>
          }
        />
      )}
      {statusAction && (
        <QuoteStatusDialog
          quote={statusAction.quote}
          status={statusAction.status}
          isSubmitting={statusMutation.isPending}
          onClose={() => setStatusAction(null)}
          onConfirm={submitStatus}
        />
      )}
      {convertQuote && catalogsQuery.data && (
        <QuoteConversionModal
          companyId={companyId}
          quote={convertQuote}
          catalogs={catalogsQuery.data}
          isSubmitting={convertMutation.isPending}
          onClose={() => setConvertQuote(null)}
          onSubmit={submitConversion}
        />
      )}
    </div>
  );
}
