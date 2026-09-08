import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { formatCentsToBRL } from "@/lib/money";
import { getIcon } from "@/lib/icons";
import type { ProductCardData } from "@/lib/catalog";

export function ProductCard({ product }: { product: ProductCardData }) {
  const Icon = getIcon(product.product_type === "AUTOMATED_SERVICE" ? "Users" : "Sparkles");

  return (
    <Link
      href={`/produto/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-primary/50"
    >
      <div
        className="relative flex aspect-[4/3] items-center justify-center border-b border-border"
        style={{
          background:
            "radial-gradient(circle at 30% 25%, color-mix(in oklch, var(--primary), transparent 82%), transparent 60%), var(--secondary)",
        }}
      >
        <Icon className="h-10 w-10 text-foreground/70" strokeWidth={1.25} />
        {product.has_best_seller && (
          <span className="absolute top-3 left-3 rounded-md bg-primary px-2 py-1 text-[11px] font-medium text-primary-foreground">
            Mais vendido
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-4">
        {product.category_name && (
          <span className="text-xs font-medium text-muted-foreground">
            {product.category_name}
          </span>
        )}
        <h3 className="text-sm font-semibold text-foreground">{product.name}</h3>
        {product.short_description && (
          <p className="line-clamp-2 text-xs text-muted-foreground">
            {product.short_description}
          </p>
        )}

        <div className="mt-3 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-muted-foreground">a partir de</span>
            <p className="text-base font-semibold text-foreground">
              {formatCentsToBRL(product.from_price_cents)}
            </p>
          </div>
          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors group-hover:border-primary group-hover:text-primary">
            <ArrowUpRight className="h-4 w-4" />
          </span>
        </div>
      </div>
    </Link>
  );
}
