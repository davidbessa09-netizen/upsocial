import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPaymentGateway, isPaymentGatewayConfigured } from "@/lib/payments";
import { clearCart } from "@/lib/cart";
import type { Product, Package } from "@/types/database";

interface CheckoutBody {
  fromCart?: boolean;
  productSlug?: string;
  packageId?: string;
  customerInput?: string;
  couponCode?: string;
  method: "PIX" | "CREDIT_CARD";
  card?: {
    token: string;
    paymentMethodId: string;
    issuerId?: string;
    installments: number;
  };
  tracking?: {
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_content?: string;
    utm_term?: string;
    landingPageSlug?: string;
  };
  /** Order bump aceito no checkout — preço real é sempre recalculado no servidor. */
  bump?: { productId: string; packageId: string };
  /** Presente quando este checkout é um upsell pós-compra de outro pedido. */
  parentOrderNumber?: string;
}

interface CheckoutItem {
  product: Product;
  pkg: Package;
  quantity: number;
  customerInput: string;
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
  if (body.method === "CREDIT_CARD" && !body.card?.token) {
    return NextResponse.json({ error: "Dados do cartão incompletos." }, { status: 400 });
  }

  const admin = createAdminClient();
  let items: CheckoutItem[];

  if (body.fromCart) {
    const { data: cart } = await admin.from("carts").select("id").eq("user_id", user.id).maybeSingle();
    const { data: cartItems } = cart
      ? await admin.from("cart_items").select("*").eq("cart_id", cart.id)
      : { data: [] };

    if (!cartItems || cartItems.length === 0) {
      return NextResponse.json({ error: "Carrinho vazio." }, { status: 400 });
    }

    const productIds = [...new Set(cartItems.map((i) => i.product_id))];
    const packageIds = [...new Set(cartItems.map((i) => i.package_id))];

    const [{ data: products }, { data: packages }] = await Promise.all([
      admin.from("products").select("*").in("id", productIds).eq("active", true),
      admin.from("packages").select("*").in("id", packageIds).eq("active", true),
    ]);

    const productById = new Map((products ?? []).map((p) => [p.id, p]));
    const packageById = new Map((packages ?? []).map((p) => [p.id, p]));

    items = cartItems
      .map((ci) => {
        const product = productById.get(ci.product_id);
        const pkg = packageById.get(ci.package_id);
        if (!product || !pkg) return null;
        return { product, pkg, quantity: ci.quantity, customerInput: ci.customer_input ?? "" };
      })
      .filter((i): i is CheckoutItem => i !== null);

    if (items.length === 0) {
      return NextResponse.json({ error: "Itens do carrinho não estão mais disponíveis." }, { status: 400 });
    }
  } else {
    if (!body.productSlug || !body.packageId || !body.customerInput?.trim()) {
      return NextResponse.json({ error: "Dados de checkout incompletos." }, { status: 400 });
    }

    const { data: product } = await admin
      .from("products")
      .select("*")
      .eq("slug", body.productSlug)
      .eq("active", true)
      .maybeSingle();
    if (!product) return NextResponse.json({ error: "Produto não encontrado." }, { status: 404 });

    const { data: pkg } = await admin
      .from("packages")
      .select("*")
      .eq("id", body.packageId)
      .eq("product_id", product.id)
      .eq("active", true)
      .maybeSingle();
    if (!pkg) return NextResponse.json({ error: "Pacote não encontrado." }, { status: 404 });

    let effectivePkg = pkg;

    // Se este checkout é a aceitação de um upsell pós-compra, o preço cobrado é o
    // preço promocional da oferta — recalculado no servidor, nunca confiado do client.
    if (body.parentOrderNumber) {
      const { data: parentOrderRow } = await admin
        .from("orders")
        .select("product_id, user_id")
        .eq("order_number", body.parentOrderNumber)
        .maybeSingle();

      if (parentOrderRow && parentOrderRow.user_id === user.id) {
        const { data: upsellOffer } = await admin
          .from("upsell_offers")
          .select("discount_percent, custom_price_cents")
          .eq("trigger_product_id", parentOrderRow.product_id)
          .eq("offer_product_id", product.id)
          .eq("active", true)
          .maybeSingle();

        if (upsellOffer) {
          const offerPriceCents =
            upsellOffer.custom_price_cents ??
            (upsellOffer.discount_percent !== null
              ? Math.round(pkg.sale_price_cents * (1 - upsellOffer.discount_percent / 100))
              : pkg.sale_price_cents);
          effectivePkg = { ...pkg, sale_price_cents: offerPriceCents };
        }
      }
    }

    items = [{ product, pkg: effectivePkg, quantity: effectivePkg.quantity, customerInput: body.customerInput.trim() }];
  }

