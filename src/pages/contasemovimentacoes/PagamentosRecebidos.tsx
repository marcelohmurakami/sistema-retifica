import { useEffect, useMemo, useState } from "react";
import { ReceiptIconButton } from "./ReciboPagamentoStyled";
import { FinanceListPage } from "../financeiro/FinanceListPage";
import { MoneyText } from "../financeiro/FinanceListPageStyled";
import { formatCurrency, formatDate } from "../financeiro/formatters";
import { useDeletePagamentoRecebido, useGetPagamentoRecebido } from "../financeiro/usePagamentoRecebido";
import { CreatePagamentoRecebidoModal } from "../../components/createFinanceForms/CreatePagamentoRecebidoModal";
import { ReciboPagamento } from "./ReciboPagamento";
import { ReceiptText} from 'lucide-react'

export function PagamentosRecebidos() {
  const { data } = useGetPagamentoRecebido();

  const [search, setSearch] = useState("");
  const [financaSelecionada, setFinancaSelecionada] = useState<any>(null);
  const [filter, setFilter] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const [reciboSelecionado, setReciboSelecionado] = useState<any>(null);
  const { mutate: deletePagamentoRecebido } = useDeletePagamentoRecebido();

  useEffect(() => {
    if (!reciboSelecionado) return;

    const timer = setTimeout(() => {
      window.print();
    }, 200);

    return () => clearTimeout(timer);
  }, [reciboSelecionado]);

  const filteredData = useMemo(() => {
    return data?.filter((item: any) => {
      const cliente = item.ContasReceber?.OrdensDeServiço?.Clientes?.cliente?.toLowerCase() || "";
      const searchTerm = search.toLowerCase();

      const matchesSearch =
        !searchTerm ||
        String(item.id).includes(searchTerm) ||
        String(cliente).includes(searchTerm) ||
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

      deletePagamentoRecebido(item.id);
    }

  return (
    <>
    <FinanceListPage
      title="Todos os pagamentos recebidos"
      subtitle="Histórico completo de entradas recebidas no sistema."
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
        { key: "descricao", title: "Descrição do pagamento", render: (item: any) => String(item.descricao) },
        {
          key: "valorRecebido",
          title: "Valor recebido",
          render: (item: any) => <MoneyText>{formatCurrency(item.valor)}</MoneyText>,
        },
        { key: "metodoPag", title: "Método" },
        {
          key: "taxaMaquina",
          title: "Taxa",
          render: (item: any) => <MoneyText>{formatCurrency(item.taxaMaquina)}</MoneyText>,
        },
        {
          key: "dataRecebimento",
          title: "Recebido em",
          render: (item: any) => formatDate(item.dataRecebimento),
        },
        {
          key: "recibo",
          title: "Recibo",
          render: (item: any) => (
            <ReceiptIconButton
              type="button"
              title="Emitir recibo"
              onClick={(e) => {
                e.stopPropagation();
                setReciboSelecionado(item);
              }}
            >
              <ReceiptText size={18} />
            </ReceiptIconButton>
          ),
        },
      ]}
      onEdit={handleEdit}
      onDelete={handleDelete}
      onCreate={handleCreate}
    />
    <CreatePagamentoRecebidoModal
      isOpen={openModal}
      onClose={() => setOpenModal(false)}
      financaSelecionada={financaSelecionada}
    />
    {reciboSelecionado && (
      <ReciboPagamento
        pagamento={reciboSelecionado}
        onClose={() => setReciboSelecionado(null)}
      />
    )}
    </>
  );
}