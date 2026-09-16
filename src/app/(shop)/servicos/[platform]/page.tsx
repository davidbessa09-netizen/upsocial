import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, ArrowRight } from "lucide-react";
import { getPlatformBySlug, getCategoriesByPlatformWithPricing } from "@/lib/catalog";
import { isSupabaseConfigured } from "@/lib/env";
import { SetupNotice } from "@/components/setup-notice";
import { ServiceMenuList } from "@/components/catalog/service-menu-list";
import { Button } from "@/components/ui/button";
import { DynamicIcon } from "@/lib/icons";

type Params = { platform: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  if (!isSupabaseConfigured()) return {};
  const { platform: platformSlug } = await params;
  const platform = await getPlatformBySlug(platformSlug);
  if (!platform) return {};
  return {
    title: platform.name,
    description: `Pacotes de serviços para ${platform.name}.`,
  };
}

export default async function PlatformPage({ params }: { params: Promise<Params> }) {
  if (!isSupabaseConfigured()) return <SetupNotice />;

  const { platform: platformSlug } = await params;
  const platform = await getPlatformBySlug(platformSlug);
  if (!platform) notFound();

  const categories = await getCategoriesByPlatformWithPricing(platform.id);
  const topCategory = categories.find((c) => c.from_price_cents !== null) ?? categories[0];

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/servicos" className="hover:text-foreground">
          Serviços
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground">{platform.name}</span>
      </nav>

      {/* Hero da plataforma: ícone grande, tagline e CTA direto pro serviço mais relevante */}
      <div className="mt-6 flex flex-col items-center rounded-2xl border border-border bg-card px-6 py-10 text-center sm:py-12">
        <span
          className="flex h-16 w-16 items-center justify-center rounded-2xl"
          style={{ backgroundColor: `${platform.color}1a`, color: platform.color }}
        >
          <DynamicIcon name={platform.icon} className="h-8 w-8" strokeWidth={1.5} />
        </span>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">
          Turbine seu {platform.name}
        </h1>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          Seguidores, curtidas e muito mais — entrega segura, pedido em poucos cliques.
        </p>
        {topCategory && (
          <Button
            size="lg"
            className="mt-6"
            render={<Link href={`/servicos/${platform.slug}/${topCategory.slug}`} />}
            nativeButton={false}
          >
            Comprar {topCategory.name} agora
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Menu de serviços: preço visível em cada item, sem precisar entrar pra descobrir */}
      <h2 className="mt-8 text-sm font-medium text-muted-foreground">O que você deseja turbinar</h2>
      <div className="mt-3">
        {categories.length > 0 ? (
          <ServiceMenuList categories={categories} platformSlug={platform.slug} />
        ) : (
          <p className="text-muted-foreground">
            Nenhuma categoria disponível para esta plataforma no momento.
          </p>
        )}
      </div>
    </div>
  );
}
