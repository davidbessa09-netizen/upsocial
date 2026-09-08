import type { Metadata } from "next";
import Link from "next/link";
import { searchProductsWithPricing, getActiveProductCategories } from "@/lib/catalog";
import { isSupabaseConfigured } from "@/lib/env";
import { SetupNotice } from "@/components/setup-notice";
import { SearchBar } from "@/components/layout/search-bar";
import { ProductCard } from "@/components/catalog/product-card";

export const metadata: Metadata = {
  title: "Catálogo",
  description: "Explore todos os produtos, ferramentas e serviços digitais.",
};

type SearchParams = { categoria?: string; q?: string };

export default async function CatalogoPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  if (!isSupabaseConfigured()) return <SetupNotice />;

  const { categoria, q } = await searchParams;
  const activeCategory = categoria ?? "todos";

  const [products, categories] = await Promise.all([
    searchProductsWithPricing({ categorySlug: categoria, query: q }),
    getActiveProductCategories(),
  ]);

  const filters = [{ slug: "todos", name: "Todos" }, ...categories];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Catálogo</h1>

      <div className="mt-6">
        <SearchBar className="max-w-xl" />
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {filters.map((f) => {
          const active = f.slug === activeCategory;
          const href = f.slug === "todos" ? "/catalogo" : `/catalogo?categoria=${f.slug}`;
          return (
            <Link
              key={f.slug}
              href={href}
              className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                active
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
              }`}
            >
              {f.name}
            </Link>
          );
        })}
      </div>

      <div className="mt-8">
        {products.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <p className="py-16 text-center text-muted-foreground">
            Nenhum produto encontrado{q ? ` para "${q}"` : ""}.
          </p>
        )}
      </div>
    </div>
  );
}
