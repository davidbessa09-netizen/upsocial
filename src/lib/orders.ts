import { createClient } from "@/lib/supabase/server";
import type { OrderPublic } from "@/types/database";

/**
 * Busca um pedido pelo order_number para o usuário autenticado. RLS
 * garante que só o dono (ou staff) recebe dados — aqui, além disso,
 * selecionamos explicitamente só as colunas seguras para o cliente.
 */
export async function getOrderByNumberForCurrentUser(orderNumber: string): Promise<OrderPublic | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select(
      "id, order_number, user_id, product_type, platform_id, category_id, product_id, package_id, customer_input, quantity, sale_price_cents, coupon_id, discount_applied_cents, payment_status, order_status, manual_service_stage, start_count, remains, utm_source, utm_medium, utm_campaign, utm_content, utm_term, referrer, landing_page_slug, parent_order_id, order_role, subtotal_cents, created_at, updated_at",
    )
    .eq("order_number", orderNumber)
    .maybeSingle();

  if (error) throw error;
  return data;
}
