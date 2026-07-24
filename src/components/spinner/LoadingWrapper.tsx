import styled from "styled-components";

export const LoadingWrapper = styled.div<{ $fullScreen?: boolean }>`
  min-height: ${({ $fullScreen }) => ($fullScreen ? "100dvh" : "300px")};
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 12px;
`;

export const LoadingText = styled.p`
  font-size: 0.78rem;
  font-weight: 620;
  color: ${({ theme}) => theme.colors.textSecondary};
`;