  const subtotalCents = items.reduce((sum, i) => sum + i.pkg.sale_price_cents, 0);

  // --- Cupom (opcional, aplicado sobre o total) ---
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
          ? Math.round((subtotalCents * coupon.discount_value) / 100)
          : Math.min(coupon.discount_value, subtotalCents);
    }
  }

  // --- Order bump (opcional) — preço sempre recalculado a partir do banco, nunca do client ---
  let bumpItem: CheckoutItem | null = null;
  if (body.bump) {
    const { data: bumpProduct } = await admin
      .from("products")
      .select("*")
      .eq("id", body.bump.productId)
      .eq("active", true)
      .maybeSingle();
    const { data: bumpPkg } = await admin
      .from("packages")
      .select("*")
      .eq("id", body.bump.packageId)
      .eq("product_id", body.bump.productId)
      .eq("active", true)
      .maybeSingle();

    // Confirma que existe uma oferta ativa de fato ligando o produto principal a este bump —
    // impede que o client injete qualquer produto/preço arbitrário como "bump" — e usa o
    // desconto configurado na oferta para recalcular o preço, nunca o preço cheio do pacote
    // nem qualquer valor vindo do client.
    const { data: bumpOffer } = await admin
      .from("order_bumps")
      .select("discount_percent, custom_price_cents")
      .eq("trigger_product_id", items[0].product.id)
      .eq("bump_product_id", body.bump.productId)
      .eq("active", true)
      .maybeSingle();

    if (bumpProduct && bumpPkg && bumpOffer) {
      const offerPriceCents =
        bumpOffer.custom_price_cents ??
        (bumpOffer.discount_percent !== null
          ? Math.round(bumpPkg.sale_price_cents * (1 - bumpOffer.discount_percent / 100))
          : bumpPkg.sale_price_cents);

      bumpItem = {
        product: bumpProduct,
        pkg: { ...bumpPkg, sale_price_cents: offerPriceCents },
        quantity: bumpPkg.quantity,
        customerInput: "",
      };
    }
  }

  const bumpPriceCents = bumpItem?.pkg.sale_price_cents ?? 0;
  const finalPriceCents = Math.max(subtotalCents - discountCents, 0) + bumpPriceCents;
  const costTotalCents =
    items.reduce((sum, i) => sum + i.pkg.cost_price_cents, 0) + (bumpItem?.pkg.cost_price_cents ?? 0);

  // --- Parent order (upsell pós-compra), se aplicável — verifica posse antes de vincular ---
  let parentOrderId: string | null = null;
  let orderRole: "STANDARD" | "UPSELL" = "STANDARD";
  if (body.parentOrderNumber) {
    const { data: parentOrder } = await admin
      .from("orders")
      .select("id, user_id")
      .eq("order_number", body.parentOrderNumber)
      .maybeSingle();
    if (parentOrder && parentOrder.user_id === user.id) {
      parentOrderId = parentOrder.id;
      orderRole = "UPSELL";
    }
  }

  // --- Cria o pedido (header) — usa o primeiro item como snapshot "principal" ---
  const main = items[0];
  const mainIsAutomated = main.product.product_type === "AUTOMATED_SERVICE";

  const { data: order, error: orderError } = await admin
    .from("orders")
    .insert({
      user_id: user.id,
      product_type: main.product.product_type,
      platform_id: mainIsAutomated ? main.product.platform_id : null,
      category_id: mainIsAutomated ? main.product.category_id : null,
      product_id: main.product.id,
      package_id: main.pkg.id,
      customer_input: main.customerInput,
      quantity: main.pkg.quantity,
      sale_price_cents: finalPriceCents,
      cost_price_cents: costTotalCents,
      coupon_id: couponId,
      discount_applied_cents: discountCents,
      subtotal_cents: subtotalCents,
      payment_status: "PENDING",
      order_status: "PENDING_PAYMENT",
      supplier_id: mainIsAutomated ? main.pkg.supplier_id : null,
      supplier_service_id: mainIsAutomated ? main.pkg.supplier_service_id : null,
      manual_service_stage: main.product.product_type === "MANUAL_SERVICE" ? "BRIEFING_PENDING" : null,
      parent_order_id: parentOrderId,
      order_role: orderRole,
      utm_source: body.tracking?.utm_source ?? null,
      utm_medium: body.tracking?.utm_medium ?? null,
      utm_campaign: body.tracking?.utm_campaign ?? null,
      utm_content: body.tracking?.utm_content ?? null,
      utm_term: body.tracking?.utm_term ?? null,
      landing_page_slug: body.tracking?.landingPageSlug ?? null,
    })
    .select()
    .single();

  if (orderError || !order) {
    return NextResponse.json({ error: "Não foi possível criar o pedido." }, { status: 500 });
  }

  const allItems = bumpItem
    ? [...items.map((i) => ({ ...i, role: "MAIN" as const })), { ...bumpItem, role: "ORDER_BUMP" as const }]
    : items.map((i) => ({ ...i, role: "MAIN" as const }));

  await admin.from("order_items").insert(
    allItems.map((item) => {
      const isAutomated = item.product.product_type === "AUTOMATED_SERVICE";
      return {
        order_id: order.id,
        item_role: item.role,
        product_type: item.product.product_type,
        platform_id: isAutomated ? item.product.platform_id : null,
        category_id: isAutomated ? item.product.category_id : null,
        product_id: item.product.id,
        package_id: item.pkg.id,
        customer_input: item.customerInput,
        quantity: item.pkg.quantity,
        unit_sale_price_cents: item.pkg.sale_price_cents,
        unit_cost_price_cents: item.pkg.cost_price_cents,
        item_status: "PENDING" as const,
        supplier_id: isAutomated ? item.pkg.supplier_id : null,
        supplier_service_id: isAutomated ? item.pkg.supplier_service_id : null,
      };
    }),
  );

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
      await admin.from("coupons").update({ usage_count: currentCoupon.usage_count + 1 }).eq("id", couponId);
    }
  }

  const description =
    items.length === 1
      ? `${items[0].product.name} — ${items[0].pkg.name}`
      : `${items.length} produtos — pedido ${order.order_number}`;
  const gateway = getPaymentGateway();

  async function onPaymentInitiated() {
    if (body.fromCart) await clearCart(user!.id);
  }

  // --- PIX ---
  if (body.method === "PIX") {
    try {
      const pix = await gateway.createPixPayment({
        orderNumber: order.order_number,
        amountCents: finalPriceCents,
        description,
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

      await onPaymentInitiated();

      return NextResponse.json({
        method: "PIX",
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

  // --- Cartão de crédito ---
  try {
    const card = await gateway.createCardPayment({
      orderNumber: order.order_number,
      amountCents: finalPriceCents,
      description,
      payerEmail: user.email!,
      cardToken: body.card!.token,
      paymentMethodId: body.card!.paymentMethodId,
      issuerId: body.card!.issuerId,
      installments: body.card!.installments,
    });

    await admin.from("payments").insert({
      order_id: order.id,
      method: "CREDIT_CARD",
      status: card.status,
      amount_cents: finalPriceCents,
      gateway: "mercadopago",
      gateway_payment_id: card.gatewayPaymentId,
      gateway_status_detail: card.statusDetail,
      raw_payload: card.rawResponse as never,
    });

    if (card.status === "APPROVED") {
      await admin.from("orders").update({ payment_status: "APPROVED", order_status: "PAID" }).eq("id", order.id);
      await admin.from("order_items").update({ item_status: "PROCESSING" }).eq("order_id", order.id);
      await onPaymentInitiated();
    } else if (card.status === "REJECTED") {
      await admin.from("orders").update({ payment_status: "REJECTED", order_status: "FAILED" }).eq("id", order.id);
    }

    return NextResponse.json({
      method: "CREDIT_CARD",
      orderNumber: order.order_number,
      status: card.status,
      statusDetail: card.statusDetail,
      amountCents: finalPriceCents,
    });
  } catch (err) {
    await admin.from("orders").update({ order_status: "FAILED" }).eq("id", order.id);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Falha ao processar o cartão." },
      { status: 502 },
    );
  }
}
