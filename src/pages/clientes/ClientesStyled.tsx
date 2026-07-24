import styled from "styled-components";

export const ClientesStyled = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
  padding: 0.2rem 0;

  @media (max-width: 640px) {
    align-items: stretch;
  }
`;

export const ClientesInfos = styled.h2`
  color: ${({ theme }) => theme.colors.primaryDark};
  font-size: clamp(1.35rem, 3vw, 1.75rem);
  font-weight: 740;
  letter-spacing: -0.035em;

  &:last-child {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    color: ${({ theme }) => theme.colors.textSecondary};
    font-size: 0.76rem;
    font-weight: 620;
    letter-spacing: 0;
  }

  @media (max-width: 640px) {
    width: 100%;
    font-size: 1.3rem;

    &:last-child {
      align-items: stretch;
      flex-direction: column;
      font-size: 0.74rem;
    }
  }
`;

export const ClientesTable = styled.div`
  width: 100%;
  margin-top: 16px;
  overflow-x: auto;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 16px;
  background: ${({ theme }) => theme.colors.surface};
  box-shadow: ${({ theme }) => theme.shadow.sm};

  @media (max-width: 760px) {
    overflow: visible;
    border: 0;
    background: transparent;
    box-shadow: none;
  }
`;

export const ClientesHeader = styled.div`
  display: grid;
  grid-template-columns: 40px minmax(140px, 1.2fr) minmax(140px, 1fr) minmax(180px, 1.5fr) minmax(110px, 0.9fr) minmax(130px, 1fr) 80px;
  min-width: 880px;
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

export const HeaderItem = styled.div`
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.7rem;
  letter-spacing: 0.045em;
  text-transform: uppercase;
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
  min-height: 42px;
  background-color: ${({ theme }) => theme.colors.surfaceElevated};
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};
  cursor: pointer;
  outline: none;
  transition: all 0.2s ease;

  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;

  box-shadow: ${({ theme }) => theme.shadow.sm};

  background-image: url("data:image/svg+xml;utf8,<svg fill='%236b7280' height='20' viewBox='0 0 20 20' width='20' xmlns='http://www.w3.org/2000/svg'><path d='M5.5 7.5l4.5 4.5 4.5-4.5'/></svg>");
  background-repeat: no-repeat;
  background-position: right 10px center;
  background-size: 16px;

  &:hover {
    border-color: color-mix(in srgb, ${({ theme }) => theme.colors.textSecondary} 45%, ${({ theme }) => theme.colors.border});
  }

  &:focus {
    border-color: ${({ theme }) => theme.colors.accent};
    box-shadow: 0 0 0 4px color-mix(in srgb, ${({ theme }) => theme.colors.accent} 12%, transparent);
  }

  @media (max-width: 640px) {
    width: 100%;
  }
`;

