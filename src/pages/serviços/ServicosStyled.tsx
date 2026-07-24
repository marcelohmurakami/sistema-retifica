import styled from "styled-components";

export const ServicosTable = styled.div`
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
    border-radius: 0;
    background: transparent;
    box-shadow: none;
  }
`;

export const ServicosFlex = styled.div`
  width: 100%;
  display: flex;
  gap: 20px;

  @media (max-width: 900px) {
    flex-direction: column;
  }
`;

export const ServicosHeader = styled.div`
  display: grid;
  grid-template-columns: 70px minmax(220px, 1fr) minmax(130px, 0.35fr) 90px;
  min-width: 720px;
  gap: 1rem;
  padding: 14px 16px;

  background: linear-gradient(95deg, #242b36, #141922);
  color: white;
  font-weight: 700;
  border-radius: 15px 15px 0 0;

  @media (max-width: 760px) {
    display: none;
  }
`;

export const ServicosFooter = styled.div`
  width: 100%;
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
    border-radius: 12px;
    align-items: stretch;
    flex-direction: column;
  }
`;
