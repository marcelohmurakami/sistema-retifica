import { useMemo, useState } from "react";
import { FinanceListPage } from "../financeiro/FinanceListPage";
import { MoneyText } from "../financeiro/FinanceListPageStyled";
import { formatCurrency, formatDate } from "../financeiro/formatters";
import { useGetPagamentoQuitado } from "../financeiro/usePagamentoQuitado";
import { CreatePagamentoQuitadoModal } from "../../components/createFinanceForms/CreatePagamentoQuitadoModal";
import { deletePagamentoQuitado } from "../financeiro/pagamentoQuitadoApi";

export function PagamentosQuitados() {
  const { data } = useGetPagamentoQuitado();

  const [search, setSearch] = useState("");
  const [financaSelecionada, setFinancaSelecionada] = useState<any>(null);
  const [filter, setFilter] = useState("");
  const [openModal, setOpenModal] = useState(false);

  const filteredData = useMemo(() => {
    return data?.filter((item: any) => {
      const searchTerm = search.toLowerCase();

      const matchesSearch =
        !searchTerm ||
        String(item.id).includes(searchTerm) ||
        String(item.idContaPagar).includes(searchTerm) ||
        item.metodoPag.toLowerCase().includes(searchTerm);

      const matchesFilter = !filter || item.metodoPag === filter;

      return matchesSearch && matchesFilter;
    });
  }, [data, search, filter]);

  function handleCreate() {
    setFinancaSelecionada(null);
    setOpenModal(true);
  }

  function handleEdit(item: any) {
    setFinancaSelecionada(item);
    setOpenModal(true);
  }

  function handleDelete(item: any) {
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
        { key: "descricao", title: "Descrição",  render: (item: any) => item.descricao },
        {
          key: "valorPago",
          title: "Valor pago",
          render: (item: any) => <MoneyText>{formatCurrency(item.valor)}</MoneyText>,
        },
        { key: "metodoPagamento", title: "Método", render: (item: any) => formatDate(item.formaPagamento) },
        {
          key: "dataPagamento",
          title: "Pago em",
          render: (item: any) => formatDate(item.dataPagamento),
        },
      ]}
      onEdit={handleEdit}
      onDelete={handleDelete}
      onCreate={handleCreate}
    />
    <CreatePagamentoQuitadoModal
      isOpen={openModal}
      onClose={() => setOpenModal(false)}
      financaSelecionada={financaSelecionada}
    />
    </>
  );
}