import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Endpoint leve de polling para o checkout. Usa o client autenticado
 * (não admin) — RLS garante que só o dono do pedido recebe os dados.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ order_number: string }> },
) {
  const { order_number: orderNumber } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { data: order } = await supabase
    .from("orders")
    .select("payment_status, order_status")
    .eq("order_number", orderNumber)
    .maybeSingle();

  if (!order) return NextResponse.json({ error: "Pedido não encontrado." }, { status: 404 });

  return NextResponse.json({
    paymentStatus: order.payment_status,
    orderStatus: order.order_status,
  });
}
