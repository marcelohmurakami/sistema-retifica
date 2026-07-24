import styled, { css } from "styled-components";

export const PageContainer = styled.div`
  width: min(100%, ${({ theme }) => theme.layout.containerMax});
  min-height: calc(100dvh - ${({ theme }) => theme.layout.headerHeight});
  margin: 0 auto;
  padding: clamp(1rem, 2.8vw, 2.25rem);
`;

export const Header = styled.header`
  position: relative;
  min-height: 178px;
  display: flex;
  align-items: flex-end;
  margin-bottom: -2.4rem;
  padding: clamp(1.5rem, 4vw, 2.5rem);
  padding-bottom: 4.7rem;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: ${({ theme }) => theme.radius.lg};
  color: #fff;
  background:
    linear-gradient(115deg, rgba(242, 106, 46, 0.16), transparent 42%),
    radial-gradient(circle at 88% -15%, rgba(255, 255, 255, 0.11), transparent 23rem),
    linear-gradient(135deg, #171c24 0%, #0c1016 100%);
  box-shadow: ${({ theme }) => theme.shadow.md};

  &::after {
    content: "";
    position: absolute;
    inset: 0 0 0 auto;
    width: min(42%, 480px);
    opacity: 0.18;
    background-image: radial-gradient(circle, rgba(255, 255, 255, 0.8) 1px, transparent 1px);
    background-size: 18px 18px;
    mask-image: linear-gradient(90deg, transparent, #000);
  }

  @media (max-width: 700px) {
    min-height: 154px;
    margin-bottom: -1.75rem;
    padding-bottom: 3.7rem;
    border-radius: 20px;
  }
`;

export const WelcomeSection = styled.div`
  position: relative;
  z-index: 1;
  max-width: 720px;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;

  &::before {
    content: "PAINEL EXECUTIVO";
    width: fit-content;
    margin-bottom: 0.2rem;
    color: ${({ theme }) => theme.colors.accent};
    font-size: 0.68rem;
    font-weight: 760;
    letter-spacing: 0.15em;
  }
`;

export const PageTitle = styled.h1`
  color: #fff;
  font-size: clamp(1.8rem, 4vw, 2.65rem);
  font-weight: 760;
  letter-spacing: -0.045em;
  line-height: 1.05;
`;

export const PageSubtitle = styled.p`
  max-width: 620px;
  color: rgba(255, 255, 255, 0.62);
  font-size: clamp(0.84rem, 1.6vw, 0.98rem);
  line-height: 1.55;
`;

export const CardsGrid = styled.div`
  position: relative;
  z-index: 2;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.9rem;
  margin: 0 1.15rem 1rem;

  @media (max-width: 1220px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 700px) {
    grid-template-columns: 1fr;
    margin-inline: 0.65rem;
  }
`;

export const SummaryCard = styled.article`
  min-width: 0;
  min-height: 132px;
  display: flex;
  align-items: flex-start;
  gap: 0.9rem;
  padding: 1.15rem;
  border: 1px solid color-mix(in srgb, ${({ theme }) => theme.colors.border} 88%, transparent);
  border-radius: 19px;
  background: color-mix(in srgb, ${({ theme }) => theme.colors.surface} 96%, transparent);
  box-shadow: ${({ theme }) => theme.shadow.md};
  backdrop-filter: blur(16px);
  transition:
    transform 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease;

  &:hover {
    border-color: color-mix(in srgb, ${({ theme }) => theme.colors.accent} 28%, ${({ theme }) => theme.colors.border});
    box-shadow: ${({ theme }) => theme.shadow.lg};
    transform: translateY(-3px);
  }
`;

const variantStyles = (
  variant: "blue" | "orange" | "green" | "red",
  theme: {
    colors: {
      info: string;
      accent: string;
      success: string;
      error: string;
    };
  },
) => {
  const color =
    variant === "blue"
      ? theme.colors.info
      : variant === "orange"
        ? theme.colors.accent
        : variant === "green"
          ? theme.colors.success
          : theme.colors.error;

  return css`
    color: ${color};
    background: color-mix(in srgb, ${color} 12%, transparent);
    box-shadow: inset 0 0 0 1px color-mix(in srgb, ${color} 12%, transparent);
  `;
};

export const CardIcon = styled.div<{
  $variant: "blue" | "orange" | "green" | "red";
}>`
  width: 46px;
  height: 46px;
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  border-radius: 14px;
  font-size: 1rem;
  ${({ theme, $variant }) => variantStyles($variant, theme)}
`;

