import styled from "styled-components";

export const ServicosTable = styled.div`
  width: 100%;
  margin-top: 16px;
  overflow-x: auto;
  border-radius: 12px;

  @media (max-width: 760px) {
    overflow: visible;
    border-radius: 0;
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

  background: linear-gradient(90deg, #1e293b, #0f172a);
  color: white;
  font-weight: 700;
  border-radius: 12px 12px 0 0;

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
