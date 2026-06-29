import styled, { css } from "styled-components";

export const PageContainer = styled.div`
  padding: 2rem;
  background: ${({ theme }) => theme.colors.background};
  min-height: 100vh;
`;

export const Header = styled.div`
  margin-bottom: 2rem;
`;

export const WelcomeSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
`;

export const PageTitle = styled.h1`
  margin: 0;
  font-size: 2rem;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.primaryDark};
`;

export const PageSubtitle = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 0.98rem;
`;

export const CardsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(220px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;

  @media (max-width: 1200px) {
    grid-template-columns: repeat(2, minmax(220px, 1fr));
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
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.05);
`;

export const CardIcon = styled.div<{
  $variant: "blue" | "orange" | "green" | "red";
}>`
  width: 52px;
  height: 52px;
  border-radius: 16px;
  display: grid;
  place-items: center;
  font-size: 1.15rem;
  flex-shrink: 0;

  ${({ theme, $variant }) => {
    if ($variant === "blue") {
      return css`
        background: rgba(30, 41, 59, 0.1);
        color: ${theme.colors.primary};
      `;
    }

    if ($variant === "orange") {
      return css`
        background: rgba(249, 115, 22, 0.12);
        color: ${theme.colors.accent};
      `;
    }

    if ($variant === "green") {
      return css`
        background: rgba(34, 197, 94, 0.12);
        color: ${theme.colors.success};
      `;
    }

    return css`
      background: rgba(239, 68, 68, 0.12);
      color: ${theme.colors.error};
    `;
  }}
`;

export const CardContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
`;

export const CardLabel = styled.span`
  font-size: 0.9rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

export const CardValue = styled.strong`
  font-size: 1.45rem;
  color: ${({ theme }) => theme.colors.primaryDark};
`;

export const CardHelper = styled.span`
  font-size: 0.85rem;
  color: ${({ theme }) => theme.colors.textSecondary};
  line-height: 1.4;
`;

export const MainGrid = styled.div`
  display: grid;
  grid-template-columns: 1.1fr 1.1fr;
  gap: 1rem;

  @media (max-width: 1100px) {
    grid-template-columns: 1fr;
  }
`;

export const SectionCard = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 20px;
  padding: 1.2rem;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.05);
`;

export const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
`;

export const SectionTitle = styled.h2`
  margin: 0;
  font-size: 1.02rem;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.primaryDark};
  display: flex;
  align-items: center;
  gap: 0.6rem;

  svg {
    color: ${({ theme }) => theme.colors.accent};
  }
`;

export const SectionAction = styled.button`
  border: none;
  background: transparent;
  color: ${({ theme }) => theme.colors.accent};
  font-weight: 700;
  cursor: pointer;
`;

export const StatsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

export const StatItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
`;

export const StatInfo = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;

  span {
    color: ${({ theme }) => theme.colors.textSecondary};
    font-weight: 600;
  }
`;

export const StatValue = styled.strong`
  color: ${({ theme }) => theme.colors.primaryDark};
`;

export const ProgressWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
`;

export const ProgressLabel = styled.span`
  font-size: 0.8rem;
  color: ${({ theme }) => theme.colors.textSecondary};
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
  $variant: "success" | "warning" | "info";
}>`
  width: ${({ $width }) => `${$width}%`};
  height: 100%;
  border-radius: inherit;

  ${({ theme, $variant }) => {
    if ($variant === "success") {
      return css`
        background: ${theme.colors.success};
      `;
    }

    if ($variant === "warning") {
      return css`
        background: ${theme.colors.warning};
      `;
    }

    return css`
      background: ${theme.colors.accent};
    `;
  }}
`;

export const RecentList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
`;

export const RecentItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.95rem 1rem;
  border-radius: 16px;
  background: ${({ theme }) => theme.colors.background};
  border: 1px solid ${({ theme }) => theme.colors.border};
`;

export const RecentInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

export const RecentTitle = styled.strong`
  color: ${({ theme }) => theme.colors.primaryDark};
`;

export const RecentMeta = styled.span`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 0.86rem;
`;

export const StatusBadge = styled.span<{ $status: string }>`
  padding: 0.4rem 0.75rem;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 800;
  text-transform: capitalize;

  ${({ theme, $status }) => {
    if ($status === "concluída") {
      return css`
        background: rgba(34, 197, 94, 0.12);
        color: ${theme.colors.success};
      `;
    }

    if ($status === "em andamento") {
      return css`
        background: rgba(234, 179, 8, 0.15);
        color: ${theme.colors.warning};
      `;
    }

    return css`
      background: rgba(249, 115, 22, 0.12);
      color: ${theme.colors.accent};
    `;
  }}
