import styled from "styled-components";

export const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 999;
  display: grid;
  place-items: center;
  padding: clamp(12px, 4vw, 24px);
  background: color-mix(in srgb, ${({ theme }) => theme.colors.background} 74%, transparent);
  backdrop-filter: blur(6px);
`;

export const ModalCard = styled.div`
  width: min(620px, 96vw);
  max-height: 90vh;
  overflow: auto;
  background: ${({ theme }) => theme.colors.surface};
  border-radius: 18px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  box-shadow: ${({ theme }) => theme.shadow.md};
`;

export const ModalHeader = styled.div`
  padding: 22px 24px 16px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  display: flex;
  justify-content: space-between;
  gap: 16px;

  h2 {
    margin: 0;
    color: ${({ theme }) => theme.colors.primaryDark};
    font-size: 22px;
  }

  p {
    margin: 6px 0 0;
    color: ${({ theme }) => theme.colors.textSecondary};
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
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 12px;
  background: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.textPrimary};
  cursor: pointer;
  font-size: 18px;

  &:hover {
    background: ${({ theme }) => theme.colors.border};
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
  color: ${({ theme }) => theme.colors.textPrimary};
`;

export const Input = styled.input`
  height: 44px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 12px;
  padding: 0 14px;
  color: ${({ theme }) => theme.colors.textPrimary};
  background: ${({ theme }) => theme.colors.surface};
  outline: none;
  font-size: 14px;

  &:focus {
    border-color: ${({ theme }) => theme.colors.accent};
    box-shadow: 0 0 0 3px color-mix(in srgb, ${({ theme }) => theme.colors.accent} 24%, transparent);
  }

  @media (max-width: 520px) {
    height: 48px;
    font-size: 16px;
  }
`;

export const Textarea = styled.textarea`
  min-height: 120px;
  resize: vertical;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 12px;
  padding: 12px 14px;
  color: ${({ theme }) => theme.colors.textPrimary};
  background: ${({ theme }) => theme.colors.surface};
  outline: none;
  font-size: 14px;
  line-height: 1.5;

  &:focus {
    border-color: ${({ theme }) => theme.colors.accent};
    box-shadow: 0 0 0 3px color-mix(in srgb, ${({ theme }) => theme.colors.accent} 24%, transparent);
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
    ${({ $active, $variant, theme }) =>
      $active
        ? $variant === "alto"
          ? theme.colors.error
          : $variant === "medio"
          ? theme.colors.warning
          : theme.colors.success
        : theme.colors.border};
  background: ${({ $active, $variant, theme }) =>
    !$active
      ? theme.colors.surface
      : $variant === "alto"
      ? `color-mix(in srgb, ${theme.colors.error} 16%, ${theme.colors.surface})`
      : $variant === "medio"
      ? `color-mix(in srgb, ${theme.colors.warning} 16%, ${theme.colors.surface})`
      : `color-mix(in srgb, ${theme.colors.success} 16%, ${theme.colors.surface})`};
  color: ${({ $variant, theme }) =>
    $variant === "alto"
      ? theme.colors.error
      : $variant === "medio"
      ? theme.colors.warning
      : theme.colors.success};
  font-weight: 800;
  cursor: pointer;

  &:hover {
    background: ${({ theme }) => theme.colors.background};
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
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.textPrimary};
  border-radius: 12px;
  padding: 10px 16px;
  font-weight: 700;
  cursor: pointer;

  &:hover {
    background: ${({ theme }) => theme.colors.background};
  }
`;

export const SubmitButton = styled.button`
  border: none;
  background: ${({ theme }) => theme.colors.accent};
  color: ${({ theme }) => theme.colors.surface};
  border-radius: 12px;
  padding: 10px 18px;
  font-weight: 800;
  cursor: pointer;

  &:hover {
    background: ${({ theme }) => theme.colors.accentDark};
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
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 10px;
  background: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.accent};
  display: grid;
  place-items: center;
  cursor: pointer;
  transition: 0.2s;

  &:hover {
    background: ${({ theme }) => theme.colors.border};
    border-color: ${({ theme }) => theme.colors.accent};
  }

  @media (max-width: 420px) {
    flex: 1;
    min-width: 44px;
    height: 42px;
  }
`;

export const DeleteButton = styled(ActionButton)`
  border-color: ${({ theme }) => theme.colors.error};
  background: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.error};

  &:hover {
    background: ${({ theme }) => theme.colors.border};
    border-color: ${({ theme }) => theme.colors.error};
  }
`;
