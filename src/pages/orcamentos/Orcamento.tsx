import { useQuery } from "@tanstack/react-query"
import { MainContent } from "../../components/mainContent/MainContent";
import { FiltroSituacaoLabel, FiltrosSituacao, FooterInfo, OSHeader, OSTable, OSTableFooter, PaginationButton, PaginationControls, SearchBox, SearchIcon, SearchInput, SearchWrapper, StatusCounterCard, StatusCounterLabel, StatusCounters, StatusCounterValue } from "./OrcamentoUnicoStyled";
import { ClientesStyled, ClientesInfos, HeaderItem, SelectStyled } from "../clientes/ClientesStyled";
import { useState } from "react";
import { AddBtn } from "../../components/buttons/AddBtn";
import { CreateClienteModal } from "../../components/createForms/CreateClienteModal";
import { LoadingContainer } from "../../components/spinner/LoadingContainer";
import { PAGE_SIZE } from "../../utils/pageSize";
import { GetOrcamentos } from "./Orcamento";
import { CreateOrcamento } from "../../components/createForms/CreateOrcamento";
import { OrcamentoDetalhes } from "./OrcamentoDetalhes";
import { useEmpresaAtual } from "../../components/empresas/useEmpresas";

export function Orcamento () {
    const { data: user } = useEmpresaAtual();
    const isAdmin = user?.role === "admin" || user?.role === "financeiro_master" ? true : false;

    const [ sortBy, setSortBy ] = useState("id-desc");
    const [ page, setPage ] = useState(1);
    const [ searchInput, setSearchInput ]= useState('');
    const [ searchTerms, setSearchTerms ] = useState('')

    const { data, isLoading } = useQuery({
        queryKey: ['Orcamentos', sortBy, page, searchInput],
        queryFn: () => GetOrcamentos(sortBy, page, searchInput),
    });

    const orcamentosAnalise = data?.data.filter((orcamento: any) => orcamento.situacao === "analise");
    const orcamentosAguardando = data?.data.filter((orcamento: any) => orcamento.situacao === "aguardando");
    const orcamentosProducao = data?.data.filter((orcamento: any) => orcamento.situacao === "producao");
    const orcamentosPronto = data?.data.filter((orcamento: any) => orcamento.situacao === "pronto");
    const orcamentosCancelado = data?.data.filter((orcamento: any) => orcamento.situacao === "cancelado");
    const orcamentosAguardandoPecas = data?.data.filter((orcamento: any) => orcamento.situacao === "aguardandoPecas");

    const count = data?.count ?? 0;
    const [ isCreateOpen, setIsCreateOpen ] = useState(false)
    const [ orcamentoSelecionado, setOrcamentoSelecionado ] = useState<any>(null);
    const numberOfPages = Math?.ceil(count / PAGE_SIZE);
    const paginas = Array.from({ length: numberOfPages }, (_, i) => i + 1);

    const situacoesFiltro = [
        { value: "analise", label: "Análise" },
        { value: "aguardando", label: "Aguardando" },
        { value: "aguardandoPecas", label: "Aguardando peças" },
        { value: "producao", label: "Produção" },
        { value: "pronto", label: "Pronto" },
        { value: "cancelado", label: "Cancelado" },
    ];

    const [situacoesSelecionadas, setSituacoesSelecionadas] = useState<string[]>([]);

    function toggleSituacao(situacao: string) {
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
                    <option value="idCliente-asc">Nome do cliente (A-Z)</option>    
                    <option value="idCliente-desc">Nome do cliente (Z-A)</option>    
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
                    <HeaderItem>Data do orçamento</HeaderItem>
                    <HeaderItem>Motor</HeaderItem>
                    <HeaderItem>Orçamento</HeaderItem>
                    <HeaderItem>Situação</HeaderItem>
                </OSHeader>

                {!isLoading && orcamentosFiltrados?.map((orcamento) => {
                    return (
                        <OrcamentoDetalhes orcamento={orcamento} setOrcamentoSelecionado={setOrcamentoSelecionado} setIsCreateOpen={setIsCreateOpen} isAdmin={isAdmin} />
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
                        <PaginationButton value={pagina} onClick={() => setPage(pagina)} $active={pagina === page}>
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
            

            <CreateClienteModal open={isCreateOpen} onClose={() => setIsCreateOpen(false)}>
                <CreateOrcamento orcamentoSelecionado={orcamentoSelecionado} />
            </CreateClienteModal> 
        </MainContent>
    )
}