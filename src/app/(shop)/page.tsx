import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeroMock } from "@/components/home/hero-mock";
import { SectionHeading } from "@/components/home/section-heading";
import { Benefits } from "@/components/home/benefits";
import { Faq } from "@/components/home/faq";
import { GenericCategoryCard } from "@/components/catalog/generic-category-card";
import { ProductCard } from "@/components/catalog/product-card";
import { PlatformGrid } from "@/components/home/platform-grid";
import {
  getActiveProductCategories,
  getFeaturedProductsWithPricing,
  getFeaturedBundlesWithPricing,
  getNewestProductsWithPricing,
  getActivePlatforms,
} from "@/lib/catalog";
import { isSupabaseConfigured } from "@/lib/env";
import { SetupNotice } from "@/components/setup-notice";

export default async function HomePage() {
  if (!isSupabaseConfigured()) return <SetupNotice />;

  const [categories, bestSellers, bundles, newest, platforms] = await Promise.all([
    getActiveProductCategories(),
    getFeaturedProductsWithPricing(8),
    getFeaturedBundlesWithPricing(3),
    getNewestProductsWithPricing(8),
    getActivePlatforms(),
  ]);

  return (
    <div>
      {/* 1. HERO */}
      <section className="bg-gradient-brand">
        <div className="mx-auto max-w-7xl px-4 pt-8 pb-8 sm:px-6 sm:pt-14 sm:pb-16 lg:px-8 lg:pt-20">
          <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-balance text-white sm:text-4xl lg:text-5xl">
                Turbine suas redes sociais agora mesmo.
              </h1>
              <p className="mt-4 max-w-md text-sm text-white/85 sm:mt-5 sm:text-base">
                Seguidores, curtidas, visualizações e muito mais — entrega segura, pedido em poucos cliques.
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-3 sm:mt-8">
                <Button
                  size="lg"
                  className="bg-white text-foreground hover:bg-white/90"
                  render={<Link href="/servicos/instagram/seguidores" />}
                  nativeButton={false}
                >
                  Comprar seguidores agora
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/40 bg-white/10 text-white hover:bg-white/20"
                  render={<Link href="/catalogo?ordenar=vendidos" />}
                  nativeButton={false}
                >
                  Ver mais vendidos
                </Button>
              </div>
            </div>

            <div className="hidden lg:block">
              <HeroMock />
            </div>
          </div>
        </div>
      </section>

      {/* 2. PLATAFORMAS — navegação direta e intuitiva logo abaixo do hero */}
      {platforms.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <PlatformGrid platforms={platforms} />
        </section>
      )}

      {/* 3. MAIS VENDIDOS — logo após o hero, para dar destaque imediato aos produtos */}
      {bestSellers.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
          <SectionHeading
            title="Mais vendidos"
            subtitle="Os produtos que mais convertem na plataforma"
            href="/catalogo?ordenar=vendidos"
          />
          <div className="mt-5 grid grid-cols-2 gap-3 sm:mt-6 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
            {bestSellers.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* 4. CATEGORIAS */}
      {categories.length > 0 && (
        <section id="categorias" className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
          <SectionHeading title="Categorias" />
          <div className="mt-5 flex gap-3 overflow-x-auto pb-2 sm:mt-6 sm:grid sm:grid-cols-3 sm:overflow-visible lg:grid-cols-5">
            {categories.map((category) => (
              <GenericCategoryCard key={category.id} category={category} />
            ))}
          </div>
        </section>
      )}

      {/* 5. PACKS EM DESTAQUE */}
      {bundles.length > 0 && (
        <section className="border-y border-border bg-secondary/30">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
            <SectionHeading title="Packs em destaque" subtitle="Tudo o que um nicho precisa, em um pacote só" />
            <div className="mt-5 grid grid-cols-1 gap-3 sm:mt-6 sm:grid-cols-3 sm:gap-4">
              {bundles.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 6. NOVOS PRODUTOS */}
      {newest.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
          <SectionHeading title="Novos produtos" href="/catalogo?ordenar=recentes" />
          <div className="mt-5 grid grid-cols-2 gap-3 sm:mt-6 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
            {newest.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* 7. BENEFÍCIOS */}
      <Benefits />

      {/* 8. FAQ — quebra de objeção antes do cliente sair do site */}
      <Faq />
    </div>
  );
}
