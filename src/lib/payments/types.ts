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

export interface CreateCardPaymentInput {
  orderNumber: string;
  amountCents: number;
  description: string;
  payerEmail: string;
  /** Token gerado no navegador pelo SDK do Mercado Pago — nunca o número do cartão. */
  cardToken: string;
  paymentMethodId: string;
  issuerId?: string;
  installments: number;
}

export interface CreateCardPaymentResult {
  gatewayPaymentId: string;
  status: GatewayPaymentStatus;
  statusDetail: string;
  rawResponse: unknown;
}

/**
 * Contrato comum de gateway de pagamento. Permite trocar/adicionar
 * gateways (Stripe, Asaas, ...) sem alterar o restante do checkout.
 */
export interface PaymentGateway {
  createPixPayment(input: CreatePixPaymentInput): Promise<CreatePixPaymentResult>;
  createCardPayment(input: CreateCardPaymentInput): Promise<CreateCardPaymentResult>;
  getPaymentStatus(gatewayPaymentId: string): Promise<PaymentStatusResult>;
}
