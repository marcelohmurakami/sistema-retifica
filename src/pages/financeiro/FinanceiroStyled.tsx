import styled, { css } from "styled-components";

export const PageContainer = styled.div`
  width: min(100%, ${({ theme }) => theme.layout.containerMax});
  margin: 0 auto;
  padding: clamp(1rem, 2.8vw, 2.25rem);
  background: ${({ theme }) => theme.colors.background};
  min-height: calc(100dvh - ${({ theme }) => theme.layout.headerHeight});
  color: ${({ theme }) => theme.colors.textPrimary};
  overflow-x: hidden;
`;

export const Header = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1.5rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;

  @media (max-width: 760px) {
    gap: 1rem;
    margin-bottom: 1.2rem;
  }
`;

export const HeaderLeft = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  min-width: 0;
`;

export const PageTitle = styled.h1`
  font-size: clamp(1.75rem, 4vw, 2.25rem);
  font-weight: 760;
  letter-spacing: -0.045em;
  color: ${({ theme }) => theme.colors.primaryDark};
  margin: 0;
  overflow-wrap: anywhere;
`;

export const PageSubtitle = styled.p`
  font-size: clamp(0.82rem, 2vw, 0.95rem);
  color: ${({ theme }) => theme.colors.textSecondary};
  margin: 0;
  overflow-wrap: anywhere;
`;

export const HeaderActions = styled.div`
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;

  @media (max-width: 640px) {
    width: 100%;

    > * {
      flex: 1 1 160px;
    }
  }
`;

export const MonthInput = styled.input`
  height: 42px;
  min-width: 0;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md};
  padding: 0 ${({ theme }) => theme.spacing[4]};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: 0.8rem;

  @media (max-width: 640px) {
    width: 100%;
  }
`;

export const ActionButton = styled.button<{ $variant?: "secondary" }>`
  border: none;
  border-radius: 14px;
  padding: 0.9rem 1.2rem;
  font-weight: 700;
  font-size: 0.8rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.65rem;
  cursor: pointer;
  transition: 0.2s ease;
  white-space: normal;
  text-align: center;

  ${({ theme, $variant }) =>
    $variant === "secondary"
      ? css`
          background: ${theme.colors.surface};
          color: ${theme.colors.primary};
          border: 1px solid ${theme.colors.border};

          &:hover {
            background: ${theme.colors.background};
            transform: translateY(-1px);
          }
        `
      : css`
          background: linear-gradient(135deg, ${theme.colors.accent}, ${theme.colors.accentDark});
          color: white;
          box-shadow: 0 9px 22px rgba(217, 76, 19, 0.2);

          &:hover {
            background: ${theme.colors.accentDark};
            transform: translateY(-1px);
          }
        `}
`;

/* ========================= CARDS ========================= */

export const CardsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;

  @media (max-width: 1200px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 700px) {
    grid-template-columns: 1fr;
  }
`;

export const SummaryCard = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 20px;
  padding: 1.2rem;
  display: flex;
  gap: 1rem;
  min-width: 0;
  box-shadow: ${({ theme }) => theme.shadow.sm};
  transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;

  &:hover {
    border-color: color-mix(in srgb, ${({ theme }) => theme.colors.accent} 25%, ${({ theme }) => theme.colors.border});
    box-shadow: ${({ theme }) => theme.shadow.md};
    transform: translateY(-2px);
  }

  @media (max-width: 420px) {
    align-items: flex-start;
    padding: 1rem;
  }

  @media (max-width: 640px) {
    padding: 1.25rem;
  }
`;

export const CardIconWrapper = styled.div<{
  $type?: "success" | "warning" | "danger";
}>`
  width: 52px;
  height: 52px;
  border-radius: 16px;
  display: grid;
  place-items: center;
  font-size: 1rem;

  ${({ theme, $type }) => {
    if ($type === "success") {
      return css`
        background: rgba(34, 197, 94, 0.12);
        color: ${theme.colors.success};
      `;
    }

    if ($type === "warning") {
      return css`
        background: rgba(234, 179, 8, 0.14);
        color: ${theme.colors.warning};
      `;
    }

    if ($type === "danger") {
      return css`
        background: rgba(239, 68, 68, 0.12);
        color: ${theme.colors.error};
      `;
    }

    return css`
      background: rgba(249, 115, 22, 0.12);
      color: ${theme.colors.accent};
    `;
  }}
`;

