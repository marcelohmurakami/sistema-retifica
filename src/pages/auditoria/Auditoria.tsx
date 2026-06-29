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
import styled from "styled-components";
import { useGetAuditoria } from "./useAuditoria";

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

const PageContainer = styled.main`
  width: 100%;
  min-height: 100%;
  padding: clamp(1rem, 3vw, 2rem);
  color: ${({ theme }) => theme.colors.textPrimary};
  background: ${({ theme }) => theme.colors.background};
  overflow-x: hidden;

  @media (max-width: 760px) {
    padding: 0.85rem;
  }
`;

const Header = styled.section`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
  max-width: 1180px;
  margin: 0 auto 1rem;
  padding: clamp(1.1rem, 3vw, 1.6rem);
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 1rem;
  background: ${({ theme }) => theme.colors.surface};
  box-shadow: ${({ theme }) => theme.shadow.sm};

  @media (max-width: 760px) {
    align-items: stretch;
    flex-direction: column;
  }

  @media (max-width: 520px) {
    border-radius: 0.85rem;
  }
`;

const HeaderBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  margin-bottom: 0.9rem;
  border: 1px solid #bfdbfe;
  border-radius: 999px;
  color: #1d4ed8;
  background: #eef2ff;
  font-size: 0.9rem;
  font-weight: 800;
`;

const Title = styled.h1`
  margin: 0;
  color: ${({ theme }) => theme.colors.primaryDark};
  font-size: clamp(1.7rem, 6vw, 3rem);
  line-height: 1.08;
  overflow-wrap: anywhere;
`;

const Subtitle = styled.p`
  max-width: 720px;
  margin: 0.75rem 0 0;
  color: ${({ theme }) => theme.colors.textSecondary};
  line-height: 1.6;
  font-size: clamp(0.95rem, 3.5vw, 1rem);
`;

const CardsGrid = styled.section`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
  gap: 1rem;
  max-width: 1180px;
  margin: 0 auto 1rem;

  @media (min-width: 1021px) {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  @media (max-width: 620px) {
    grid-template-columns: 1fr;
    gap: 0.85rem;
  }
`;

const MetricCard = styled.article<{ $variant: "green" | "blue" | "red" | "dark" }>`
  position: relative;
  min-height: 150px;
  padding: 1rem;
  border: 1px solid
    ${({ $variant }) =>
      ({
        green: "rgba(34, 197, 94, 0.26)",
        blue: "rgba(37, 99, 235, 0.24)",
        red: "rgba(220, 38, 38, 0.24)",
        dark: "rgba(15, 23, 42, 0.18)",
      })[$variant]};
  border-radius: 1rem;
  background:
    ${({ theme }) => theme.colors.surface},
    ${({ $variant }) =>
      ({
        green: "linear-gradient(135deg, rgba(22, 163, 74, 0.1), transparent)",
        blue: "linear-gradient(135deg, rgba(37, 99, 235, 0.1), transparent)",
        red: "linear-gradient(135deg, rgba(220, 38, 38, 0.1), transparent)",
        dark: "linear-gradient(135deg, rgba(15, 23, 42, 0.1), transparent)",
      })[$variant]};
  box-shadow: 0 16px 34px rgba(15, 23, 42, 0.075);
  overflow: hidden;
  transition: transform 0.18s ease, box-shadow 0.18s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 22px 45px rgba(15, 23, 42, 0.11);
  }

  &::before {
    content: "";
    position: absolute;
    inset: 0 0 auto;
    height: 0.35rem;
    background: ${({ $variant }) =>
      ({ green: "#16a34a", blue: "#2563eb", red: "#dc2626", dark: "#0f172a" })[
        $variant
      ]};
  }

  > svg {
    width: 2.2rem;
    height: 2.2rem;
    padding: 0.55rem;
    border-radius: 0.7rem;
    color: #ffffff;
    background: ${({ $variant }) =>
      ({ green: "#16a34a", blue: "#2563eb", red: "#dc2626", dark: "#0f172a" })[
        $variant
      ]};
  }

  span {
    display: block;
    margin-top: 0.8rem;
    color: ${({ theme }) => theme.colors.textSecondary};
    font-size: 0.8rem;
    font-weight: 800;
    text-transform: uppercase;
    line-height: 1.35;
  }

  strong {
    display: block;
    margin-top: 0.35rem;
    color: ${({ theme }) => theme.colors.primaryDark};
    font-size: clamp(1.8rem, 7vw, 2.15rem);
  }

  small {
    display: block;
    margin-top: 0.5rem;
    color: ${({ theme }) => theme.colors.textSecondary};
    line-height: 1.4;
  }
