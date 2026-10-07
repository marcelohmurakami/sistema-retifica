import { Archive, Building2, Edit3, Mail, Phone, Plus, RotateCcw, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { DataTable, FilterBar, Pagination, SearchInput, type DataTableColumn } from "../../components_shared";
import { useAccess } from "../../features/access/hooks/useAccess";
import { useAuth } from "../../features/auth/hooks/useAuth";
import { EntityStatusDialog } from "../../features/inventory/components/EntityStatusDialog";
import { SupplierFormModal } from "../../features/inventory/components/SupplierFormModal";
import { useSaveSupplier, useSuppliers, useToggleSupplierStatus } from "../../features/inventory/hooks/useInventory";
import type { Supplier, SupplierFormValues } from "../../features/inventory/types/inventory.types";
import "../../features/inventory/inventory.css";

type StatusFilter = "todos" | "ativos" | "inativos";

export function Fornecedores() {
  const { empresaAtual } = useAuth();
  const { cargo } = useAccess();
  const companyId = empresaAtual?.id ?? 0;
  const canManage = cargo === "dono" || cargo === "gerente" || cargo === "recepcionista";
  const suppliersQuery = useSuppliers(companyId);
  const saveMutation = useSaveSupplier(companyId);
  const statusMutation = useToggleSupplierStatus(companyId);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("todos");
  const [page, setPage] = useState(1);
  const [formSupplier, setFormSupplier] = useState<Supplier | "new" | null>(null);
  const [statusSupplier, setStatusSupplier] = useState<Supplier | null>(null);
  const suppliers = useMemo(() => suppliersQuery.data ?? [], [suppliersQuery.data]);
  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("pt-BR");
    return suppliers.filter((supplier) => {
      const matchesSearch = !term || [supplier.nome, supplier.nome_fantasia, supplier.documento, supplier.contato_responsavel].some((value) => value?.toLocaleLowerCase("pt-BR").includes(term));
      return matchesSearch && (status === "todos" || (status === "ativos" ? supplier.ativo : !supplier.ativo));
    });
  }, [suppliers, search, status]);
  const pageSize = 12;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const columns: DataTableColumn<Supplier>[] = [
    { id: "name", header: "Fornecedor", cell: (supplier) => <div className="inventory-primary-cell"><strong>{supplier.nome_fantasia || supplier.nome}</strong><span>{supplier.nome_fantasia ? supplier.nome : supplier.documento || "Documento não informado"}</span></div> },
    { id: "contact", header: "Contato", cell: (supplier) => supplier.contato_responsavel || "—", hideOnMobile: true },
    { id: "phone", header: "Telefone", cell: (supplier) => supplier.telefone ? <span className="inventory-icon-text"><Phone size={15} /> {supplier.telefone}</span> : "—" },
    { id: "email", header: "E-mail", cell: (supplier) => supplier.email ? <span className="inventory-icon-text"><Mail size={15} /> {supplier.email}</span> : "—", hideOnMobile: true },
    { id: "status", header: "Status", cell: (supplier) => <span className="status-badge" data-status={supplier.ativo ? "active" : "inactive"}>{supplier.ativo ? "Ativo" : "Inativo"}</span>, hideOnMobile: true },
    { id: "actions", header: <span className="sr-only">Ações</span>, align: "right", cell: (supplier) => canManage ? <div className="inventory-row-actions"><button className="btn btn--icon btn--ghost" type="button" onClick={() => setFormSupplier(supplier)} aria-label={`Editar ${supplier.nome}`}><Edit3 size={17} /></button><button className="btn btn--icon btn--ghost" type="button" onClick={() => setStatusSupplier(supplier)} aria-label={`${supplier.ativo ? "Arquivar" : "Reativar"} ${supplier.nome}`}>{supplier.ativo ? <Archive size={17} /> : <RotateCcw size={17} />}</button></div> : null },
  ];

  async function saveSupplier(values: SupplierFormValues) { await saveMutation.mutateAsync({ values, supplierId: formSupplier !== "new" && formSupplier ? formSupplier.id : undefined }); setFormSupplier(null); }
  async function changeStatus() { if (!statusSupplier) return; await statusMutation.mutateAsync({ supplierId: statusSupplier.id, active: !statusSupplier.ativo }); setStatusSupplier(null); }

  return (
    <div className="page inventory-page">
      <header className="page-header"><div className="page-header__content"><span className="page-eyebrow">Parceiros</span><h1>Fornecedores</h1><p>Centralize contatos e empresas usadas nas compras do estoque.</p></div><div className="page-actions">{!canManage && <span className="inventory-read-only"><ShieldCheck size={16} /> Somente leitura</span>}{canManage && <button className="btn btn--primary" type="button" onClick={() => setFormSupplier("new")}><Plus size={18} /> Novo fornecedor</button>}</div></header>
      <section className="inventory-metrics inventory-metrics--three" aria-label="Resumo de fornecedores"><article><span>Total</span><strong>{suppliers.length}</strong><small>fornecedores cadastrados</small></article><article><span>Ativos</span><strong>{suppliers.filter((supplier) => supplier.ativo).length}</strong><small>disponíveis para compras</small></article><article><span>Com contato</span><strong>{suppliers.filter((supplier) => supplier.telefone || supplier.email).length}</strong><small>telefone ou e-mail informado</small></article></section>
      <section className="card inventory-list-card">
        <FilterBar search={<SearchInput value={search} onChange={(value) => { setSearch(value); setPage(1); }} placeholder="Buscar fornecedor, documento ou contato..." label="Buscar fornecedores" />} activeFilterCount={status === "todos" ? 0 : 1} onClearFilters={() => { setStatus("todos"); setPage(1); }}><label className="inventory-filter"><span>Status</span><select value={status} onChange={(event) => { setStatus(event.target.value as StatusFilter); setPage(1); }}><option value="todos">Todos</option><option value="ativos">Ativos</option><option value="inativos">Inativos</option></select></label></FilterBar>
        <DataTable data={pageItems} columns={columns} rowKey="id" isLoading={suppliersQuery.isPending} error={suppliersQuery.error} onRetry={() => void suppliersQuery.refetch()} isRetrying={suppliersQuery.isFetching} emptyIcon={Building2} emptyTitle={search || status !== "todos" ? "Nenhum fornecedor encontrado" : "Nenhum fornecedor cadastrado"} emptyDescription={search || status !== "todos" ? "Ajuste a busca ou limpe o filtro de status." : "Cadastre fornecedores para registrar suas compras."} emptyAction={canManage && !search && status === "todos" ? <button className="btn btn--primary" type="button" onClick={() => setFormSupplier("new")}><Plus size={17} /> Novo fornecedor</button> : undefined} getRowClassName={(supplier) => supplier.ativo ? undefined : "inventory-row--inactive"} />
        {!suppliersQuery.isPending && !suppliersQuery.error && <Pagination page={safePage} totalPages={totalPages} totalItems={filtered.length} pageSize={pageSize} onPageChange={setPage} />}
      </section>
      {formSupplier && <SupplierFormModal key={formSupplier === "new" ? "new" : formSupplier.id} supplier={formSupplier === "new" ? undefined : formSupplier} isSubmitting={saveMutation.isPending} onClose={() => setFormSupplier(null)} onSubmit={saveSupplier} />}
      {statusSupplier && <EntityStatusDialog entityLabel="fornecedor" name={statusSupplier.nome_fantasia || statusSupplier.nome} active={statusSupplier.ativo} isSubmitting={statusMutation.isPending} onClose={() => setStatusSupplier(null)} onConfirm={changeStatus} />}
    </div>
  );
}
