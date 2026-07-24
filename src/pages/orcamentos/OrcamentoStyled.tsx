import styled from "styled-components"

type Situacao =
  | "analise"
  | "aguardando"
  | "aguardandoPecas"
  | "producao"
  | "pronto"
  | "cancelado";

export const ClienteRow = styled.div`
  display: grid;
  grid-template-columns: 40px minmax(180px, 1.25fr) minmax(140px, 0.9fr) minmax(130px, 0.85fr) minmax(180px, 1.3fr) minmax(145px, 0.9fr) 80px;
  min-width: 980px;
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

  > * {
    min-width: 0;
  }

  p {
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
      content: "Cliente";
    }

    p:nth-child(3)::before {
      content: "Data do orçamento";
    }

    p:nth-child(4)::before {
      content: "Motor";
    }

    p:nth-child(5)::before {
      content: "Orçamento";
    }
  }
`;

const situacaoColors = {
  analise: {
    background: "#dbeafe",
    color: "#1d4ed8",
  },
  aguardando: {
    background: "#fef3c7",
    color: "#92400e",
  },
  aguardandoPecas: {
    background: "#ffedd5",
    color: "#c2410c",
  },
  producao: {
    background: "#ede9fe",
    color: "#6d28d9",
  },
  pronto: {
    background: "#dcfce7",
    color: "#166534",
  },
  cancelado: {
    background: "#fee2e2",
    color: "#b91c1c",
  },
};

export const SituacaoBadge = styled.span<{ situacao?: Situacao | string }>`
  width: fit-content;
  min-width: 92px;
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  text-align: center;
  text-transform: uppercase;

  background: ${({ situacao }) =>
    situacaoColors[situacao as Situacao]?.background ?? "#e5e7eb"};

  color: ${({ situacao }) =>
    situacaoColors[situacao as Situacao]?.color ?? "#374151"};
`;

export const SituacaoSelect = styled.select<{ situacao?: Situacao | string }>`
  width: fit-content;
  min-width: 130px;
  max-width: 100%;
  padding: 7px 28px 7px 10px;
  border: 0;
  border-radius: 999px;
  outline: none;
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
  cursor: pointer;
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;

  background: ${({ situacao }) =>
    situacaoColors[situacao as Situacao]?.background ?? "#e5e7eb"};

  background-image: url("data:image/svg+xml;utf8,<svg fill='%236b7280' height='18' viewBox='0 0 20 20' width='18' xmlns='http://www.w3.org/2000/svg'><path d='M5.5 7.5l4.5 4.5 4.5-4.5'/></svg>");
  background-repeat: no-repeat;
  background-position: right 8px center;
  background-size: 14px;

  color: ${({ situacao }) =>
    situacaoColors[situacao as Situacao]?.color ?? "#374151"};

  &:disabled {
    opacity: 0.65;
    cursor: not-allowed;
  }

  @media (max-width: 760px) {
    width: 100%;
    min-width: 0;

    &::before {
      content: "Situação";
    }
  }
`;

