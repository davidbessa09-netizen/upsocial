export interface CreatePixPaymentInput {
  orderNumber: string;
  amountCents: number;
  description: string;
  payerEmail: string;
}

export interface CreatePixPaymentResult {
  gatewayPaymentId: string;
  qrCode: string;
  qrCodeBase64: string;
  expiresAt: string;
  rawResponse: unknown;
}

export type GatewayPaymentStatus = "PENDING" | "APPROVED" | "REJECTED" | "REFUNDED" | "CANCELED" | "EXPIRED";

export interface PaymentStatusResult {
  status: GatewayPaymentStatus;
  rawResponse: unknown;
}

/**
 * Contrato comum de gateway de pagamento. Permite trocar/adicionar
 * gateways (Stripe, Asaas, ...) sem alterar o restante do checkout.
 */
export interface PaymentGateway {
  createPixPayment(input: CreatePixPaymentInput): Promise<CreatePixPaymentResult>;
  getPaymentStatus(gatewayPaymentId: string): Promise<PaymentStatusResult>;
}
