import { MainContent } from "../../components/mainContent/MainContent";
import { ClientesHeader, ClientesInfos, ClientesStyled, ClientesTable, HeaderItem, SelectStyled } from "./EstoqueStyled";
import { AddBtn } from "../../components/buttons/AddBtn";
import { useState } from "react";
import { CreateClienteModal } from "../../components/createForms/CreateClienteModal";
import type { ClienteType } from "../../models/cliente"
import { LoadingContainer } from "../../components/spinner/LoadingContainer";
import type { OsType } from "../../models/os";
import { FooterInfo, OSTableFooter, PaginationButton, PaginationControls, SearchBox, SearchIcon, SearchInput, SearchWrapper } from "../ordensDeServico/OsStyled";
import { PAGE_SIZE } from "../../utils/pageSize";
import { useGetEstoqueWithPagination } from "./useEstoque";
import { EstoqueRow } from "../../components/estoque/EstoqueRow";
import { CreateEstoque } from "../../components/createForms/CreateEstoque";
import { useEmpresaAtual } from "../../components/empresas/useEmpresas";

export function Estoque () {
    const { data: user } = useEmpresaAtual();
    const isAdmin = user?.role === "admin" || user?.role === "financeiro_master" ? true : false;
    
    const [sortBy, setSortBy] = useState("id");
    const [ page, setPage ] = useState(1);
    const [ searchInput, setSearchInput ] = useState('');
    const [ searchTerm, setSearchTerms ] = useState('');

    let { estoque, isLoadingEstoque, count } = useGetEstoqueWithPagination(sortBy, page, searchInput);

    const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
    const [clienteSelecionado, setClienteSelecionado] = useState<ClienteType | OsType | null>(null);
    const [isSortByOpen] = useState<boolean>(true)

    const numberOfPages = Math?.ceil(count / PAGE_SIZE);
    const paginas = Array.from({ length: numberOfPages }, (_, i) => i + 1);
    
    if (isLoadingEstoque) return <LoadingContainer />

    return (
        <MainContent>
            <SearchWrapper>
                <SearchBox>
                    <SearchIcon>🔎</SearchIcon>
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
                <ClientesInfos>Todos os produtos</ClientesInfos>
                <ClientesInfos>Ordernar por: {isSortByOpen && <SelectStyled value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                    <option value="id">ID</option>
                    <option value="cliente-asc">Nome (A-Z)</option>
                    <option value="cliente-desc">Nome (Z-A)</option>
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

            {!isLoadingEstoque && estoque?.map((cliente: any) => {
                return (
                    <EstoqueRow cliente={cliente} setIsCreateOpen={setIsCreateOpen} setClienteSelecionado={setClienteSelecionado} isAdmin={isAdmin} />
                )
            })}

            <OSTableFooter>
                <FooterInfo>
                {`Mostrando ${PAGE_SIZE * page - 9}–${PAGE_SIZE * page <= count ? PAGE_SIZE * page : count} de ${count} ordens de serviço`}
                </FooterInfo>

                <PaginationControls>
                <PaginationButton onClick={() => setPage(page - 1)} disabled={page === 1}>Anterior</PaginationButton>
                {paginas.map((pagina) => (
                    <PaginationButton value={pagina} onClick={() => setPage(pagina)} $active={pagina === page}>
                        {pagina}
                    </PaginationButton>
                ))}
                <PaginationButton onClick={() => setPage(page + 1)} disabled={page === numberOfPages}>Próxima</PaginationButton>
                </PaginationControls>
            </OSTableFooter>
            </ClientesTable>

            {isAdmin && <AddBtn setIsCreateOpen={setIsCreateOpen} novo={"Cadastrar novo produto"} />}

            <CreateClienteModal
                open={isCreateOpen}
                onClose={() => {
                    setIsCreateOpen(false);
                    setClienteSelecionado(null);
                }}
                >
                <CreateEstoque
                    setIsCreateOpen={setIsCreateOpen}
                    clienteParaEditar={clienteSelecionado}
                />
            </CreateClienteModal>
        </MainContent>
    )
}