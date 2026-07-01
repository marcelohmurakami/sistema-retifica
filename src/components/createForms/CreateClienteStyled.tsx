import styled from "styled-components";

export const Form = styled.form`
  width: min(720px, 100%);
  margin: 0 auto;
  padding: clamp(1.25rem, 2.4vw, 2rem);

  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 20px;
  box-shadow: ${({ theme }) => theme.shadow.md};

  display: grid;
  gap: 1rem;
  overflow-x: hidden;

  h1 {
    margin: 0 3rem 0.25rem 0;
    font-size: clamp(1.7rem, 4vw, 2.4rem);
    line-height: 1.2;
    color: ${({ theme }) => theme.colors.primaryDark};
  }

  h1::after {
    content: "";
    display: block;
    margin-top: 0.9rem;
    height: 1px;
    background: ${({ theme }) => theme.colors.border};
  }

  @media (max-width: 640px) {
    padding: 1.4rem;
    border-radius: 16px;

    h1 {
      margin-right: 3.2rem;
      font-size: 1.9rem;
    }
  }

  @media (max-width: 380px) {
    padding: 1.1rem;

    h1 {
      font-size: 1.65rem;
    }
  }
`;

export const FormRow = styled.div`
  display: grid;
  grid-template-columns: minmax(120px, 180px) minmax(0, 1fr);
  align-items: center;
  gap: 0.85rem;

  padding: 0.85rem;
  border-radius: 14px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.background};

  transition: border-color 160ms ease, transform 160ms ease, box-shadow 160ms ease;

  > * {
    min-width: 0;
  }

  &:focus-within {
    border-color: ${({ theme }) => theme.colors.accent};
    box-shadow: ${({ theme }) => theme.shadow.sm};
    transform: translateY(-1px);
    background: ${({ theme }) => theme.colors.surface};
  }

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
    gap: 0.55rem;
    padding: 0.9rem;
  }
`;

export const Label = styled.label`
  font-size: 1.4rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.textPrimary};
  overflow-wrap: anywhere;

  @media (max-width: 640px) {
    font-size: 1.25rem;
  }
`;

export const Input = styled.input<{ $error?: boolean }>`
  width: 100%;
  min-width: 0;
  height: 44px;
  padding: 0.75rem 0.9rem;

  border-radius: 12px;
  border: 1px solid ${({ $error, theme }) => ($error ? theme.colors.error : theme.colors.border)};
  background: ${({ theme }) => theme.colors.surface};

  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: 1.35rem;

  outline: none;
  transition: border-color 160ms ease, box-shadow 160ms ease, background 160ms ease;

  &::placeholder {
    color: ${({ theme }) => theme.colors.textSecondary};
  }

  &:hover {
    border-color: ${({ theme }) => theme.colors.textSecondary};
  }

  &:focus {
    border-color: ${({ $error, theme }) => ($error ? theme.colors.error : theme.colors.accent)};
    box-shadow: 0 0 0 3px color-mix(in srgb, ${({ theme }) => theme.colors.accent} 24%, transparent);
    background: ${({ theme }) => theme.colors.surface};
  }

  @media (max-width: 640px) {
    height: 46px;
    font-size: 1.35rem;
  }
`;

export const ButtonContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.8rem;
  flex-wrap: wrap;
  margin-top: 0.25rem;
  padding-top: 0.35rem;

  @media (max-width: 640px) {
    justify-content: stretch;
  }
`;

export const ErrorMessage = styled.span`
  display: flex;
  align-items: center;
  gap: 6px;
  grid-column: 1 / -1;

  margin-top: 6px;
  padding: 6px 8px;

  font-size: 1.2rem;
  font-weight: 600;

  color: ${({ theme }) => theme.colors.error};
  background: ${({ theme }) => theme.colors.background};

  border-left: 3px solid ${({ theme }) => theme.colors.error};
  border-radius: 4px;
