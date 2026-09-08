import Link from "next/link";
import { ShoppingBag } from "lucide-react";

/** Contador estático por enquanto — o carrinho real (carts/cart_items) entra na Etapa 3. */
export function CartButton({ count = 0 }: { count?: number }) {
  return (
    <Link
      href="/carrinho"
      aria-label="Carrinho"
      className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
    >
      <ShoppingBag className="h-[18px] w-[18px]" />
      {count > 0 && (
        <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
          {count}
        </span>
      )}
    </Link>
  );
}
