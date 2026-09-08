import Link from "next/link";
import { getIcon } from "@/lib/icons";
import type { Category } from "@/types/database";

export function CategoryGrid({
  categories,
  platformSlug,
}: {
  categories: Category[];
  platformSlug: string;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {categories.map((category) => {
        const Icon = getIcon(category.icon);
        return (
          <Link
            key={category.id}
            href={`/servicos/${platformSlug}/${category.slug}`}
            className="group flex items-center gap-3 rounded-xl border border-border/60 bg-card/50 p-4 transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:bg-card hover:shadow-lg hover:shadow-primary/5"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-transform group-hover:scale-110">
              <Icon className="h-5 w-5" />
            </span>
            <span className="text-sm font-medium text-foreground">{category.name}</span>
          </Link>
        );
      })}
    </div>
  );
}
