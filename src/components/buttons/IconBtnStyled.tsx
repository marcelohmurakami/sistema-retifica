import styled from "styled-components";

export const IconBtnStyled = styled.div`
  display: flex;
  gap: 0.4rem;
  justify-content: flex-end;
  align-items: center;
`;

export const IconButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;

  width: 36px;
  height: 36px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 10px;
  background: ${({ theme }) => theme.colors.surfaceElevated};
  color: ${({ theme }) => theme.colors.textSecondary};
  transition: transform 0.16s ease, box-shadow 0.16s ease, border-color 0.16s ease, background 0.16s ease;

  svg {
    font-size: 15px;
  }

  &:hover {
    transform: translateY(-1px);
    box-shadow: ${({ theme }) => theme.shadow.sm};
    border-color: color-mix(in srgb, ${({ theme }) => theme.colors.accent} 30%, ${({ theme }) => theme.colors.border});
  }

  &:active {
    transform: translateY(0);
    box-shadow: none;
  }
`;

export const EditButton = styled(IconButton)`
  color: ${({ theme }) => theme.colors.info};

  &:hover {
    background: color-mix(in srgb, ${({ theme }) => theme.colors.info} 8%, transparent);
  }
`;

export const DeleteButton = styled(IconButton)`
  color: ${({ theme }) => theme.colors.error};

  &:hover {
    background: color-mix(in srgb, ${({ theme }) => theme.colors.error} 8%, transparent);
  }
`;
