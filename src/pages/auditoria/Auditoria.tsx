import { useMemo, useState } from "react";
import {
  FaBoxOpen,
  FaCalendarAlt,
  FaChevronDown,
  FaChevronUp,
  FaClipboardList,
  FaEdit,
  FaFilter,
  FaHistory,
  FaPlus,
  FaSearch,
  FaShieldAlt,
  FaTrash
} from "react-icons/fa";
import { useGetAuditoria } from "./useAuditoria";
import {
  PageContainer,
  Header,
  HeaderBadge,
  Title,
  Subtitle,
  CardsGrid,
  MetricCard,
  Toolbar,
  SearchBox,
  SelectBox,
  AuditPanel,
  PanelHeader,
  PanelIcon,
  AuditList,
  AuditItem,
  ActionIcon,
  AuditContent,
  AuditTopLine,
  ActionBadge,
  AuditMeta,
  DetailsBox,
  DetailsButton,
  DetailsContent,
  ChangedFields,
  ChangedField,
  ChangedValues,
  ChangedValue,
  ChangedArrow,
  EmptyState,
} from "./AuditoriaStyled";

type AuditoriaItem = {
  id: number;
  usuario_id?: string | null;
  usuario_nome?: string;
  entidade: string;
  entidade_id?: string | null;
  acao: string;
  dados_anteriores?: Record<string, unknown> | null;
  dados_novos?: Record<string, unknown> | null;
  created_at: string;
};

const entidadeLabels: Record<string, string> = {
  Clientes: "Clientes",
  Estoque: "Estoque",
  Orcamentos: "Orcamentos",
  "OrdensDeServiço": "Ordens de serviço",
  ContasPagar: "Contas a pagar",
  ContasReceber: "Contas a receber",
  PagamentoQuitado: "Pagamentos quitados",
  PagamentoRecebido: "Pagamentos recebidos",
  Servicos: "Serviços",
  itensOS: "Itens da OS",
  anotacoes_diarias: "Anotações diarias",
  anotacoes_gerais: "Anotações gerais",
  empresas: "Empresas",
};

function formatarData(data: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(data));
}

function getAcaoLabel(acao: string) {
  if (acao === "criou") return "Criou";
  if (acao === "editou") return "Editou";
  if (acao === "deletou") return "Deletou";
  return acao;
}

function getAcaoIcon(acao: string) {
  if (acao === "criou") return <FaPlus />;
  if (acao === "editou") return <FaEdit />;
  if (acao === "deletou") return <FaTrash />;
  return <FaHistory />;
}

function getAcaoVariant(acao: string) {
  if (acao === "criou") return "green";
  if (acao === "editou") return "blue";
  if (acao === "deletou") return "red";
  return "dark";
}

function getCamposAlterados(item: AuditoriaItem) {
  if (item.acao !== "editou" || !item.dados_anteriores || !item.dados_novos) {
    return [];
  }

  return Object.keys(item.dados_novos)
    .filter((campo) => {
      const antes = item.dados_anteriores?.[campo];
      const depois = item.dados_novos?.[campo];
      return JSON.stringify(antes) !== JSON.stringify(depois);
    })
    .filter((campo) => !["updated_at"].includes(campo));
}

function DetalhesAuditoria({ item }: { item: AuditoriaItem }) {
  const [isOpen, setIsOpen] = useState(false);
  const camposAlterados = getCamposAlterados(item);

  return (
    <DetailsBox>
      <DetailsButton type="button" onClick={() => setIsOpen((value) => !value)}>
        <span>
          {camposAlterados.length
            ? `${camposAlterados.length} campo(s) alterado(s)`
            : "Ver detalhes do registro"}
        </span>
        {isOpen ? <FaChevronUp /> : <FaChevronDown />}
      </DetailsButton>

      {isOpen && (
        <DetailsContent>
          {camposAlterados.length > 0 && (
            <ChangedFields>
              {camposAlterados.map((campo) => (
                <ChangedField key={campo}>
                  <strong>{campo}</strong>
                  <ChangedValues>
                    <ChangedValue>
                      <small>Antes</small>
                      <span>{String(item.dados_anteriores?.[campo] ?? "vazio")}</span>
                    </ChangedValue>

                    <ChangedArrow aria-hidden="true">-&gt;</ChangedArrow>

                    <ChangedValue>
                      <small>Depois</small>
                      <span>{String(item.dados_novos?.[campo] ?? "vazio")}</span>
                    </ChangedValue>
                  </ChangedValues>
                </ChangedField>
              ))}
            </ChangedFields>
          )}
        </DetailsContent>
      )}
    </DetailsBox>
  );
}

