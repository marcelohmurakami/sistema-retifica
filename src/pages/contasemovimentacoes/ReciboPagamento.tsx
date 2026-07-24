import {
  PrintGlobalStyle,
  ReceiptBackdrop,
  ReceiptPage,
  ReceiptHeader,
  BrandArea,
  ReceiptTitleArea,
  ReceiptNumber,
  ReceiptTitle,
  ReceiptSection,
  SectionTitle,
  InfoGrid,
  InfoBox,
  Label,
  Value,
  AmountBox,
  AmountLabel,
  AmountValue,
  DescriptionBox,
  SignatureArea,
  SignatureBox,
  ReceiptFooter,
  CloseButton,
} from "./ReciboPagamentoStyled";

import { formatDate } from "../../utils/formatDate";
import type { PagamentoRecebido } from "../../models/financeiro";

type ReciboPagamentoProps = {
  pagamento: PagamentoRecebido;
  onClose: () => void;
};

function formatMetodoPagamento(metodo?: string) {
  const metodos: Record<string, string> = {
    pix: "Pix",
    dinheiro: "Dinheiro",
    cartao_credito: "Cartão de crédito",
    cartao_debito: "Cartão de débito",
  };

  return metodos[metodo || ""] || metodo || "-";
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function ReciboPagamento({ pagamento, onClose }: ReciboPagamentoProps) {
  return (
    <>
      <PrintGlobalStyle />

      <ReceiptBackdrop>
        <CloseButton type="button" onClick={onClose}>
          Fechar
        </CloseButton>

        <ReceiptPage className="recibo-print-area">
          <ReceiptHeader>
            <BrandArea>
              <strong>Retífica Estação</strong>
              <span>Comprovante de pagamento</span>
            </BrandArea>

            <ReceiptTitleArea>
              <ReceiptTitle>Recibo</ReceiptTitle>
              <ReceiptNumber>Nº {pagamento?.id}</ReceiptNumber>
            </ReceiptTitleArea>
          </ReceiptHeader>

          <AmountBox>
            <AmountLabel>Valor recebido</AmountLabel>
            <AmountValue>{formatCurrency(pagamento?.valor || 0)}</AmountValue>
          </AmountBox>

          <ReceiptSection>
            <SectionTitle>Dados do pagamento</SectionTitle>

            <InfoGrid>
              <InfoBox>
                <Label>Data do recebimento</Label>
                <Value>{formatDate(pagamento?.dataRecebimento)}</Value>
              </InfoBox>

              <InfoBox>
                <Label>Método</Label>
                <Value>{formatMetodoPagamento(pagamento?.metodoPag)}</Value>
              </InfoBox>
            </InfoGrid>
          </ReceiptSection>

          <ReceiptSection>
            <SectionTitle>Descrição</SectionTitle>
            <DescriptionBox>
              {pagamento?.descricao || "Pagamento recebido referente aos serviços prestados."}
            </DescriptionBox>
          </ReceiptSection>

          <SignatureArea>
            <SignatureBox>
              <span>Assinatura do cliente</span>
            </SignatureBox>

            <SignatureBox>
              <span>Responsável pelo recebimento</span>
            </SignatureBox>
          </SignatureArea>

          <ReceiptFooter>
            Este recibo confirma o recebimento do valor descrito acima.
          </ReceiptFooter>
        </ReceiptPage>
      </ReceiptBackdrop>
    </>
  );
}
