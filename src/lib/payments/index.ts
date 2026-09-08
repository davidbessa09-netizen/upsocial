import { MercadoPagoGateway } from "./mercadopago";
import type { PaymentGateway } from "./types";

export type { PaymentGateway } from "./types";
export * from "./types";

export function isPaymentGatewayConfigured(): boolean {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN ?? "";
  return token.length > 0 && !token.includes("your_mercadopago");
}

/** Chamar apenas em código de servidor — nunca importar no client. */
export function getPaymentGateway(): PaymentGateway {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!token || token.includes("your_mercadopago")) {
    throw new Error(
      "MERCADOPAGO_ACCESS_TOKEN não configurado em .env.local. Configure para ativar pagamentos reais.",
    );
  }
  return new MercadoPagoGateway(token);
}
