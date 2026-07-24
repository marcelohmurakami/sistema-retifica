import { MainContent } from "../../components/mainContent/MainContent";
import { ClientesHeader, ClientesInfos, ClientesStyled, ClientesTable, HeaderItem, SelectStyled } from "./ClientesStyled";
import { Cliente } from "../../components/cliente/Cliente";
import { AddBtn } from "../../components/buttons/AddBtn";
import { useState } from "react";
import { AppModal } from "../../components/modal/AppModal";
import type { ClienteType } from "../../models/cliente"
import { CreateCliente } from "../../components/createForms/CreateCliente";
import { LoadingContainer } from "../../components/spinner/LoadingContainer";
import type { OsType } from "../../models/os";
import { useGetClientes } from "../../components/createForms/useGetOs";
import { FooterInfo, OSTableFooter, PaginationButton, PaginationControls, SearchBox, SearchIcon, SearchInput, SearchWrapper } from "../ordensDeServico/OsStyled";
import { PAGE_SIZE } from "../../utils/pageSize";
import { useEmpresaAtual } from "../../components/empresas/useEmpresas";
import { FaSearch } from "react-icons/fa";

export function Clientes () {
    const [sortBy, setSortBy] = useState("id");
    const [ page, setPage ] = useState(1);
    const [ searchInput, setSearchInput ] = useState('');
    const [ searchTerm, setSearchTerms ] = useState('');

    const { data: user } = useEmpresaAtual();
    const isAdmin = user?.role === "admin" || user?.role === "financeiro_master" ? true : false;

    const { clientes: data, isLoadingClientes: isLoading, count } = useGetClientes(sortBy, page, searchInput);

    const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
    const [clienteSelecionado, setClienteSelecionado] = useState<ClienteType | OsType | null>(null);
    const [isSortByOpen] = useState<boolean>(true)

    const numberOfPages = Math?.ceil(count / PAGE_SIZE);
    
    const MAX_VISIBLE_PAGES = 10;

    const getVisiblePages = () => {
        const half = Math.floor(MAX_VISIBLE_PAGES / 2);

        let start = Math.max(page - half, 1);
        const end = Math.min(start + MAX_VISIBLE_PAGES - 1, numberOfPages);

        if (end - start + 1 < MAX_VISIBLE_PAGES) {
            start = Math.max(end - MAX_VISIBLE_PAGES + 1, 1);
        }

        return Array.from(
            { length: end - start + 1 },
            (_, index) => start + index
        );
    };

    const visiblePages = getVisiblePages();

    if (isLoading) return <LoadingContainer />

    return (
        <MainContent>
            <SearchWrapper>
                <SearchBox>
                    <SearchIcon><FaSearch /></SearchIcon>
                    <SearchInput
                        type="text"
                        placeholder="Buscar por cliente..."
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
                <ClientesInfos>Clientes cadastrados</ClientesInfos>
                <ClientesInfos>Ordenar por {isSortByOpen && <SelectStyled value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                    <option value="id">ID</option>
                    <option value="cliente-asc">Nome (A-Z)</option>
                    <option value="cliente-desc">Nome (Z-A)</option>
                </SelectStyled>}</ClientesInfos>
            </ClientesStyled>

            <ClientesTable>
                <ClientesHeader>
                    <HeaderItem>ID</HeaderItem>
                    <HeaderItem>Cliente</HeaderItem>
                    <HeaderItem>CPF/CNPJ</HeaderItem>
                    <HeaderItem>Endereço</HeaderItem>
                    <HeaderItem>Telefone</HeaderItem>
                    <HeaderItem>Oficina</HeaderItem>
                </ClientesHeader>

            {!isLoading && data?.map((cliente) => {
                return (
                    <Cliente key={cliente.id} cliente={cliente} setIsCreateOpen={setIsCreateOpen} setClienteSelecionado={setClienteSelecionado} isAdmin={isAdmin} />
                )
            })}

            <OSTableFooter>
                <FooterInfo>
                {`Mostrando ${count === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–${Math.min(PAGE_SIZE * page, count)} de ${count} clientes`}
                </FooterInfo>

                <PaginationControls>
                <PaginationButton onClick={() => setPage(1)} disabled={page === 1}>
                    «
                    </PaginationButton>

                    <PaginationButton onClick={() => setPage(page - 1)} disabled={page === 1}>
                    ‹
                    </PaginationButton>
                    {visiblePages.map((pagina) => (
                        <PaginationButton key={pagina} value={pagina} onClick={() => setPage(pagina)} $active={pagina === page}>
                            {pagina}
                        </PaginationButton>
                    ))}
                    <PaginationButton onClick={() => setPage(page + 1)} disabled={page >= numberOfPages}>
                    ›
                    </PaginationButton>

                    <PaginationButton onClick={() => setPage(numberOfPages)} disabled={page >= numberOfPages}>
                    »
                    </PaginationButton>
                </PaginationControls>
            </OSTableFooter>
            </ClientesTable>

            {isAdmin && (
                <AddBtn setIsCreateOpen={setIsCreateOpen} novo={"Cadastrar novo cliente"} />
            )}

            {isCreateOpen && (
              <AppModal
                open
                onClose={() => {
                    setIsCreateOpen(false);
                    setClienteSelecionado(null);
                }}
                >
                <CreateCliente
                    setIsCreateOpen={setIsCreateOpen}
                    clienteParaEditar={clienteSelecionado}
                />
              </AppModal>
            )}
        </MainContent>
    )
}
