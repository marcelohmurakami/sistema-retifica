import styled from "styled-components";

export const PageContainer = styled.main`
  width: min(100%, ${({ theme }) => theme.layout.containerMax});
  min-height: calc(100dvh - ${({ theme }) => theme.layout.headerHeight});
  margin: 0 auto;
  padding: clamp(1rem, 3vw, 2rem);
  color: ${({ theme }) => theme.colors.textPrimary};
  background: ${({ theme }) => theme.colors.background};
  overflow-x: hidden;

  @media (max-width: 760px) {
    padding: 0.85rem;
  }
`;

export const Header = styled.section`
  max-width: 1180px;
  margin: 0 auto 1rem;
  padding: clamp(1.1rem, 3vw, 1.6rem);
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.lg};
  background: ${({ theme }) => theme.colors.surface};
  box-shadow: ${({ theme }) => theme.shadow.sm};

  h1 {
    margin: 0;
    color: ${({ theme }) => theme.colors.primaryDark};
    font-size: clamp(1.6rem, 6vw, 2.25rem);
    line-height: 1.15;
    overflow-wrap: anywhere;
  }

  p {
    color: ${({ theme }) => theme.colors.textSecondary};
    line-height: 1.5;
    max-width: 64ch;
    margin: 0.7rem 0 0;
  }

  @media (max-width: 520px) {
    border-radius: 0.85rem;
  }
`;

export const HeaderCopy = styled.div`
  min-width: 0;
`;

export const HeaderBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  margin-bottom: 0.9rem;
  border: 1px solid color-mix(in srgb, ${({ theme }) => theme.colors.accent} 24%, ${({ theme }) => theme.colors.border});
  border-radius: 999px;
  color: ${({ theme }) => theme.colors.accentDark};
  background: ${({ theme }) => theme.colors.accentSoft};
  font-size: 0.9rem;
  font-weight: 700;

  @media (max-width: 420px) {
    width: 100%;
    justify-content: center;
  }
`;

export const PeriodBox = styled.div`
  min-width: 0;
  padding: 1rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 0.9rem;
  background: ${({ theme }) => theme.colors.surface};
  box-shadow: ${({ theme }) => theme.shadow.sm};

  label,
  select {
    display: block;
  }

  label {
    color: ${({ theme }) => theme.colors.textSecondary};
    font-size: 0.82rem;
    font-weight: 700;
    text-transform: uppercase;
  }

  select {
    width: 100%;
    margin-top: 0.45rem;
    min-height: 44px;
    padding: 0.7rem 2.35rem 0.7rem 0.85rem;
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: 0.65rem;
    color: ${({ theme }) => theme.colors.textPrimary};
    background:
      linear-gradient(45deg, transparent 50%, ${({ theme }) => theme.colors.textSecondary} 50%) calc(100% - 18px) 52% / 6px 6px no-repeat,
      linear-gradient(135deg, ${({ theme }) => theme.colors.textSecondary} 50%, transparent 50%) calc(100% - 13px) 52% / 6px 6px no-repeat,
      ${({ theme }) => theme.colors.surface};
    appearance: none;
    font: inherit;
    font-weight: 800;
    cursor: pointer;
  }

  select:focus {
    outline: 3px solid color-mix(in srgb, ${({ theme }) => theme.colors.accent} 22%, transparent);
    border-color: ${({ theme }) => theme.colors.accent};
  }

  select:hover {
    border-color: #94a3b8;
  }

  @media (max-width: 760px) {
    padding: 0.9rem;

    label {
      font-size: 0.9rem;
    }

    select {
      min-height: 46px;
      font-size: 1rem;
    }
  }
`;

export const CardsGrid = styled.section`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
  gap: 1rem;
  max-width: 1180px;
  margin: 0 auto 1.15rem;

  @media (min-width: 1121px) {
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }

  @media (max-width: 620px) {
    grid-template-columns: 1fr;
    gap: 0.85rem;
  }
