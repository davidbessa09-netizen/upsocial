import { createClient } from "@/lib/supabase/server";

export interface CartItemView {
  cartItemId: string;
  productId: string;
  packageId: string;
  productName: string;
  productSlug: string;
  packageName: string;
  quantity: number;
  customerInput: string | null;
  unitPriceCents: number;
}

async function getOrCreateCartId(userId: string): Promise<string> {
  const supabase = await createClient();

  const { data: existing } = await supabase.from("carts").select("id").eq("user_id", userId).maybeSingle();
  if (existing) return existing.id;

  const { data: created, error } = await supabase
    .from("carts")
    .insert({ user_id: userId })
    .select("id")
    .single();

  if (error || !created) throw new Error(error?.message ?? "Não foi possível criar o carrinho.");
  return created.id;
}

export async function getCartItemCount(userId: string): Promise<number> {
  const supabase = await createClient();
  const { data: cart } = await supabase.from("carts").select("id").eq("user_id", userId).maybeSingle();
  if (!cart) return 0;

  const { count } = await supabase
    .from("cart_items")
    .select("id", { count: "exact", head: true })
    .eq("cart_id", cart.id);

  return count ?? 0;
}

export async function getCartWithItems(userId: string): Promise<CartItemView[]> {
  const supabase = await createClient();
  const { data: cart } = await supabase.from("carts").select("id").eq("user_id", userId).maybeSingle();
  if (!cart) return [];

  const { data: items } = await supabase
    .from("cart_items")
    .select("id, product_id, package_id, quantity, customer_input")
    .eq("cart_id", cart.id)
    .order("created_at", { ascending: true });

  if (!items || items.length === 0) return [];

  const productIds = [...new Set(items.map((i) => i.product_id))];
  const packageIds = [...new Set(items.map((i) => i.package_id))];

  const [{ data: products }, { data: packages }] = await Promise.all([
    supabase.from("products").select("id, name, slug").in("id", productIds),
    supabase.from("packages").select("id, name, sale_price_cents").in("id", packageIds),
  ]);

  const productById = new Map((products ?? []).map((p) => [p.id, p]));
  const packageById = new Map((packages ?? []).map((p) => [p.id, p]));

  return items.map((item) => {
    const product = productById.get(item.product_id);
    const pkg = packageById.get(item.package_id);
    return {
      cartItemId: item.id,
      productId: item.product_id,
      packageId: item.package_id,
      productName: product?.name ?? "Produto removido",
      productSlug: product?.slug ?? "",
      packageName: pkg?.name ?? "—",
      quantity: item.quantity,
      customerInput: item.customer_input,
      unitPriceCents: pkg?.sale_price_cents ?? 0,
    };
  });
}

export async function addToCart(
  userId: string,
  input: { productId: string; packageId: string; customerInput: string; quantity?: number },
): Promise<void> {
  const supabase = await createClient();
  const cartId = await getOrCreateCartId(userId);

  const { data: existing } = await supabase
    .from("cart_items")
    .select("id, quantity")
    .eq("cart_id", cartId)
    .eq("product_id", input.productId)
    .eq("package_id", input.packageId)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("cart_items")
      .update({ customer_input: input.customerInput, quantity: existing.quantity + (input.quantity ?? 1) })
      .eq("id", existing.id);
    return;
  }

  const { error } = await supabase.from("cart_items").insert({
    cart_id: cartId,
    product_id: input.productId,
    package_id: input.packageId,
    customer_input: input.customerInput,
    quantity: input.quantity ?? 1,
  });

  if (error) throw new Error(error.message);
}

export async function removeCartItem(userId: string, cartItemId: string): Promise<void> {
  const supabase = await createClient();
  // RLS (cart_items_all_own) já garante que só itens do próprio carrinho podem ser removidos.
  await supabase.from("cart_items").delete().eq("id", cartItemId);
  void userId;
}

export async function clearCart(userId: string): Promise<void> {
  const supabase = await createClient();
  const { data: cart } = await supabase.from("carts").select("id").eq("user_id", userId).maybeSingle();
  if (!cart) return;
  await supabase.from("cart_items").delete().eq("cart_id", cart.id);
}