export const CardContent = styled.div`
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

export const CardLabel = styled.span`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 0.76rem;
  font-weight: 650;
`;

export const CardValue = styled.strong`
  overflow-wrap: anywhere;
  color: ${({ theme }) => theme.colors.primaryDark};
  font-family: ${({ theme }) => theme.typography.displayFamily};
  font-size: clamp(1.45rem, 3vw, 1.85rem);
  font-weight: 760;
  letter-spacing: -0.04em;
  line-height: 1.2;
`;

export const CardHelper = styled.span`
  margin-top: 0.15rem;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.71rem;
  line-height: 1.4;
`;

export const MainGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;

  @media (max-width: 1080px) {
    grid-template-columns: 1fr;
  }
`;

export const SectionCard = styled.section`
  min-width: 0;
  padding: clamp(1.05rem, 2vw, 1.35rem);
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 20px;
  background: ${({ theme }) => theme.colors.surface};
  box-shadow: ${({ theme }) => theme.shadow.sm};
`;

export const SectionHeader = styled.div`
  min-width: 0;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
`;

export const SectionTitle = styled.h2`
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 0.55rem;
  color: ${({ theme }) => theme.colors.primaryDark};
  font-size: 1rem;
  font-weight: 720;
  line-height: 1.3;

  svg {
    flex: 0 0 auto;
    color: ${({ theme }) => theme.colors.accent};
  }
`;

export const SectionAction = styled.button`
  flex: 0 0 auto;
  padding: 0.35rem 0.58rem;
  border: 0;
  border-radius: 8px;
  background: ${({ theme }) => theme.colors.accentSoft};
  color: ${({ theme }) => theme.colors.accentDark};
  font-size: 0.72rem;
  font-weight: 680;
  transition: transform 0.16s ease, background 0.16s ease;

  &:hover {
    transform: translateX(2px);
    background: color-mix(in srgb, ${({ theme }) => theme.colors.accent} 18%, transparent);
  }
`;

export const StatsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
`;

export const StatItem = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.4rem 1rem;
`;

export const StatInfo = styled.span`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 0.8rem;
`;

export const StatValue = styled.strong`
  color: ${({ theme }) => theme.colors.primaryDark};
  font-size: 0.8rem;
`;

export const ProgressWrapper = styled.div`
  grid-column: 1 / -1;
`;

export const ProgressLabel = styled.span`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.7rem;
`;

export const ProgressBar = styled.div`
  height: 7px;
  overflow: hidden;
  border-radius: ${({ theme }) => theme.radius.pill};
  background: ${({ theme }) => theme.colors.background};
`;

export const ProgressFill = styled.div<{
  $width: number;
  $variant: "blue" | "orange" | "green" | "red";
}>`
  width: ${({ $width }) => `${$width}%`};
  height: 100%;
  border-radius: inherit;
  ${({ theme, $variant }) => variantStyles($variant, theme)}
`;

export const RecentList = styled.div`
  display: flex;
  flex-direction: column;
`;

export const RecentItem = styled.div`
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.85rem;
  padding: 0.85rem 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};

  &:last-child {
    padding-bottom: 0;
    border-bottom: 0;
  }

  &:first-child {
    padding-top: 0;
  }

  @media (max-width: 480px) {
    align-items: flex-start;
    flex-direction: column;
  }
`;

export const RecentInfo = styled.div`
  min-width: 0;
`;

export const RecentTitle = styled.strong`
  display: block;
  overflow: hidden;
  color: ${({ theme }) => theme.colors.primaryDark};
  font-size: 0.84rem;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const RecentMeta = styled.span`
  display: block;
  margin-top: 0.18rem;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 0.72rem;
`;

export const StatusBadge = styled.span<{ $status: string }>`
  flex: 0 0 auto;
  padding: 0.38rem 0.58rem;
  border-radius: ${({ theme }) => theme.radius.pill};
  background: color-mix(in srgb, ${({ theme }) => theme.colors.success} 10%, transparent);
  color: ${({ theme }) => theme.colors.success};
  font-size: 0.72rem;
  font-weight: 700;
  white-space: nowrap;
`;

export const QuickActionsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.7rem;

  @media (max-width: 580px) {
    grid-template-columns: 1fr;
  }
`;

