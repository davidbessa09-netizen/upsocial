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
            className="group flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/50"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary">
              <Icon className="h-5 w-5" />
            </span>
            <span className="text-sm font-medium text-foreground">{category.name}</span>
          </Link>
        );
      })}
    </div>
  );
}
