import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Clock, RotateCcw } from "lucide-react";
import { getProductBySlug, getPackagesByProduct } from "@/lib/catalog";
import { isSupabaseConfigured } from "@/lib/env";
import { SetupNotice } from "@/components/setup-notice";
import { ProductPurchaseForm } from "@/components/catalog/product-purchase-form";
import { createClient } from "@/lib/supabase/server";
import { DynamicIcon } from "@/lib/icons";

type Params = { slug: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  if (!isSupabaseConfigured()) return {};
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};
  return {
    title: product.name,
    description: product.short_description ?? product.description,
  };
}

export default async function ProductPage({ params }: { params: Promise<Params> }) {
  if (!isSupabaseConfigured()) return <SetupNotice />;

  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const packages = await getPackagesByProduct(product.id);

  const supabase = await createClient();
  const category = product.category_id
    ? await supabase
        .from("categories")
        .select("name, slug")
        .eq("id", product.category_id)
        .maybeSingle()
        .then((r) => r.data)
    : null;

  const platformData = product.platform_id
    ? await supabase
        .from("platforms")
        .select("name, slug, icon, color")
        .eq("id", product.platform_id)
        .maybeSingle()
        .then((r) => r.data)
    : null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <nav className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/servicos" className="hover:text-foreground">
          Serviços
        </Link>
        {platformData && (
          <>
            <ChevronRight className="h-3.5 w-3.5" />
            <Link href={`/servicos/${platformData.slug}`} className="hover:text-foreground">
              {platformData.name}
            </Link>
          </>
        )}
        {category && platformData && (
          <>
            <ChevronRight className="h-3.5 w-3.5" />
            <Link
              href={`/servicos/${platformData.slug}/${category.slug}`}
              className="hover:text-foreground"
            >
              {category.name}
            </Link>
          </>
        )}
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground">{product.name}</span>
      </nav>

      <div className="mt-6 grid gap-10 lg:grid-cols-2">
        {/* Lado esquerdo: imagem/visual do produto */}
        <div
          className="flex aspect-[4/3] items-center justify-center rounded-xl border border-border lg:sticky lg:top-20 lg:aspect-square lg:self-start"
          style={{
            background:
              "radial-gradient(circle at 30% 25%, color-mix(in oklch, var(--primary), transparent 82%), transparent 60%), var(--secondary)",
          }}
        >
          <DynamicIcon name={platformData?.icon} className="h-16 w-16 text-foreground/70" strokeWidth={1.25} />
        </div>

        {/* Lado direito: categoria, título, descrição, preço, compra */}
        <div className="flex flex-col gap-6">
          <div>
            {platformData && (
              <span className="text-xs font-medium text-muted-foreground">{platformData.name}</span>
            )}

            <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">{product.name}</h1>
            <p className="mt-3 text-sm text-muted-foreground">{product.description}</p>

            <div className="mt-5 flex flex-wrap gap-4 text-sm text-muted-foreground">
              {product.estimated_time && (
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-primary" />
                  Prazo estimado: {product.estimated_time}
                </span>
              )}
              {product.has_refill && (
                <span className="flex items-center gap-1.5">
                  <RotateCcw className="h-4 w-4 text-primary" />
                  Reposição
                  {product.refill_duration_days
                    ? ` por ${product.refill_duration_days} dias`
                    : " disponível"}
                </span>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-6">
            {packages.length > 0 ? (
              <ProductPurchaseForm
                productId={product.id}
                packages={packages}
                inputFieldType={product.input_field_type}
                productSlug={product.slug}
              />
            ) : (
              <p className="text-muted-foreground">Nenhum pacote disponível no momento.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
