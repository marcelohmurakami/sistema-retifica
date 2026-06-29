import styled from "styled-components";

export const IconBtnStyled = styled.div`
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
  align-items: center;
`;

export const IconButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;

  width: 36px;
  height: 36px;

  border: 1px solid rgba(0,0,0,0.12);
  border-radius: 10px;
  background: #fff;

  cursor: pointer;

  transition: transform 0.12s ease, box-shadow 0.12s ease, border-color 0.12s ease;

  svg {
    font-size: 18px;
  }

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 8px 18px rgba(0,0,0,0.10);
    border-color: rgba(0,0,0,0.18);
  }

  &:active {
    transform: translateY(0);
    box-shadow: 0 4px 10px rgba(0,0,0,0.10);
  }

  &:focus-visible {
    outline: 3px solid rgba(59,130,246,0.5);
    outline-offset: 2px;
  }
`;

export const EditButton = styled(IconButton)`
  color: #1f6feb;

  &:hover {
    background: rgba(31,111,235,0.06);
  }
`;

export const DeleteButton = styled(IconButton)`
  color: #d1242f;

  &:hover {
    background: rgba(209,36,47,0.06);
  }
`;