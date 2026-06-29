import styled from "styled-components";

export const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 999;
  display: grid;
  place-items: center;
  padding: clamp(12px, 4vw, 24px);
  background: rgba(15, 23, 42, 0.55);
  backdrop-filter: blur(6px);
`;

export const ModalCard = styled.div`
  width: min(620px, 96vw);
  max-height: 90vh;
  overflow: auto;
  background: #ffffff;
  border-radius: 18px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 24px 70px rgba(15, 23, 42, 0.24);
`;

export const ModalHeader = styled.div`
  padding: 22px 24px 16px;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  gap: 16px;

  h2 {
    margin: 0;
    color: #0f172a;
    font-size: 22px;
  }

  p {
    margin: 6px 0 0;
    color: #64748b;
    font-size: 14px;
  }

  @media (max-width: 520px) {
    padding: 18px 16px 14px;

    h2 {
      font-size: 20px;
    }
  }
`;

export const CloseButton = styled.button`
  width: 38px;
  height: 38px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #f8fafc;
  color: #334155;
  cursor: pointer;
  font-size: 18px;

  &:hover {
    background: #e2e8f0;
  }
`;

export const NoteForm = styled.form`
  padding: 22px 24px 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;

  @media (max-width: 520px) {
    padding: 18px 16px 20px;
  }
`;

export const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 7px;
`;

export const Label = styled.label`
  font-size: 14px;
  font-weight: 700;
  color: #334155;
`;

export const Input = styled.input`
  height: 44px;
  border: 1px solid #cbd5e1;
  border-radius: 12px;
  padding: 0 14px;
  color: #0f172a;
  background: #ffffff;
  outline: none;
  font-size: 14px;

  &:focus {
    border-color: #f97316;
    box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.15);
  }

  @media (max-width: 520px) {
    height: 48px;
    font-size: 16px;
  }
`;

export const Textarea = styled.textarea`
  min-height: 120px;
  resize: vertical;
  border: 1px solid #cbd5e1;
  border-radius: 12px;
  padding: 12px 14px;
  color: #0f172a;
  background: #ffffff;
  outline: none;
  font-size: 14px;
  line-height: 1.5;

  &:focus {
    border-color: #f97316;
    box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.15);
  }

  @media (max-width: 520px) {
    font-size: 16px;
  }
`;

export const PriorityOptions = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;

  @media (max-width: 420px) {
    grid-template-columns: 1fr;
  }
`;

export const PriorityOption = styled.button<{
  $active?: boolean;
  $variant: "baixo" | "medio" | "alto";
}>`
  height: 42px;
  border-radius: 12px;
  border: 1px solid
    ${({ $active, $variant }) =>
      $active
        ? $variant === "alto"
          ? "#ef4444"
          : $variant === "medio"
          ? "#f59e0b"
          : "#22c55e"
        : "#e2e8f0"};
  background: ${({ $active, $variant }) =>
    !$active
      ? "#ffffff"
      : $variant === "alto"
      ? "#fef2f2"
      : $variant === "medio"
      ? "#fffbeb"
      : "#f0fdf4"};
  color: ${({ $variant }) =>
    $variant === "alto"
      ? "#991b1b"
      : $variant === "medio"
      ? "#92400e"
      : "#166534"};
  font-weight: 800;
  cursor: pointer;

  &:hover {
    background: #f8fafc;
  }
`;

export const FormActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding-top: 8px;

  @media (max-width: 520px) {
    flex-direction: column-reverse;

    button {
      width: 100%;
      min-height: 44px;
    }
  }
`;

export const CancelButton = styled.button`
  border: 1px solid #cbd5e1;
  background: #ffffff;
  color: #334155;
  border-radius: 12px;
  padding: 10px 16px;
  font-weight: 700;
  cursor: pointer;

  &:hover {
    background: #f1f5f9;
  }
`;

export const SubmitButton = styled.button`
  border: none;
  background: #f97316;
  color: #ffffff;
  border-radius: 12px;
  padding: 10px 18px;
  font-weight: 800;
  cursor: pointer;

  &:hover {
    background: #ea580c;
  }

  &:disabled {
    opacity: 0.65;
    cursor: not-allowed;
  }
`;

export const ChecklistActions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;

  @media (max-width: 720px) {
    grid-column: 1 / -1;
    justify-content: flex-end;
    flex-wrap: wrap;
    padding-top: 2px;
  }

  @media (max-width: 420px) {
    align-items: stretch;

    > span {
      width: 100%;
    }
  }
`;

export const ActionButton = styled.button`
  width: 34px;
  height: 34px;
  border: 1px solid #bfdbfe;
  border-radius: 10px;
  background: #eff6ff;
  color: #2563eb;
  display: grid;
  place-items: center;
  cursor: pointer;
  transition: 0.2s;

  &:hover {
    background: #dbeafe;
    border-color: #93c5fd;
  }

  @media (max-width: 420px) {
    flex: 1;
    min-width: 44px;
    height: 42px;
  }
`;

export const DeleteButton = styled(ActionButton)`
  border-color: #fecaca;
  background: #fef2f2;
  color: #dc2626;

  &:hover {
    background: #fee2e2;
    border-color: #fca5a5;
  }
`;
