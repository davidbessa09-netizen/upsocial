import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getLandingPageBySlug, getPackagesByProduct } from "@/lib/catalog";
import { isSupabaseConfigured } from "@/lib/env";
import { SetupNotice } from "@/components/setup-notice";
import { Button } from "@/components/ui/button";
import { LandingSections } from "@/components/catalog/landing-sections";
import { formatCentsToBRL } from "@/lib/money";
import { createClient } from "@/lib/supabase/server";

type Params = { slug: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  if (!isSupabaseConfigured()) return {};
  const { slug } = await params;
  const lp = await getLandingPageBySlug(slug);
  if (!lp) return {};
  return {
    title: lp.seo_title ?? lp.headline,
    description: lp.seo_description ?? lp.subheadline ?? undefined,
  };
}

export default async function LandingPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  if (!isSupabaseConfigured()) return <SetupNotice />;

  const { slug } = await params;
  const utm = await searchParams;

  const lp = await getLandingPageBySlug(slug);
  if (!lp) notFound();

  const supabase = await createClient();
  const { data: linkedProduct } = await supabase
    .from("products")
    .select("id, slug, name")
    .eq("id", lp.product_id)
    .maybeSingle();

  if (!linkedProduct) notFound();

  const packages = await getPackagesByProduct(linkedProduct.id);
  const cheapest = packages.length ? packages.reduce((a, b) => (a.sale_price_cents < b.sale_price_cents ? a : b)) : null;

  const ctaHref = new URLSearchParams({
    ...(utm.utm_source ? { utm_source: utm.utm_source } : {}),
    ...(utm.utm_campaign ? { utm_campaign: utm.utm_campaign } : {}),
    lp: slug,
  });

  return (
    <div>
      <section className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
        <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">{lp.headline}</h1>
        {lp.subheadline && (
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">{lp.subheadline}</p>
        )}

        {lp.hero_image_url && (
          <Image
            src={lp.hero_image_url}
            alt=""
            width={900}
            height={500}
            className="mx-auto mt-8 w-full max-w-2xl rounded-xl border border-border object-cover"
          />
        )}

        <div className="mt-8">
          <Button
            size="lg"
            className="text-base"
            nativeButton={false}
            render={<Link href={`/produto/${linkedProduct.slug}?${ctaHref.toString()}`} />}
          >
            {lp.cta_text}
            {cheapest && ` — ${formatCentsToBRL(cheapest.sale_price_cents)}`}
          </Button>
        </div>
      </section>

      {Array.isArray(lp.sections) && lp.sections.length > 0 && (
        <section className="mx-auto max-w-3xl px-4 pb-16 sm:px-6">
          <LandingSections sections={lp.sections} />
        </section>
      )}
    </div>
  );
}
