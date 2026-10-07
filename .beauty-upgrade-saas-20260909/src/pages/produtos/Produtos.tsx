import {
  Archive,
  Edit3,
  PackagePlus,
  PackageSearch,
  RotateCcw,
  ShieldCheck,
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
import { EntityStatusDialog } from "../../features/inventory/components/EntityStatusDialog";
import { ProductFormModal } from "../../features/inventory/components/ProductFormModal";
import {
  useProducts,
  useSaveProduct,
  useToggleProductStatus,
} from "../../features/inventory/hooks/useInventory";
import type {
  Product,
  ProductFormValues,
} from "../../features/inventory/types/inventory.types";
import {
  formatInventoryCurrency,
  formatInventoryNumber,
  productStockState,
  PRODUCT_PURPOSE_LABELS,
} from "../../features/inventory/utils/inventory.utils";
import "../../features/inventory/inventory.css";

type StatusFilter = "todos" | "ativos" | "inativos";
type StockFilter = "todos" | "baixo" | "zerado";

export function Produtos() {
  const { empresaAtual } = useAuth();
  const { cargo } = useAccess();
  const companyId = empresaAtual?.id ?? 0;
  const canManage =
    cargo === "dono" || cargo === "gerente" || cargo === "recepcionista";
  const productsQuery = useProducts(companyId);
  const saveMutation = useSaveProduct(companyId);
  const statusMutation = useToggleProductStatus(companyId);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("todos");
  const [stock, setStock] = useState<StockFilter>("todos");
  const [page, setPage] = useState(1);
  const [formProduct, setFormProduct] = useState<Product | "new" | null>(null);
  const [statusProduct, setStatusProduct] = useState<Product | null>(null);
  const products = useMemo(
    () => productsQuery.data ?? [],
    [productsQuery.data],
  );
  const metrics = useMemo(
    () => ({
      total: products.length,
      active: products.filter((product) => product.ativo).length,
      low: products.filter((product) => productStockState(product) === "low")
        .length,
      out: products.filter((product) => productStockState(product) === "out")
        .length,
    }),
    [products],
  );
  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("pt-BR");
    return products.filter((product) => {
      const matchesSearch =
        !term ||
        [product.nome, product.codigo, product.descricao].some((value) =>
          value?.toLocaleLowerCase("pt-BR").includes(term),
        );
      const matchesStatus =
        status === "todos" ||
        (status === "ativos" ? product.ativo : !product.ativo);
      const state = productStockState(product);
      const matchesStock =
        stock === "todos" ||
        (stock === "baixo" ? state === "low" : state === "out");
      return matchesSearch && matchesStatus && matchesStock;
    });
  }, [products, search, status, stock]);
  const pageSize = 12;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize,
  );

  const columns: DataTableColumn<Product>[] = [
    {
      id: "product",
      header: "Produto",
      cell: (product) => (
        <div className="inventory-primary-cell">
          <strong>{product.nome}</strong>
          <span>
            {product.codigo || "Sem código"} ·{" "}
            {
              PRODUCT_PURPOSE_LABELS[
                product.finalidade as keyof typeof PRODUCT_PURPOSE_LABELS
              ]
            }
          </span>
        </div>
      ),
    },
    {
      id: "sale",
      header: "Venda",
      cell: (product) => formatInventoryCurrency(product.preco_venda),
      hideOnMobile: true,
    },
    {
      id: "cost",
      header: "Custo",
      cell: (product) => formatInventoryCurrency(product.custo_medio),
      hideOnMobile: true,
    },
    {
      id: "stock",
      header: "Estoque",
      cell: (product) => {
        const state = productStockState(product);
        return product.controla_estoque ? (
          <span className="stock-value" data-state={state}>
            {formatInventoryNumber(product.estoque_atual)}{" "}
            {product.unidade_medida}
          </span>
        ) : (
          <span className="muted-text">Não controlado</span>
        );
      },
    },
    {
      id: "minimum",
      header: "Mínimo",
      cell: (product) =>
        product.controla_estoque
          ? `${formatInventoryNumber(product.estoque_minimo)} ${product.unidade_medida}`
          : "—",
      hideOnMobile: true,
    },
    {
      id: "status",
      header: "Status",
      cell: (product) => (
        <span
          className="status-badge"
          data-status={product.ativo ? "active" : "inactive"}
        >
          {product.ativo ? "Ativo" : "Inativo"}
        </span>
      ),
      hideOnMobile: true,
    },
    {
      id: "actions",
      header: <span className="sr-only">Ações</span>,
      align: "right",
      cell: (product) =>
        canManage ? (
          <div className="inventory-row-actions">
            <button
              className="btn btn--icon btn--ghost"
              type="button"
              onClick={() => setFormProduct(product)}
              aria-label={`Editar ${product.nome}`}
            >
              <Edit3 size={17} />
            </button>
            <button
              className="btn btn--icon btn--ghost"
              type="button"
              onClick={() => setStatusProduct(product)}
              aria-label={`${product.ativo ? "Arquivar" : "Reativar"} ${product.nome}`}
            >
              {product.ativo ? <Archive size={17} /> : <RotateCcw size={17} />}
            </button>
          </div>
        ) : null,
    },
  ];

  async function saveProduct(values: ProductFormValues) {
    await saveMutation.mutateAsync({
      values,
      productId:
        formProduct !== "new" && formProduct ? formProduct.id : undefined,
    });
    setFormProduct(null);
  }
  async function changeStatus() {
    if (!statusProduct) return;
    await statusMutation.mutateAsync({
      productId: statusProduct.id,
      active: !statusProduct.ativo,
    });
    setStatusProduct(null);
  }

  return (
    <div className="page inventory-page">
      <header className="page-header">
        <div className="page-header__content">
          <span className="page-eyebrow">Catálogo</span>
          <h1>Produtos</h1>
          <p>
            Preços, custos, estoque mínimo e disponibilidade em um só lugar.
          </p>
        </div>
        <div className="page-actions">
          {!canManage && (
            <span className="inventory-read-only">
              <ShieldCheck size={16} /> Somente leitura
            </span>
          )}
          {canManage && (
            <button
              className="btn btn--primary"
              type="button"
              onClick={() => setFormProduct("new")}
            >
              <PackagePlus size={18} /> Novo produto
            </button>
          )}
        </div>
      </header>
      <section className="inventory-metrics" aria-label="Resumo de produtos">
        <article>
          <span>Total</span>
          <strong>{metrics.total}</strong>
          <small>produtos cadastrados</small>
        </article>
        <article>
          <span>Ativos</span>
          <strong>{metrics.active}</strong>
          <small>disponíveis</small>
        </article>
        <article data-tone="warning">
          <span>Estoque baixo</span>
          <strong>{metrics.low}</strong>
          <small>pedem reposição</small>
        </article>
        <article data-tone="danger">
          <span>Sem estoque</span>
          <strong>{metrics.out}</strong>
          <small>saldo zerado</small>
        </article>
      </section>
      <section className="card inventory-list-card">
        <FilterBar
          search={
            <SearchInput
              value={search}
              onChange={(value) => {
                setSearch(value);
                setPage(1);
              }}
              placeholder="Buscar por nome, código ou descrição..."
              label="Buscar produtos"
            />
          }
          activeFilterCount={
            (status === "todos" ? 0 : 1) + (stock === "todos" ? 0 : 1)
          }
          onClearFilters={() => {
            setStatus("todos");
            setStock("todos");
            setPage(1);
          }}
        >
          <label className="inventory-filter">
            <span>Status</span>
            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value as StatusFilter);
                setPage(1);
              }}
            >
              <option value="todos">Todos</option>
              <option value="ativos">Ativos</option>
              <option value="inativos">Inativos</option>
            </select>
          </label>
          <label className="inventory-filter">
            <span>Saldo</span>
            <select
              value={stock}
              onChange={(event) => {
                setStock(event.target.value as StockFilter);
                setPage(1);
              }}
            >
              <option value="todos">Todos</option>
              <option value="baixo">Baixo</option>
              <option value="zerado">Zerado</option>
            </select>
          </label>
        </FilterBar>
        <DataTable
          data={pageItems}
          columns={columns}
          rowKey="id"
          isLoading={productsQuery.isPending}
          error={productsQuery.error}
          onRetry={() => void productsQuery.refetch()}
          isRetrying={productsQuery.isFetching}
          emptyIcon={PackageSearch}
          emptyTitle={
            search || status !== "todos" || stock !== "todos"
              ? "Nenhum produto encontrado"
              : "Nenhum produto cadastrado"
          }
          emptyDescription={
            search || status !== "todos" || stock !== "todos"
              ? "Ajuste os filtros para localizar outros itens."
              : "Cadastre o primeiro produto para começar o controle do estoque."
          }
          emptyAction={
            canManage && !search && status === "todos" && stock === "todos" ? (
              <button
                className="btn btn--primary"
                type="button"
                onClick={() => setFormProduct("new")}
              >
                <PackagePlus size={17} /> Novo produto
              </button>
            ) : undefined
          }
          getRowClassName={(product) =>
            product.ativo ? undefined : "inventory-row--inactive"
          }
        />
        {!productsQuery.isPending && !productsQuery.error && (
          <Pagination
            page={safePage}
            totalPages={totalPages}
            totalItems={filtered.length}
            pageSize={pageSize}
            onPageChange={setPage}
          />
        )}
      </section>
      {formProduct && (
        <ProductFormModal
          key={formProduct === "new" ? "new" : formProduct.id}
          product={formProduct === "new" ? undefined : formProduct}
          isSubmitting={saveMutation.isPending}
          onClose={() => setFormProduct(null)}
          onSubmit={saveProduct}
        />
      )}
      {statusProduct && (
        <EntityStatusDialog
          entityLabel="produto"
          name={statusProduct.nome}
          active={statusProduct.ativo}
          isSubmitting={statusMutation.isPending}
          onClose={() => setStatusProduct(null)}
          onConfirm={changeStatus}
        />
      )}
    </div>
  );
}