export const CardContent = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;
`;

export const CardLabel = styled.span`
  font-size: 0.76rem;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

export const CardValue = styled.strong<{ $positive?: boolean }>`
  font-size: clamp(1.45rem, 4vw, 1.8rem);
  letter-spacing: -0.035em;
  overflow-wrap: anywhere;
  color: ${({ theme, $positive }) =>
    $positive === undefined
      ? theme.colors.primaryDark
      : $positive
      ? theme.colors.success
      : theme.colors.error};
`;

export const CardHelper = styled.span`
  font-size: 0.71rem;
  color: ${({ theme }) => theme.colors.textSecondary};
  overflow-wrap: anywhere;
`;

export const TopSection = styled.div`
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 1rem;
  margin-bottom: 1rem;

  @media (max-width: 1000px) {
    grid-template-columns: 1fr;
  }
`;

export const FiltersCard = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 20px;
  padding: 1.2rem;
  box-shadow: ${({ theme }) => theme.shadow.sm};
`;

export const FluxoCard = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 20px;
  padding: 1.2rem;
  box-shadow: ${({ theme }) => theme.shadow.sm};
`;

export const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.75rem;
  margin-bottom: 1rem;
`;

export const SectionTitle = styled.h2`
  margin: 0;
  min-width: 0;
  font-size: clamp(1rem, 2vw, 1.12rem);
  font-weight: 800;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  overflow-wrap: anywhere;
`;

export const SectionBadge = styled.span`
  background: ${({ theme }) => theme.colors.accent};
  color: white;
  border-radius: 999px;
  padding: 0 0.6rem;
  font-size: 0.7rem;
`;

export const FiltersRow = styled.div`
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
`;

export const SearchBox = styled.div`
  flex: 1;
  min-width: min(240px, 100%);
  display: flex;
  align-items: center;
  background: ${({ theme }) => theme.colors.background};
  border: 1px solid ${({ theme }) => theme.colors.border};
  padding: 0 1rem;
  border-radius: 12px;

  input {
    border: none;
    background: transparent;
    width: 100%;
    outline: none;
    color: ${({ theme }) => theme.colors.textPrimary};

    &::placeholder {
      color: ${({ theme }) => theme.colors.textSecondary};
    }
  }
`;

export const Select = styled.select`
  padding: 0.5rem;
  border-radius: 12px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.textPrimary};
`;

/* ========================= LISTAS ========================= */

export const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;

  @media (max-width: 1000px) {
    grid-template-columns: 1fr;
  }
`;

export const SectionCard = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 20px;
  padding: 1rem;
  min-width: 0;
`;

export const ItemsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  margin-bottom: 1rem;
`;

export const FinanceItem = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  min-width: 0;

  @media (max-width: 640px) {
    flex-direction: column;
    padding-bottom: 0.8rem;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  }
`;

export const FinanceItemMain = styled.div`
  min-width: 0;
`;

export const FinanceTitle = styled.strong`
  display: block;
  font-size: 0.82rem;
  overflow-wrap: anywhere;
`;

export const FinanceMeta = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.35rem;
  font-size: 0.72rem;
  color: ${({ theme }) => theme.colors.textSecondary};

  span {
    min-width: 0;
    overflow-wrap: anywhere;
  }
`;

export const Dot = styled.span`
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.border};
  display: inline-block;
`;

export const FinanceItemAside = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing[2]};

  @media (max-width: 640px) {
    justify-content: flex-start;
  }
`;

export const FinanceValue = styled.strong`
  font-size: 0.84rem;
`;

export const StatusBadge = styled.span<{ $status: string }>`
  font-size: 0.7rem;
