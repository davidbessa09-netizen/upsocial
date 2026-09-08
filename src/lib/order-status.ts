import type { OrderStatus } from "@/types/database";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING_PAYMENT: "Pagamento pendente",
  PAID: "Pagamento aprovado",
  PROCESSING: "Em processamento",
  PARTIAL: "Parcialmente concluído",
  COMPLETED: "Concluído",
  CANCELED: "Cancelado",
  REFUNDED: "Reembolsado",
  FAILED: "Falhou",
};

/** Passos da timeline visual exibida ao cliente em /pedido/[order_number]. */
export const ORDER_TIMELINE_STEPS = [
  { key: "PAID", label: "Pagamento confirmado" },
  { key: "PROCESSING", label: "Pedido em processamento" },
  { key: "COMPLETED", label: "Pedido concluído" },
] as const;

const STEP_ORDER: OrderStatus[] = ["PENDING_PAYMENT", "PAID", "PROCESSING", "PARTIAL", "COMPLETED"];

/** Retorna o índice do passo atual na timeline, para status "felizes" (fora do fluxo de erro/cancelamento). */
export function getTimelineStepIndex(status: OrderStatus): number {
  if (status === "CANCELED" || status === "REFUNDED" || status === "FAILED") return -1;
  if (status === "PARTIAL") return 2; // trata como concluído parcialmente na timeline visual
  return Math.max(0, STEP_ORDER.indexOf(status) - 1);
}

export function isErrorStatus(status: OrderStatus): boolean {
  return status === "CANCELED" || status === "REFUNDED" || status === "FAILED";
}
