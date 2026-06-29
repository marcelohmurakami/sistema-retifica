import styled from "styled-components";

export const ClienteRow = styled.div`
  display: grid;
  grid-template-columns: 50px minmax(220px, 1.35fr) minmax(100px, 0.7fr) minmax(100px, 0.7fr) minmax(110px, 0.7fr) minmax(140px, 0.9fr) 80px;
  min-width: 900px;
  padding: 12px 16px;
  align-items: center;
  background: ${({ theme }) => theme.colors.surface};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  transition: 0.2s ease;
  gap: 1rem;

  &:nth-child(even) {
    background: ${({ theme }) => theme.colors.background};
  }

  &:hover {
    background: ${({ theme }) => theme.colors.border};
  }

  @media (max-width: 760px) {
    min-width: 0;
    display: grid;
    grid-template-columns: 1fr;
    gap: 0.8rem;

    padding: 1rem;
    margin-bottom: 0.9rem;

    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: 14px;
    background: ${({ theme }) => theme.colors.surface};
    box-shadow: 0 10px 26px rgba(15, 23, 42, 0.06);

    &:nth-child(even) {
      background: ${({ theme }) => theme.colors.surface};
    }

    &:hover {
      background: ${({ theme }) => theme.colors.background};
      transform: translateY(-1px);
    }
  }
`;

export const ClienteInfo = styled.p`
  min-width: 0;
  margin: 0;
  color: ${({ theme }) => theme.colors.primaryDark};
  font-size: 1.25rem;
  font-weight: 700;
  line-height: 1.35;

  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  @media (max-width: 760px) {
    white-space: normal;
    overflow: visible;
    text-overflow: initial;
    font-size: 1.35rem;

    &::before {
      display: block;
      margin-bottom: 0.22rem;
      color: ${({ theme }) => theme.colors.textSecondary};
      font-size: 1.05rem;
      font-weight: 800;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }

    &:nth-child(1)::before {
      content: "ID";
    }

    &:nth-child(2)::before {
      content: "Produto";
    }

    &:nth-child(3)::before {
      content: "Custo";
    }

    &:nth-child(4)::before {
      content: "Valor";
    }

    &:nth-child(5)::before {
      content: "Quantidade";
    }

    &:nth-child(6)::before {
      content: "Situação";
    }
  }
`

