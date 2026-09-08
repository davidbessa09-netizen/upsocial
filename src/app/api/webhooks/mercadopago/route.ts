import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPaymentGateway, isPaymentGatewayConfigured } from "@/lib/payments";
import { getSupplierService } from "@/lib/suppliers";

/**
 * Webhook de notificação de pagamento do Mercado Pago. Configurar a URL
 * pública (ex: https://seu-dominio.com/api/webhooks/mercadopago) no
 * painel do Mercado Pago. Aceita tanto o formato de query string quanto
 * o body JSON que o Mercado Pago usa dependendo do tipo de notificação.
 */
export async function POST(request: Request) {
  if (!isPaymentGatewayConfigured()) {
    return NextResponse.json({ error: "Gateway não configurado." }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  let paymentId = searchParams.get("data.id") ?? searchParams.get("id");

  if (!paymentId) {
    const body = await request.json().catch(() => null);
    paymentId = body?.data?.id ? String(body.data.id) : null;
  }

  if (!paymentId) {
    return NextResponse.json({ error: "Notificação sem id de pagamento." }, { status: 400 });
  }

  const admin = createAdminClient();
  const gateway = getPaymentGateway();

  const { data: payment } = await admin
    .from("payments")
    .select("*")
    .eq("gateway_payment_id", paymentId)
    .maybeSingle();

  if (!payment) {
    // Notificação de um pagamento que não é nosso ou ainda não foi salvo — ignora.
    return NextResponse.json({ ok: true });
  }

  const statusResult = await gateway.getPaymentStatus(paymentId);

  const paymentStatusMap = {
    APPROVED: "APPROVED",
    REJECTED: "REJECTED",
    REFUNDED: "REFUNDED",
    CANCELED: "CANCELED",
    EXPIRED: "EXPIRED",
    PENDING: "PENDING",
  } as const;

  await admin
    .from("payments")
    .update({ status: paymentStatusMap[statusResult.status], raw_payload: statusResult.rawResponse as never })
    .eq("id", payment.id);

  if (statusResult.status !== "APPROVED") {
    return NextResponse.json({ ok: true });
  }

  const { data: order } = await admin.from("orders").select("*").eq("id", payment.order_id).maybeSingle();
  if (!order || order.payment_status === "APPROVED") {
    return NextResponse.json({ ok: true }); // já processado — evita duplicar efeitos colaterais
  }

  await admin
    .from("orders")
    .update({ payment_status: "APPROVED", order_status: "PAID" })
    .eq("id", order.id);
  await admin
    .from("order_items")
    .update({ item_status: "PROCESSING" })
    .eq("order_id", order.id)
    .eq("item_role", "MAIN");

  // --- Processamento automático por tipo de produto ---
  if (order.product_type === "AUTOMATED_SERVICE" && order.supplier_service_id) {
    try {
      const supplierService = getSupplierService();
      const result = await supplierService.createOrder({
        serviceId: order.supplier_service_id,
        target: order.customer_input,
        quantity: order.quantity,
      });

      await admin
        .from("orders")
        .update({ order_status: "PROCESSING", supplier_order_id: result.supplierOrderId })
        .eq("id", order.id);
      await admin
        .from("order_items")
        .update({ supplier_order_id: result.supplierOrderId })
        .eq("order_id", order.id)
        .eq("item_role", "MAIN");
    } catch (err) {
      await admin
        .from("orders")
        .update({
          admin_notes: `Falha ao enviar ao fornecedor: ${err instanceof Error ? err.message : String(err)}`,
        })
        .eq("id", order.id);
    }
  }

  if (order.product_type === "DIGITAL_PRODUCT") {
    const { data: files } = await admin.from("digital_files").select("id").eq("product_id", order.product_id);
    const { data: product } = await admin
      .from("products")
      .select("download_limit, access_duration_days")
      .eq("id", order.product_id)
      .maybeSingle();

    if (files && files.length > 0) {
      const expiresAt = product?.access_duration_days
        ? new Date(Date.now() + product.access_duration_days * 86_400_000).toISOString()
        : null;

      await admin.from("customer_downloads").insert(
        files.map((f) => ({
          order_id: order.id,
          digital_file_id: f.id,
          user_id: order.user_id,
          download_limit: product?.download_limit ?? null,
          expires_at: expiresAt,
        })),
      );
    }
    await admin.from("orders").update({ order_status: "COMPLETED" }).eq("id", order.id);
    await admin
      .from("order_items")
      .update({ item_status: "COMPLETED" })
      .eq("order_id", order.id)
      .eq("item_role", "MAIN");
  }

  return NextResponse.json({ ok: true });
}

/** Mercado Pago também pode chamar via GET com query params. */
export async function GET(request: Request) {
  return POST(request);
}
