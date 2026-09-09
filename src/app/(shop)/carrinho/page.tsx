import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Trash2, ShoppingBag } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCartWithItems } from "@/lib/cart";
import { removeFromCartAction, updateCartQuantityAction } from "@/lib/cart-actions";
import { formatCentsToBRL } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const metadata: Metadata = { title: "Carrinho" };

export default async function CartPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirect=/carrinho");

  const items = await getCartWithItems(user.id);
  const total = items.reduce((sum, i) => sum + i.unitPriceCents * i.quantity, 0);

  if (items.length === 0) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-20 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-muted-foreground">
          <ShoppingBag className="h-7 w-7" />
        </span>
        <h1 className="text-xl font-semibold">Seu carrinho está vazio</h1>
        <p className="text-sm text-muted-foreground">Explore o catálogo e adicione produtos ao carrinho.</p>
        <Button nativeButton={false} render={<Link href="/catalogo" />}>
          Explorar produtos
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="text-xl font-semibold tracking-tight">Carrinho</h1>

      <div className="mt-6 flex flex-col gap-3">
        {items.map((item) => (
          <div key={item.cartItemId} className="flex items-center gap-4 rounded-xl border border-border bg-card p-4">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground">{item.productName}</p>
              <p className="text-xs text-muted-foreground">{item.packageName}</p>
              {item.customerInput && (
                <p className="mt-1 text-xs text-muted-foreground">Para: {item.customerInput}</p>
              )}
            </div>

            <form action={updateCartQuantityAction.bind(null, item.cartItemId)} className="flex items-center gap-1.5">
              <Input
                name="quantity"
                type="number"
                min={1}
                defaultValue={item.quantity}
                className="h-8 w-16 text-center"
              />
              <Button type="submit" size="sm" variant="outline">
                Atualizar
              </Button>
            </form>

            <p className="w-24 shrink-0 text-right text-sm font-semibold">
              {formatCentsToBRL(item.unitPriceCents * item.quantity)}
            </p>

            <form action={removeFromCartAction.bind(null, item.cartItemId)}>
              <button type="submit" aria-label="Remover" className="text-muted-foreground hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </button>
            </form>
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between rounded-xl border border-border bg-card p-5">
        <span className="text-sm text-muted-foreground">Total</span>
        <span className="text-xl font-semibold">{formatCentsToBRL(total)}</span>
      </div>

      <Button size="lg" className="mt-4 w-full" nativeButton={false} render={<Link href="/checkout" />}>
        Finalizar compra
      </Button>
    </div>
  );
}
