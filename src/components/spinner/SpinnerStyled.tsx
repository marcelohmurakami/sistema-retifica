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
  border: 3px solid ${({ theme}) => theme.colors.border};
  border-top-color: ${({ theme}) => theme.colors.accent};
  border-radius: 50%;
  animation: ${rotate} 0.72s linear infinite;
  filter: drop-shadow(0 4px 8px rgba(217, 76, 19, 0.16));
`;
