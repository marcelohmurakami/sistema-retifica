import { useId } from "react";
import type { ReactNode } from "react";
import {
  Overlay,
  ModalContainer,
  Header,
  Title,
  CloseButton,
  Body,
  Footer,
} from "./BaseFinanceModalStyled";
import { useModalAccessibility } from "../modal/useModalAccessibility";

type BaseFinanceModalProps = {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
};

export function BaseFinanceModal({
  isOpen,
  title,
  onClose,
  children,
  footer,
}: BaseFinanceModalProps) {
  const titleId = useId();
  const dialogRef = useModalAccessibility(isOpen, onClose);

  if (!isOpen) return null;

  return (
    <Overlay
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <ModalContainer
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <Header>
          <Title id={titleId}>{title}</Title>
          <CloseButton
            type="button"
            onClick={onClose}
            aria-label={`Fechar ${title.toLowerCase()}`}
          >
            ×
          </CloseButton>
        </Header>

        <Body>{children}</Body>

        {footer && <Footer>{footer}</Footer>}
      </ModalContainer>
    </Overlay>
  );
}
