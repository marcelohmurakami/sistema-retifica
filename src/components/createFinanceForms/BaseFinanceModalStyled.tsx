import styled from "styled-components";

export const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(7, 10, 14, 0.62);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing[4]};
  z-index: 1000;
  backdrop-filter: blur(7px);
  animation: modal-overlay-in 0.18s ease-out;

  @keyframes modal-overlay-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

export const ModalContainer = styled.div`
  width: 100%;
  max-width: 560px;
  max-height: min(90dvh, 780px);
  overflow-y: auto;
  background: ${({ theme }) => theme.colors.surfaceElevated};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.lg};
  box-shadow: ${({ theme }) => theme.shadow.lg};
  animation: modal-card-in 0.22s cubic-bezier(0.22, 1, 0.36, 1);

  @keyframes modal-card-in {
    from { opacity: 0; transform: translateY(10px) scale(0.985); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }
`;

export const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.15rem 1.35rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

export const Title = styled.h2`
  margin: 0;
  color: ${({ theme }) => theme.colors.primaryDark};
  font-family: ${({ theme }) => theme.typography.displayFamily};
  font-size: 1.15rem;
  font-weight: ${({ theme }) => theme.typography.weights.bold};
`;

export const CloseButton = styled.button`
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 10px;
  background: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 1.15rem;
  line-height: 1;
  cursor: pointer;

  &:hover {
    color: ${({ theme }) => theme.colors.error};
    background: color-mix(in srgb, ${({ theme }) => theme.colors.error} 8%, transparent);
  }
`;

export const Body = styled.div`
  padding: 1.35rem;
`;

export const Footer = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.spacing[3]};
  padding: 1rem 1.35rem 1.25rem;
  border-top: 1px solid ${({ theme }) => theme.colors.border};

  @media (max-width: 520px) {
    > * {
      flex: 1;
    }
  }
`;
