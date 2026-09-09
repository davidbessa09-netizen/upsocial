import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatCentsToBRL } from "@/lib/money";
import { ORDER_STATUS_LABELS } from "@/lib/order-status";

export const metadata: Metadata = { title: "Detalhe do pedido" };

type Params = { id: string };

export default async function AdminOrderDetailPage({ params }: { params: Promise<Params> }) {
  const { id: orderNumber } = await params;
  const admin = createAdminClient();

  const { data: order } = await admin.from("orders").select("*").eq("order_number", orderNumber).maybeSingle();
  if (!order) notFound();

  const [{ data: product }, { data: pkg }, { data: supplier }, { data: payments }, { data: profile }] =
    await Promise.all([
      admin.from("products").select("name").eq("id", order.product_id).maybeSingle(),
      admin.from("packages").select("name, quantity").eq("id", order.package_id).maybeSingle(),
      order.supplier_id
        ? admin.from("suppliers").select("name").eq("id", order.supplier_id).maybeSingle()
        : Promise.resolve({ data: null }),
      admin.from("payments").select("*").eq("order_id", order.id).order("created_at", { ascending: false }),
      admin.from("profiles").select("full_name").eq("id", order.user_id).maybeSingle(),
    ]);

  const rows: [string, string | number][] = [
    ["Número do pedido", order.order_number],
    ["Cliente", profile?.full_name ?? order.user_id],
    ["Produto", product?.name ?? "—"],
    ["Pacote", pkg ? `${pkg.quantity.toLocaleString("pt-BR")} — ${pkg.name}` : "—"],
    ["Perfil/Link informado", order.customer_input],
    ["Quantidade", order.quantity],
    ["Preço de venda", formatCentsToBRL(order.sale_price_cents)],
    ["Preço de custo", formatCentsToBRL(order.cost_price_cents)],
    ["Lucro estimado", formatCentsToBRL(order.profit_estimated_cents)],
    ["Desconto aplicado", formatCentsToBRL(order.discount_applied_cents)],
    ["Status de pagamento", order.payment_status],
    ["Status do pedido", ORDER_STATUS_LABELS[order.order_status]],
    ["Fornecedor", supplier?.name ?? "—"],
    ["ID do serviço no fornecedor", order.supplier_service_id ?? "—"],
    ["ID do pedido no fornecedor", order.supplier_order_id ?? "—"],
    ["Criado em", new Date(order.created_at).toLocaleString("pt-BR")],
  ];

  return (
    <div className="max-w-2xl px-6 py-6 sm:px-8">
      <h1 className="text-xl font-semibold tracking-tight">Pedido {order.order_number}</h1>

      <div className="mt-6 overflow-hidden rounded-xl border border-border">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between border-b border-border px-4 py-2.5 text-sm last:border-0">
            <span className="text-muted-foreground">{label}</span>
            <span className="font-medium">{value}</span>
          </div>
        ))}
      </div>

      {order.admin_notes && (
        <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {order.admin_notes}
        </div>
      )}

      <h2 className="mt-8 text-sm font-medium">Pagamentos</h2>
      <div className="mt-3 overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="px-4 py-2.5 font-medium">Método</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
              <th className="px-4 py-2.5 font-medium">Valor</th>
              <th className="px-4 py-2.5 font-medium">Gateway ID</th>
            </tr>
          </thead>
          <tbody>
            {(payments ?? []).map((p) => (
              <tr key={p.id} className="border-b border-border last:border-0">
                <td className="px-4 py-2.5">{p.method}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{p.status}</td>
                <td className="px-4 py-2.5">{formatCentsToBRL(p.amount_cents)}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{p.gateway_payment_id}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
