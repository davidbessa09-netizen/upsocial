import type { BillingInterval } from "@/types/database";

/** Soma um intervalo de cobrança a uma data, preservando o dia do mês quando possível. */
export function addBillingInterval(from: Date, interval: BillingInterval): Date {
  const result = new Date(from);
  switch (interval) {
    case "MONTHLY":
      result.setMonth(result.getMonth() + 1);
      break;
    case "QUARTERLY":
      result.setMonth(result.getMonth() + 3);
      break;
    case "YEARLY":
      result.setFullYear(result.getFullYear() + 1);
      break;
  }
  return result;
}

/**
 * Calcula started_at / trial_ends_at / current_period_end para uma nova
 * assinatura, dado o intervalo de cobrança e dias de teste do pacote.
 * Sem cobrança recorrente automática: current_period_end marca quando o
 * acesso expira e o cliente precisa comprar de novo (renovação manual).
 */
export function computeSubscriptionPeriod(
  interval: BillingInterval | null,
  trialDays: number | null,
): { startedAt: Date; trialEndsAt: Date | null; currentPeriodEnd: Date | null } {
  const startedAt = new Date();
  const trialEndsAt = trialDays && trialDays > 0 ? new Date(startedAt.getTime() + trialDays * 86_400_000) : null;
  const periodStart = trialEndsAt ?? startedAt;
  const currentPeriodEnd = interval ? addBillingInterval(periodStart, interval) : null;
  return { startedAt, trialEndsAt, currentPeriodEnd };
}
