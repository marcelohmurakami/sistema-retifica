import styled from "styled-components";

export const OSRow = styled.div`
  display: grid;
  grid-template-columns: 40px minmax(180px, 1.3fr) minmax(130px, 0.9fr) minmax(160px, 1fr) minmax(110px, 0.75fr) minmax(140px, 0.9fr) 80px;
  min-width: 980px;
  padding: 12px 16px;
  align-items: center;
  background: ${({ theme }) => theme.colors.surface};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  transition: background 0.18s ease, transform 0.18s ease;
  gap: 1rem;

  &:nth-child(even) {
    background: color-mix(in srgb, ${({ theme }) => theme.colors.background} 55%, ${({ theme }) => theme.colors.surface});
  }

  &:hover {
    background: ${({ theme }) => theme.colors.accentSoft};
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
    box-shadow: ${({ theme }) => theme.shadow.sm};

    &:nth-child(even) {
      background: ${({ theme }) => theme.colors.surface};
    }

    &:hover {
      background: ${({ theme }) => theme.colors.background};
      transform: translateY(-1px);
    }
  }
`;

export const OSInfo = styled.p`
  min-width: 0;
  margin: 0;

  color: ${({ theme }) => theme.colors.primaryDark};
  font-size: 0.8rem;
  font-weight: 590;
  line-height: 1.35;

  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  @media (max-width: 760px) {
    white-space: normal;
    overflow: visible;
    text-overflow: initial;
    font-size: 0.88rem;

    &::before {
      display: block;
      margin-bottom: 0.22rem;
      color: ${({ theme }) => theme.colors.textSecondary};
      font-size: 0.64rem;
      font-weight: 740;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }

    &:nth-child(1)::before {
      content: "ID";
    }

    &:nth-child(2)::before {
      content: "Cliente";
    }

    &:nth-child(3)::before {
      content: "Data do serviço";
    }

    &:nth-child(4)::before {
      content: "Motor";
    }

    &:nth-child(5)::before {
      content: "Valor";
    }

    &:nth-child(6)::before {
      content: "Data de vencimento";
    }
  }
`

