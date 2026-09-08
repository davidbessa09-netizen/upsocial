import Link from "next/link";
import { ArrowRight, ShieldCheck, Zap, Headset } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PlatformGrid } from "@/components/home/platform-grid";
import { HowItWorks } from "@/components/home/how-it-works";
import { getActivePlatforms } from "@/lib/catalog";
import { isSupabaseConfigured } from "@/lib/env";
import { SetupNotice } from "@/components/setup-notice";

export default async function HomePage() {
  if (!isSupabaseConfigured()) {
    return <SetupNotice />;
  }

  const platforms = await getActivePlatforms();

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(60% 50% at 50% 0%, oklch(0.58 0.22 291 / 0.18), transparent)",
          }}
        />
        <div className="mx-auto max-w-7xl px-4 pt-20 pb-16 text-center sm:px-6 lg:px-8 lg:pt-28">
          <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/50 px-4 py-1.5 text-xs font-medium text-muted-foreground">
            <Zap className="h-3.5 w-3.5 text-primary" />
            Checkout simples · Sem necessidade de senha
          </span>

          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
            Impulsione sua presença digital.
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground text-balance">
            Escolha sua plataforma, encontre o pacote ideal e acompanhe seu
            pedido em poucos passos.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="text-base">
              <Link href="/servicos">
                Começar agora
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="text-base">
              <Link href="/servicos">Ver serviços</Link>
            </Button>
          </div>

          <div className="mt-16">
            <PlatformGrid platforms={platforms} />
          </div>
        </div>
      </section>

      {/* TRUST STRIP */}
      <section className="border-y border-border/60 bg-card/30">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-8 sm:grid-cols-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center gap-3 text-sm text-muted-foreground">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Nunca pedimos sua senha
          </div>
          <div className="flex items-center justify-center gap-3 text-sm text-muted-foreground">
            <Zap className="h-5 w-5 text-primary" />
            Pedido processado automaticamente
          </div>
          <div className="flex items-center justify-center gap-3 text-sm text-muted-foreground">
            <Headset className="h-5 w-5 text-primary" />
            Suporte para dúvidas e pedidos
          </div>
        </div>
      </section>

      <HowItWorks />
    </div>
  );
}
