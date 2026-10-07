import { describe, expect, it } from "vitest";
import {
  canRescheduleBooking,
  hasPendingBookingSignal,
  rescheduleBlockedMessage,
} from "./booking-actions";

describe("regras de reagendamento no cliente", () => {
  it.each([
    { status: "aguardando_pagamento", sinal_status: "pendente", pode_reagendar: true },
    { status: "aguardando_confirmacao", sinal_status: "pendente", pode_reagendar: true },
  ])("bloqueia qualquer reserva com sinal pendente", (booking) => {
    expect(hasPendingBookingSignal(booking)).toBe(true);
    expect(canRescheduleBooking(booking)).toBe(false);
    expect(rescheduleBlockedMessage(booking)).toMatch(/sinal/i);
  });

  it("bloqueia quando a política encerrou o prazo", () => {
    const booking = { status: "confirmado", sinal_status: "pago", pode_reagendar: false };
    expect(canRescheduleBooking(booking)).toBe(false);
    expect(rescheduleBlockedMessage(booking)).toMatch(/prazo/i);
  });

  it("permite somente quando pagamento e política permitem", () => {
    const booking = { status: "confirmado", sinal_status: "pago", pode_reagendar: true };
    expect(canRescheduleBooking(booking)).toBe(true);
    expect(rescheduleBlockedMessage(booking)).toBeNull();
  });
});
