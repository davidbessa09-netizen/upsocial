import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import {
  getPlatformBySlug,
  getCategoryBySlug,
  getProductsByCategory,
  getPackagesByProduct,
} from "@/lib/catalog";
import { isSupabaseConfigured } from "@/lib/env";
import { SetupNotice } from "@/components/setup-notice";
import { PackageCard } from "@/components/catalog/package-card";
import type { PackagePublic, Product } from "@/types/database";

type Params = { platform: string; category: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  if (!isSupabaseConfigured()) return {};
  const { platform: platformSlug, category: categorySlug } = await params;
  const platform = await getPlatformBySlug(platformSlug);
  if (!platform) return {};
  const category = await getCategoryBySlug(platform.id, categorySlug);
  if (!category) return {};
  return {
    title: `${category.name} — ${platform.name}`,
    description: `Pacotes de ${category.name} para ${platform.name}.`,
  };
}

export default async function CategoryPage({ params }: { params: Promise<Params> }) {
  if (!isSupabaseConfigured()) return <SetupNotice />;

  const { platform: platformSlug, category: categorySlug } = await params;
  const platform = await getPlatformBySlug(platformSlug);
  if (!platform) notFound();

  const category = await getCategoryBySlug(platform.id, categorySlug);
  if (!category) notFound();

  const products = await getProductsByCategory(category.id);
  const productsWithPackages = await Promise.all(
    products.map(async (product) => ({
      product,
      packages: await getPackagesByProduct(product.id),
    })),
  );

  const allCards: { product: Product; pkg: PackagePublic }[] = productsWithPackages.flatMap(
    ({ product, packages }) => packages.map((pkg) => ({ product, pkg })),
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <nav className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/servicos" className="hover:text-foreground">
          Serviços
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href={`/servicos/${platform.slug}`} className="hover:text-foreground">
          {platform.name}
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground">{category.name}</span>
      </nav>

      <h1 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">
        {platform.name} — {category.name}
      </h1>
      {category.description && (
        <p className="mt-2 max-w-2xl text-muted-foreground">{category.description}</p>
      )}

      <div className="mt-10">
        {allCards.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {allCards.map(({ product, pkg }) => (
              <PackageCard
                key={pkg.id}
                pkg={pkg}
                productSlug={product.slug}
                productName={product.name}
                hasRefill={product.has_refill}
              />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">
            Nenhum pacote disponível para esta categoria no momento.
          </p>
        )}
      </div>
    </div>
  );
}