`;

const Toolbar = styled.section`
  display: grid;
  grid-template-columns: minmax(260px, 1fr) 220px 200px;
  gap: 0.8rem;
  max-width: 1180px;
  margin: 0 auto 1rem;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const SearchBox = styled.label`
  display: flex;
  align-items: center;
  gap: 0.65rem;
  min-height: 52px;
  padding: 0.85rem 1rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 0.9rem;
  background: ${({ theme }) => theme.colors.surface};
  box-shadow: ${({ theme }) => theme.shadow.sm};

  svg {
    color: ${({ theme }) => theme.colors.textSecondary};
  }

  input {
    width: 100%;
    border: 0;
    outline: 0;
    color: ${({ theme }) => theme.colors.primaryDark};
    background: transparent;
    font: inherit;
    font-weight: 650;
    min-width: 0;

    &::placeholder {
      color: #94a3b8;
    }
  }
`;

const SelectBox = styled.div`
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: 0.25rem 0.55rem;
  min-height: 52px;
  padding: 0.7rem 0.85rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 0.9rem;
  background: ${({ theme }) => theme.colors.surface};
  box-shadow: ${({ theme }) => theme.shadow.sm};

  svg {
    grid-row: 1 / span 2;
    color: #1d4ed8;
  }

  label {
    color: ${({ theme }) => theme.colors.textSecondary};
    font-size: 0.72rem;
    font-weight: 900;
    text-transform: uppercase;
  }

  select {
    border: 0;
    outline: 0;
    color: ${({ theme }) => theme.colors.primaryDark};
    background: transparent;
    font: inherit;
    font-weight: 800;
    cursor: pointer;
    min-width: 0;
  }
`;

const AuditPanel = styled.section`
  max-width: 1180px;
  margin: 0 auto;
  overflow: hidden;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 1rem;
  background: ${({ theme }) => theme.colors.surface};
  box-shadow: ${({ theme }) => theme.shadow.sm};

  @media (max-width: 620px) {
    border-radius: 0.85rem;
  }
`;

const PanelHeader = styled.header`
  display: flex;
  gap: 0.85rem;
  padding: 1.15rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surface};

  h2 {
    margin: 0;
    color: ${({ theme }) => theme.colors.primaryDark};
    line-height: 1.25;
  }

  p {
    margin: 0.35rem 0 0;
    color: ${({ theme }) => theme.colors.textSecondary};
    line-height: 1.45;
  }

  @media (max-width: 420px) {
    flex-direction: column;
  }
`;

const PanelIcon = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.4rem;
  height: 2.4rem;
  border-radius: 0.8rem;
  color: #1d4ed8;
  background: #dbeafe;
  flex: 0 0 auto;
`;

const AuditList = styled.div`
  display: grid;

  @media (max-width: 620px) {
    gap: 0.8rem;
    padding: 0.8rem;
    background: ${({ theme }) => theme.colors.background};
  }
`;

const AuditItem = styled.article`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 0.9rem;
  padding: 1rem 1.15rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surface};

  &:last-child {
    border-bottom: 0;
  }

  @media (max-width: 620px) {
    grid-template-columns: 1fr;
    gap: 0.75rem;
    padding: 1rem;
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: 0.85rem;
    box-shadow: 0 10px 22px rgba(15, 23, 42, 0.06);
  }
`;

const ActionIcon = styled.div<{ $variant: string }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.35rem;
  height: 2.35rem;
  border-radius: 999px;
  color: ${({ $variant }) =>
    ({ green: "#15803d", blue: "#1d4ed8", red: "#b91c1c", dark: "#0f172a" })[
      $variant
    ]};
  background: ${({ $variant }) =>
    ({ green: "#dcfce7", blue: "#dbeafe", red: "#fee2e2", dark: "#e2e8f0" })[
      $variant
    ]};

  @media (max-width: 620px) {
    width: 2.6rem;
    height: 2.6rem;
  }
`;

