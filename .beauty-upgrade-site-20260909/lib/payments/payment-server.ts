import "server-only";

import type { NextRequest } from "next/server";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { getAuthenticatedCustomerAccount } from "@/lib/supabase/customer-session";
import type { PublicSite } from "@/lib/supabase/site";
import {
  getMercadoPagoOrder,
  type MercadoPagoOrder,
} from "@/lib/payments/mercado-pago";
import {
  assertOrderMatchesPayment,
  orderApprovedAt,
  orderPaidAmount,
} from "@/lib/payments/mercado-pago-core";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type PreparedPayment = {
  payment_id: number;
  booking_id: number;
  company_id: number;
  customer_email: string;
  amount: number;
  status: string;
  provider_status: string | null;
  provider_status_detail: string | null;
  external_id: string | null;
  idempotency_key: string;
  expires_at: string;
};

function bookingToken(request: NextRequest) {
  const token =
    request.cookies.get("site_booking_token")?.value ??
    request.cookies.get("murakami_booking_token")?.value ??
    "";
  return uuidPattern.test(token) ? token : null;
}

export async function resolvePaymentBooking(
  request: NextRequest,
  site: PublicSite,
  requestedBookingId?: number,
) {
  const admin = createAdminSupabase();

  if (requestedBookingId) {
    const account = await getAuthenticatedCustomerAccount(site.empresa.id);
    if (!account) throw new Error("Entre na sua conta para pagar esta reserva.");

    const { data, error } = await admin
      .from("agendamentos")
      .select("id")
      .eq("id", requestedBookingId)
      .eq("id_empresa", site.empresa.id)
      .eq("id_cliente", account.cliente.id)
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error("Agendamento não encontrado na sua conta.");
    return { admin, bookingId: Number(data.id) };
  }

  const token = bookingToken(request);
  if (!token) {
    throw new Error("Nenhum agendamento foi identificado neste dispositivo.");
  }

  const { data, error } = await admin
    .from("agendamentos")
    .select("id")
    .eq("id_empresa", site.empresa.id)
    .eq("site_access_token", token)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Agendamento não encontrado neste dispositivo.");

  return { admin, bookingId: Number(data.id) };
}

export async function applyMercadoPagoOrder(
  order: MercadoPagoOrder,
  client = createAdminSupabase(),
) {
  const payment = order.transactions?.payments?.[0];
  const { data, error } = await client.rpc("aplicar_order_mercado_pago_v2", {
    p_order_id: order.id,
    p_external_reference: order.external_reference ?? null,
    p_status: order.status,
    p_status_detail: order.status_detail,
    p_transaction_status: payment?.status ?? null,
    p_transaction_status_detail: payment?.status_detail ?? null,
    p_paid_amount: orderPaidAmount(order),
    p_paid_at: orderApprovedAt(order),
  });
  if (error) throw error;
  return data as PreparedPayment | null;
}

export async function refreshMercadoPagoOrder(
  prepared: PreparedPayment,
  client = createAdminSupabase(),
) {
  if (!prepared.external_id) return null;
  const order = await getMercadoPagoOrder(prepared.external_id);
  assertOrderMatchesPayment(order, {
    bookingId: prepared.booking_id,
    amount: Number(prepared.amount),
  });
  const updated = await applyMercadoPagoOrder(order, client);
  return { order, prepared: updated ?? prepared };
}