export function Auditoria() {
  const { data: auditorias = [], isLoading } = useGetAuditoria();
  const [busca, setBusca] = useState("");
  const [entidade, setEntidade] = useState("todas");
  const [acao, setAcao] = useState("todas");

  const entidadesDisponiveis = useMemo(() => {
    return Array.from(
      new Set((auditorias as AuditoriaItem[]).map((item) => item.entidade))
    ).sort();
  }, [auditorias]);

  const auditoriasFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return (auditorias as AuditoriaItem[]).filter((item) => {
        if (item.entidade === "itensOS") return false;

        const entidadeMatch = entidade === "todas" || item.entidade === entidade;
        const acaoMatch = acao === "todas" || item.acao === acao;
        const texto = `${item.entidade} ${item.entidade_id ?? ""} ${item.acao}`.toLowerCase();
        const buscaMatch = !termo || texto.includes(termo);

        return entidadeMatch && acaoMatch && buscaMatch;
    });
  }, [acao, auditorias, busca, entidade]);

  const resumo = useMemo(() => {
    return (auditorias as AuditoriaItem[]).reduce(
      (acc, item) => {
        acc.total += 1;
        if (item.acao === "criou") acc.criados += 1;
        if (item.acao === "editou") acc.editados += 1;
        if (item.acao === "deletou") acc.deletados += 1;
        return acc;
      },
      { total: 0, criados: 0, editados: 0, deletados: 0 }
    );
  }, [auditorias]);

  if (isLoading) {
    return (
      <PageContainer>
        <HeaderBadge>
          <FaHistory />
          Auditoria
        </HeaderBadge>
        <Title>Carregando historico...</Title>
        <Subtitle>Buscando as ultimas alteracoes registradas no sistema.</Subtitle>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Header>
        <div>
          <HeaderBadge>
            <FaHistory />
            Auditoria
          </HeaderBadge>
          <Title>Historico de alteracoes</Title>
          <Subtitle>
            Veja o que foi criado, editado ou deletado no sistema, com data,
            tabela afetada e detalhes do registro.
          </Subtitle>
        </div>
      </Header>

      <CardsGrid>
        <MetricCard $variant="dark">
          <FaClipboardList />
          <span>Total registrado</span>
          <strong>{resumo.total}</strong>
          <small>Eventos encontrados no historico.</small>
        </MetricCard>
        <MetricCard $variant="green">
          <FaPlus />
          <span>Criados</span>
          <strong>{resumo.criados}</strong>
          <small>Novos registros inseridos.</small>
        </MetricCard>
        <MetricCard $variant="blue">
          <FaEdit />
          <span>Editados</span>
          <strong>{resumo.editados}</strong>
          <small>Registros alterados.</small>
        </MetricCard>
        <MetricCard $variant="red">
          <FaTrash />
          <span>Deletados</span>
          <strong>{resumo.deletados}</strong>
          <small>Registros removidos.</small>
        </MetricCard>
      </CardsGrid>

      <Toolbar>
        <SearchBox>
          <FaSearch />
          <input
            type="search"
            placeholder="Buscar por tabela, acao ou ID..."
            value={busca}
            onChange={(event) => setBusca(event.target.value)}
          />
        </SearchBox>

        <SelectBox>
          <FaFilter />
          <label htmlFor="filtroEntidade">Tabela</label>
          <select
            id="filtroEntidade"
            value={entidade}
            onChange={(event) => setEntidade(event.target.value)}
          >
            <option value="todas">Todas</option>
            {entidadesDisponiveis.map((item) => (
              <option key={item} value={item}>
                {entidadeLabels[item] ?? item}
              </option>
            ))}
          </select>
        </SelectBox>

        <SelectBox>
          <FaShieldAlt />
          <label htmlFor="filtroAcao">Acao</label>
          <select
            id="filtroAcao"
            value={acao}
            onChange={(event) => setAcao(event.target.value)}
          >
            <option value="todas">Todas</option>
            <option value="criou">Criou</option>
            <option value="editou">Editou</option>
            <option value="deletou">Deletou</option>
          </select>
        </SelectBox>
      </Toolbar>

      <AuditPanel>
        <PanelHeader>
          <PanelIcon>
            <FaCalendarAlt />
          </PanelIcon>
          <div>
            <h2>Eventos recentes</h2>
            <p>{auditoriasFiltradas.length} evento(s) encontrados.</p>
          </div>
        </PanelHeader>

        {auditoriasFiltradas.length === 0 ? (
          <EmptyState>
            <FaBoxOpen />
            <strong>Nenhum evento encontrado</strong>
            <span>Tente limpar os filtros ou ampliar sua busca.</span>
          </EmptyState>
        ) : (
          <AuditList>
            {auditoriasFiltradas.map((item) => {
              const entidadeLabel = entidadeLabels[item.entidade] ?? item.entidade;
              const variant = getAcaoVariant(item.acao);

              return (
                <AuditItem key={item.id}>
                  <ActionIcon $variant={variant}>{getAcaoIcon(item.acao)}</ActionIcon>

                  <AuditContent>
                    <AuditTopLine>
                      <div>
                        <strong>
                          {getAcaoLabel(item.acao)} {entidadeLabel}
                          {item.entidade_id ? ` #${item.entidade_id}` : ""}
                        </strong>
                        <span>{formatarData(item.created_at)}</span>
                      </div>

                      <ActionBadge $variant={variant}>
                        {getAcaoLabel(item.acao)}
                      </ActionBadge>
                    </AuditTopLine>

                    <AuditMeta>
                      <span>Tabela: {entidadeLabel}</span>
                      {item.entidade_id && <span>ID: {item.entidade_id}</span>}
                      {item.usuario_id && <span>Usuario: {item.usuario_nome}</span>}
                    </AuditMeta>

                    {item.acao === "editou" && <DetalhesAuditoria item={item} />}
                    
                  </AuditContent>
                </AuditItem>
              );
            })}
          </AuditList>
        )}
      </AuditPanel>
    </PageContainer>
  );
}
