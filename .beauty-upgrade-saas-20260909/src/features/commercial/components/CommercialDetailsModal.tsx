import type { ReactNode } from "react";
import { Modal } from "../../../components_shared";
import type { Command, Quote } from "../types/commercial.types";
import { COMMAND_STATUS_LABELS, COMMERCIAL_ITEM_LABELS, commandPaymentDisplay, formatCommercialCurrency, formatCommercialDate, formatCommercialDateTime, QUOTE_STATUS_LABELS, quoteEffectiveStatus } from "../utils/commercial.utils";

type Props = { document: Quote | Command; kind: "quote" | "command"; onClose: () => void; actions?: ReactNode };

export function CommercialDetailsModal({ document, kind, onClose, actions }: Props) {
  const isQuote = kind === "quote";
  const quote = isQuote ? document as Quote : null;
  const command = !isQuote ? document as Command : null;
  const quoteStatus = quote ? quoteEffectiveStatus(quote) : null;
  const status = quoteStatus ?? command!.status;
  const label = quoteStatus ? QUOTE_STATUS_LABELS[quoteStatus] : COMMAND_STATUS_LABELS[status as keyof typeof COMMAND_STATUS_LABELS];
  const payment = command ? commandPaymentDisplay(command) : null;
  return (
    <Modal open onClose={onClose} title={`${isQuote ? "Orçamento" : "Comanda"} #${document.id}`} description={`${document.cliente?.nome ?? "Cliente não encontrado"} · ${label}`} size="lg" footer={actions ? <div className="commercial-details-actions">{actions}</div> : <button className="btn btn--secondary" type="button" onClick={onClose}>Fechar</button>}>
      <div className="commercial-details">
        <section className="commercial-details__meta"><div><span>Status</span><strong><span className="status-badge" data-status={status}>{label}</span></strong></div><div><span>{isQuote ? "Criado em" : "Aberta em"}</span><strong>{formatCommercialDateTime(isQuote ? document.created_at : command!.aberta_em)}</strong></div>{quote && <div><span>Validade</span><strong>{formatCommercialDate(quote.validade)}</strong></div>}{command?.responsavel && <div><span>Responsável</span><strong>{command.responsavel.nome}</strong></div>}</section>
        {payment && <section className="commercial-details__payment"><header><span>Pagamento</span><span className="payment-badge" data-payment-status={payment.status}>{payment.label}</span></header><div><span>Valor recebido<strong>{formatCommercialCurrency(payment.paid)}</strong></span><span>Saldo a receber<strong>{formatCommercialCurrency(payment.balance)}</strong></span>{payment.dueDate && <span>Vencimento<strong>{formatCommercialDate(payment.dueDate)}</strong></span>}</div></section>}
        <section className="commercial-details__items"><header><h3>Itens</h3><span>{document.itens.length}</span></header>{document.itens.map((item) => <article key={item.id}><div><strong>{item.descricao_snapshot}</strong><small>{COMMERCIAL_ITEM_LABELS[item.tipo_item as keyof typeof COMMERCIAL_ITEM_LABELS]}{"id_funcionario" in item && item.funcionario ? ` · ${item.funcionario.nome}` : ""}</small></div><span>{item.quantidade} × {formatCommercialCurrency(item.valor_unitario_snapshot)}{Number(item.desconto) > 0 ? ` · desconto ${formatCommercialCurrency(item.desconto)}` : ""}</span><strong>{formatCommercialCurrency(item.valor_total)}</strong></article>)}</section>
        {document.observacoes && <section className="commercial-details__notes"><span>Observações</span><p>{document.observacoes}</p></section>}
        {command?.motivo_cancelamento && <section className="commercial-details__cancel"><span>Motivo do cancelamento</span><p>{command.motivo_cancelamento}</p></section>}
        <section className="commercial-details__totals"><div><span>Subtotal</span><strong>{formatCommercialCurrency(document.subtotal)}</strong></div><div><span>Descontos dos itens</span><strong>− {formatCommercialCurrency(document.desconto_itens)}</strong></div><div><span>Desconto geral</span><strong>− {formatCommercialCurrency(document.desconto)}</strong></div><div><span>Acréscimo</span><strong>+ {formatCommercialCurrency(document.acrescimo)}</strong></div><div><span>Total</span><strong>{formatCommercialCurrency(document.valor_total)}</strong></div></section>
      </div>
    </Modal>
  );
}
