import styled from "styled-components";

export const ServicoRow = styled.div`
  display: grid;
  grid-template-columns: 70px minmax(220px, 1fr) minmax(130px, 0.35fr) 90px;
  min-width: 720px;
  gap: 1rem;
  padding: 12px 16px;
  align-items: center;
  background: ${({ theme }) => theme.colors.surface};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  transition: background 0.18s ease, transform 0.18s ease;

  &:nth-child(even) {
    background: color-mix(in srgb, ${({ theme }) => theme.colors.background} 55%, ${({ theme }) => theme.colors.surface});
  }

  &:hover {
    background: ${({ theme }) => theme.colors.accentSoft};
  }

  p {
    min-width: 0;
    margin: 0;
    color: ${({ theme }) => theme.colors.primaryDark};
    font-size: 0.8rem;
    font-weight: 590;
    line-height: 1.35;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
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

    p {
      white-space: normal;
      overflow: visible;
      text-overflow: initial;
      font-size: 0.88rem;
    }

    p::before {
      display: block;
      margin-bottom: 0.22rem;
      color: ${({ theme }) => theme.colors.textSecondary};
      font-size: 0.64rem;
      font-weight: 740;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }

    p:nth-child(1)::before {
      content: "ID";
    }

    p:nth-child(2)::before {
      content: "Serviço";
    }

    p:nth-child(3)::before {
      content: "Valor";
    }
  }
`;

export const ServicoInfo = styled.p`
  font-size: 0.8rem;
  font-weight: 590;
`

