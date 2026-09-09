import Link from "next/link";
import { DynamicIcon } from "@/lib/icons";
import type { ProductCategory } from "@/types/database";

/**
 * Card de categoria genérica (product_categories) — usado na home e no
 * catálogo, distinto de CategoryGrid (que é específico de categorias de
 * plataforma social, ex: "Seguidores" dentro de "Instagram").
 */
export function GenericCategoryCard({ category }: { category: ProductCategory }) {
  return (
    <Link
      href={`/catalogo?categoria=${category.slug}`}
      className="group flex shrink-0 flex-col items-start gap-3 rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/50 sm:w-auto"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary">
        <DynamicIcon name={category.icon} className="h-5 w-5" />
      </span>
      <span className="text-sm font-medium text-foreground">{category.name}</span>
    </Link>
  );
}
