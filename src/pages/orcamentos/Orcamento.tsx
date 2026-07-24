import { useQuery } from "@tanstack/react-query"
import { MainContent } from "../../components/mainContent/MainContent";
import { FiltroSituacaoLabel, FiltrosSituacao, FooterInfo, OSHeader, OSTable, OSTableFooter, PaginationButton, PaginationControls, SearchBox, SearchIcon, SearchInput, SearchWrapper, StatusCounterCard, StatusCounterLabel, StatusCounters, StatusCounterValue } from "./OrcamentoUnicoStyled";
import { ClientesStyled, ClientesInfos, HeaderItem, SelectStyled } from "../clientes/ClientesStyled";
import { useState } from "react";
import { AddBtn } from "../../components/buttons/AddBtn";
import { AppModal } from "../../components/modal/AppModal";
import { LoadingContainer } from "../../components/spinner/LoadingContainer";
import { PAGE_SIZE } from "../../utils/pageSize";
import { GetOrcamentos } from "./Orcamento";
import { CreateOrcamento } from "../../components/createForms/CreateOrcamento";
import { OrcamentoDetalhes } from "./OrcamentoDetalhes";
import { useEmpresaAtual } from "../../components/empresas/useEmpresas";
import type { OrcamentoType, SituacaoOrcamento } from "../../models/orcamento";
import { useAuth } from "../../contexts/AuthContext";
import { queryKeys } from "../../services/queryKeys";

