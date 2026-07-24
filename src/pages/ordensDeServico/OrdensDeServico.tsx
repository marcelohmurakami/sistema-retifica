import { useQuery } from "@tanstack/react-query"
import { GetOS } from "./osApi"
import { MainContent } from "../../components/mainContent/MainContent";
import { FooterInfo, OSHeader, OSTable, OSTableFooter, PaginationButton, PaginationControls, SearchBox, SearchIcon, SearchInput, SearchWrapper } from "./OsStyled";
import { ClientesStyled, ClientesInfos, HeaderItem, SelectStyled } from "../clientes/ClientesStyled";
import { OrdemDeServiço } from "../../components/ordemDeServiço/Os";
import { useState } from "react";
import { AddBtn } from "../../components/buttons/AddBtn";
import { AppModal } from "../../components/modal/AppModal";
import { CreateOS } from "../../components/createForms/CreateOS";
import { LoadingContainer } from "../../components/spinner/LoadingContainer";
import type { OsType } from "../../models/os";
import { PAGE_SIZE } from "../../utils/pageSize";
import { useEmpresaAtual } from "../../components/empresas/useEmpresas";
import { FaSearch } from "react-icons/fa";
import { useAuth } from "../../contexts/AuthContext";
import { queryKeys } from "../../services/queryKeys";

export function OrdensDeServico () {
    const { user: authUser } = useAuth();
    const [ sortBy, setSortBy ] = useState("id-desc");
    const [ page, setPage ] = useState(1);
    const [ searchInput, setSearchInput ]= useState('');
    const [ searchTerms, setSearchTerms ] = useState('')

    const { data: user } = useEmpresaAtual();
    const isAdmin = user?.role === "admin" || user?.role === "financeiro_master" ? true : false;

    const { data, isLoading } = useQuery({
        queryKey: queryKeys.ordensServico.page(authUser?.id, sortBy, page, searchInput),
        queryFn: () => GetOS(sortBy, page, searchInput),
        enabled: !!authUser?.id,
    });

    const count = data?.count ?? 0;
    const [ isCreateOpen, setIsCreateOpen ] = useState(false)
    const [ osSelecionada, setOsSelecionada ] = useState<OsType | null>(null);
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
                        value={searchTerms}
                        onChange={(e) => setSearchTerms(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                            setSearchInput(searchTerms);
                            setPage(1);
                            }
                        }}
                    />
                </SearchBox>
            </SearchWrapper>

            <ClientesStyled>
                <ClientesInfos>Ordens de serviço</ClientesInfos>
                <ClientesInfos>Ordenar por <SelectStyled value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                    <option value="id">ID</option>      
                    <option value="valorServico-asc">Valor do serviço (Menor - maior)</option>    
                    <option value="valorServico-desc">Valor do serviço (Maior - menor)</option>    
                    <option value="dataServico-asc">Data do serviço (Menor - maior)</option>    
                    <option value="dataServico-desc">Data do serviço (Maior - menor)</option>    
                    <option value="motor">Motor</option>    
                </SelectStyled> </ClientesInfos>
            </ClientesStyled>

            <OSTable>
                <OSHeader>
                    <HeaderItem>ID</HeaderItem>
                    <HeaderItem>Cliente</HeaderItem>
                    <HeaderItem>Data do serviço</HeaderItem>
                    <HeaderItem>Motor</HeaderItem>
                    <HeaderItem>Valor</HeaderItem>
                    <HeaderItem>Data de vencimento</HeaderItem>
                </OSHeader>

                {!isLoading && data?.data.map((OS) => {
                    return (
                        <OrdemDeServiço key={OS.id} OS={OS} setOsSelecionada={setOsSelecionada} setIsCreateOpen={setIsCreateOpen} isAdmin={isAdmin} />
                    )
                })}

                <OSTableFooter>
                    <FooterInfo>
                    {`Mostrando ${count === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–${Math.min(PAGE_SIZE * page, count)} de ${count} ordens de serviço`}
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
            </OSTable>

            {isAdmin && (
                <AddBtn setIsCreateOpen={setIsCreateOpen} novo ={"Criar ordem de serviço"} />
            )}

            {isCreateOpen && (
              <AppModal open onClose={() => {
                setIsCreateOpen(false);
                setOsSelecionada(null);
              }}>
                <CreateOS key={osSelecionada?.id ?? "nova"} osSelecionada={osSelecionada} />
              </AppModal>
            )}
                
            
        </MainContent>
    )
}
