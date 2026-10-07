export type BookingActionState = {
  status: string;
  sinal_status: string;
  pode_reagendar: boolean;
};

export function hasPendingBookingSignal(booking: BookingActionState) {
  return booking.status === "aguardando_pagamento" || booking.sinal_status === "pendente";
}

export function canRescheduleBooking(booking: BookingActionState) {
  return booking.pode_reagendar && !hasPendingBookingSignal(booking);
}

export function rescheduleBlockedMessage(booking: BookingActionState) {
  if (hasPendingBookingSignal(booking)) {
    return "O reagendamento fica disponível após a confirmação do sinal. Se o Pix venceu, aguarde a atualização da reserva.";
  }
  if (!booking.pode_reagendar) {
    return "Prazo de reagendamento online encerrado. Fale com a recepção.";
  }
  return null;
}
