export type PublicPixPayment = {
  bookingId: number;
  amount: number;
  orderId: string;
  status: string;
  statusDetail: string;
  expiresAt: string;
  ticketUrl: string | null;
  pixCopyPaste: string | null;
  qrCodeBase64: string | null;
  paid: boolean;
  expired: boolean;
};
