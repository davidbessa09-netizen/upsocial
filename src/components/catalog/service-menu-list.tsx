import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { DynamicIcon } from "@/lib/icons";
import { formatCentsToBRL } from "@/lib/money";
import type { CategoryWithPricing } from "@/lib/catalog";

/**
 * Lista vertical "menu de serviços": ícone + nome + "a partir de" + seta.
 * Prioriza escaneabilidade e preço visível — o cliente decide sem sair da
 * lista, diferente de um grid de cards onde o preço fica escondido.
 */
export function ServiceMenuList({
  categories,
  platformSlug,
}: {
  categories: CategoryWithPricing[];
  platformSlug: string;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      {categories.map((category, i) => (
        <Link
          key={category.id}
          href={`/servicos/${platformSlug}/${category.slug}`}
          className={`group flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-secondary/60 ${
            i > 0 ? "border-t border-border" : ""
          }`}
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary">
            <DynamicIcon name={category.icon} className="h-5 w-5" />
          </span>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground">{category.name}</p>
            {category.from_price_cents !== null ? (
              <p className="text-xs text-muted-foreground">
                a partir de <span className="font-medium text-foreground">{formatCentsToBRL(category.from_price_cents)}</span>
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">Em breve</p>
            )}
          </div>

          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
        </Link>
      ))}
    </div>
  );
}
