import styled from "styled-components";

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
  grid-template-columns: 40px minmax(180px, 1.3fr) minmax(130px, 0.9fr) minmax(160px, 1fr) minmax(110px, 0.75fr) minmax(140px, 0.9fr) 80px;
  min-width: 980px;
  padding: 14px 16px;
  background: linear-gradient(90deg, #1e293b, #0f172a);
  color: white;
  font-weight: 700;
  border-radius: 12px 12px 0 0;
  gap: 1rem;

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

