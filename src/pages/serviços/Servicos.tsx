import { MainContent } from "../../components/mainContent/MainContent";
import { ClientesInfos, ClientesStyled, HeaderItem, SelectStyled } from "../clientes/ClientesStyled";
import { ServicosFooter, ServicosHeader, ServicosTable } from "./ServicosStyled";
import { Servico } from "../../components/Servico/Servico";
import { useState } from "react";
import { AddBtn } from "../../components/buttons/AddBtn";
import { CreateClienteModal } from "../../components/createForms/CreateClienteModal";
import { CreateServico } from "../../components/createForms/CreateServico";
import { LoadingContainer } from "../../components/spinner/LoadingContainer";
import { useGetServicosWithPagination } from "../../components/createForms/useGetOs";
import { FooterInfo, PaginationButton, PaginationControls, SearchBox, SearchIcon, SearchInput, SearchWrapper } from "../ordensDeServico/OsStyled";
import { PAGE_SIZE } from "../../utils/pageSize";
import type { ServicoType } from "../../models/servico";
import { useEmpresaAtual } from "../../components/empresas/useEmpresas";

export function Servicos() {
  const { data: user } = useEmpresaAtual();
  const isAdmin = user?.role === "admin" || user?.role === "financeiro_master";

  const [sortBy, setSortBy] = useState("id");
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [servicoSelecionado, setServicoSelecionado] = useState<ServicoType | null>(null);

  const {
    servicos: servicosData,
    isLoadingServicos: isLoading,
    error,
    count,
  } = useGetServicosWithPagination(sortBy, page, searchInput, "servico");

  const MAX_VISIBLE_PAGES = 5;

  function getVisiblePages(currentPage: number, totalPages: number) {
    const half = Math.floor(MAX_VISIBLE_PAGES / 2);

    let start = Math.max(currentPage - half, 1);
    const end = Math.min(start + MAX_VISIBLE_PAGES - 1, totalPages);

    if (end - start + 1 < MAX_VISIBLE_PAGES) {
      start = Math.max(end - MAX_VISIBLE_PAGES + 1, 1);
    }

    return Array.from(
      { length: end - start + 1 },
      (_, index) => start + index
    );
  }

  const totalCount = count ?? 0;
  const numberOfPages = Math.ceil(totalCount / PAGE_SIZE);
  const visiblePages = getVisiblePages(page, numberOfPages);
  const firstItem = totalCount === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const lastItem = Math.min(PAGE_SIZE * page, totalCount);

  if (error) return null;

  if (isLoading) {
    return <LoadingContainer />;
  }

  return (
    <MainContent>
      <SearchWrapper>
        <SearchBox>
          <SearchIcon>🔎</SearchIcon>
          <SearchInput
            type="text"
            placeholder="Buscar por serviço..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setSearchInput(searchTerm);
                setPage(1);
              }
            }}
          />
        </SearchBox>
      </SearchWrapper>

      <ClientesStyled>
        <ClientesInfos>Todos os serviços</ClientesInfos>
        <ClientesInfos>
          Ordenar por:{" "}
          <SelectStyled value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="id">ID</option>
            <option value="servico">Nome do serviço</option>
          </SelectStyled>
        </ClientesInfos>
      </ClientesStyled>

      <ServicosTable>
        <ServicosHeader>
          <HeaderItem>ID</HeaderItem>
          <HeaderItem>Serviço</HeaderItem>
          <HeaderItem>Valor</HeaderItem>
          {isAdmin && <HeaderItem>Ações</HeaderItem>}
        </ServicosHeader>

        {servicosData?.map((servico: ServicoType) => (
          <Servico
            key={servico.id}
            servico={servico}
            setServicoSelecionado={setServicoSelecionado}
            setIsOpen={setIsOpen}
            isAdmin={isAdmin}
          />
        ))}

        <ServicosFooter>
          <FooterInfo>
            {`Mostrando ${firstItem}-${lastItem} de ${totalCount} serviços`}
          </FooterInfo>

          <PaginationControls>
            <PaginationButton onClick={() => setPage(1)} disabled={page === 1}>
              ‹‹
            </PaginationButton>

            <PaginationButton onClick={() => setPage(page - 1)} disabled={page === 1}>
              ‹
            </PaginationButton>

            {visiblePages.map((pagina) => (
              <PaginationButton
                key={pagina}
                value={pagina}
                onClick={() => setPage(pagina)}
                $active={pagina === page}
              >
                {pagina}
              </PaginationButton>
            ))}

            <PaginationButton
              onClick={() => setPage(page + 1)}
              disabled={page >= numberOfPages}
            >
              ›
            </PaginationButton>

            <PaginationButton
              onClick={() => setPage(numberOfPages)}
              disabled={page >= numberOfPages}
            >
              ››
            </PaginationButton>
          </PaginationControls>
        </ServicosFooter>
      </ServicosTable>

      {isAdmin && <AddBtn setIsCreateOpen={setIsOpen} novo="Cadastrar novo serviço" />}

      <CreateClienteModal open={isOpen} onClose={() => setIsOpen(false)}>
        <CreateServico servicoSelecionado={servicoSelecionado} />
      </CreateClienteModal>
    </MainContent>
  );
}
