import { useMemo, useState } from "react";
import { FinanceListPage, FinanceStatusBadge } from "../financeiro/FinanceListPage";
import { MoneyText } from "../financeiro/FinanceListPageStyled";
import { formatCurrency, formatDate } from "../financeiro/formatters";
import { useGetContasReceber } from "../financeiro/useContasReceber";
import { CreateContaReceberModal } from "../../components/createFinanceForms/CreateContaReceberModal";
import { useDeleteContasReceber } from "../financeiro/useContasReceber";
import type { ContaReceber } from "../../models/financeiro";

export function ContasAReceber() {
  const { data } = useGetContasReceber();
  const { mutate: deleteContaReceber } = useDeleteContasReceber();

  const [ openModal, setOpenModal ] = useState(false);
  const [financaSelecionada, setFinancaSelecionada] = useState<ContaReceber | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const cliente = item.OrdensServico?.Clientes?.cliente?.toLowerCase() || "";
      const descricao = item.descricao?.toLowerCase() || "";
      const searchTerm = search.toLowerCase();

      const matchesSearch =
        !searchTerm ||
        cliente.includes(searchTerm) ||
        descricao.includes(searchTerm) ||
        String(item.id).includes(searchTerm);

      const matchesFilter = !filter || item.status === filter;

      return matchesSearch && matchesFilter;
    });
  }, [data, search, filter]);

  function handleCreate() {
    setFinancaSelecionada(null);
    setOpenModal(true);
  }

  function handleEdit(item: ContaReceber) {
    setFinancaSelecionada(item);
    setOpenModal(true);
  }

  function handleDelete(item: ContaReceber) {
    const confirmDelete = window.confirm(
      `Tem certeza que deseja excluir o registro?`
    );

    if (!confirmDelete) return;

    deleteContaReceber(item.id);
  }

  function handleStatus(item: ContaReceber) {
    const valorRecebido = Number(item?.valorRecebido || 0)
    const valorTotal = Number(item?.valor || 0)

    if (valorRecebido >= valorTotal) {
      return "PAGO"
    }

    if (new Date(item?.dataPagamento) < new Date()) {
      return "ATRASADO"
    }

    if (valorRecebido > 0) {
      return "PARCIAL"
    }

    return "PENDENTE"
  }

  return (
    <>
    <FinanceListPage
      title="Todas as contas a receber"
      subtitle="Visualize, acompanhe e filtre todas as contas a receber do sistema."
      data={filteredData}
      searchValue={search}
      onSearchChange={setSearch}
      filterValue={filter}
      onFilterChange={setFilter}
      filterOptions={[
        { label: "Todos os status", value: "" },
        { label: "Pendente", value: "pendente" },
        { label: "Parcial", value: "parcial" },
        { label: "Pago", value: "pago" },
        { label: "Atrasado", value: "atrasado" },
      ]}
      columns={[
        { key: "id", title: "ID" },
        {
          key: "cliente",
          title: "Cliente",
          render: (item) => item.OrdensServico?.Clientes?.cliente || "-",
        },
        {
          key: "descricao",
          title: "Descrição",
        },
        {
          key: "valorTotal",
          title: "Recebido",
          render: (item) => <MoneyText>{formatCurrency(item.valorRecebido)}</MoneyText>,
        },
        {
          key: "valorRecebido",
          title: "Valor total",
          render: (item) => <MoneyText>{formatCurrency(item.valor)}</MoneyText>,
        },
        {
          key: "valorRestante",
          title: "Valor restante",
          render: (item) => <MoneyText>{formatCurrency(item.valor - item.valorRecebido)}</MoneyText>,
        },
        {
          key: "dataVencimento",
          title: "Vencimento",
          render: (item) => formatDate(item.dataPagamento),
        },
        {
          key: "status",
          title: "Status",
          render: (item) => {
            const status = handleStatus(item)

            return (
              <FinanceStatusBadge variant={status}>
                {status}
              </FinanceStatusBadge>
            )
          },
        },
      ]}
      onEdit={handleEdit}
      onDelete={handleDelete}
      onCreate={handleCreate}
    />
    {openModal && (
      <CreateContaReceberModal
        key={financaSelecionada?.id ?? "new"}
        isOpen
        onClose={() => setOpenModal(false)}
        financaSelecionada={financaSelecionada}
      />
    )}
    </>
  );
}
