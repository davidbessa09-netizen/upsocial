import { createClient } from "@/lib/supabase/server";

export interface OfferView {
  offerId: string;
  headline: string;
  description: string | null;
  productId: string;
  productSlug: string;
  productName: string;
  packageId: string;
  originalPriceCents: number;
  offerPriceCents: number;
}

function applyOfferPrice(
  originalPriceCents: number,
  discountPercent: number | null,
  customPriceCents: number | null,
): number {
  if (customPriceCents !== null) return customPriceCents;
  if (discountPercent !== null) return Math.round(originalPriceCents * (1 - discountPercent / 100));
  return originalPriceCents;
}

/** Oferta exibida DURANTE o checkout (pré-pagamento), para o produto que o cliente está comprando. */
export async function getOrderBumpForProduct(triggerProductId: string): Promise<OfferView | null> {
  const supabase = await createClient();
  const { data: bump } = await supabase
    .from("order_bumps")
    .select("*")
    .eq("trigger_product_id", triggerProductId)
    .eq("active", true)
    .order("display_order")
    .limit(1)
    .maybeSingle();

  if (!bump) return null;
  return resolveOffer(bump.id, bump.headline, bump.description, bump.bump_product_id, bump.discount_percent, bump.custom_price_cents);
}

/** Oferta exibida DEPOIS do pagamento aprovado (tela de "obrigado"), para o produto que o cliente acabou de comprar. */
export async function getUpsellOfferForProduct(triggerProductId: string): Promise<OfferView | null> {
  const supabase = await createClient();
  const { data: offer } = await supabase
    .from("upsell_offers")
    .select("*")
    .eq("trigger_product_id", triggerProductId)
    .eq("active", true)
    .order("display_order")
    .limit(1)
    .maybeSingle();

  if (!offer) return null;
  return resolveOffer(offer.id, offer.headline, offer.description, offer.offer_product_id, offer.discount_percent, offer.custom_price_cents);
}

/**
 * Preço de upsell para um par (produto que originou a compra, produto
 * ofertado) específico — usado quando o cliente já sabe qual upsell está
 * aceitando (veio do CTA "Quero aproveitar" da página de pedido).
 */
export async function getUpsellPriceForPair(
  triggerProductId: string,
  offerProductId: string,
  packageId: string,
): Promise<number | null> {
  const supabase = await createClient();

  const { data: offer } = await supabase
    .from("upsell_offers")
    .select("discount_percent, custom_price_cents")
    .eq("trigger_product_id", triggerProductId)
    .eq("offer_product_id", offerProductId)
    .eq("active", true)
    .maybeSingle();
  if (!offer) return null;

  const { data: pkg } = await supabase
    .from("packages")
    .select("sale_price_cents")
    .eq("id", packageId)
    .maybeSingle();
  if (!pkg) return null;

  return applyOfferPrice(pkg.sale_price_cents, offer.discount_percent, offer.custom_price_cents);
}

async function resolveOffer(
  offerId: string,
  headline: string,
  description: string | null,
  offerProductId: string,
  discountPercent: number | null,
  customPriceCents: number | null,
): Promise<OfferView | null> {
  const supabase = await createClient();

  const { data: product } = await supabase
    .from("products")
    .select("id, slug, name")
    .eq("id", offerProductId)
    .eq("active", true)
    .maybeSingle();
  if (!product) return null;

  const { data: packages } = await supabase
    .from("packages")
    .select("id, sale_price_cents")
    .eq("product_id", product.id)
    .eq("active", true)
    .order("sale_price_cents")
    .limit(1);

  const pkg = packages?.[0];
  if (!pkg) return null;

  return {
    offerId,
    headline,
    description,
    productId: product.id,
    productSlug: product.slug,
    productName: product.name,
    packageId: pkg.id,
    originalPriceCents: pkg.sale_price_cents,
    offerPriceCents: applyOfferPrice(pkg.sale_price_cents, discountPercent, customPriceCents),
  };
}
