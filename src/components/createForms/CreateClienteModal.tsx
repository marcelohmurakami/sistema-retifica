import { AnimatePresence } from "framer-motion";
import { useEffect } from "react";
import styled from "styled-components";
import { motion } from "framer-motion";

const Overlay = styled(motion.div)`
  position: fixed;
  inset: 0;
  z-index: 999;

  display: grid;
  place-items: center;

  padding: clamp(0.75rem, 3vw, 1.5rem);

  background: color-mix(in srgb, ${({ theme }) => theme.colors.background} 74%, transparent);
  backdrop-filter: blur(8px);

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
  background: ${({ theme }) => theme.colors.surface};

  border: 1px solid ${({ theme }) => theme.colors.border};

  box-shadow: ${({ theme }) => theme.shadow.md};

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
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.textPrimary};

  cursor: pointer;
  font-size: 16px;
  font-weight: 800;

  box-shadow: ${({ theme }) => theme.shadow.sm};

  @media (max-width: 420px) {
    width: 38px;
    height: 38px;
  }
`;

type Props = {
  open: boolean,
  onClose: () => void,
  children: React.ReactNode,
};

export function CreateClienteModal({ open, onClose, children }: Props) {

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };

  }, [open, onClose]);

  return (
    <AnimatePresence>

      {open && (

        <Overlay
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >

          <ModalCard
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.97 }}
            transition={{ duration: 0.25 }}
          >

            <CloseButton onClick={onClose}>
              ✕
            </CloseButton>

            {children}

          </ModalCard>

        </Overlay>

      )}

    </AnimatePresence>
  );
}