`;

export const MetricCard = styled.article<{ $variant: "green" | "blue" | "purple" | "amber" | "dark" }>`
  position: relative;
  overflow: hidden;
  min-height: 170px;
  padding: 1.15rem;
  border: 1px solid
    ${({ $variant }) =>
      ({
        green: "rgba(34, 197, 94, 0.26)",
        blue: "rgba(37, 99, 235, 0.24)",
        purple: "rgba(124, 58, 237, 0.24)",
        amber: "rgba(217, 119, 6, 0.24)",
        dark: "rgba(15, 23, 42, 0.18)",
      })[$variant]};
  border-radius: 1rem;
  background:
    ${({ $variant }) =>
      ({
        green: "linear-gradient(135deg, rgba(22, 163, 74, 0.1), transparent)",
        blue: "linear-gradient(135deg, rgba(37, 99, 235, 0.1), transparent)",
        purple: "linear-gradient(135deg, rgba(124, 58, 237, 0.1), transparent)",
        amber: "linear-gradient(135deg, rgba(217, 119, 6, 0.1), transparent)",
        dark: "linear-gradient(135deg, rgba(15, 23, 42, 0.1), transparent)",
      })[$variant]},
    ${({ theme }) => theme.colors.surface};
  box-shadow: 0 16px 34px rgba(15, 23, 42, 0.075);
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
      ({
        green: "#16a34a",
        blue: "#2563eb",
        purple: "#7c3aed",
        amber: "#d97706",
        dark: "#0f172a",
      })[$variant]};
  }

  span {
    display: block;
    margin-top: 0.9rem;
    color: ${({ theme }) => theme.colors.textSecondary};
    font-size: 0.84rem;
    font-weight: 800;
    text-transform: uppercase;
    line-height: 1.35;
    overflow-wrap: anywhere;
  }

  strong {
    display: block;
    margin-top: 0.45rem;
    color: ${({ theme }) => theme.colors.primaryDark};
    font-size: clamp(1.6rem, 3vw, 2.1rem);
    line-height: 1.1;
    overflow-wrap: anywhere;
  }

  small {
    display: block;
    margin-top: 0.55rem;
    color: ${({ theme }) => theme.colors.textSecondary};
    line-height: 1.45;
  }

  @media (max-width: 620px) {
    min-height: auto;
    padding: 1.05rem;

    span {
      font-size: 0.95rem;
    }

    strong {
      font-size: clamp(1.7rem, 9vw, 2.2rem);
    }

    small {
      font-size: 0.95rem;
    }
  }
`;

export const CardIcon = styled.div<{ $variant: "green" | "blue" | "purple" | "amber" | "dark" }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.75rem;
  color: #ffffff;
  background: ${({ $variant }) =>
    ({
      green: "#16a34a",
      blue: "#2563eb",
      purple: "#7c3aed",
      amber: "#d97706",
      dark: "#0f172a",
    })[$variant]};
  box-shadow: inset 0 -10px 18px rgba(255, 255, 255, 0.08);
`;

export const ReportsGrid = styled.section`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
  max-width: 1180px;
  margin: 0 auto;

  > article:first-child {
    grid-column: 1 / -1;
  }

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }

  @media (max-width: 620px) {
    gap: 0.85rem;
  }
`;

export const Panel = styled.article`
  min-width: 0;
  overflow: hidden;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 1rem;
  background: ${({ theme }) => theme.colors.surface};
  box-shadow: ${({ theme }) => theme.shadow.sm};

  @media (max-width: 620px) {
    border-radius: 0.85rem;
  }
`;

