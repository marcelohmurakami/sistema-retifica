import styled from "styled-components";

type Situacao =
  | "analise"
  | "aguardando"
  | "aguardandoPecas"
  | "producao"
  | "pronto"
  | "cancelado";

const situacaoColors = {
  analise: {
    background: "#dbeafe",
    color: "#1d4ed8",
  },
  aguardando: {
    background: "#fef3c7",
    color: "#92400e",
  },
  aguardandoPecas: {
    background: "#ffedd5",
    color: "#c2410c",
  },
  producao: {
    background: "#ede9fe",
    color: "#6d28d9",
  },
  pronto: {
    background: "#dcfce7",
    color: "#166534",
  },
  cancelado: {
    background: "#fee2e2",
    color: "#b91c1c",
  },
};

export const StatusCounters = styled.div`
  display: grid;
  grid-template-columns: repeat(6, minmax(120px, 1fr));
  gap: 12px;
  margin: 16px 0;

  @media (max-width: 1180px) {
    grid-template-columns: repeat(3, minmax(140px, 1fr));
  }

  @media (max-width: 640px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

export const StatusCounterCard = styled.div<{ situacao: Situacao }>`
  min-width: 0;
  padding: 14px 16px;
  border-radius: 8px;
  background: ${({ situacao }) => situacaoColors[situacao].background};
  color: ${({ situacao }) => situacaoColors[situacao].color};
  border: 1px solid ${({ situacao }) => situacaoColors[situacao].color}22;

  @media (max-width: 420px) {
    padding: 12px;
  }
`;

export const StatusCounterLabel = styled.span`
  display: block;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  overflow-wrap: anywhere;
`;

export const StatusCounterValue = styled.strong`
  display: block;
  margin-top: 6px;
  font-size: 24px;
  font-weight: 800;
  line-height: 1;
`;

export const OSTable = styled.div`
  width: 100%;
  margin-top: 16px;
  overflow-x: auto;
  border-radius: 12px;

  @media (max-width: 760px) {
    overflow: visible;
    border-radius: 0;
  }
`;

export const OSHeader = styled.div`
  display: grid;
  grid-template-columns: 40px minmax(180px, 1.25fr) minmax(140px, 0.9fr) minmax(130px, 0.85fr) minmax(180px, 1.3fr) minmax(145px, 0.9fr) 80px;
  min-width: 980px;
  gap: 1rem;
  padding: 14px 16px;
  background: linear-gradient(90deg, #1e293b, #0f172a);
  color: white;
  font-weight: 700;
  border-radius: 12px 12px 0 0;

  @media (max-width: 760px) {
    display: none;
  }
`;

export const OSTableFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 16px;
  background: linear-gradient(90deg, #0f172a, #111827);
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 0 0 12px 12px;
  color: #e2e8f0;
  flex-wrap: wrap;

  @media (max-width: 760px) {
    margin-top: 0.5rem;
    border-radius: 12px;
    align-items: stretch;
    flex-direction: column;
  }
`;

export const FooterInfo = styled.span`
  font-size: 14px;
  color: #cbd5e1;

  @media (max-width: 760px) {
    text-align: center;
  }
`;

export const PaginationControls = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;

  @media (max-width: 760px) {
    justify-content: center;
  }
`;

export const PaginationButton = styled.button<{ $active?: boolean }>`
  min-width: 36px;
  height: 36px;
  padding: 0 12px;
  border: 1px solid
    ${({ $active }) => ($active ? "#3b82f6" : "rgba(255, 255, 255, 0.08)")};
  background: ${({ $active }) => ($active ? "#3b82f6" : "#1e293b")};
  color: #f8fafc;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: 0.2s ease;

  &:hover {
    background: ${({ $active }) => ($active ? "#2563eb" : "#334155")};
    border-color: ${({ $active }) => ($active ? "#2563eb" : "#334155")};
  }

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
`;

export const SearchWrapper = styled.div`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-top: 20px;
  margin-bottom: 16px;
  flex-wrap: wrap;
`;

export const SearchBox = styled.div`
  position: relative;
  width: 100%;
  max-width: 420px;

  @media (max-width: 640px) {
    max-width: none;
  }
`;

export const SearchInput = styled.input`
  width: 100%;
  height: 44px;
  padding: 0 16px 0 42px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 12px;
  background-color: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.primaryDark};
  font-size: 14px;
  font-weight: 500;
  outline: none;
  transition: all 0.2s ease;

  &::placeholder {
    color: #94a3b8;
  }

  &:hover {
    border-color: #cbd5f5;
  }

  &:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
  }
`;

export const SearchIcon = styled.span`
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 16px;
  color: #94a3b8;
  pointer-events: none;
`;

export const SearchInfo = styled.span`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-weight: 500;
`;

export const FiltrosSituacao = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 12px 0 16px;

  @media (max-width: 640px) {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 380px) {
    grid-template-columns: 1fr;
  }
`;

export const FiltroSituacaoLabel = styled.label`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 10px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 8px;
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  min-width: 0;

  span {
    min-width: 0;
    overflow-wrap: anywhere;
  }

  input {
    accent-color: #2563eb;
    cursor: pointer;
  }

  &:hover {
    background: ${({ theme }) => theme.colors.background};
  }
`;

