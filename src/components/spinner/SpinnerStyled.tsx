// styles.ts
import styled, { keyframes } from "styled-components";

const rotate = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

const sizes = {
  sm: "18px",
  md: "28px",
  lg: "42px",
};

export const SpinnerStyled = styled.div<{ $size: "sm" | "md" | "lg" }>`
  width: ${({ $size }) => sizes[$size]};
  height: ${({ $size }) => sizes[$size]};
  border: 3px solid rgba(255, 255, 255, 0.25);
  border-top: 3px solid ${({ theme}) => theme.colors.primaryDark};
  border-radius: 50%;
  animation: ${rotate} 0.8s linear infinite;
`;