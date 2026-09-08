import type {
  PaymentGateway,
  CreatePixPaymentInput,
  CreatePixPaymentResult,
  PaymentStatusResult,
  GatewayPaymentStatus,
} from "./types";

const API_URL = "https://api.mercadopago.com";

/**
 * Adapter para o Mercado Pago (PIX). Usa a API de pagamentos diretamente
 * via fetch (sem SDK) para manter a dependência mínima. Requer
 * MERCADOPAGO_ACCESS_TOKEN em .env.local — nunca exposto ao client.
 */
export class MercadoPagoGateway implements PaymentGateway {
  constructor(private readonly accessToken: string) {}

  async createPixPayment(input: CreatePixPaymentInput): Promise<CreatePixPaymentResult> {
    const response = await fetch(`${API_URL}/v1/payments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.accessToken}`,
        "X-Idempotency-Key": input.orderNumber,
      },
      body: JSON.stringify({
        transaction_amount: Math.round(input.amountCents) / 100,
        description: input.description,
        payment_method_id: "pix",
        payer: { email: input.payerEmail },
        external_reference: input.orderNumber,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        `Mercado Pago recusou o pagamento: ${data.message ?? response.statusText}`,
      );
    }

    const pointOfInteraction = data.point_of_interaction?.transaction_data;
    if (!pointOfInteraction?.qr_code) {
      throw new Error("Mercado Pago não retornou o QR Code do PIX.");
    }

    return {
      gatewayPaymentId: String(data.id),
      qrCode: pointOfInteraction.qr_code,
      qrCodeBase64: pointOfInteraction.qr_code_base64,
      expiresAt: data.date_of_expiration,
      rawResponse: data,
    };
  }

  async getPaymentStatus(gatewayPaymentId: string): Promise<PaymentStatusResult> {
    const response = await fetch(`${API_URL}/v1/payments/${gatewayPaymentId}`, {
      headers: { Authorization: `Bearer ${this.accessToken}` },
      cache: "no-store",
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(`Erro ao consultar pagamento no Mercado Pago: ${data.message ?? response.statusText}`);
    }

    return { status: this.mapStatus(data.status), rawResponse: data };
  }

  private mapStatus(raw: string): GatewayPaymentStatus {
    switch (raw) {
      case "approved":
        return "APPROVED";
      case "rejected":
        return "REJECTED";
      case "refunded":
        return "REFUNDED";
      case "cancelled":
        return "CANCELED";
      case "in_process":
      case "pending":
        return "PENDING";
      default:
        return "EXPIRED";
    }
  }
}
