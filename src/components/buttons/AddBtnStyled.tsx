import styled from "styled-components";

export const BtnFlex = styled.div`
    display: flex;
    justify-content: center;
`

export const CreateButton = styled.button`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;

  padding: 0.65rem 1.1rem;
  margin: 1.5rem 0;

  border: none;
  border-radius: 10px;

  background: #16a34a;
  color: white;

  font-size: 0.95rem;
  font-weight: 500;

  cursor: pointer;

  transition: all 0.15s ease;

  svg {
    font-size: 18px;
  }

  p {
    font-size: 1.4rem;
    font-weight: bolder;
  }

  &:hover {
    background: #15803d;
    transform: translateY(-1px);
    box-shadow: 0 6px 14px rgba(0,0,0,0.12);
  }

  &:active {
    transform: translateY(0);
    box-shadow: 0 3px 8px rgba(0,0,0,0.10);
  }

  &:focus-visible {
    outline: 3px solid rgba(34,197,94,0.4);
    outline-offset: 2px;
  }
`;