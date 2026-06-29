import styled, { css } from "styled-components";

export const PageContainer = styled.main`
  width: 100%;
  padding: clamp(1rem, 3vw, ${({ theme }) => theme.spacing[6]});
  background: ${({ theme }) => theme.colors.background};
  min-height: calc(100vh - ${({ theme }) => theme.layout.headerHeight});
  overflow-x: hidden;
`;

export const Header = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[4]};
  margin-bottom: ${({ theme }) => theme.spacing[6]};

  @media (max-width: 640px) {
    margin-bottom: ${({ theme }) => theme.spacing[4]};
  }
`;

export const HeaderContent = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing[4]};

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

export const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};
  flex-wrap: wrap;

  @media (max-width: 640px) {
    width: 100%;

    > * {
      flex: 1 1 160px;
    }
  }
`;

export const Title = styled.h1`
  margin: 0;
  color: ${({ theme }) => theme.colors.primaryDark};
  font-family: ${({ theme }) => theme.typography.fontFamily};
  font-size: clamp(1.7rem, 4vw, ${({ theme }) => theme.typography.sizes["2xl"]});
  font-weight: ${({ theme }) => theme.typography.weights.bold};
  line-height: ${({ theme }) => theme.typography.lineHeights.tight};
  overflow-wrap: anywhere;
`;

export const Subtitle = styled.p`
  margin: ${({ theme }) => theme.spacing[2]} 0 0 0;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-family: ${({ theme }) => theme.typography.fontFamily};
  font-size: ${({ theme }) => theme.typography.sizes.md};
  font-weight: ${({ theme }) => theme.typography.weights.regular};
  line-height: ${({ theme }) => theme.typography.lineHeights.normal};
  overflow-wrap: anywhere;
`;

export const Toolbar = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing[3]};

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const InputBase = css`
  height: 42px;
  min-width: 0;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-family: ${({ theme }) => theme.typography.fontFamily};
  font-size: ${({ theme }) => theme.typography.sizes.sm};
  padding: 0 ${({ theme }) => theme.spacing[4]};
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;

  &::placeholder {
    color: ${({ theme }) => theme.colors.textSecondary};
  }

  &:focus {
    border-color: ${({ theme }) => theme.colors.accent};
    box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.15);
  }
`;

export const SearchInput = styled.input`
  ${InputBase};
  width: 100%;
  max-width: 360px;

  @media (max-width: 768px) {
    max-width: none;
  }
`;

export const FilterSelect = styled.select`
  ${InputBase};
  min-width: 180px;
  cursor: pointer;

  @media (max-width: 768px) {
    width: 100%;
  }
`;

export const TableWrapper = styled.section`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.lg};
  box-shadow: ${({ theme }) => theme.shadow.sm};
  overflow: hidden;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;

  @media (max-width: 760px) {
    border-radius: 12px;
    overflow: visible;
    background: transparent;
    border: none;
    box-shadow: none;
  }
`;

export const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  min-width: 840px;

  @media (max-width: 760px) {
    display: block;
    min-width: 0;
  }
`;

export const Thead = styled.thead`
  background: ${({ theme }) => theme.colors.background};

  @media (max-width: 760px) {
    display: none;
  }
`;

export const Tbody = styled.tbody`
  @media (max-width: 760px) {
    display: grid;
    gap: ${({ theme }) => theme.spacing[3]};
  }

  tr {
    cursor: pointer;

    transition:
    background 0.2s ease,
    transform 0.1s ease,
    box-shadow 0.15s ease;

    &:hover {
      background: ${({ theme }) => theme.colors.border};
    }

    @media (max-width: 760px) {
      display: grid;
      gap: ${({ theme }) => theme.spacing[2]};
      padding: ${({ theme }) => theme.spacing[4]};
      background: ${({ theme }) => theme.colors.surface};
      border: 1px solid ${({ theme }) => theme.colors.border};
      border-radius: ${({ theme }) => theme.radius.md};
      box-shadow: ${({ theme }) => theme.shadow.sm};

      &:hover {
        background: ${({ theme }) => theme.colors.surface};
      }
    }
  }

  tr:not(:last-child) {
    border-bottom: 1px solid ${({ theme }) => theme.colors.border};

    @media (max-width: 760px) {
      border-bottom: 1px solid ${({ theme }) => theme.colors.border};
    }
  }
