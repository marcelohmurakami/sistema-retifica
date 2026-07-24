import { AnimatePresence } from "framer-motion";
import styled from "styled-components";
import { motion } from "framer-motion";
import { useModalAccessibility } from "./useModalAccessibility";

const Overlay = styled(motion.div)`
  position: fixed;
  inset: 0;
  z-index: 999;

  display: grid;
  place-items: center;

  padding: clamp(0.75rem, 3vw, 1.5rem);

  background: rgba(7, 10, 14, 0.62);
  backdrop-filter: blur(7px);

  overflow-y: auto;

  @media (max-width: 640px) {
    align-items: stretch;
  }
`;

const ModalCard = styled(motion.div)`
  width: min(820px, 100%);
  max-height: min(88dvh, 900px);
  overflow-y: auto;
  overscroll-behavior: contain;

  border-radius: 20px;
  background: ${({ theme }) => theme.colors.surfaceElevated};

  border: 1px solid ${({ theme }) => theme.colors.border};

  box-shadow: ${({ theme }) => theme.shadow.lg};

  position: relative;

  & > form {
    margin: 0;
    width: 100%;
    box-shadow: none;
    border: none;
    background: transparent;
  }

  @media (max-width: 640px) {
    width: 100%;
    max-height: calc(100dvh - 1.5rem);
    border-radius: 18px;
  }

  @media (max-width: 420px) {
    max-height: calc(100dvh - 1rem);
    border-radius: 16px;
  }
`;

const CloseButton = styled.button`
  position: sticky;
  top: 12px;
  left: 100%;
  z-index: 2;

  width: 40px;
  height: 40px;
  margin: 12px 12px -52px auto;

  display: grid;
  place-items: center;

  border-radius: 12px;

  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surfaceElevated};
  color: ${({ theme }) => theme.colors.textPrimary};

  cursor: pointer;
  font-size: 16px;
  font-weight: 800;

  box-shadow: ${({ theme }) => theme.shadow.sm};

  &:hover {
    color: ${({ theme }) => theme.colors.error};
    background: color-mix(in srgb, ${({ theme }) => theme.colors.error} 8%, transparent);
  }

  @media (max-width: 420px) {
    width: 38px;
    height: 38px;
  }
`;

export type AppModalProps = {
  open: boolean,
  onClose: () => void,
  children: React.ReactNode,
};

export function AppModal({ open, onClose, children }: AppModalProps) {
  const dialogRef = useModalAccessibility(open, onClose);

  return (
    <AnimatePresence>

      {open && (

        <Overlay
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) onClose();
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >

          <ModalCard
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label="Formulário"
            tabIndex={-1}
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.97 }}
            transition={{ duration: 0.25 }}
          >

            <CloseButton
              type="button"
              onClick={onClose}
              aria-label="Fechar formulário"
            >
              ✕
            </CloseButton>

            {children}

          </ModalCard>

        </Overlay>

      )}

    </AnimatePresence>
  );
}
