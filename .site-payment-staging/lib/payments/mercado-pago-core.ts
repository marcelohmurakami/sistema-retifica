export type MercadoPagoPaymentMethod = {
  id?: string;
  type?: string;
  ticket_url?: string;
  qr_code?: string;
  qr_code_base64?: string;
};

export type MercadoPagoTransaction = {
  id?: string;
  status?: string;
  status_detail?: string;
  amount?: string;
  paid_amount?: string;
  date_approved?: string;
  payment_method?: MercadoPagoPaymentMethod;
};

export type MercadoPagoOrder = {
  id: string;
  status: string;
  status_detail: string;
  external_reference?: string;
  transactions?: { payments?: MercadoPagoTransaction[] };
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function optionalString(value: unknown) {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

export function parseMercadoPagoOrder(value: unknown): MercadoPagoOrder {
  if (!isRecord(value)) throw new Error("Resposta inválida do Mercado Pago.");

  const id = optionalString(value.id);
  const status = optionalString(value.status);
  const statusDetail = optionalString(value.status_detail);
  if (!id || !status || !statusDetail) {
    throw new Error("Resposta incompleta do Mercado Pago.");
  }

  const transactions = isRecord(value.transactions) ? value.transactions : null;
  const rawPayments = transactions?.payments;
  const payments = Array.isArray(rawPayments)
    ? rawPayments.filter(isRecord).map((payment) => {
        const rawMethod = isRecord(payment.payment_method)
          ? payment.payment_method
          : null;
        return {
          id: optionalString(payment.id),
          status: optionalString(payment.status),
          status_detail: optionalString(payment.status_detail),
          amount: optionalString(payment.amount),
          paid_amount: optionalString(payment.paid_amount),
          date_approved: optionalString(payment.date_approved),
          payment_method: rawMethod
            ? {
                id: optionalString(rawMethod.id),
                type: optionalString(rawMethod.type),
                ticket_url: optionalString(rawMethod.ticket_url),
                qr_code: optionalString(rawMethod.qr_code),
                qr_code_base64: optionalString(rawMethod.qr_code_base64),
              }
            : undefined,
        };
      })
    : undefined;

  return {
    id,
    status,
    status_detail: statusDetail,
    external_reference: optionalString(value.external_reference),
    transactions: payments ? { payments } : undefined,
  };
}

export function paymentFrom(order: MercadoPagoOrder) {
  return order.transactions?.payments?.[0];
}

export function isPaidOrder(order: MercadoPagoOrder) {
  const transaction = paymentFrom(order);
  return (
    order.status === "processed" &&
    order.status_detail === "accredited" &&
    transaction?.status === "processed" &&
    transaction.status_detail === "accredited"
  );
}

export function orderPaidAmount(order: MercadoPagoOrder) {
  const transaction = paymentFrom(order);
  return Number(transaction?.paid_amount ?? transaction?.amount ?? 0);
}

export function orderApprovedAt(order: MercadoPagoOrder) {
  const value = paymentFrom(order)?.date_approved;
  return value && Number.isFinite(Date.parse(value)) ? value : null;
}

export function isRetryableMercadoPagoStatus(status: number) {
  return status === 408 || status === 409 || status === 425 || status === 429 || status >= 500;
}

export function assertOrderMatchesPayment(
  order: MercadoPagoOrder,
  expected: { bookingId: number; amount: number },
) {
  if (order.external_reference !== String(expected.bookingId)) {
    throw new Error("A referência da cobrança não corresponde ao agendamento.");
  }

  const amount = Number(paymentFrom(order)?.amount);
  if (
    !Number.isFinite(expected.amount) ||
    expected.amount <= 0 ||
    !Number.isFinite(amount) ||
    Math.abs(amount - expected.amount) > 0.005
  ) {
    throw new Error("O valor da cobrança retornado pelo Mercado Pago diverge do sinal.");
  }
}
