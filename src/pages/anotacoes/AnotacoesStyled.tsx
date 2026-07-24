import styled from "styled-components";

export const PageContainer = styled.main`
  width: min(100%, ${({ theme }) => theme.layout.containerMax});
  min-height: calc(100dvh - ${({ theme }) => theme.layout.headerHeight});
  margin: 0 auto;
  padding: clamp(16px, 4vw, 24px);
  display: flex;
  flex-direction: column;
  gap: 22px;
  overflow-x: hidden;
`;

export const PageHeader = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;

  @media (max-width: 640px) {
    align-items: stretch;
    flex-direction: column;
  }
`;

export const HeaderText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

export const Title = styled.h1`
  font-size: clamp(24px, 7vw, 28px);
  font-weight: 700;
  color: ${({ theme }) => theme.colors.primaryDark};
  margin: 0;
  line-height: 1.15;
`;

export const Subtitle = styled.p`
  font-size: clamp(14px, 4vw, 16px);
  color: ${({ theme }) => theme.colors.textSecondary};
  margin: 0;
  line-height: 1.45;
`;

export const NewButton = styled.button`
  border: none;
  background: linear-gradient(135deg, ${({ theme }) => theme.colors.accent}, ${({ theme }) => theme.colors.accentDark});
  color: #ffffff;
  padding: 11px 16px;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: 0.2s;

  &:hover {
    box-shadow: 0 10px 24px rgba(217, 76, 19, 0.24);
    transform: translateY(-1px);
  }

  @media (max-width: 640px) {
    width: 100%;
    min-height: 44px;
    font-size: 15px;
  }
`;

export const Tabs = styled.div`
  display: flex;
  gap: 8px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};

  @media (max-width: 480px) {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    border-bottom: none;
  }
`;

export const TabButton = styled.button<{ $active?: boolean }>`
  border: none;
  background: transparent;
  padding: 12px 16px;
  font-size: 14px;
  font-weight: 600;
  color: ${({ $active, theme }) => ($active ? theme.colors.accent : theme.colors.textSecondary)};
  border-bottom: 3px solid ${({ $active, theme }) => ($active ? theme.colors.accent : "transparent")};
  cursor: pointer;

  &:hover {
    color: ${({ theme }) => theme.colors.accent};
  }

  @media (max-width: 480px) {
    min-height: 44px;
    border: 1px solid ${({ $active, theme }) => ($active ? theme.colors.accent : theme.colors.border)};
    border-radius: 11px;
    background: ${({ $active, theme }) => ($active ? theme.colors.accentSoft : theme.colors.surface)};
    font-size: 15px;
  }
`;

export const Toolbar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

export const SearchInput = styled.input`
  width: 100%;
  max-width: 420px;
  height: 42px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 13px;
  padding: 0 14px;
  font-size: 14px;
  outline: none;
  background: ${({ theme }) => theme.colors.surfaceElevated};
  color: ${({ theme }) => theme.colors.textPrimary};

  &:focus {
    border-color: ${({ theme }) => theme.colors.accent};
    box-shadow: 0 0 0 4px color-mix(in srgb, ${({ theme }) => theme.colors.accent} 12%, transparent);
  }
`;

export const Section = styled.section`
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

export const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 0;
  gap: 12px;

  h2 {
    font-size: 18px;
    color: ${({ theme }) => theme.colors.primaryDark};
    margin: 0;
  }

  @media (max-width: 640px) {
    align-items: stretch;
    flex-direction: column;

    h2 {
      font-size: 20px;
    }
  }
`;

export const Checklist = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

export const ChecklistItem = styled.div<{ $done?: boolean }>`
  display: grid;
  grid-template-columns: 22px 1fr auto;
  align-items: center;
  gap: 12px;
  min-height: 54px;
  padding: 12px 14px;
  background: ${({ $done, theme }) => ($done ? theme.colors.background : theme.colors.surface)};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-left: 4px solid ${({ $done, theme }) => ($done ? theme.colors.textMuted : theme.colors.accent)};
  border-radius: 13px;
  box-shadow: ${({ theme }) => theme.shadow.sm};

  span {
    color: ${({ $done, theme }) => ($done ? theme.colors.textMuted : theme.colors.primaryDark)};
    text-decoration: ${({ $done }) => ($done ? "line-through" : "none")};
    font-weight: 500;
  }

  input {
    width: 18px;
    height: 18px;
    cursor: pointer;
    accent-color: ${({ theme }) => theme.colors.accent};
  }

  @media (max-width: 720px) {
    grid-template-columns: 28px minmax(0, 1fr);
    align-items: flex-start;
    gap: 12px;
    padding: 14px;

    span {
      font-size: 16px;
      line-height: 1.45;
      overflow-wrap: anywhere;
    }

    input {
      width: 22px;
      height: 22px;
      margin-top: 1px;
    }
  }
