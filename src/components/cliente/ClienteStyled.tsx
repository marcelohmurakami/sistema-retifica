import styled from "styled-components";

export const ClienteRow = styled.div`
  display: grid;
  grid-template-columns: 40px minmax(140px, 1.2fr) minmax(140px, 1fr) minmax(180px, 1.5fr) minmax(110px, 0.9fr) minmax(130px, 1fr) 80px;
  min-width: 880px;
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
    gap: 0.75rem;
    padding: 1rem;
    margin-bottom: 0.85rem;
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: 12px;
    background: ${({ theme }) => theme.colors.surface};
  }
`;

export const ClienteInfo = styled.p`
  min-width: 0;
  margin: 0;
  font-size: 1.3rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.primaryDark};
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
      margin-bottom: 0.2rem;
      font-size: 1.05rem;
      font-weight: 800;
      color: ${({ theme }) => theme.colors.textSecondary};
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    &:nth-child(1)::before {
      content: "ID";
    }

    &:nth-child(2)::before {
      content: "Cliente";
    }

    &:nth-child(3)::before {
      content: "CPF/CNPJ";
    }

    &:nth-child(4)::before {
      content: "Endereço";
    }

    &:nth-child(5)::before {
      content: "Telefone";
    }

    &:nth-child(6)::before {
      content: "Oficina";
    }
  }
`;
