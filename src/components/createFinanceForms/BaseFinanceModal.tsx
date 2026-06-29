import React from "react";
import {
  Overlay,
  ModalContainer,
  Header,
  Title,
  CloseButton,
  Body,
  Footer,
} from "./BaseFinanceModalStyled";

type BaseFinanceModalProps = {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

export function BaseFinanceModal({
  isOpen,
  title,
  onClose,
  children,
  footer,
}: BaseFinanceModalProps) {
  if (!isOpen) return null;

  return (
    <Overlay>
      <ModalContainer>
        <Header>
          <Title>{title}</Title>
          <CloseButton type="button" onClick={onClose}>
            ×
          </CloseButton>
        </Header>

        <Body>{children}</Body>

        {footer && <Footer>{footer}</Footer>}
      </ModalContainer>
    </Overlay>
  );
}