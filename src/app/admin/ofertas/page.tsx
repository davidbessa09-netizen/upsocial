import type { Metadata } from "next";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { createAdminClient } from "@/lib/supabase/admin";
import { createOrderBump, createUpsellOffer, toggleOrderBump, toggleUpsellOffer } from "@/lib/admin/actions";
import { formatCentsToBRL } from "@/lib/money";

export const metadata: Metadata = { title: "Ofertas" };

export default async function AdminOffersPage() {
  const admin = createAdminClient();

  const [{ data: products }, { data: bumps }, { data: upsells }] = await Promise.all([
    admin.from("products").select("id, name").eq("active", true).order("name"),
    admin.from("order_bumps").select("*").order("created_at", { ascending: false }),
    admin.from("upsell_offers").select("*").order("created_at", { ascending: false }),
  ]);

  const productNameById = new Map((products ?? []).map((p) => [p.id, p.name]));

  return (
    <div className="px-6 py-6 sm:px-8">
      <h1 className="text-xl font-semibold tracking-tight">Ofertas</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Order bumps aparecem durante o checkout. Upsells aparecem na tela de acompanhamento logo
        após o pagamento ser aprovado.
      </p>

      {/* --- ORDER BUMPS --- */}
      <h2 className="mt-8 text-sm font-medium">Order bumps (checkout)</h2>
      <OfferForm action={createOrderBump} products={products ?? []} />

      <div className="mt-4 overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="px-4 py-2.5 font-medium">Ao comprar</th>
              <th className="px-4 py-2.5 font-medium">Oferece</th>
              <th className="px-4 py-2.5 font-medium">Headline</th>
              <th className="px-4 py-2.5 font-medium">Desconto/Preço</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
              <th className="px-4 py-2.5 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {(bumps ?? []).map((b) => (
              <tr key={b.id} className="border-b border-border last:border-0">
                <td className="px-4 py-2.5">{productNameById.get(b.trigger_product_id) ?? "—"}</td>
                <td className="px-4 py-2.5">{productNameById.get(b.bump_product_id) ?? "—"}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{b.headline}</td>
                <td className="px-4 py-2.5 text-muted-foreground">
                  {b.custom_price_cents
                    ? formatCentsToBRL(b.custom_price_cents)
                    : b.discount_percent
                      ? `-${b.discount_percent}%`
                      : "—"}
                </td>
                <td className="px-4 py-2.5">
                  <StatusBadge active={b.active} />
                </td>
                <td className="px-4 py-2.5 text-right">
                  <ToggleForm action={toggleOrderBump.bind(null, b.id, !b.active)} active={b.active} />
                </td>
              </tr>
            ))}
            {(!bumps || bumps.length === 0) && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  Nenhum order bump cadastrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* --- UPSELLS --- */}
      <h2 className="mt-10 text-sm font-medium">Upsells (pós-compra)</h2>
      <OfferForm action={createUpsellOffer} products={products ?? []} />

      <div className="mt-4 overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="px-4 py-2.5 font-medium">Ao comprar</th>
              <th className="px-4 py-2.5 font-medium">Oferece</th>
              <th className="px-4 py-2.5 font-medium">Headline</th>
              <th className="px-4 py-2.5 font-medium">Desconto/Preço</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
              <th className="px-4 py-2.5 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {(upsells ?? []).map((u) => (
              <tr key={u.id} className="border-b border-border last:border-0">
                <td className="px-4 py-2.5">{productNameById.get(u.trigger_product_id) ?? "—"}</td>
                <td className="px-4 py-2.5">{productNameById.get(u.offer_product_id) ?? "—"}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{u.headline}</td>
                <td className="px-4 py-2.5 text-muted-foreground">
                  {u.custom_price_cents
                    ? formatCentsToBRL(u.custom_price_cents)
                    : u.discount_percent
                      ? `-${u.discount_percent}%`
                      : "—"}
                </td>
                <td className="px-4 py-2.5">
                  <StatusBadge active={u.active} />
                </td>
                <td className="px-4 py-2.5 text-right">
                  <ToggleForm action={toggleUpsellOffer.bind(null, u.id, !u.active)} active={u.active} />
                </td>
              </tr>
            ))}
            {(!upsells || upsells.length === 0) && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  Nenhum upsell cadastrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`rounded-md px-2 py-0.5 text-xs font-medium ${
        active ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"
      }`}
    >
      {active ? "Ativo" : "Inativo"}
    </span>
  );
}

function ToggleForm({ action, active }: { action: () => Promise<void>; active: boolean }) {
  return (
    <form action={action}>
      <button type="submit" className="text-xs font-medium text-primary hover:underline">
        {active ? "Desativar" : "Ativar"}
      </button>
    </form>
  );
}

function OfferForm({
  action,
  products,
}: {
  action: (formData: FormData) => Promise<void>;
  products: { id: string; name: string }[];
}) {
  return (
    <details className="mt-3 max-w-xl rounded-xl border border-dashed border-border">
      <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-primary">+ Nova oferta</summary>
      <div className="border-t border-border p-4">
        <form action={action} className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label>Produto gatilho (ao comprar isso...)</Label>
              <select
                name="trigger_product_id"
                required
                className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Produto ofertado (...oferece isso)</Label>
              <select
                name="offer_product_id"
                required
                className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Headline da oferta</Label>
            <Input name="headline" placeholder="Aproveite e leve também..." required />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Descrição (opcional)</Label>
            <Input name="description" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label>Desconto (%)</Label>
              <Input name="discount_percent" type="number" min={0} max={100} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Ou preço fixo (R$)</Label>
              <Input name="custom_price" type="number" step="0.01" />
            </div>
          </div>

          <Button type="submit" size="sm" className="w-fit">
            Criar oferta
          </Button>
        </form>
      </div>
    </details>
  );
}