`;

export const Th = styled.th`
  text-align: left;
  padding: ${({ theme }) => theme.spacing[4]};
  color: ${({ theme }) => theme.colors.textSecondary};
  font-family: ${({ theme }) => theme.typography.fontFamily};
  font-size: ${({ theme }) => theme.typography.sizes.sm};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  white-space: nowrap;
`;

export const Td = styled.td`
  text-align: left;
  padding: ${({ theme }) => theme.spacing[4]};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-family: ${({ theme }) => theme.typography.fontFamily};
  font-size: ${({ theme }) => theme.typography.sizes.sm};
  font-weight: ${({ theme }) => theme.typography.weights.regular};
  vertical-align: middle;
  max-width: 260px;
  overflow-wrap: anywhere;

  @media (max-width: 760px) {
    display: grid;
    grid-template-columns: minmax(92px, 38%) minmax(0, 1fr);
    align-items: center;
    gap: ${({ theme }) => theme.spacing[3]};
    max-width: none;
    padding: 0;
    font-size: ${({ theme }) => theme.typography.sizes.xl};
    line-height: ${({ theme }) => theme.typography.lineHeights.normal};

    &::before {
      content: attr(data-label);
      color: ${({ theme }) => theme.colors.textSecondary};
      font-weight: ${({ theme }) => theme.typography.weights.semibold};
      font-size: ${({ theme }) => theme.typography.sizes.lg};
      overflow-wrap: anywhere;
    }

    &[data-empty="true"] {
      display: block;
    }

    &[data-empty="true"]::before {
      content: none;
    }
  }

  @media (max-width: 420px) {
    grid-template-columns: 1fr;
    gap: ${({ theme }) => theme.spacing[1]};
  }
`;

export const EmptyState = styled.div`
  padding: ${({ theme }) => theme.spacing[8]} ${({ theme }) => theme.spacing[4]};
  text-align: center;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.typography.sizes.md};

  @media (max-width: 760px) {
    font-size: ${({ theme }) => theme.typography.sizes.xl};
  }
`;

type StatusBadgeProps = {
  $variant: "PENDENTE" | "PARCIAL" | "PAGO" | "ATRASADO";
};

export const StatusBadge = styled.span<StatusBadgeProps>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 6px 10px;
  border-radius: ${({ theme }) => theme.radius.pill};
  font-family: ${({ theme }) => theme.typography.fontFamily};
  font-size: ${({ theme }) => theme.typography.sizes.xs};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  line-height: 1;
  white-space: nowrap;

  ${({ theme, $variant }) =>
    $variant === "PENDENTE" &&
    css`
      background: rgba(234, 179, 8, 0.14);
      color: ${theme.colors.warning};
    `}

  ${({ theme, $variant }) =>
    $variant === "PARCIAL" &&
    css`
      background: rgba(249, 115, 22, 0.14);
      color: ${theme.colors.accentDark};
    `}

  ${({ theme, $variant }) =>
    $variant === "PAGO" &&
    css`
      background: rgba(34, 197, 94, 0.14);
      color: ${theme.colors.success};
    `}

  ${({ theme, $variant }) =>
    $variant === "ATRASADO" &&
    css`
      background: rgba(239, 68, 68, 0.14);
      color: ${theme.colors.error};
    `}
`;

export const MoneyText = styled.span`
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  color: ${({ theme }) => theme.colors.primaryDark};
`;

export const ActionsCell = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  flex-wrap: wrap;

  @media (max-width: 420px) {
    align-items: stretch;
    flex-direction: column;
    width: 100%;
  }
`;

export const ActionButton = styled.button`
  border: none;
  border-radius: ${({ theme }) => theme.radius.sm};
  min-height: 34px;
  padding: 6px 10px;
  font-size: ${({ theme }) => theme.typography.sizes.xs};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  cursor: pointer;
  background: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.primaryDark};
  white-space: nowrap;

  @media (max-width: 760px) {
    min-height: 44px;
    font-size: ${({ theme }) => theme.typography.sizes.lg};
  }

  &:hover {
    background: ${({ theme }) => theme.colors.border};
  }
`;

export const DeleteButton = styled(ActionButton)`
  color: ${({ theme }) => theme.colors.error};

  &:hover {
    background: rgba(239, 68, 68, 0.12);
  }
`;

export const FlexButtons = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.spacing[3]};
  margin-top: ${({ theme }) => theme.spacing[4]};
  flex-wrap: wrap;

  a {
    display: inline-flex;
    text-decoration: none;
  }

  @media (max-width: 640px) {
    align-items: stretch;
    flex-direction: column;

    > *,
    a,
    button {
      width: 100%;
    }
  }
`