export const PanelHeader = styled.header`
  display: flex;
  gap: 0.85rem;
  align-items: flex-start;
  padding: 1.15rem 1.15rem 0.85rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surface};

  h2 {
    margin: 0;
    color: ${({ theme }) => theme.colors.primaryDark};
    font-size: 1.15rem;
    line-height: 1.25;
    overflow-wrap: anywhere;
  }

  p {
    margin: 0.35rem 0 0;
    color: ${({ theme }) => theme.colors.textSecondary};
    line-height: 1.45;
  }

  @media (max-width: 620px) {
    padding: 1rem 1rem 0.7rem;

    h2 {
      font-size: 1.25rem;
    }

    p {
      font-size: 0.98rem;
    }
  }

  @media (max-width: 420px) {
    flex-direction: column;
  }
`;

export const PanelIcon = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: 2.4rem;
  height: 2.4rem;
  border-radius: 0.8rem;
  color: ${({ theme }) => theme.colors.accentDark};
  background: ${({ theme }) => theme.colors.accentSoft};
`;

export const TableWrapper = styled.div`
  overflow-x: auto;
  padding: 0.85rem 1.15rem 1.15rem;
  -webkit-overflow-scrolling: touch;

  table {
    width: 100%;
    min-width: 520px;
    border-collapse: collapse;
  }

  th {
    color: ${({ theme }) => theme.colors.textSecondary};
    background: ${({ theme }) => theme.colors.background};
    font-size: 0.78rem;
    text-align: left;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  th,
  td {
    padding: 0.9rem;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  }

  td {
    color: ${({ theme }) => theme.colors.textPrimary};
    font-weight: 650;
  }

  tbody tr:hover {
    background: ${({ theme }) => theme.colors.background};
  }

  @media (max-width: 620px) {
    overflow: visible;
    padding: 0.35rem 1rem 1rem;

    table,
    tbody,
    tr,
    td {
      display: block;
      width: 100%;
      min-width: 0;
    }

    table {
      border-collapse: separate;
      border-spacing: 0;
    }

    thead {
      display: none;
    }

    tbody {
      display: grid;
      gap: 0.75rem;
    }

    tbody tr {
      padding: 0.9rem;
      border: 1px solid ${({ theme }) => theme.colors.border};
      border-radius: 0.85rem;
      background: ${({ theme }) => theme.colors.surface};
      box-shadow: ${({ theme }) => theme.shadow.sm};
    }

    tbody tr:hover {
      background: ${({ theme }) => theme.colors.surface};
    }

    td {
      display: grid;
      grid-template-columns: minmax(7.5rem, 42%) minmax(0, 1fr);
      align-items: center;
      gap: 0.75rem;
      padding: 0.45rem 0;
      border-bottom: 0;
      font-size: 1.04rem;
      line-height: 1.45;
      overflow-wrap: anywhere;
    }

    td::before {
      content: attr(data-label);
      color: ${({ theme }) => theme.colors.textSecondary};
      font-size: 0.9rem;
      font-weight: 800;
      text-transform: uppercase;
    }
  }

  @media (max-width: 390px) {
    td {
      grid-template-columns: 1fr;
      gap: 0.15rem;
    }
  }
`;

export const RankNumber = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.6rem;
  height: 1.6rem;
  margin-right: 0.55rem;
  border-radius: 999px;
  color: ${({ theme }) => theme.colors.accentDark};
  background: ${({ theme }) => theme.colors.accentSoft};
  font-size: 0.78rem;
  font-weight: 900;

  @media (max-width: 620px) {
    width: 1.8rem;
    height: 1.8rem;
    font-size: 0.85rem;
  }
`;

export const EmptyState = styled.p`
  margin: 0;
  padding: 1rem 1.15rem 1.25rem;
  color: ${({ theme }) => theme.colors.textSecondary};

  @media (max-width: 620px) {
    padding: 1rem;
    font-size: 1rem;
    line-height: 1.45;
  }
`;

export const HeaderFilters = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(190px, 260px));
  gap: 1rem;
  align-items: center;
  max-width: 1180px;
  margin: 0 auto;
  padding-bottom: 1.15rem;

  @media (max-width: 768px) {
    align-items: stretch;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 520px) {
    grid-template-columns: 1fr;
    gap: 0.75rem;
    padding-bottom: 1rem;
  }
`;
