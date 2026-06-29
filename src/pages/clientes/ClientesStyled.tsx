import styled from "styled-components";

export const ClientesStyled = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;

  @media (max-width: 640px) {
    align-items: stretch;
  }
`;

export const ClientesInfos = styled.h2`
  font-size: 1.8rem;

  @media (max-width: 640px) {
    width: 100%;
    font-size: 1.55rem;
  }
`;

export const ClientesTable = styled.div`
  width: 100%;
  margin-top: 16px;
  overflow-x: auto;
  border-radius: 12px;

  @media (max-width: 760px) {
    overflow: visible;
  }
`;

export const ClientesHeader = styled.div`
  display: grid;
  grid-template-columns: 40px minmax(140px, 1.2fr) minmax(140px, 1fr) minmax(180px, 1.5fr) minmax(110px, 0.9fr) minmax(130px, 1fr) 80px;
  min-width: 880px;
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

export const HeaderItem = styled.div`
  font-size: 13px;
  letter-spacing: 0.4px;
`;

export const ClienteInfo = styled.div`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.primaryDark};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const SelectStyled = styled.select`
  width: auto;
  max-width: 100%;
  padding: 10px 36px 10px 14px;
  border-radius: 10px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  background-color: ${({ theme }) => theme.colors.surface};
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};
  cursor: pointer;
  outline: none;
  transition: all 0.2s ease;

  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;

  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);

  background-image: url("data:image/svg+xml;utf8,<svg fill='%236b7280' height='20' viewBox='0 0 20 20' width='20' xmlns='http://www.w3.org/2000/svg'><path d='M5.5 7.5l4.5 4.5 4.5-4.5'/></svg>");
  background-repeat: no-repeat;
  background-position: right 10px center;
  background-size: 16px;

  &:hover {
    border-color: #9ca3af;
  }

  &:focus {
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.2);
  }

  @media (max-width: 640px) {
    width: 100%;
  }
`;

