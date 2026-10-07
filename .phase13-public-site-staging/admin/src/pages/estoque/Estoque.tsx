import { AlertTriangle, ArrowDownToLine, ArrowUpFromLine, ClipboardList, Edit3, PackageCheck, Plus, RefreshCw, ShoppingCart, Warehouse, XCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { DataTable, EmptyState, ErrorState, SearchInput, type DataTableColumn } from "../../components_shared";
import { useAccess } from "../../features/access/hooks/useAccess";
import { useAuth } from "../../features/auth/hooks/useAuth";
import { PurchaseCancelDialog } from "../../features/inventory/components/PurchaseCancelDialog";
import { PurchaseFormModal } from "../../features/inventory/components/PurchaseFormModal";
import { PurchaseReceiveModal } from "../../features/inventory/components/PurchaseReceiveModal";
import { StockMovementModal } from "../../features/inventory/components/StockMovementModal";
import { useCancelPurchase, useCreateStockMovement, useProducts, usePurchases, useReceivePurchase, useSavePurchase, useStockMovements, useSuppliers } from "../../features/inventory/hooks/useInventory";
import type { InventoryTab, Purchase, PurchaseReceiptInput, PurchaseWriteInput, StockMovement, StockMovementInput } from "../../features/inventory/types/inventory.types";
import { formatInventoryCurrency, formatInventoryDate, formatInventoryDateTime, formatInventoryNumber, isPurchaseReceivable, MOVEMENT_TYPE_LABELS, productStockState, PURCHASE_STATUS_LABELS } from "../../features/inventory/utils/inventory.utils";
import "../../features/inventory/inventory.css";

export function Estoque() {
  const { empresaAtual } = useAuth();
  const { cargo } = useAccess();
  const companyId = empresaAtual?.id ?? 0;
  const canMoveStock = cargo === "dono" || cargo === "gerente" || cargo === "recepcionista";
  const canManagePurchases = cargo === "dono" || cargo === "gerente";
  const productsQuery = useProducts(companyId);
  const suppliersQuery = useSuppliers(companyId);
  const purchasesQuery = usePurchases(companyId);
  const movementsQuery = useStockMovements(companyId);
  const movementMutation = useCreateStockMovement(companyId);
  const savePurchaseMutation = useSavePurchase(companyId);
  const receiveMutation = useReceivePurchase(companyId);
  const cancelMutation = useCancelPurchase(companyId);
  const [tab, setTab] = useState<InventoryTab>("overview");
  const [search, setSearch] = useState("");
  const [movementOpen, setMovementOpen] = useState(false);
  const [purchaseForm, setPurchaseForm] = useState<Purchase | "new" | null>(null);
  const [receivingPurchase, setReceivingPurchase] = useState<Purchase | null>(null);
  const [cancelingPurchase, setCancelingPurchase] = useState<Purchase | null>(null);
  const products = productsQuery.data ?? [];
  const suppliers = suppliersQuery.data ?? [];
  const purchases = useMemo(() => purchasesQuery.data ?? [], [purchasesQuery.data]);
  const movements = useMemo(() => movementsQuery.data ?? [], [movementsQuery.data]);
  const stockProducts = products.filter((product) => product.ativo && product.controla_estoque);
  const alerts = stockProducts.filter((product) => ["low", "out"].includes(productStockState(product)));
  const inventoryValue = stockProducts.reduce((total, product) => total + Number(product.estoque_atual) * Number(product.custo_medio ?? 0), 0);
  const unitsInStock = stockProducts.reduce((total, product) => total + Number(product.estoque_atual), 0);
  const normalizedSearch = search.trim().toLocaleLowerCase("pt-BR");
  const filteredMovements = useMemo(() => movements.filter((movement) => !normalizedSearch || [movement.produto?.nome, movement.produto?.codigo, movement.descricao, MOVEMENT_TYPE_LABELS[movement.tipo]].some((value) => value?.toLocaleLowerCase("pt-BR").includes(normalizedSearch))), [movements, normalizedSearch]);
  const filteredPurchases = useMemo(() => purchases.filter((purchase) => !normalizedSearch || [purchase.fornecedor?.nome, purchase.fornecedor?.nome_fantasia, purchase.numero_documento, `#${purchase.id}`, PURCHASE_STATUS_LABELS[purchase.status]].some((value) => value?.toLocaleLowerCase("pt-BR").includes(normalizedSearch))), [purchases, normalizedSearch]);

  const movementColumns: DataTableColumn<StockMovement>[] = [
    { id: "date", header: "Data", cell: (movement) => formatInventoryDateTime(movement.movimentado_em) },
    { id: "product", header: "Produto", cell: (movement) => <div className="inventory-primary-cell"><strong>{movement.produto?.nome ?? "Produto removido"}</strong><span>{movement.produto?.codigo || movement.descricao || "Sem observação"}</span></div> },
    { id: "type", header: "Movimento", cell: (movement) => <span className="movement-kind" data-direction={movement.tipo.startsWith("entrada") ? "in" : "out"}>{movement.tipo.startsWith("entrada") ? <ArrowDownToLine size={15} /> : <ArrowUpFromLine size={15} />}{MOVEMENT_TYPE_LABELS[movement.tipo] ?? movement.tipo}</span>, hideOnMobile: true },
    { id: "quantity", header: "Quantidade", cell: (movement) => <strong>{movement.tipo.startsWith("entrada") ? "+" : "−"}{formatInventoryNumber(movement.quantidade)} {movement.produto?.unidade_medida ?? ""}</strong>, align: "right" },
    { id: "balance", header: "Saldo após", cell: (movement) => `${formatInventoryNumber(movement.estoque_depois)} ${movement.produto?.unidade_medida ?? ""}`, align: "right", hideOnMobile: true },
  ];

  const purchaseColumns: DataTableColumn<Purchase>[] = [
    { id: "purchase", header: "Compra", cell: (purchase) => <div className="inventory-primary-cell"><strong>Compra #{purchase.id}</strong><span>{purchase.numero_documento || "Sem documento"} · {purchase.itens.length} {purchase.itens.length === 1 ? "item" : "itens"}</span></div> },
    { id: "supplier", header: "Fornecedor", cell: (purchase) => purchase.fornecedor?.nome_fantasia || purchase.fornecedor?.nome || "—", hideOnMobile: true },
    { id: "date", header: "Data", cell: (purchase) => formatInventoryDate(purchase.data_compra), hideOnMobile: true },
    { id: "total", header: "Total", cell: (purchase) => <strong>{formatInventoryCurrency(purchase.total_final)}</strong> },
    { id: "status", header: "Status", cell: (purchase) => <span className="status-badge" data-status={purchase.status}>{PURCHASE_STATUS_LABELS[purchase.status] ?? purchase.status}</span> },
    { id: "actions", header: <span className="sr-only">Ações</span>, align: "right", cell: (purchase) => canManagePurchases ? <div className="inventory-row-actions">{["rascunho", "pedido"].includes(purchase.status) && <button className="btn btn--icon btn--ghost" type="button" onClick={() => setPurchaseForm(purchase)} aria-label={`Editar compra ${purchase.id}`}><Edit3 size={17} /></button>}{isPurchaseReceivable(purchase) && <button className="btn btn--icon btn--ghost action-success" type="button" onClick={() => setReceivingPurchase(purchase)} aria-label={`Receber compra ${purchase.id}`}><PackageCheck size={18} /></button>}{["rascunho", "pedido"].includes(purchase.status) && <button className="btn btn--icon btn--ghost action-danger" type="button" onClick={() => setCancelingPurchase(purchase)} aria-label={`Cancelar compra ${purchase.id}`}><XCircle size={17} /></button>}</div> : null },
  ];

  async function submitMovement(input: StockMovementInput) { await movementMutation.mutateAsync(input); setMovementOpen(false); }
  async function submitPurchase(input: PurchaseWriteInput) { await savePurchaseMutation.mutateAsync(input); setPurchaseForm(null); }
  async function submitReceipt(input: PurchaseReceiptInput) { await receiveMutation.mutateAsync(input); setReceivingPurchase(null); }
  async function confirmCancel() { if (!cancelingPurchase) return; await cancelMutation.mutateAsync(cancelingPurchase.id); setCancelingPurchase(null); }
  function changeTab(nextTab: InventoryTab) { setTab(nextTab); setSearch(""); }
  const loading = productsQuery.isPending || purchasesQuery.isPending || movementsQuery.isPending;

  return (
    <div className="page inventory-page inventory-stock-page">
      <header className="page-header"><div className="page-header__content"><span className="page-eyebrow">Operação</span><h1>Estoque</h1><p>Compras, recebimentos, movimentações e alertas de reposição.</p></div><div className="page-actions">{tab === "purchases" && canManagePurchases && <button className="btn btn--primary" type="button" onClick={() => setPurchaseForm("new")}><ShoppingCart size={18} /> Nova compra</button>}{tab !== "purchases" && canMoveStock && <button className="btn btn--primary" type="button" onClick={() => setMovementOpen(true)} disabled={!stockProducts.length}><Plus size={18} /> Movimentar estoque</button>}</div></header>
      <section className="inventory-metrics" aria-label="Resumo do estoque"><article><span>Saldo total</span><strong>{formatInventoryNumber(unitsInStock)}</strong><small>unidades em estoque</small></article><article data-tone="warning"><span>Estoque baixo</span><strong>{alerts.filter((product) => productStockState(product) === "low").length}</strong><small>produtos em alerta</small></article><article data-tone="danger"><span>Sem estoque</span><strong>{alerts.filter((product) => productStockState(product) === "out").length}</strong><small>produtos zerados</small></article><article><span>Valor estimado</span><strong>{formatInventoryCurrency(inventoryValue)}</strong><small>pelo custo médio</small></article></section>
      <nav className="inventory-tabs" aria-label="Seções do estoque"><button type="button" data-active={tab === "overview"} onClick={() => changeTab("overview")}><Warehouse size={17} /> Visão geral</button><button type="button" data-active={tab === "movements"} onClick={() => changeTab("movements")}><RefreshCw size={17} /> Movimentações</button><button type="button" data-active={tab === "purchases"} onClick={() => changeTab("purchases")}><ClipboardList size={17} /> Compras</button></nav>

      {tab === "overview" && <section className="inventory-overview-grid">
        <div className="card inventory-alerts-card"><header><div><span className="page-eyebrow">Reposição</span><h2>Alertas de estoque</h2></div><span className="inventory-alert-count">{alerts.length}</span></header>{productsQuery.error ? <ErrorState error={productsQuery.error} onRetry={() => void productsQuery.refetch()} /> : !loading && alerts.length === 0 ? <EmptyState icon={PackageCheck} title="Estoque em dia" description="Nenhum produto atingiu o nível mínimo." compact /> : <div className="inventory-alert-list">{alerts.map((product) => <article key={product.id} data-state={productStockState(product)}><span className="inventory-alert-icon"><AlertTriangle size={18} /></span><div><strong>{product.nome}</strong><small>Mínimo: {formatInventoryNumber(product.estoque_minimo)} {product.unidade_medida}</small></div><strong>{formatInventoryNumber(product.estoque_atual)} {product.unidade_medida}</strong></article>)}</div>}</div>
        <div className="card inventory-recent-card"><header><div><span className="page-eyebrow">Histórico</span><h2>Últimas movimentações</h2></div><button className="btn btn--ghost btn--small" type="button" onClick={() => changeTab("movements")}>Ver todas</button></header>{movementsQuery.error ? <ErrorState error={movementsQuery.error} onRetry={() => void movementsQuery.refetch()} /> : !loading && movements.length === 0 ? <EmptyState icon={RefreshCw} title="Sem movimentações" description="As entradas e saídas aparecerão aqui." compact /> : <div className="inventory-recent-list">{movements.slice(0, 6).map((movement) => <article key={movement.id}><span className="movement-dot" data-direction={movement.tipo.startsWith("entrada") ? "in" : "out"} /><div><strong>{movement.produto?.nome ?? "Produto removido"}</strong><small>{MOVEMENT_TYPE_LABELS[movement.tipo] ?? movement.tipo} · {formatInventoryDateTime(movement.movimentado_em)}</small></div><strong>{movement.tipo.startsWith("entrada") ? "+" : "−"}{formatInventoryNumber(movement.quantidade)}</strong></article>)}</div>}</div>
      </section>}

      {tab === "movements" && <section className="card inventory-list-card"><div className="inventory-list-toolbar"><SearchInput value={search} onChange={setSearch} placeholder="Buscar produto ou movimentação..." label="Buscar movimentações" />{canMoveStock && <button className="btn btn--secondary" type="button" onClick={() => setMovementOpen(true)} disabled={!stockProducts.length}><Plus size={17} /> Nova movimentação</button>}</div><DataTable data={filteredMovements} columns={movementColumns} rowKey="id" isLoading={movementsQuery.isPending} error={movementsQuery.error} onRetry={() => void movementsQuery.refetch()} isRetrying={movementsQuery.isFetching} emptyIcon={RefreshCw} emptyTitle="Nenhuma movimentação encontrada" emptyDescription={search ? "Tente buscar por outro produto ou tipo." : "Entradas, saídas e ajustes aparecerão aqui."} /></section>}

      {tab === "purchases" && <section className="card inventory-list-card"><div className="inventory-list-toolbar"><SearchInput value={search} onChange={setSearch} placeholder="Buscar compra, fornecedor ou documento..." label="Buscar compras" />{canManagePurchases && <button className="btn btn--secondary" type="button" onClick={() => setPurchaseForm("new")}><ShoppingCart size={17} /> Nova compra</button>}</div><DataTable data={filteredPurchases} columns={purchaseColumns} rowKey="id" isLoading={purchasesQuery.isPending} error={purchasesQuery.error} onRetry={() => void purchasesQuery.refetch()} isRetrying={purchasesQuery.isFetching} emptyIcon={ShoppingCart} emptyTitle="Nenhuma compra encontrada" emptyDescription={search ? "Tente buscar por outro fornecedor ou documento." : "Registre uma compra e receba seus itens para dar entrada no estoque."} emptyAction={canManagePurchases && !search ? <button className="btn btn--primary" type="button" onClick={() => setPurchaseForm("new")}><ShoppingCart size={17} /> Nova compra</button> : undefined} /></section>}

      {movementOpen && <StockMovementModal companyId={companyId} products={products} isSubmitting={movementMutation.isPending} onClose={() => setMovementOpen(false)} onSubmit={submitMovement} />}
      {purchaseForm && <PurchaseFormModal key={purchaseForm === "new" ? "new" : purchaseForm.id} companyId={companyId} purchase={purchaseForm === "new" ? undefined : purchaseForm} products={products} suppliers={suppliers} isSubmitting={savePurchaseMutation.isPending} onClose={() => setPurchaseForm(null)} onSubmit={submitPurchase} />}
      {receivingPurchase && <PurchaseReceiveModal companyId={companyId} purchase={receivingPurchase} isSubmitting={receiveMutation.isPending} onClose={() => setReceivingPurchase(null)} onSubmit={submitReceipt} />}
      {cancelingPurchase && <PurchaseCancelDialog purchase={cancelingPurchase} isSubmitting={cancelMutation.isPending} onClose={() => setCancelingPurchase(null)} onConfirm={confirmCancel} />}
    </div>
  );
}
