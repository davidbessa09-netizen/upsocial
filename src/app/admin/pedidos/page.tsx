import type { Metadata } from "next";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatCentsToBRL } from "@/lib/money";
import { ORDER_STATUS_LABELS } from "@/lib/order-status";
import type { OrderStatus } from "@/types/database";

export const metadata: Metadata = { title: "Pedidos" };

type SearchParams = { status?: string };

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { status } = await searchParams;
  const admin = createAdminClient();

  let query = admin
    .from("orders")
    .select("order_number, customer_input, sale_price_cents, cost_price_cents, order_status, payment_status, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  if (status) query = query.eq("order_status", status as OrderStatus);

  const { data: orders } = await query;

  const statuses: OrderStatus[] = [
    "PENDING_PAYMENT",
    "PAID",
    "PROCESSING",
    "PARTIAL",
    "COMPLETED",
    "CANCELED",
    "REFUNDED",
    "FAILED",
  ];

  return (
    <div className="px-6 py-6 sm:px-8">
      <h1 className="text-xl font-semibold tracking-tight">Pedidos</h1>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href="/admin/pedidos"
          className={`rounded-full border px-3 py-1 text-xs font-medium ${
            !status ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"
          }`}
        >
          Todos
        </Link>
        {statuses.map((s) => (
          <Link
            key={s}
            href={`/admin/pedidos?status=${s}`}
            className={`rounded-full border px-3 py-1 text-xs font-medium ${
              status === s ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"
            }`}
          >
            {ORDER_STATUS_LABELS[s]}
          </Link>
        ))}
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="px-4 py-2.5 font-medium">Pedido</th>
              <th className="px-4 py-2.5 font-medium">Cliente/Perfil</th>
              <th className="px-4 py-2.5 font-medium">Preço</th>
              <th className="px-4 py-2.5 font-medium">Custo</th>
              <th className="px-4 py-2.5 font-medium">Lucro</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
              <th className="px-4 py-2.5 font-medium">Data</th>
              <th className="px-4 py-2.5 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {(orders ?? []).map((o) => (
              <tr key={o.order_number} className="border-b border-border last:border-0">
                <td className="px-4 py-2.5 font-medium">{o.order_number}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{o.customer_input}</td>
                <td className="px-4 py-2.5">{formatCentsToBRL(o.sale_price_cents)}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{formatCentsToBRL(o.cost_price_cents)}</td>
                <td className="px-4 py-2.5 text-primary">
                  {formatCentsToBRL(o.sale_price_cents - o.cost_price_cents)}
                </td>
                <td className="px-4 py-2.5 text-muted-foreground">{ORDER_STATUS_LABELS[o.order_status]}</td>
                <td className="px-4 py-2.5 text-muted-foreground">
                  {new Date(o.created_at).toLocaleDateString("pt-BR")}
                </td>
                <td className="px-4 py-2.5 text-right">
                  <Link
                    href={`/admin/pedidos/${o.order_number}`}
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    Ver
                  </Link>
                </td>
              </tr>
            ))}
            {(!orders || orders.length === 0) && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                  Nenhum pedido encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
