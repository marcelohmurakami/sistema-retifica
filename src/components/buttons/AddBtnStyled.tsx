import styled from "styled-components";

export const BtnFlex = styled.div`
  display: flex;
  justify-content: flex-end;
`

export const CreateButton = styled.button`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.55rem;
  min-height: 44px;
  padding: 0.7rem 1rem;
  margin: 1.1rem 0;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, ${({ theme }) => theme.colors.accent}, ${({ theme }) => theme.colors.accentDark});
  color: #fff;
  font-size: 0.82rem;
  font-weight: 700;
  box-shadow: 0 9px 22px rgba(217, 76, 19, 0.2);
  transition: transform 0.16s ease, box-shadow 0.16s ease, filter 0.16s ease;

  svg {
    font-size: 15px;
  }

  p {
    font-size: 0.82rem;
    font-weight: 700;
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 13px 28px rgba(217, 76, 19, 0.27);
    filter: saturate(1.08);
  }

  &:active {
    transform: translateY(0);
    box-shadow: 0 6px 14px rgba(217, 76, 19, 0.18);
  }
`;
