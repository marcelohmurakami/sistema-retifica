import styled from "styled-components";

export const OSTable = styled.div`
  width: 100%;
  margin-top: 1rem;
  overflow-x: auto;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 16px;
  background: ${({ theme }) => theme.colors.surface};
  box-shadow: ${({ theme }) => theme.shadow.sm};

  @media (max-width: 760px) {
    overflow: visible;
    border: 0;
    border-radius: 0;
    background: transparent;
    box-shadow: none;
  }
`;

export const OSHeader = styled.div`
  display: grid;
  grid-template-columns: 40px minmax(180px, 1.3fr) minmax(130px, 0.9fr) minmax(160px, 1fr) minmax(110px, 0.75fr) minmax(140px, 0.9fr) 80px;
  min-width: 980px;
  padding: 14px 16px;
  background: linear-gradient(95deg, #242b36, #141922);
  color: white;
  font-weight: 700;
  border-radius: 15px 15px 0 0;
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
  background: linear-gradient(95deg, #141922, #0d1117);
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 0 0 15px 15px;
  color: #e2e8f0;
  flex-wrap: wrap;

  @media (max-width: 760px) {
    margin-top: 0.5rem;
    border-radius: 15px;
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
    ${({ $active, theme }) => ($active ? theme.colors.accent : "rgba(255, 255, 255, 0.1)")};
  background: ${({ $active, theme }) => ($active ? theme.colors.accent : "rgba(255, 255, 255, 0.06)")};
  color: #f8fafc;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: 0.2s ease;

  &:hover {
    background: ${({ $active, theme }) => ($active ? theme.colors.accentDark : "rgba(255, 255, 255, 0.12)")};
    border-color: ${({ $active, theme }) => ($active ? theme.colors.accentDark : "rgba(255, 255, 255, 0.16)")};
    transform: translateY(-1px);
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
  margin: 0 0 1rem;
  flex-wrap: wrap;
`;

export const SearchBox = styled.div`
  position: relative;
  width: 100%;
  max-width: 520px;

  @media (max-width: 640px) {
    max-width: none;
  }
`;

export const SearchInput = styled.input`
  width: 100%;
  height: 48px;
  padding: 0 16px 0 42px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 14px;
  background-color: ${({ theme }) => theme.colors.surfaceElevated};
  color: ${({ theme }) => theme.colors.primaryDark};
  font-size: 14px;
  font-weight: 500;
  outline: none;
  transition: all 0.2s ease;

  &::placeholder {
    color: ${({ theme }) => theme.colors.textMuted};
  }

  &:hover {
    border-color: color-mix(in srgb, ${({ theme }) => theme.colors.textSecondary} 45%, ${({ theme }) => theme.colors.border});
  }

  &:focus {
    border-color: ${({ theme }) => theme.colors.accent};
    box-shadow: 0 0 0 4px color-mix(in srgb, ${({ theme }) => theme.colors.accent} 12%, transparent);
  }
`;

export const SearchIcon = styled.span`
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 16px;
  color: ${({ theme }) => theme.colors.textMuted};
  pointer-events: none;
`;

export const SearchInfo = styled.span`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-weight: 500;
`;

