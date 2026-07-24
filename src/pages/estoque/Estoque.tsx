import { MainContent } from "../../components/mainContent/MainContent";
import { ClientesHeader, ClientesInfos, ClientesStyled, ClientesTable, HeaderItem, SelectStyled } from "./EstoqueStyled";
import { AddBtn } from "../../components/buttons/AddBtn";
import { useState } from "react";
import { AppModal } from "../../components/modal/AppModal";
import { LoadingContainer } from "../../components/spinner/LoadingContainer";
import { FooterInfo, OSTableFooter, PaginationButton, PaginationControls, SearchBox, SearchIcon, SearchInput, SearchWrapper } from "../ordensDeServico/OsStyled";
import { PAGE_SIZE } from "../../utils/pageSize";
import { useGetEstoqueWithPagination } from "./useEstoque";
import { EstoqueRow } from "../../components/estoque/EstoqueRow";
import { CreateEstoque } from "../../components/createForms/CreateEstoque";
import { useEmpresaAtual } from "../../components/empresas/useEmpresas";
import type { EstoqueItem } from "../../models/estoque";
import { FaSearch } from "react-icons/fa";

export function Estoque () {
    const { data: user } = useEmpresaAtual();
    const isAdmin = user?.role === "admin" || user?.role === "financeiro_master" ? true : false;
    
    const [sortBy, setSortBy] = useState("id");
    const [ page, setPage ] = useState(1);
    const [ searchInput, setSearchInput ] = useState('');
    const [ searchTerm, setSearchTerms ] = useState('');

    const { estoque = [], isLoadingEstoque, count = 0 } = useGetEstoqueWithPagination(sortBy, page, searchInput);

    const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
    const [clienteSelecionado, setClienteSelecionado] = useState<EstoqueItem | null>(null);
    const [isSortByOpen] = useState<boolean>(true)

    const numberOfPages = Math?.ceil(count / PAGE_SIZE);
    const inicioPaginas = Math.max(1, Math.min(page - 4, numberOfPages - 9));
    const paginas = Array.from(
      { length: Math.min(10, numberOfPages) },
      (_, i) => inicioPaginas + i,
    );
    
    if (isLoadingEstoque) return <LoadingContainer />

    return (
        <MainContent>
            <SearchWrapper>
                <SearchBox>
                    <SearchIcon><FaSearch /></SearchIcon>
                    <SearchInput
                        type="text"
                        placeholder="Buscar por produto..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerms(e.target.value)}
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
                <ClientesInfos>Produtos em estoque</ClientesInfos>
                <ClientesInfos>Ordenar por {isSortByOpen && <SelectStyled value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                    <option value="id">ID</option>
                    <option value="nome-asc">Nome (A-Z)</option>
                    <option value="nome-desc">Nome (Z-A)</option>
                </SelectStyled>}</ClientesInfos>
            </ClientesStyled>

            <ClientesTable>
                <ClientesHeader>
                    <HeaderItem>ID</HeaderItem>
                    <HeaderItem>Produto</HeaderItem>
                    <HeaderItem>Custo</HeaderItem>
                    <HeaderItem>Valor</HeaderItem>
                    <HeaderItem>Quantidade</HeaderItem>
                    <HeaderItem>Situação</HeaderItem>
                </ClientesHeader>

            {!isLoadingEstoque && estoque.map((cliente) => {
                return (
                    <EstoqueRow key={cliente.id} cliente={cliente} setIsCreateOpen={setIsCreateOpen} setClienteSelecionado={setClienteSelecionado} isAdmin={isAdmin} />
                )
            })}

            <OSTableFooter>
                <FooterInfo>
                {`Mostrando ${count === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–${Math.min(PAGE_SIZE * page, count)} de ${count} produtos`}
                </FooterInfo>

                <PaginationControls>
                <PaginationButton onClick={() => setPage(page - 1)} disabled={page === 1}>Anterior</PaginationButton>
                {paginas.map((pagina) => (
                    <PaginationButton key={pagina} value={pagina} onClick={() => setPage(pagina)} $active={pagina === page}>
                        {pagina}
                    </PaginationButton>
                ))}
                <PaginationButton onClick={() => setPage(page + 1)} disabled={page >= numberOfPages}>Próxima</PaginationButton>
                </PaginationControls>
            </OSTableFooter>
            </ClientesTable>

            {isAdmin && <AddBtn setIsCreateOpen={setIsCreateOpen} novo={"Cadastrar novo produto"} />}

            {isCreateOpen && (
              <AppModal
                open
                onClose={() => {
                    setIsCreateOpen(false);
                    setClienteSelecionado(null);
                }}
                >
                <CreateEstoque
                    setIsCreateOpen={setIsCreateOpen}
                    clienteParaEditar={clienteSelecionado}
                />
              </AppModal>
            )}
        </MainContent>
    )
}