`;

export const NotesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 14px;

  @media (max-width: 520px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

export const NoteCard = styled.article`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 16px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  transition: 0.2s;

  &:hover {
    border-color: color-mix(in srgb, ${({ theme }) => theme.colors.accent} 32%, ${({ theme }) => theme.colors.border});
    box-shadow: ${({ theme }) => theme.shadow.md};
    transform: translateY(-2px);
  }

  p {
    overflow-wrap: anywhere;
  }

  @media (max-width: 520px) {
    padding: 14px;
  }
`;

export const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;

  h3 {
    font-size: 20px;
    color: ${({ theme }) => theme.colors.primaryDark};
    margin: 0;
    overflow-wrap: anywhere;
  }


  @media (max-width: 420px) {
    flex-direction: column;

    h3 {
      font-size: 18px;
    }
  }
`;

export const Description = styled.p`
  font-size: 20px;
  line-height: 1.5;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin: 0;
`;

export const ItemsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const NoteItem = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 10px;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textPrimary};
  padding-bottom: 8px;
  border-bottom: 1px dashed ${({ theme }) => theme.colors.border};

  strong {
    color: ${({ theme }) => theme.colors.primaryDark};
    white-space: nowrap;
  }
`;

export const TotalBox = styled.div`
  margin-top: 4px;
  background: ${({ theme }) => theme.colors.accentSoft};
  border: 1px solid color-mix(in srgb, ${({ theme }) => theme.colors.accent} 22%, ${({ theme }) => theme.colors.border});
  border-radius: 11px;
  padding: 10px 12px;
  display: flex;
  justify-content: space-between;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.accentDark};
`;

export const Priority = styled.span<{ $priority: "baixo" | "medio" | "alto" }>`
  font-size: 12px;
  font-weight: 700;
  padding: 5px 9px;
  border-radius: 999px;
  color: ${({ $priority }) =>
    $priority === "alto"
      ? "#991b1b"
      : $priority === "medio"
      ? "#92400e"
      : "#166534"};
  background: ${({ $priority }) =>
    $priority === "alto"
      ? "#fee2e2"
      : $priority === "medio"
      ? "#fef3c7"
      : "#dcfce7"};

  @media (max-width: 720px) {
    font-size: 13px;
    text-align: center;
  }
`;

export const CardActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 4px;

  @media (max-width: 420px) {
    width: 100%;
  }
`;

export const IconButton = styled.button`
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surfaceElevated};
  color: ${({ theme }) => theme.colors.textPrimary};
  height: 34px;
  padding: 0 10px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;

  &:hover {
    background: ${({ theme }) => theme.colors.background};
  }
`;

export const EmptyState = styled.div`
  min-height: 180px;
  border: 1px dashed ${({ theme }) => theme.colors.border};
  border-radius: 16px;
  background: ${({ theme }) => theme.colors.surface};
  display: grid;
  place-items: center;
  text-align: center;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-weight: 500;
`;

export const EditButton = styled.button`
  width: 34px;
  height: 34px;
  border: 1px solid color-mix(in srgb, ${({ theme }) => theme.colors.info} 25%, ${({ theme }) => theme.colors.border});
  border-radius: 10px;
  background: color-mix(in srgb, ${({ theme }) => theme.colors.info} 8%, transparent);
  color: ${({ theme }) => theme.colors.info};
  cursor: pointer;

  &:hover {
    background: color-mix(in srgb, ${({ theme }) => theme.colors.info} 15%, transparent);
  }

  @media (max-width: 420px) {
    flex: 1;
    min-width: 44px;
    height: 42px;
  }
`;

export const DeleteButton = styled.button`
  width: 34px;
  height: 34px;
  border: 1px solid color-mix(in srgb, ${({ theme }) => theme.colors.error} 25%, ${({ theme }) => theme.colors.border});
  border-radius: 10px;
  background: color-mix(in srgb, ${({ theme }) => theme.colors.error} 8%, transparent);
  color: ${({ theme }) => theme.colors.error};
  cursor: pointer;

  &:hover {
    background: color-mix(in srgb, ${({ theme }) => theme.colors.error} 15%, transparent);
  }

  @media (max-width: 420px) {
    flex: 1;
    min-width: 44px;
    height: 42px;
  }
`;