`;

export const QuickActionsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.9rem;

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

export const QuickActionCard = styled.button`
  width: 100%;
  min-height: 48px;
  padding: 0.9rem 1.2rem;

  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.8rem;

  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 10px;

  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.textPrimary};

  font: inherit;
  font-size: 1rem;
  font-weight: 700;
  text-align: center;

  cursor: pointer;
  transition:
    transform 0.16s ease,
    border-color 0.16s ease,
    background 0.16s ease,
    box-shadow 0.16s ease;

  &:hover {
    transform: translateY(-1px);
    border-color: ${({ theme }) => theme.colors.accent};
    background: ${({ theme }) => theme.colors.background};
    box-shadow: 0 8px 18px rgba(15, 23, 42, 0.08);
  }

  &:active {
    transform: translateY(0);
    box-shadow: none;
  }

  &:focus-visible {
    outline: 3px solid ${({ theme }) => theme.colors.accent};
    outline-offset: 2px;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.55;
    color: ${({ theme }) => theme.colors.textSecondary};
    background: ${({ theme }) => theme.colors.background};
    border-color: ${({ theme }) => theme.colors.border};
    box-shadow: none;
    transform: none;
  }

  &:disabled svg {
    opacity: 0.7;
  }
`;

export const QuickActionIcon = styled.div<{
  $variant: "blue" | "orange" | "green" | "red";
}>`
  width: 44px;
  height: 44px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  margin-bottom: 0.8rem;

  ${({ theme, $variant }) => {
    if ($variant === "blue") {
      return css`
        background: rgba(30, 41, 59, 0.1);
        color: ${theme.colors.primary};
      `;
    }

    if ($variant === "orange") {
      return css`
        background: rgba(249, 115, 22, 0.12);
        color: ${theme.colors.accent};
      `;
    }

    if ($variant === "green") {
      return css`
        background: rgba(34, 197, 94, 0.12);
        color: ${theme.colors.success};
      `;
    }

    return css`
      background: rgba(239, 68, 68, 0.12);
      color: ${theme.colors.error};
    `;
  }}
`;

export const QuickActionTitle = styled.h3`
  margin: 0 0 0.35rem 0;
  font-size: 0.98rem;
  color: ${({ theme }) => theme.colors.primaryDark};
`;

export const QuickActionText = styled.p`
  margin: 0;
  font-size: 0.85rem;
  line-height: 1.45;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

export const AlertList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
`;

export const AlertItem = styled.div`
  display: flex;
  gap: 0.85rem;
  align-items: flex-start;
  padding: 0.95rem 1rem;
  border-radius: 16px;
  background: ${({ theme }) => theme.colors.background};
  border: 1px solid ${({ theme }) => theme.colors.border};
`;

export const AlertIcon = styled.div<{ $variant: string }>`
  width: 42px;
  height: 42px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  flex-shrink: 0;

  ${({ theme, $variant }) => {
    if ($variant === "warning") {
      return css`
        background: rgba(234, 179, 8, 0.15);
        color: ${theme.colors.warning};
      `;
    }

    if ($variant === "success") {
      return css`
        background: rgba(34, 197, 94, 0.12);
        color: ${theme.colors.success};
      `;
    }

    return css`
      background: rgba(249, 115, 22, 0.12);
      color: ${theme.colors.accent};
    `;
  }}
`;

export const AlertContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

export const AlertTitle = styled.strong`
  color: ${({ theme }) => theme.colors.primaryDark};
`;

export const AlertText = styled.span`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 0.88rem;
  line-height: 1.45;
`;

export const ChartHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

export const SectionSubtitle = styled.p`
  margin: 0.4rem 0 0;
  font-size: 1.2rem;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

export const ChartTotal = styled.div`
  text-align: right;

  span {
    display: block;
    font-size: 1.1rem;
    color: ${({ theme }) => theme.colors.textSecondary};
  }

  strong {
    display: block;
    margin-top: 0.4rem;
    font-size: 1.6rem;
    color: ${({ theme }) => theme.colors.primaryDark};
  }
`;

export const ChartWrapper = styled.div`
  width: 100%;
  height: 260px;
`;

export const FinanceSummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

export const FinanceSummaryItem = styled.div`
  padding: 1.2rem;
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.colors.background};

  span {
    display: block;
    margin-bottom: 0.6rem;
    color: ${({ theme }) => theme.colors.textSecondary};
    font-size: 1.2rem;
  }

  strong {
    color: ${({ theme }) => theme.colors.primaryDark};
    font-size: 1.8rem;
  }
`;

export const FinanceSummaryResult = styled(FinanceSummaryItem)<{
  $isPositive: boolean;
}>`
  background: ${({ $isPositive }) =>
    $isPositive ? "rgba(34, 197, 94, 0.12)" : "rgba(239, 68, 68, 0.12)"};

  strong {
    color: ${({ theme, $isPositive }) =>
      $isPositive ? theme.colors.success : theme.colors.error};
  }
`;