const AuditContent = styled.div`
  min-width: 0;
`;

const AuditTopLine = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 1rem;

  strong,
  span {
    display: block;
  }

  strong {
    color: ${({ theme }) => theme.colors.primaryDark};
    overflow-wrap: anywhere;
  }

  span {
    margin-top: 0.25rem;
    color: ${({ theme }) => theme.colors.textSecondary};
    font-size: 0.86rem;
  }

  @media (max-width: 620px) {
    align-items: flex-start;
    flex-direction: column;
    gap: 0.65rem;
  }
`;

const ActionBadge = styled.span<{ $variant: string }>`
  height: fit-content;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.35rem 0.6rem;
  border-radius: 999px;
  color: ${({ $variant }) =>
    ({ green: "#15803d", blue: "#1d4ed8", red: "#b91c1c", dark: "#0f172a" })[
      $variant
    ]};
  background: ${({ $variant }) =>
    ({ green: "#dcfce7", blue: "#dbeafe", red: "#fee2e2", dark: "#e2e8f0" })[
      $variant
    ]};
  font-size: 0.75rem;
  font-weight: 900;
  text-transform: uppercase;
  white-space: nowrap;
`;

const AuditMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  margin-top: 0.65rem;

  span {
    padding: 0.35rem 0.55rem;
    border-radius: 999px;
    color: ${({ theme }) => theme.colors.textSecondary};
    background: ${({ theme }) => theme.colors.background};
    font-size: 0.78rem;
    font-weight: 750;
    overflow-wrap: anywhere;
  }

  @media (max-width: 420px) {
    span {
      width: 100%;
      border-radius: 0.7rem;
    }
  }
`;

const DetailsBox = styled.div`
  margin-top: 0.85rem;
`;

const DetailsButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-height: 38px;
  padding: 0.45rem 0.75rem;
  border: 1px solid #bfdbfe;
  border-radius: 999px;
  color: #1d4ed8;
  background: #eff6ff;
  font: inherit;
  font-size: 0.88rem;
  font-weight: 850;
  cursor: pointer;
  transition: background 0.18s ease, border-color 0.18s ease;

  &:hover {
    background: #dbeafe;
    border-color: #93c5fd;
  }

  @media (max-width: 420px) {
    width: 100%;
    min-height: 44px;
    font-size: 0.95rem;
  }
`;

const DetailsContent = styled.div`
  margin-top: 0.75rem;
`;

const ChangedFields = styled.div`
  display: grid;
  gap: 0.65rem;
  margin-bottom: 0.8rem;
`;

const ChangedField = styled.div`
  display: grid;
  gap: 0.55rem;
  padding: 0.75rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 0.85rem;
  background: ${({ theme }) => theme.colors.background};

  > strong {
    color: ${({ theme }) => theme.colors.primaryDark};
    font-size: 0.92rem;
    overflow-wrap: anywhere;
  }
`;

const ChangedValues = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  align-items: stretch;
  gap: 0.55rem;

  @media (max-width: 620px) {
    grid-template-columns: 1fr;
  }
`;

const ChangedValue = styled.div`
  min-width: 0;
  padding: 0.65rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 0.7rem;
  background: ${({ theme }) => theme.colors.surface};

  small,
  span {
    display: block;
  }

  small {
    color: ${({ theme }) => theme.colors.textSecondary};
    font-size: 0.72rem;
    font-weight: 900;
    text-transform: uppercase;
  }

  span {
    margin-top: 0.25rem;
    color: ${({ theme }) => theme.colors.textPrimary};
    line-height: 1.45;
    overflow-wrap: anywhere;
    word-break: break-word;
  }
`;

const ChangedArrow = styled.span`
  display: grid;
  place-items: center;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-weight: 900;

  @media (max-width: 620px) {
    transform: rotate(90deg);
  }
`;

const EmptyState = styled.div`
  display: grid;
  justify-items: center;
  gap: 0.45rem;
  padding: 3rem 1rem;
  color: ${({ theme }) => theme.colors.textSecondary};
  text-align: center;

  svg {
    color: #94a3b8;
    font-size: 2rem;
  }

  strong {
    color: ${({ theme }) => theme.colors.primaryDark};
  }
`;


