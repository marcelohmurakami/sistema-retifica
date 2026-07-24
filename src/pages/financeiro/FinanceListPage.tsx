import React, { useState } from "react";
import {
  PageContainer,
  Header,
  HeaderContent,
  Title,
  Subtitle,
  TableWrapper,
  Table,
  Thead,
  Tbody,
  Th,
  Td,
  EmptyState,
  StatusBadge,
  Toolbar,
  SearchInput,
  FilterSelect,
  HeaderActions,
  ActionsCell,
  ActionButton,
  DeleteButton,
  FlexButtons,
} from "./FinanceListPageStyled";
import { MonthInput, VerTodosButton } from "./FinanceiroStyled";
import { BackButton } from "../ordensDeServico/OsDetalhesStyled";
import { Link } from "react-router";

type Column<T> = {
  key: string;
  title: string;
  render?: (item: T) => React.ReactNode;
};

type FinanceListPageProps<T> = {
  title: string;
  subtitle: string;
  data: T[];
  columns: Column<T>[];
  emptyMessage?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  filterValue?: string;
  onFilterChange?: (value: string) => void;
  filterOptions?: { label: string; value: string }[];
  actions?: React.ReactNode;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  onCreate?: () => void;
  buttonLabel?: string;
};

type FinanceItemBase = {
  id: string | number;
  dataVencimento?: string | null;
  dataRecebimento?: string | null;
  dataPagamento?: string | null;
};

export function FinanceListPage<T extends FinanceItemBase>({
  title,
  subtitle,
  data,
  columns,
  emptyMessage = "Nenhum registro encontrado.",
  searchValue = "",
  onSearchChange,
  filterValue = "",
  onFilterChange,
  filterOptions = [],
  actions,
  onEdit,
  onDelete,
  onCreate,
  buttonLabel = "Novo registro",
}: FinanceListPageProps<T>) {
  const [mesSelecionado, setMesSelecionado] = useState("")

  function isSameMonth(date?: string | null) {
    if (!date || !mesSelecionado) return false

    return date.slice(0, 7) === mesSelecionado
  }

  const financas = mesSelecionado
    ? data?.filter((item) =>
        isSameMonth(item?.dataVencimento || item?.dataRecebimento || item?.dataPagamento)
      )
    : data

  return (
    <PageContainer>
      <Header>
        <HeaderContent>
          <div>
            <Title>{title}</Title>
            <Subtitle>{subtitle}</Subtitle>
          </div>

          {actions && <HeaderActions>{actions}</HeaderActions>}
        </HeaderContent>

        <Toolbar>
          <SearchInput
            placeholder="Buscar..."
            value={searchValue}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onSearchChange?.(e.target.value)}
          />

          {filterOptions.length > 0 && (
            <FilterSelect
              value={filterValue}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onFilterChange?.(e.target.value)}
            >
              {filterOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </FilterSelect>
          )}

          <MonthInput
            type="month"
            value={mesSelecionado}
            onChange={(e) => setMesSelecionado(e.target.value)}
          />

          {mesSelecionado && (
            <VerTodosButton type="button" onClick={() => setMesSelecionado("")}>
              Ver todos
            </VerTodosButton>
          )}
        </Toolbar>
      </Header>

      <TableWrapper>
        <Table>
          <Thead>
            <tr>
              {columns.map((column) => (
                <Th key={column.key}>{column.title}</Th>
              ))}

              <Th>Ações</Th>
            </tr>
          </Thead>

          <Tbody>
            {financas?.length > 0 ? (
              financas.map((item) => (
                <tr key={item.id}>
                  {columns.map((column) => (
                    <Td key={column.key} data-label={column.title}>
                      {column.render
                        ? column.render(item)
                        : String(
                            (item as unknown as Record<string, unknown>)[column.key] ?? "-"
                          )}
                    </Td>
                  ))}

                  <Td data-label="Ações">
                    <ActionsCell>
                      <ActionButton
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit?.(item);
                        }}
                      >
                        Editar
                      </ActionButton>

                      <DeleteButton
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete?.(item);
                        }}
                      >
                        Excluir
                      </DeleteButton>
                    </ActionsCell>
                  </Td>
                </tr>
              ))
            ) : (
              <tr>
                <Td colSpan={columns.length + 1} data-empty="true">
                  <EmptyState>{emptyMessage}</EmptyState>
                </Td>
              </tr>
            )}
          </Tbody>
        </Table>
      </TableWrapper>
      <FlexButtons>
        <VerTodosButton onClick={() => onCreate?.()}>
            {buttonLabel}
        </VerTodosButton>
        <Link to="/financeiro">
            <BackButton>Voltar</BackButton>
        </Link>
      </FlexButtons>
    </PageContainer>
  );
}

type BadgeVariant = "PENDENTE" | "PARCIAL" | "PAGO" | "ATRASADO";

export function FinanceStatusBadge({
  children,
  variant,
}: {
  children: React.ReactNode;
  variant: BadgeVariant;
}) {
  return <StatusBadge $variant={variant}>{children}</StatusBadge>;
}
