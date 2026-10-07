import "server-only";

import { refundMercadoPagoOrder } from "@/lib/payments/mercado-pago";
import { createAdminSupabase } from "@/lib/supabase/admin";

type ClaimedRefund = {
  request_id: number;
  company_id: number;
  booking_id: number;
  payment_id: number;
  order_id: string;
  amount: number;
  idempotency_key: string;
};

export async function processPendingBookingRefunds(bookingId?: number) {
  const admin = createAdminSupabase();
  const { data, error } = await admin.rpc("reivindicar_estornos_agendamento", {
    p_limite: bookingId ? 5 : 20,
    p_id_agendamento: bookingId ?? null,
  });
  if (error) throw error;

  const rows = (data ?? []) as ClaimedRefund[];
  let refunded = 0;
  let failed = 0;

  for (const row of rows) {
    try {
      const order = await refundMercadoPagoOrder(
        row.order_id,
        row.idempotency_key,
      );
      const { error: completeError } = await admin.rpc(
        "concluir_estorno_agendamento",
        {
          p_solicitacao_id: row.request_id,
          p_provedor_status: order.status,
          p_provedor_status_detalhe: order.status_detail,
        },
      );
      if (completeError) throw completeError;
      refunded += 1;
    } catch (refundError) {
      failed += 1;
      const message =
        refundError instanceof Error
          ? refundError.message
          : "Falha desconhecida ao solicitar o estorno.";
      const { error: failureError } = await admin.rpc(
        "falhar_estorno_agendamento",
        { p_solicitacao_id: row.request_id, p_erro: message },
      );
      if (failureError) {
        console.error("Falha ao registrar erro de estorno", failureError);
      }
    }
  }

  return { checked: rows.length, refunded, failed };
}