`;

export const EmptyState = styled.div`
  text-align: center;
  padding: 1rem;
`;

/* ========================= TABELA ========================= */

export const BottomSection = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-top: 10px;

  @media (max-width: 1000px) {
    grid-template-columns: 1fr;
  }
`;

export const MovementsTableWrapper = styled.div`
  width: 100%;
  overflow-x: hidden;
  border-radius: 12px;
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
`;

export const MovementsTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;

  th, td {
    text-align: start;
    padding: 0.7rem 0.5rem;
    vertical-align: top;
    white-space: normal;
    overflow-wrap: anywhere;
    word-break: break-word;
  }

  td {
    border-top: 1px solid ${({ theme }) => theme.colors.border};
  }

  th {
    font-size: 0.7rem;
    color: ${({ theme }) => theme.colors.textSecondary};
    background: ${({ theme }) => theme.colors.background};
  }

  td {
    font-size: 0.76rem;
    color: ${({ theme }) => theme.colors.textPrimary};
  }

  @media (max-width: 640px) {
    th,
    td {
      padding: 0.7rem 0.35rem;
      font-size: 0.72rem;
    }
  }
`;

export const MovementType = styled.span<{ $type: string }>`
  font-weight: bold;
`;

export const TableValue = styled.strong<{ $type: string }>`
  font-weight: bold;
`;

/* ========================= SIDE ========================= */

export const SideInfoCard = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.textPrimary};
  border: 1px solid ${({ theme }) => theme.colors.border};
  padding: 1rem;
  border-radius: 20px;
`;

export const InfoList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
`;

export const InfoItem = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 1rem;

  span,
  strong {
    min-width: 0;
    font-size: 0.76rem;
    overflow-wrap: anywhere;
  }
`;

export const FluxoItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  margin-bottom: 1rem;
`;

export const FluxoInfo = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;

  span {
    color: ${({ theme }) => theme.colors.textSecondary};
    font-size: 0.76rem;
    font-weight: 600;
  }

  strong {
    color: ${({ theme }) => theme.colors.primaryDark};
    font-size: 0.82rem;
  }
`;

export const ProgressBar = styled.div`
  width: 100%;
  height: 10px;
  border-radius: 999px;
  background: ${({ theme }) => theme.colors.background};
  overflow: hidden;
`;

export const ProgressFill = styled.div<{
  $width: number;
  $variant: "success" | "danger";
}>`
  width: ${({ $width }) => `${$width}%`};
  height: 100%;
  border-radius: inherit;
  transition: 0.3s ease;

  ${({ theme, $variant }) =>
    $variant === "success"
      ? css`
          background: ${theme.colors.success};
        `
      : css`
          background: ${theme.colors.error};
        `}
`;

export const FluxoFooter = styled.div<{ $positive: boolean }>`
  margin-top: 0.5rem;
  padding-top: 0.85rem;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  font-size: 0.76rem;
  font-weight: 600;

  color: ${({ theme, $positive }) =>
    $positive ? theme.colors.success : theme.colors.error};

  strong {
    font-size: 0.84rem;
  }
`;

export const VerTodosButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;

  padding: ${({ theme }) => `${theme.spacing[1]} ${theme.spacing[4]}`};
  min-height: 42px;

  border: none;
  border-radius: 10px;
  background: ${({ theme }) => theme.colors.accent};
  color: ${({ theme }) => theme.colors.surface};

  font-family: ${({ theme }) => theme.typography.fontFamily};
  font-size: ${({ theme }) => theme.typography.sizes.md}; // aumentou
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  line-height: ${({ theme }) => theme.typography.lineHeights.normal};

  cursor: pointer;
  text-align: center;
  white-space: normal;
  transition:
    background 0.2s ease,
    transform 0.15s ease,
    box-shadow 0.2s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.accentDark};
    box-shadow: ${({ theme }) => theme.shadow.sm};
  }

  &:active {
    transform: scale(0.97);
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.25);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  @media (max-width: 640px) {
    width: 100%;
    font-size: 0.84rem;
  }
`;
