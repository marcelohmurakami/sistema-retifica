import { useMemo, useState } from "react";
import { FinanceListPage } from "../financeiro/FinanceListPage";
import { MoneyText } from "../financeiro/FinanceListPageStyled";
import { formatCurrency, formatDate } from "../financeiro/formatters";
import { useGetPagamentoQuitado } from "../financeiro/usePagamentoQuitado";
import { CreatePagamentoQuitadoModal } from "../../components/createFinanceForms/CreatePagamentoQuitadoModal";
import { deletePagamentoQuitado } from "../financeiro/pagamentoQuitadoApi";
import type { PagamentoQuitado } from "../../models/financeiro";

export function PagamentosQuitados() {
  const { data } = useGetPagamentoQuitado();

  const [search, setSearch] = useState("");
  const [financaSelecionada, setFinancaSelecionada] = useState<PagamentoQuitado | null>(null);
  const [filter, setFilter] = useState("");
  const [openModal, setOpenModal] = useState(false);

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const searchTerm = search.toLowerCase();
      const formaPagamento = item.formaPagamento?.toLowerCase() ?? "";

      const matchesSearch =
        !searchTerm ||
        String(item.id).includes(searchTerm) ||
        String(item.idContaPagar ?? "").includes(searchTerm) ||
        formaPagamento.includes(searchTerm);

      const matchesFilter = !filter || formaPagamento === filter;

      return matchesSearch && matchesFilter;
    });
  }, [data, search, filter]);

  function handleCreate() {
    setFinancaSelecionada(null);
    setOpenModal(true);
  }

  function handleEdit(item: PagamentoQuitado) {
    setFinancaSelecionada(item);
    setOpenModal(true);
  }

  function handleDelete(item: PagamentoQuitado) {
    const confirmDelete = window.confirm(
      `Tem certeza que deseja excluir o registro?`
    );

    if (!confirmDelete) return;

    deletePagamentoQuitado(item.id);
  }

  return (
    <>
    <FinanceListPage
      title="Todos os pagamentos quitados"
      subtitle="Histórico de pagamentos realizados para contas a pagar."
      data={filteredData}
      searchValue={search}
      onSearchChange={setSearch}
      filterValue={filter}
      onFilterChange={setFilter}
      filterOptions={[
        { label: "Todos os métodos", value: "" },
        { label: "Pix", value: "pix" },
        { label: "Dinheiro", value: "dinheiro" },
        { label: "Cartão de crédito", value: "cartao_credito" },
        { label: "Cartão de débito", value: "cartao_debito" },
      ]}
      columns={[
        { key: "id", title: "ID" },
        { key: "descricao", title: "Descrição",  render: (item) => item.descricao },
        {
          key: "valorPago",
          title: "Valor pago",
          render: (item) => <MoneyText>{formatCurrency(item.valor)}</MoneyText>,
        },
        { key: "formaPagamento", title: "Método" },
        {
          key: "dataPagamento",
          title: "Pago em",
          render: (item) => formatDate(item.dataPagamento),
        },
      ]}
      onEdit={handleEdit}
      onDelete={handleDelete}
      onCreate={handleCreate}
    />
    {openModal && (
      <CreatePagamentoQuitadoModal
        key={financaSelecionada?.id ?? "new"}
        isOpen
        onClose={() => setOpenModal(false)}
        financaSelecionada={financaSelecionada}
      />
    )}
    </>
  );
}
