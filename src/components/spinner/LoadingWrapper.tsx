import styled from "styled-components";

export const LoadingWrapper = styled.div`
  min-height: 300px;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 12px;
`;

export const LoadingText = styled.p`
  font-size: 1rem;
  color: ${({ theme}) => theme.colors.primaryDark};
`;