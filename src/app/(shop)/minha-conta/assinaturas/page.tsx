import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { DynamicIcon } from "@/lib/icons";
import type { ProductSubscription, SaasSubscription } from "@/types/database";

export const metadata: Metadata = { title: "Minhas assinaturas" };

type ProductSubscriptionRow = ProductSubscription & {
  products: { name: string; slug: string } | null;
};

type SaasSubscriptionRow = SaasSubscription & {
  saas_apps: { name: string; slug: string; icon: string } | null;
  saas_plans: { name: string } | null;
};

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: "Ativa",
  PAST_DUE: "Pagamento pendente",
  CANCELED: "Cancelada",
  EXPIRED: "Expirada",
};

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("pt-BR");
}

export default async function MinhasAssinaturasPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirect=/minha-conta/assinaturas");

  const [{ data: productSubs }, { data: saasSubs }] = await Promise.all([
    supabase
      .from("product_subscriptions")
      .select("*, products(name, slug)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .returns<ProductSubscriptionRow[]>(),
    supabase
      .from("saas_subscriptions")
      .select("*, saas_apps(name, slug, icon), saas_plans(name)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .returns<SaasSubscriptionRow[]>(),
  ]);

  const hasAny = (productSubs && productSubs.length > 0) || (saasSubs && saasSubs.length > 0);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/minha-conta" className="hover:text-foreground">
          Minha conta
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground">Minhas assinaturas</span>
      </nav>

      <h1 className="mt-4 text-2xl font-semibold tracking-tight">Minhas assinaturas</h1>

      {!hasAny && (
        <p className="mt-8 text-sm text-muted-foreground">Você ainda não tem nenhuma assinatura ativa.</p>
      )}

      {saasSubs && saasSubs.length > 0 && (
        <div className="mt-8">
          <h2 className="text-sm font-medium text-muted-foreground">Ferramentas</h2>
          <div className="mt-3 flex flex-col gap-3">
            {saasSubs.map((sub) => (
              <div
                key={sub.id}
                className="flex items-center gap-4 rounded-xl border border-border bg-card p-4"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-foreground">
                  <DynamicIcon name={sub.saas_apps?.icon} className="h-5 w-5" />
                </span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{sub.saas_apps?.name ?? "Ferramenta"}</p>
                  <p className="text-xs text-muted-foreground">
                    Plano {sub.saas_plans?.name ?? "—"} · válido até {formatDate(sub.current_period_end)}
                  </p>
                </div>
                <span
                  className={`rounded-md px-2 py-0.5 text-xs font-medium ${
                    sub.status === "ACTIVE" ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {STATUS_LABEL[sub.status] ?? sub.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {productSubs && productSubs.length > 0 && (
        <div className="mt-8">
          <h2 className="text-sm font-medium text-muted-foreground">Produtos recorrentes</h2>
          <div className="mt-3 flex flex-col gap-3">
            {productSubs.map((sub) => (
              <div
                key={sub.id}
                className="flex items-center justify-between rounded-xl border border-border bg-card p-4"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">{sub.products?.name ?? "Produto"}</p>
                  <p className="text-xs text-muted-foreground">
                    {sub.trial_ends_at && new Date(sub.trial_ends_at) > new Date()
                      ? `Em teste grátis até ${formatDate(sub.trial_ends_at)}`
                      : `Válido até ${formatDate(sub.current_period_end)}`}
                  </p>
                </div>
                <span
                  className={`rounded-md px-2 py-0.5 text-xs font-medium ${
                    sub.status === "ACTIVE" ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {STATUS_LABEL[sub.status] ?? sub.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
