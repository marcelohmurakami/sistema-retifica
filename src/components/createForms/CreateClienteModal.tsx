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

  background: rgba(2, 6, 23, 0.55);
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
  background: rgba(255, 255, 255, 0.92);

  border: 1px solid rgba(15, 23, 42, 0.08);

  box-shadow:
    0 22px 60px rgba(2, 6, 23, 0.22),
    0 1px 0 rgba(255, 255, 255, 0.55) inset;

  backdrop-filter: blur(10px);

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

  border: 1px solid rgba(15, 23, 42, 0.12);
  background: white;

  cursor: pointer;
  font-size: 16px;
  font-weight: 800;

  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.12);

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