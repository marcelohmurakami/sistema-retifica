import type { PublicPixPayment } from "@/lib/payments/types";

const expiredStatuses = new Set(["expired", "canceled", "cancelled"]);
const terminalStatuses = new Set([...expiredStatuses, "failed", "refunded"]);

export function isPixProviderTerminal(payment: PublicPixPayment) {
  return (
    terminalStatuses.has(payment.status.toLowerCase()) ||
    terminalStatuses.has(payment.statusDetail.toLowerCase())
  );
}

export function isPixExpired(payment: PublicPixPayment, now: number) {
  const expiration = Date.parse(payment.expiresAt);
  return (
    payment.expired ||
    expiredStatuses.has(payment.status.toLowerCase()) ||
    expiredStatuses.has(payment.statusDetail.toLowerCase()) ||
    (Number.isFinite(expiration) && expiration <= now)
  );
}

export function pixTerminalErrorMessage(payment: PublicPixPayment) {
  const status = payment.status.toLowerCase();
  const detail = payment.statusDetail.toLowerCase();
  if (status === "failed" || detail === "failed" || detail.includes("rejected")) {
    return "O Mercado Pago não conseguiu concluir este Pix. Não tente pagar o código exibido; atualize a situação ou fale com a recepção.";
  }
  if (status === "refunded" || detail === "refunded") {
    return "Este pagamento foi estornado. A atualização pode levar alguns instantes para aparecer no aplicativo do seu banco.";
  }
  return null;
}

export function pixStatusErrorMessage(error: unknown) {
  const detail = error instanceof Error ? error.message.trim() : "";
  return detail
    ? `Não conseguimos atualizar o Pix: ${detail}`
    : "Não conseguimos atualizar o Pix. Verifique sua conexão e tente novamente.";
}
