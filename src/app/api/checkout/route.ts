import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPaymentGateway, isPaymentGatewayConfigured } from "@/lib/payments";

interface CheckoutBody {
  productSlug: string;
  packageId: string;
  customerInput: string;
  couponCode?: string;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Você precisa estar logado para finalizar a compra." }, { status: 401 });
  }

  if (!isPaymentGatewayConfigured()) {
    return NextResponse.json(
      { error: "Pagamento ainda não configurado. Configure MERCADOPAGO_ACCESS_TOKEN em .env.local." },
      { status: 503 },
    );
  }

  const body = (await request.json()) as CheckoutBody;
  if (!body.productSlug || !body.packageId || !body.customerInput?.trim()) {
    return NextResponse.json({ error: "Dados de checkout incompletos." }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: product, error: productError } = await admin
    .from("products")
    .select("*")
    .eq("slug", body.productSlug)
    .eq("active", true)
    .maybeSingle();

  if (productError || !product) {
    return NextResponse.json({ error: "Produto não encontrado." }, { status: 404 });
  }

  const { data: pkg, error: packageError } = await admin
    .from("packages")
    .select("*")
    .eq("id", body.packageId)
    .eq("product_id", product.id)
    .eq("active", true)
    .maybeSingle();

  if (packageError || !pkg) {
    return NextResponse.json({ error: "Pacote não encontrado." }, { status: 404 });
  }

  // --- Cupom (opcional) ---
  let discountCents = 0;
  let couponId: string | null = null;

  if (body.couponCode) {
    const { data: coupon } = await admin
      .from("coupons")
      .select("*")
      .eq("code", body.couponCode.toUpperCase())
      .eq("active", true)
      .maybeSingle();

    const now = new Date();
    const isValid =
      coupon &&
      (!coupon.starts_at || new Date(coupon.starts_at) <= now) &&
      (!coupon.ends_at || new Date(coupon.ends_at) >= now) &&
      (coupon.usage_limit === null || coupon.usage_count < coupon.usage_limit);

    if (isValid) {
      couponId = coupon.id;
      discountCents =
        coupon.type === "PERCENTAGE"
          ? Math.round((pkg.sale_price_cents * coupon.discount_value) / 100)
          : Math.min(coupon.discount_value, pkg.sale_price_cents);
    }
  }

  const finalPriceCents = Math.max(pkg.sale_price_cents - discountCents, 0);

  // --- Cria o pedido (header) ---
  const isAutomated = product.product_type === "AUTOMATED_SERVICE";

  const { data: order, error: orderError } = await admin
    .from("orders")
    .insert({
      user_id: user.id,
      product_type: product.product_type,
      platform_id: isAutomated ? product.platform_id : null,
      category_id: isAutomated ? product.category_id : null,
      product_id: product.id,
      package_id: pkg.id,
      customer_input: body.customerInput.trim(),
      quantity: pkg.quantity,
      sale_price_cents: finalPriceCents,
      cost_price_cents: pkg.cost_price_cents,
      coupon_id: couponId,
      discount_applied_cents: discountCents,
      subtotal_cents: pkg.sale_price_cents,
      payment_status: "PENDING",
      order_status: "PENDING_PAYMENT",
      supplier_id: isAutomated ? pkg.supplier_id : null,
      supplier_service_id: isAutomated ? pkg.supplier_service_id : null,
      manual_service_stage: product.product_type === "MANUAL_SERVICE" ? "BRIEFING_PENDING" : null,
    })
    .select()
    .single();

  if (orderError || !order) {
    return NextResponse.json({ error: "Não foi possível criar o pedido." }, { status: 500 });
  }

  await admin.from("order_items").insert({
    order_id: order.id,
    item_role: "MAIN",
    product_type: product.product_type,
    platform_id: isAutomated ? product.platform_id : null,
    category_id: isAutomated ? product.category_id : null,
    product_id: product.id,
    package_id: pkg.id,
    customer_input: body.customerInput.trim(),
    quantity: pkg.quantity,
    unit_sale_price_cents: finalPriceCents,
    unit_cost_price_cents: pkg.cost_price_cents,
    item_status: "PENDING",
    supplier_id: isAutomated ? pkg.supplier_id : null,
    supplier_service_id: isAutomated ? pkg.supplier_service_id : null,
  });

  if (couponId) {
    await admin.from("coupon_usage").insert({
      coupon_id: couponId,
      order_id: order.id,
      user_id: user.id,
      discount_applied_cents: discountCents,
    });

    const { data: currentCoupon } = await admin
      .from("coupons")
      .select("usage_count")
      .eq("id", couponId)
      .single();

    if (currentCoupon) {
      await admin
        .from("coupons")
        .update({ usage_count: currentCoupon.usage_count + 1 })
        .eq("id", couponId);
    }
  }

  // --- Gera o pagamento PIX ---
  try {
    const gateway = getPaymentGateway();
    const pix = await gateway.createPixPayment({
      orderNumber: order.order_number,
      amountCents: finalPriceCents,
      description: `${product.name} — ${pkg.name}`,
      payerEmail: user.email!,
    });

    await admin.from("payments").insert({
      order_id: order.id,
      method: "PIX",
      status: "PENDING",
      amount_cents: finalPriceCents,
      gateway: "mercadopago",
      gateway_payment_id: pix.gatewayPaymentId,
      pix_qr_code: pix.qrCode,
      pix_qr_code_base64: pix.qrCodeBase64,
      pix_expires_at: pix.expiresAt,
      raw_payload: pix.rawResponse as never,
    });

    return NextResponse.json({
      orderNumber: order.order_number,
      pixQrCode: pix.qrCode,
      pixQrCodeBase64: pix.qrCodeBase64,
      expiresAt: pix.expiresAt,
      amountCents: finalPriceCents,
    });
  } catch (err) {
    await admin.from("orders").update({ order_status: "FAILED" }).eq("id", order.id);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Falha ao gerar o pagamento PIX." },
      { status: 502 },
    );
  }
}
