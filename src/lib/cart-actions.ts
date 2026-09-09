"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { removeCartItem } from "@/lib/cart";

export async function removeFromCartAction(cartItemId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await removeCartItem(user.id, cartItemId);
  revalidatePath("/carrinho");
}

export async function updateCartQuantityAction(cartItemId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const quantity = Math.max(1, Number(formData.get("quantity")) || 1);
  await supabase.from("cart_items").update({ quantity }).eq("id", cartItemId);
  revalidatePath("/carrinho");
}
