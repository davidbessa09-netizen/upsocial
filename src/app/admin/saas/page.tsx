import type { Metadata } from "next";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { createAdminClient } from "@/lib/supabase/admin";
import { createSaasApp, toggleSaasApp, createSaasPlan, toggleSaasPlan } from "@/lib/admin/actions";
import { formatCentsToBRL } from "@/lib/money";
import type { SaasPlan } from "@/types/database";

export const metadata: Metadata = { title: "SaaS" };

export default async function AdminSaasPage() {
  const admin = createAdminClient();
  const [{ data: apps }, { data: plans }] = await Promise.all([
    admin.from("saas_apps").select("*").order("created_at", { ascending: false }),
    admin.from("saas_plans").select("*").order("display_order"),
  ]);

  const plansByApp = new Map<string, SaasPlan[]>();
  for (const plan of plans ?? []) {
    const list = plansByApp.get(plan.app_id) ?? [];
    list.push(plan);
    plansByApp.set(plan.app_id, list);
  }

  return (
    <div className="px-6 py-6 sm:px-8">
      <h1 className="text-xl font-semibold tracking-tight">SaaS</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Ferramentas internas por assinatura. Cadastre a ferramenta, seus planos, e depois vincule um pacote de um
        produto do tipo SAAS a um plano em Produtos → editar → Pacotes.
      </p>

      <details className="mt-6 max-w-xl rounded-xl border border-dashed border-border">
        <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-primary">+ Nova ferramenta</summary>
        <div className="border-t border-border p-4">
          <form action={createSaasApp} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Nome</Label>
              <Input name="name" placeholder="Gerador de Legendas IA" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Slug (opcional, gerado do nome)</Label>
              <Input name="slug" placeholder="gerador-de-legendas-ia" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Descrição</Label>
              <Input name="description" placeholder="Gera legendas otimizadas para Reels e TikTok." />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Ícone (nome lucide-react, ver src/lib/icons.tsx)</Label>
              <Input name="icon" placeholder="Sparkles" />
            </div>
            <Button type="submit" size="sm" className="w-fit">
              Criar ferramenta
            </Button>
          </form>
        </div>
      </details>

      <div className="mt-8 flex flex-col gap-6">
        {(apps ?? []).map((app) => (
          <div key={app.id} className="rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div>
                <p className="text-sm font-medium">{app.name}</p>
                <p className="text-xs text-muted-foreground">/{app.slug}</p>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`rounded-md px-2 py-0.5 text-xs font-medium ${
                    app.active ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {app.active ? "Ativo" : "Inativo"}
                </span>
                <form action={toggleSaasApp.bind(null, app.id, !app.active)}>
                  <button type="submit" className="text-xs font-medium text-primary hover:underline">
                    {app.active ? "Desativar" : "Ativar"}
                  </button>
                </form>
              </div>
            </div>

            <div className="p-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="pb-2 font-medium">Plano</th>
                    <th className="pb-2 font-medium">Preço</th>
                    <th className="pb-2 font-medium">Periodicidade</th>
                    <th className="pb-2 font-medium">Limite/mês</th>
                    <th className="pb-2 font-medium">Status</th>
                    <th className="pb-2 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {(plansByApp.get(app.id) ?? []).map((plan) => (
                    <tr key={plan.id} className="border-b border-border last:border-0">
                      <td className="py-2 font-medium">{plan.name}</td>
                      <td className="py-2 text-muted-foreground">
                        {plan.price_cents > 0 ? formatCentsToBRL(plan.price_cents) : "Grátis"}
                      </td>
                      <td className="py-2 text-muted-foreground">{plan.billing_interval ?? "—"}</td>
                      <td className="py-2 text-muted-foreground">{plan.monthly_limit ?? "Ilimitado"}</td>
                      <td className="py-2">
                        <span
                          className={`rounded-md px-2 py-0.5 text-xs font-medium ${
                            plan.active ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"
                          }`}
                        >
                          {plan.active ? "Ativo" : "Inativo"}
                        </span>
                      </td>
                      <td className="py-2 text-right">
                        <form action={toggleSaasPlan.bind(null, plan.id, !plan.active)}>
                          <button type="submit" className="text-xs font-medium text-primary hover:underline">
                            {plan.active ? "Desativar" : "Ativar"}
                          </button>
                        </form>
                      </td>
                    </tr>
                  ))}
                  {(plansByApp.get(app.id) ?? []).length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-4 text-center text-muted-foreground">
                        Nenhum plano cadastrado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              <details className="mt-3 rounded-lg border border-dashed border-border">
                <summary className="cursor-pointer px-3 py-2 text-xs font-medium text-primary">
                  + Novo plano para {app.name}
                </summary>
                <div className="border-t border-border p-3">
                  <form action={createSaasPlan.bind(null, app.id)} className="flex flex-col gap-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="flex flex-col gap-1.5">
                        <Label>Nome do plano</Label>
                        <Input name="name" placeholder="PRO" required />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label>Preço (R$, 0 = grátis)</Label>
                        <Input name="price" type="number" step="0.01" defaultValue={0} />
                      </div>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="flex flex-col gap-1.5">
                        <Label>Periodicidade</Label>
                        <select
                          name="billing_interval"
                          className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
                        >
                          <option value="">Grátis/vitalício</option>
                          <option value="MONTHLY">Mensal</option>
                          <option value="YEARLY">Anual</option>
                        </select>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label>Limite de uso total</Label>
                        <Input name="usage_limit" type="number" placeholder="Ilimitado" />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label>Limite mensal</Label>
                        <Input name="monthly_limit" type="number" placeholder="Ilimitado" />
                      </div>
                    </div>
                    <Button type="submit" size="sm" className="w-fit">
                      Adicionar plano
                    </Button>
                  </form>
                </div>
              </details>
            </div>
          </div>
        ))}

        {(!apps || apps.length === 0) && (
          <p className="text-sm text-muted-foreground">Nenhuma ferramenta SaaS cadastrada.</p>
        )}
      </div>
    </div>
  );
}
