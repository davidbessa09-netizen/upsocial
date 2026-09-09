import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPaymentGateway, isPaymentGatewayConfigured } from "@/lib/payments";
import { getSupplierService } from "@/lib/suppliers";

/**
 * Valida o header `x-signature` enviado pelo Mercado Pago, conforme
 * https://www.mercadopago.com.br/developers/pt/docs/checkout-api/webhooks#editor_2
 * Manifest esperado: `id:{data.id};request-id:{x-request-id};ts:{ts};`
 * (data.id em minúsculas), assinado com HMAC-SHA256 usando o secret do
 * painel do Mercado Pago. Se o secret não estiver configurado, pula a
 * verificação (mantém compatibilidade com ambientes de teste antigos).
 */
function isValidSignature(request: Request, dataId: string): boolean {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  if (!secret) return true;

  const signatureHeader = request.headers.get("x-signature");
  const requestId = request.headers.get("x-request-id");
  if (!signatureHeader || !requestId) return false;

  const parts = Object.fromEntries(
    signatureHeader.split(",").map((pair) => {
      const [key, value] = pair.split("=").map((p) => p.trim());
      return [key, value];
    }),
  );
  const ts = parts.ts;
  const hash = parts.v1;
  if (!ts || !hash) return false;

  const manifest = `id:${dataId.toLowerCase()};request-id:${requestId};ts:${ts};`;
  const expectedHash = createHmac("sha256", secret).update(manifest).digest("hex");

  const expectedBuf = Buffer.from(expectedHash, "hex");
  const receivedBuf = Buffer.from(hash, "hex");
  if (expectedBuf.length !== receivedBuf.length) return false;
  return timingSafeEqual(expectedBuf, receivedBuf);
}

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

  if (!isValidSignature(request, paymentId)) {
    return NextResponse.json({ error: "Assinatura inválida." }, { status: 401 });
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

  await admin.from("orders").update({ payment_status: "APPROVED", order_status: "PAID" }).eq("id", order.id);

  const { data: orderItems } = await admin
    .from("order_items")
    .select("*")
    .eq("order_id", order.id)
    .eq("item_status", "PENDING");

  // --- Processamento automático por item, conforme o product_type de cada um ---
  for (const item of orderItems ?? []) {
    if (item.product_type === "AUTOMATED_SERVICE" && item.supplier_service_id) {
      try {
        const supplierService = getSupplierService();
        const result = await supplierService.createOrder({
          serviceId: item.supplier_service_id,
          target: item.customer_input ?? "",
          quantity: item.quantity,
        });

        await admin
          .from("order_items")
          .update({ item_status: "PROCESSING", supplier_order_id: result.supplierOrderId })
          .eq("id", item.id);
      } catch (err) {
        await admin
          .from("orders")
          .update({
            admin_notes: `Falha ao enviar item ${item.id} ao fornecedor: ${err instanceof Error ? err.message : String(err)}`,
          })
          .eq("id", order.id);
      }
      continue;
    }

    if (item.product_type === "DIGITAL_PRODUCT") {
      const { data: files } = await admin.from("digital_files").select("id").eq("product_id", item.product_id);
      const { data: product } = await admin
        .from("products")
        .select("download_limit, access_duration_days")
        .eq("id", item.product_id)
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
      await admin.from("order_items").update({ item_status: "COMPLETED" }).eq("id", item.id);
      continue;
    }

    // MANUAL_SERVICE, SUBSCRIPTION, SAAS: aguardam fluxo próprio (briefing,
    // provisionamento de assinatura) ainda não automatizado — permanecem PENDING.
  }

  // --- Deriva o status agregado do pedido a partir dos itens ---
  const { data: refreshedItems } = await admin.from("order_items").select("item_status").eq("order_id", order.id);
  const statuses = (refreshedItems ?? []).map((i) => i.item_status);
  const aggregateStatus = statuses.every((s) => s === "COMPLETED")
    ? "COMPLETED"
    : statuses.some((s) => s === "PROCESSING" || s === "COMPLETED")
      ? "PROCESSING"
      : "PAID";

  await admin.from("orders").update({ order_status: aggregateStatus }).eq("id", order.id);

  return NextResponse.json({ ok: true });
}

/** Mercado Pago também pode chamar via GET com query params. */
export async function GET(request: Request) {
  return POST(request);
}
