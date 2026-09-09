import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { getPlatformBySlug, getCategoriesByPlatform } from "@/lib/catalog";
import { isSupabaseConfigured } from "@/lib/env";
import { SetupNotice } from "@/components/setup-notice";
import { CategoryGrid } from "@/components/catalog/category-grid";
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

  const categories = await getCategoriesByPlatform(platform.id);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/servicos" className="hover:text-foreground">
          Serviços
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground">{platform.name}</span>
      </nav>

      <div className="mt-4 flex items-center gap-3">
        <span
          className="flex h-11 w-11 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${platform.color}1a`, color: platform.color }}
        >
          <DynamicIcon name={platform.icon} className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{platform.name}</h1>
          <p className="text-sm text-muted-foreground">Escolha uma categoria</p>
        </div>
      </div>

      <div className="mt-8">
        {categories.length > 0 ? (
          <CategoryGrid categories={categories} platformSlug={platform.slug} />
        ) : (
          <p className="text-muted-foreground">
            Nenhuma categoria disponível para esta plataforma no momento.
          </p>
        )}
      </div>
    </div>
  );
}
