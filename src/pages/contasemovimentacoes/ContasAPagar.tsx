import { useMemo, useState } from "react";
import { FinanceListPage, FinanceStatusBadge } from "../financeiro/FinanceListPage";
import { MoneyText } from "../financeiro/FinanceListPageStyled";
import { formatCurrency, formatDate } from "../financeiro/formatters";
import { useDeleteContasPagar, useGetContasPagar } from "../financeiro/useContasPagar";
import { CreateContaPagarModal } from "../../components/createFinanceForms/CreateContaPagarModal";

export function ContasAPagar() {
  const { data } = useGetContasPagar();
  const { mutate: deleteContaPagar } = useDeleteContasPagar();

  console.log(data)

  const [ openModal, setOpenModal ] = useState(false);
  const [financaSelecionada, setFinancaSelecionada] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");

  const filteredData = useMemo(() => {
    return data?.filter((item: any) => {
      const fornecedor = item.fornecedor?.toLowerCase() || "";
      const descricao = item.descricao?.toLowerCase() || "";
      const searchTerm = search.toLowerCase();

      const matchesSearch =
        !searchTerm ||
        fornecedor.includes(searchTerm) ||
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

  function handleEdit(item: any) {
    setFinancaSelecionada(item);
    setOpenModal(true);
  }

  function handleDelete(item: any) {
    const confirmDelete = window.confirm(
      `Tem certeza que deseja excluir o registro?`
    );

    if (!confirmDelete) return;

    deleteContaPagar(item.id);
  }

  function handleStatus(item: any) {
    const valorRecebido = Number(item?.valor_parcial_pago || 0)
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
      title="Todas as contas a pagar"
      subtitle="Acompanhe despesas, vencimentos e pagamentos realizados."
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
        { key: "fornecedor", title: "Fornecedor" },
        { key: "descricao", title: "Descrição" },
        {
          key: "valorTotal",
          title: "Valor total",
          render: (item: any) => <MoneyText>{formatCurrency(item.valor)}</MoneyText>,
        },
        {
          key: "valor_parcial_pago",
          title: "Pago",
          render: (item: any) => <MoneyText>{formatCurrency(item.valor_parcial_pago)}</MoneyText>,
        },
        {
          key: "valorRestante",
          title: "Valor restante",
          render: (item: any) => <MoneyText>{formatCurrency(item.valor - item.valor_parcial_pago)}</MoneyText>,
        },
        {
          key: "dataVencimento",
          title: "Vencimento",
          render: (item: any) => formatDate(item.dataVencimento),
        },
        {
          key: "status",
          title: "Status",
          render: (item: any) => (
            <FinanceStatusBadge variant={item.status}>
              {handleStatus(item)}
            </FinanceStatusBadge>
          ),
        },
      ]}
      onEdit={handleEdit}
      onDelete={handleDelete}
      onCreate={handleCreate}
    />

    <CreateContaPagarModal
      isOpen={openModal}
      onClose={() => setOpenModal(false)}
      financaSelecionada={financaSelecionada}
    />
    </>
  );
}