export function Orcamento () {
    const { user: authUser } = useAuth();
    const { data: user } = useEmpresaAtual();
    const isAdmin = user?.role === "admin" || user?.role === "financeiro_master" ? true : false;

    const [ sortBy, setSortBy ] = useState("id-desc");
    const [ page, setPage ] = useState(1);
    const [ searchInput, setSearchInput ]= useState('');
    const [ searchTerms, setSearchTerms ] = useState('')

    const { data, isLoading } = useQuery({
        queryKey: queryKeys.orcamentos.page(authUser?.id, sortBy, page, searchInput),
        queryFn: () => GetOrcamentos(sortBy, page, searchInput),
        enabled: !!authUser?.id,
    });

    const orcamentosAnalise = data?.data.filter((orcamento) => orcamento.situacao === "analise");
    const orcamentosAguardando = data?.data.filter((orcamento) => orcamento.situacao === "aguardando");
    const orcamentosProducao = data?.data.filter((orcamento) => orcamento.situacao === "producao");
    const orcamentosPronto = data?.data.filter((orcamento) => orcamento.situacao === "pronto");
    const orcamentosCancelado = data?.data.filter((orcamento) => orcamento.situacao === "cancelado");
    const orcamentosAguardandoPecas = data?.data.filter((orcamento) => orcamento.situacao === "aguardandoPecas");

    const count = data?.count ?? 0;
    const [ isCreateOpen, setIsCreateOpen ] = useState(false)
    const [ orcamentoSelecionado, setOrcamentoSelecionado ] = useState<OrcamentoType | null>(null);
    const numberOfPages = Math?.ceil(count / PAGE_SIZE);
    const inicioPaginas = Math.max(1, Math.min(page - 4, numberOfPages - 9));
    const paginas = Array.from(
      { length: Math.min(10, numberOfPages) },
      (_, i) => inicioPaginas + i,
    );

    const situacoesFiltro: Array<{ value: SituacaoOrcamento; label: string }> = [
        { value: "analise", label: "Análise" },
        { value: "aguardando", label: "Aguardando" },
        { value: "aguardandoPecas", label: "Aguardando peças" },
        { value: "producao", label: "Produção" },
        { value: "pronto", label: "Pronto" },
        { value: "cancelado", label: "Cancelado" },
    ];

    const [situacoesSelecionadas, setSituacoesSelecionadas] = useState<string[]>([]);

    function toggleSituacao(situacao: SituacaoOrcamento) {
        setSituacoesSelecionadas((selecionadas) => {
            if (selecionadas.includes(situacao)) {
            return selecionadas.filter((item) => item !== situacao);
            }

            return [...selecionadas, situacao];
        });
    }

    const orcamentosFiltrados =
    situacoesSelecionadas.length === 0
        ? data?.data
        : data?.data.filter((orcamento) =>
            situacoesSelecionadas.includes(orcamento.situacao)
        );

    if (isLoading) return <LoadingContainer />

    return (
        <MainContent>

            <StatusCounters>
                <StatusCounterCard situacao="analise">
                    <StatusCounterLabel>Análise</StatusCounterLabel>
                    <StatusCounterValue>{orcamentosAnalise?.length || 0}</StatusCounterValue>
                </StatusCounterCard>

                <StatusCounterCard situacao="aguardando">
                    <StatusCounterLabel>Aguardando</StatusCounterLabel>
                    <StatusCounterValue>{orcamentosAguardando?.length || 0}</StatusCounterValue>
                </StatusCounterCard>

                <StatusCounterCard situacao="aguardandoPecas">
                    <StatusCounterLabel>Aguardando peças</StatusCounterLabel>
                    <StatusCounterValue>{orcamentosAguardandoPecas?.length || 0}</StatusCounterValue>
                </StatusCounterCard>

                <StatusCounterCard situacao="producao">
                    <StatusCounterLabel>Produção</StatusCounterLabel>
                    <StatusCounterValue>{orcamentosProducao?.length || 0}</StatusCounterValue>
                </StatusCounterCard>

                <StatusCounterCard situacao="pronto">
                    <StatusCounterLabel>Pronto</StatusCounterLabel>
                    <StatusCounterValue>{orcamentosPronto?.length || 0}</StatusCounterValue>
                </StatusCounterCard>

                <StatusCounterCard situacao="cancelado">
                    <StatusCounterLabel>Cancelado</StatusCounterLabel>
                    <StatusCounterValue>{orcamentosCancelado?.length || 0}</StatusCounterValue>
                </StatusCounterCard>
                </StatusCounters>

                <SearchWrapper>
                <SearchBox>
                    <SearchIcon>🔎</SearchIcon>
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

            <FiltrosSituacao>
                {situacoesFiltro.map((situacao) => (
                    <FiltroSituacaoLabel key={situacao.value}>
                    <input
                        type="checkbox"
                        checked={situacoesSelecionadas.includes(situacao.value)}
                        onChange={() => toggleSituacao(situacao.value)}
                    />

                    <span>{situacao.label}</span>
                    </FiltroSituacaoLabel>
                ))}
            </FiltrosSituacao>

            <ClientesStyled>
                <ClientesInfos>Todos as ordens de serviço</ClientesInfos>
                <ClientesInfos>Ordernar por: <SelectStyled value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                    <option value="id">ID</option>    
                    <option value="motor-asc">Motor (A-Z)</option>
                    <option value="motor-desc">Motor (Z-A)</option>
                    <option value="situacao-asc">Situação (A-Z)</option>
                </SelectStyled> </ClientesInfos>
            </ClientesStyled>

            <OSTable>
                <OSHeader>
                    <HeaderItem>ID</HeaderItem>
                    <HeaderItem>Cliente</HeaderItem>
                    <HeaderItem>Data do orçamento</HeaderItem>
                    <HeaderItem>Motor</HeaderItem>
                    <HeaderItem>Orçamento</HeaderItem>
                    <HeaderItem>Situação</HeaderItem>
                </OSHeader>

                {!isLoading && orcamentosFiltrados?.map((orcamento) => {
                    return (
                        <OrcamentoDetalhes key={orcamento.id} orcamento={orcamento} setOrcamentoSelecionado={setOrcamentoSelecionado} setIsCreateOpen={setIsCreateOpen} isAdmin={isAdmin} />
                    )
                })}

                <OSTableFooter>
                    <FooterInfo>
                    {`Mostrando ${PAGE_SIZE * page - 9}–${PAGE_SIZE * page <= count ? PAGE_SIZE * page : count} de ${count} orçamentos`}
                    </FooterInfo>

                    <PaginationControls>
                    <PaginationButton onClick={() => setPage(1)} disabled={page === 1}>
                        «
                    </PaginationButton>

                    <PaginationButton onClick={() => setPage(page - 1)} disabled={page === 1}>
                        ‹
                    </PaginationButton>
                    {paginas.map((pagina) => (
                        <PaginationButton key={pagina} value={pagina} onClick={() => setPage(pagina)} $active={pagina === page}>
                            {pagina}
                        </PaginationButton>
                    ))}
                    <PaginationButton onClick={() => setPage(page + 1)} disabled={page === numberOfPages}>
                        ›
                    </PaginationButton>
                    <PaginationButton onClick={() => setPage(numberOfPages)} disabled={page === numberOfPages}>
                        »
                    </PaginationButton>
                    </PaginationControls>
                </OSTableFooter>
            </OSTable>

            {isAdmin && <AddBtn setIsCreateOpen={setIsCreateOpen} novo ={"Fazer novo orçamento"} />}
            

            {isCreateOpen && (
              <AppModal open onClose={() => {
                setIsCreateOpen(false);
                setOrcamentoSelecionado(null);
              }}>
                <CreateOrcamento
                  key={orcamentoSelecionado?.id ?? "novo"}
                  orcamentoSelecionado={orcamentoSelecionado}
                  setIsCreateOpen={setIsCreateOpen}
                />
              </AppModal>
            )}
        </MainContent>
    )
}
