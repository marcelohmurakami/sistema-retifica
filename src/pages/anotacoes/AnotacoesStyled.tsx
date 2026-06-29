import styled from "styled-components";

export const PageContainer = styled.main`
  width: 100%;
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
  color: #111827;
  margin: 0;
  line-height: 1.15;
`;

export const Subtitle = styled.p`
  font-size: clamp(14px, 4vw, 16px);
  color: #6b7280;
  margin: 0;
  line-height: 1.45;
`;

export const NewButton = styled.button`
  border: none;
  background: #2563eb;
  color: #ffffff;
  padding: 11px 16px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: 0.2s;

  &:hover {
    background: #1d4ed8;
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
  border-bottom: 1px solid #e5e7eb;

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
  color: ${({ $active }) => ($active ? "#2563eb" : "#6b7280")};
  border-bottom: 3px solid ${({ $active }) => ($active ? "#2563eb" : "transparent")};
  cursor: pointer;

  &:hover {
    color: #2563eb;
  }

  @media (max-width: 480px) {
    min-height: 44px;
    border: 1px solid ${({ $active }) => ($active ? "#2563eb" : "#e5e7eb")};
    border-radius: 8px;
    background: ${({ $active }) => ($active ? "#eff6ff" : "#ffffff")};
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
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 0 14px;
  font-size: 14px;
  outline: none;
  background: #ffffff;

  &:focus {
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.14);
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
    color: #111827;
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
  background: ${({ $done }) => ($done ? "#f9fafb" : "#ffffff")};
  border: 1px solid ${({ $done }) => ($done ? "#e5e7eb" : "#dbeafe")};
  border-left: 4px solid ${({ $done }) => ($done ? "#9ca3af" : "#2563eb")};
  border-radius: 8px;

  span {
    color: ${({ $done }) => ($done ? "#9ca3af" : "#111827")};
    text-decoration: ${({ $done }) => ($done ? "line-through" : "none")};
    font-weight: 500;
  }

  input {
    width: 18px;
    height: 18px;
    cursor: pointer;
    accent-color: #2563eb;
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
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  transition: 0.2s;

  &:hover {
    border-color: #93c5fd;
    box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
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
    color: #111827;
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
  color: #4b5563;
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
  color: #374151;
  padding-bottom: 8px;
  border-bottom: 1px dashed #e5e7eb;

  strong {
    color: #111827;
    white-space: nowrap;
  }
`;

export const TotalBox = styled.div`
  margin-top: 4px;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 8px;
  padding: 10px 12px;
  display: flex;
  justify-content: space-between;
  font-weight: 700;
  color: #1e3a8a;
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
  border: 1px solid #e5e7eb;
  background: #ffffff;
  color: #374151;
  height: 34px;
  padding: 0 10px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;

  &:hover {
    background: #f3f4f6;
  }
`;

export const EmptyState = styled.div`
  min-height: 180px;
  border: 1px dashed #cbd5e1;
  border-radius: 8px;
  background: #f8fafc;
  display: grid;
  place-items: center;
  text-align: center;
  color: #64748b;
  font-weight: 500;
`;

export const EditButton = styled.button`
  width: 34px;
  height: 34px;
  border: 1px solid #bfdbfe;
  border-radius: 8px;
  background: #eff6ff;
  color: #2563eb;
  cursor: pointer;

  &:hover {
    background: #dbeafe;
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
  border: 1px solid #fecaca;
  border-radius: 8px;
  background: #fef2f2;
  color: #dc2626;
  cursor: pointer;

  &:hover {
    background: #fee2e2;
  }

  @media (max-width: 420px) {
    flex: 1;
    min-width: 44px;
    height: 42px;
  }
`;
