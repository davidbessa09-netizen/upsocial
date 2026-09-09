import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeroMock } from "@/components/home/hero-mock";
import { SectionHeading } from "@/components/home/section-heading";
import { Benefits } from "@/components/home/benefits";
import { GenericCategoryCard } from "@/components/catalog/generic-category-card";
import { ProductCard } from "@/components/catalog/product-card";
import {
  getActiveProductCategories,
  getFeaturedProductsWithPricing,
  getFeaturedBundlesWithPricing,
  getNewestProductsWithPricing,
} from "@/lib/catalog";
import { isSupabaseConfigured } from "@/lib/env";
import { SetupNotice } from "@/components/setup-notice";

export default async function HomePage() {
  if (!isSupabaseConfigured()) return <SetupNotice />;

  const [categories, bestSellers, bundles, newest] = await Promise.all([
    getActiveProductCategories(),
    getFeaturedProductsWithPricing(8),
    getFeaturedBundlesWithPricing(3),
    getNewestProductsWithPricing(8),
  ]);

  return (
    <div>
      {/* 1. HERO */}
      <section className="mx-auto max-w-7xl px-4 pt-14 pb-16 sm:px-6 lg:px-8 lg:pt-20">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
              Tudo que você precisa para crescer no digital.
            </h1>
            <p className="mt-5 max-w-md text-base text-muted-foreground">
              Produtos, ferramentas e serviços digitais em um só lugar.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button size="lg" render={<Link href="/catalogo" />} nativeButton={false}>
                Explorar produtos
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                render={<Link href="/catalogo?ordenar=vendidos" />}
                nativeButton={false}
              >
                Ver mais vendidos
              </Button>
            </div>
          </div>

          <HeroMock />
        </div>
      </section>

      {/* 3. CATEGORIAS */}
      {categories.length > 0 && (
        <section id="categorias" className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <SectionHeading title="Categorias" />
          <div className="mt-6 flex gap-3 overflow-x-auto pb-2 sm:grid sm:grid-cols-3 sm:overflow-visible lg:grid-cols-5">
            {categories.map((category) => (
              <GenericCategoryCard key={category.id} category={category} />
            ))}
          </div>
        </section>
      )}

      {/* 4. MAIS VENDIDOS */}
      {bestSellers.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <SectionHeading
            title="Mais vendidos"
            subtitle="Os produtos que mais convertem na plataforma"
            href="/catalogo?ordenar=vendidos"
          />
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {bestSellers.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* 5. PACKS EM DESTAQUE */}
      {bundles.length > 0 && (
        <section className="border-y border-border bg-secondary/30">
          <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
            <SectionHeading title="Packs em destaque" subtitle="Tudo o que um nicho precisa, em um pacote só" />
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {bundles.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 6. NOVOS PRODUTOS */}
      {newest.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <SectionHeading title="Novos produtos" href="/catalogo?ordenar=recentes" />
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {newest.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* 7. BENEFÍCIOS */}
      <Benefits />
    </div>
  );
}