`;

export const SubmitButton = styled.button`
  height: 46px;
  padding: 0 1.1rem;
  min-width: 180px;

  border: 0;
  border-radius: 14px;
  cursor: pointer;

  font-weight: 800;
  font-size: 1.35rem;
  color: ${({ theme }) => theme.colors.surface};

  background: ${({ theme }) => theme.colors.accent};
  box-shadow: ${({ theme }) => theme.shadow.sm};

  transition: transform 140ms ease, filter 140ms ease, box-shadow 140ms ease;

  &:hover {
    background: ${({ theme }) => theme.colors.accentDark};
    filter: brightness(1.03);
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
    filter: brightness(0.98);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.65;
    box-shadow: none;
    transform: none;
  }

  @media (max-width: 640px) {
    width: 100%;
    min-width: unset;
    height: 48px;
  }
`;

export const Select = styled.select`
  width: 100%;
  min-width: 0;
  height: 44px;
  padding: 0.75rem 2.6rem 0.75rem 0.9rem;

  border-radius: 12px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  background-color: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.textPrimary};

  font-size: 1.35rem;
  font-weight: 500;
  outline: none;
  cursor: pointer;

  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;

  background-image: url("data:image/svg+xml;utf8,<svg fill='%236b7280' height='20' viewBox='0 0 20 20' width='20' xmlns='http://www.w3.org/2000/svg'><path d='M5.5 7.5l4.5 4.5 4.5-4.5'/></svg>");
  background-repeat: no-repeat;
  background-position: right 10px center;
  background-size: 16px;

  transition: border-color 160ms ease, box-shadow 160ms ease, background 160ms ease;

  &:hover:not(:disabled) {
    border-color: ${({ theme }) => theme.colors.textSecondary};
  }

  &:focus {
    border-color: ${({ theme }) => theme.colors.accent};
    box-shadow: 0 0 0 3px color-mix(in srgb, ${({ theme }) => theme.colors.accent} 24%, transparent);
    background-color: ${({ theme }) => theme.colors.surface};
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.65;
    background-color: ${({ theme }) => theme.colors.background};
  }

  @media (max-width: 640px) {
    height: 46px;
    font-size: 1.35rem;
  }
`;

export const SelectCliente = styled.div`
  display: flex;
  align-items: center;
  gap: 0.8rem;
  width: 100%;

  > input,
  > select {
    flex: 1 1 0;
  }

  @media (max-width: 640px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

export const ServicosAdicionados = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
  padding: 0.9rem 1rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 12px;
  background: ${({ theme }) => theme.colors.surface};

  span {
    min-width: 0;
    color: ${({ theme }) => theme.colors.textPrimary};
    font-size: 1.25rem;
    line-height: 1.45;
    overflow-wrap: anywhere;
  }

  button {
    flex: 0 0 auto;
    min-height: 34px;
    padding: 0.55rem 0.9rem;
    border: 1px solid ${({ theme }) => theme.colors.error};
    border-radius: 10px;
    background: ${({ theme }) => theme.colors.background};
    color: ${({ theme }) => theme.colors.error};
    font-weight: 700;
    cursor: pointer;
    transition: background 0.16s ease, transform 0.16s ease;
  }

  button:hover {
    background: ${({ theme }) => theme.colors.border};
    transform: translateY(-1px);
  }

  @media (max-width: 640px) {
    align-items: stretch;
    flex-direction: column;

    button {
      width: 100%;
    }
  }
`;

export const TextArea = styled.textarea<{ $error?: boolean }>`
  width: 100%;
  min-height: 150px;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid ${({ $error, theme }) => ($error ? theme.colors.error : theme.colors.border)};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.textPrimary};

  font-size: 14px;
  resize: vertical;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.accent};
    box-shadow: 0 0 0 3px color-mix(in srgb, ${({ theme }) => theme.colors.accent} 24%, transparent);
  }
`;
