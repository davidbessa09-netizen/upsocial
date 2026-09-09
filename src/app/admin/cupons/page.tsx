import type { Metadata } from "next";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { createAdminClient } from "@/lib/supabase/admin";
import { createCoupon, toggleCoupon } from "@/lib/admin/actions";

export const metadata: Metadata = { title: "Cupons" };

export default async function AdminCouponsPage() {
  const admin = createAdminClient();
  const { data: coupons } = await admin.from("coupons").select("*").order("created_at", { ascending: false });

  return (
    <div className="px-6 py-6 sm:px-8">
      <h1 className="text-xl font-semibold tracking-tight">Cupons</h1>

      <details className="mt-6 max-w-xl rounded-xl border border-dashed border-border">
        <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-primary">+ Novo cupom</summary>
        <div className="border-t border-border p-4">
          <form action={createCoupon} className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label>Código</Label>
                <Input name="code" placeholder="BEMVINDO10" required />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Tipo</Label>
                <select name="type" className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm">
                  <option value="PERCENTAGE">Porcentagem</option>
                  <option value="FIXED">Valor fixo (centavos)</option>
                </select>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label>Desconto (% ou centavos)</Label>
                <Input name="discount_value" type="number" required />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Limite de uso (vazio = ilimitado)</Label>
                <Input name="usage_limit" type="number" />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label>Início</Label>
                <Input name="starts_at" type="datetime-local" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Fim</Label>
                <Input name="ends_at" type="datetime-local" />
              </div>
            </div>
            <Button type="submit" size="sm" className="w-fit">
              Criar cupom
            </Button>
          </form>
        </div>
      </details>

      <div className="mt-6 overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="px-4 py-2.5 font-medium">Código</th>
              <th className="px-4 py-2.5 font-medium">Tipo</th>
              <th className="px-4 py-2.5 font-medium">Desconto</th>
              <th className="px-4 py-2.5 font-medium">Usos</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
              <th className="px-4 py-2.5 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {(coupons ?? []).map((c) => (
              <tr key={c.id} className="border-b border-border last:border-0">
                <td className="px-4 py-2.5 font-medium">{c.code}</td>
                <td className="px-4 py-2.5 text-muted-foreground">
                  {c.type === "PERCENTAGE" ? "Porcentagem" : "Valor fixo"}
                </td>
                <td className="px-4 py-2.5">
                  {c.type === "PERCENTAGE" ? `${c.discount_value}%` : `R$ ${(c.discount_value / 100).toFixed(2)}`}
                </td>
                <td className="px-4 py-2.5 text-muted-foreground">
                  {c.usage_count}
                  {c.usage_limit ? ` / ${c.usage_limit}` : ""}
                </td>
                <td className="px-4 py-2.5">
                  <span
                    className={`rounded-md px-2 py-0.5 text-xs font-medium ${
                      c.active ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {c.active ? "Ativo" : "Inativo"}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-right">
                  <form action={toggleCoupon.bind(null, c.id, !c.active)}>
                    <button type="submit" className="text-xs font-medium text-primary hover:underline">
                      {c.active ? "Desativar" : "Ativar"}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {(!coupons || coupons.length === 0) && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  Nenhum cupom cadastrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