export const QuickActionCard = styled.button`
  width: 100%;
  min-height: 132px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 16px;
  background: ${({ theme }) => theme.colors.surfaceElevated};
  color: ${({ theme }) => theme.colors.textPrimary};
  text-align: left;
  transition:
    transform 0.18s ease,
    border-color 0.18s ease,
    background 0.18s ease,
    box-shadow 0.18s ease;

  &:hover:not(:disabled) {
    border-color: color-mix(in srgb, ${({ theme }) => theme.colors.accent} 38%, ${({ theme }) => theme.colors.border});
    background: ${({ theme }) => theme.colors.accentSoft};
    box-shadow: ${({ theme }) => theme.shadow.sm};
    transform: translateY(-2px);
  }

  &:disabled {
    opacity: 0.45;
  }
`;

export const QuickActionIcon = styled.div<{
  $variant: "blue" | "orange" | "green" | "red";
}>`
  width: 39px;
  height: 39px;
  display: grid;
  place-items: center;
  margin-bottom: 0.7rem;
  border-radius: 12px;
  ${({ theme, $variant }) => variantStyles($variant, theme)}
`;

export const QuickActionTitle = styled.h3`
  margin-bottom: 0.2rem;
  color: ${({ theme }) => theme.colors.primaryDark};
  font-size: 0.84rem;
  font-weight: 700;
`;

export const QuickActionText = styled.p`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 0.72rem;
  line-height: 1.45;
`;

export const AlertList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
`;

export const AlertItem = styled.div`
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
  padding: 0.85rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 14px;
  background: ${({ theme }) => theme.colors.background};
`;

export const AlertIcon = styled.div<{ $variant: string }>`
  width: 36px;
  height: 36px;
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  border-radius: 11px;
  color: ${({ theme, $variant }) =>
    $variant === "warning" ? theme.colors.warning : $variant === "success" ? theme.colors.success : theme.colors.accent};
  background: ${({ theme, $variant }) =>
    `color-mix(in srgb, ${
      $variant === "warning" ? theme.colors.warning : $variant === "success" ? theme.colors.success : theme.colors.accent
    } 11%, transparent)`};
`;

export const AlertContent = styled.div`
  min-width: 0;
`;

export const AlertTitle = styled.strong`
  display: block;
  color: ${({ theme }) => theme.colors.primaryDark};
  font-size: 0.8rem;
`;

export const AlertText = styled.span`
  display: block;
  margin-top: 0.15rem;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 0.72rem;
  line-height: 1.45;
`;

export const ChartHeader = styled.div`
  min-width: 0;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;

  @media (max-width: 580px) {
    flex-direction: column;
  }
`;

export const SectionSubtitle = styled.p`
  margin-top: 0.3rem;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 0.72rem;
  line-height: 1.45;
`;

export const ChartTotal = styled.div`
  flex: 0 0 auto;
  text-align: right;

  span {
    display: block;
    color: ${({ theme }) => theme.colors.textSecondary};
    font-size: 0.67rem;
  }

  strong {
    display: block;
    margin-top: 0.2rem;
    color: ${({ theme }) => theme.colors.primaryDark};
    font-size: 1rem;
    letter-spacing: -0.025em;
  }

  @media (max-width: 580px) {
    text-align: left;
  }
`;

export const ChartWrapper = styled.div`
  width: 100%;
  height: 285px;
  margin-left: -0.5rem;

  .recharts-cartesian-axis-tick-value {
    fill: ${({ theme }) => theme.colors.textSecondary};
    font-size: 0.68rem;
  }

  @media (max-width: 580px) {
    height: 235px;
  }
`;

export const FinanceSummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.7rem;

  @media (max-width: 680px) {
    grid-template-columns: 1fr;
  }
`;

export const FinanceSummaryItem = styled.div`
  min-width: 0;
  padding: 1rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 15px;
  background: ${({ theme }) => theme.colors.background};

  span {
    display: block;
    margin-bottom: 0.35rem;
    color: ${({ theme }) => theme.colors.textSecondary};
    font-size: 0.72rem;
  }

  strong {
    display: block;
    overflow-wrap: anywhere;
    color: ${({ theme }) => theme.colors.primaryDark};
    font-size: 1rem;
  }
`;

export const FinanceSummaryResult = styled(FinanceSummaryItem)<{
  $isPositive: boolean;
}>`
  border-color: ${({ theme, $isPositive }) =>
    `color-mix(in srgb, ${$isPositive ? theme.colors.success : theme.colors.error} 24%, ${theme.colors.border})`};
  background: ${({ theme, $isPositive }) =>
    `color-mix(in srgb, ${$isPositive ? theme.colors.success : theme.colors.error} 8%, ${theme.colors.surface})`};

  strong {
    color: ${({ theme, $isPositive }) => ($isPositive ? theme.colors.success : theme.colors.error)};
  }
`;
