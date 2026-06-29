import styled from "styled-components";

export const Form = styled.form`
  width: min(720px, 100%);
  margin: 0 auto;
  padding: clamp(1.25rem, 2.4vw, 2rem);

  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 20px;
  box-shadow:
    0 18px 45px rgba(2, 6, 23, 0.12),
    0 1px 0 rgba(255, 255, 255, 0.55) inset;
  backdrop-filter: blur(10px);

  display: grid;
  gap: 1rem;
  overflow-x: hidden;

  h1 {
    margin: 0 3rem 0.25rem 0;
    font-size: clamp(1.7rem, 4vw, 2.4rem);
    line-height: 1.2;
    color: #0f172a;
  }

  h1::after {
    content: "";
    display: block;
    margin-top: 0.9rem;
    height: 1px;
    background: linear-gradient(
      90deg,
      rgba(15, 23, 42, 0.16),
      rgba(15, 23, 42, 0.04),
      rgba(15, 23, 42, 0)
    );
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
  border: 1px solid rgba(15, 23, 42, 0.06);
  background: rgba(248, 250, 252, 0.7);

  transition: border-color 160ms ease, transform 160ms ease, box-shadow 160ms ease;

  > * {
    min-width: 0;
  }

  &:focus-within {
    border-color: rgba(37, 99, 235, 0.35);
    box-shadow: 0 10px 25px rgba(37, 99, 235, 0.12);
    transform: translateY(-1px);
    background: rgba(248, 250, 252, 0.92);
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
  color: #0f172a;
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
  border: 1px solid ${({ $error }) => ($error ? "#ff4d4f" : "#ccc")};
  background: rgba(255, 255, 255, 0.9);

  color: #0f172a;
  font-size: 1.35rem;

  outline: none;
  transition: border-color 160ms ease, box-shadow 160ms ease, background 160ms ease;

  &::placeholder {
    color: rgba(15, 23, 42, 0.45);
  }

  &:hover {
    border-color: rgba(15, 23, 42, 0.22);
  }

  &:focus {
    border-color: ${({ $error }) => ($error ? "#ff4d4f" : "#4c8bf5")};
    box-shadow:
      0 0 0 4px rgba(37, 99, 235, 0.14),
      0 10px 22px rgba(2, 6, 23, 0.08);
    background: #ffffff;
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

  color: #ff4d4f;
  background: #fff1f0;

  border-left: 3px solid #ff4d4f;
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
  color: #ffffff;

  background: linear-gradient(135deg, #2563eb, #7c3aed);
  box-shadow:
    0 14px 30px rgba(37, 99, 235, 0.22),
    0 6px 14px rgba(124, 58, 237, 0.12);

  transition: transform 140ms ease, filter 140ms ease, box-shadow 140ms ease;

  &:hover {
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
  border: 1px solid #ccc;
  background-color: rgba(255, 255, 255, 0.9);
  color: #0f172a;

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
    border-color: rgba(15, 23, 42, 0.22);
  }

  &:focus {
    border-color: #4c8bf5;
    box-shadow:
      0 0 0 4px rgba(37, 99, 235, 0.14),
      0 10px 22px rgba(2, 6, 23, 0.08);
    background-color: #ffffff;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.65;
    background-color: #f8fafc;
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
  border: 1px solid #d8dee8;
  border-radius: 12px;
  background: #ffffff;

  span {
    min-width: 0;
    color: #0f172a;
    font-size: 1.25rem;
    line-height: 1.45;
    overflow-wrap: anywhere;
  }

  button {
    flex: 0 0 auto;
    min-height: 34px;
    padding: 0.55rem 0.9rem;
    border: 1px solid #fecaca;
    border-radius: 10px;
    background: #fff1f2;
    color: #b91c1c;
    font-weight: 700;
    cursor: pointer;
    transition: background 0.16s ease, transform 0.16s ease;
  }

  button:hover {
    background: #ffe4e6;
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
  border: 1px solid ${({ $error }) => ($error ? "#ef4444" : "#E2E8F0")};
  background: #fff;

  font-size: 14px;
  resize: vertical;

  &:focus {
    outline: none;
    border-color: #F97316;
    box-shadow: 0 0 0 2px rgba(249, 115, 22, 0.2);
  }
`;
