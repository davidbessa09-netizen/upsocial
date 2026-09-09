import type { Metadata } from "next";
import Link from "next/link";
import { DollarSign, ShoppingCart, Clock, CheckCircle2, AlertTriangle, TrendingUp } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatCentsToBRL } from "@/lib/money";
import { ORDER_STATUS_LABELS } from "@/lib/order-status";
import type { OrderStatus } from "@/types/database";

export const metadata: Metadata = { title: "Dashboard" };

function startOfDayISO(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function daysAgoISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

const PAID_STATUSES: OrderStatus[] = ["PAID", "PROCESSING", "PARTIAL", "COMPLETED"];

export default async function AdminDashboardPage() {
  const admin = createAdminClient();

  const [{ data: allPaidOrders }, { data: todayOrders }, { data: recentOrders }] = await Promise.all([
    admin.from("orders").select("sale_price_cents, cost_price_cents, order_status, created_at").in("order_status", PAID_STATUSES),
    admin.from("orders").select("id, order_status").gte("created_at", startOfDayISO()),
    admin
      .from("orders")
      .select("order_number, customer_input, sale_price_cents, order_status, payment_status, created_at")
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  const totalRevenueCents = (allPaidOrders ?? []).reduce((sum, o) => sum + o.sale_price_cents, 0);
  const totalProfitCents = (allPaidOrders ?? []).reduce((sum, o) => sum + (o.sale_price_cents - o.cost_price_cents), 0);
  const ticketMedioCents = allPaidOrders?.length ? Math.round(totalRevenueCents / allPaidOrders.length) : 0;

  const last7 = daysAgoISO(7);
  const revenue7dCents = (allPaidOrders ?? [])
    .filter((o) => o.created_at >= last7)
    .reduce((sum, o) => sum + o.sale_price_cents, 0);

  const revenueTodayCents = (allPaidOrders ?? [])
    .filter((o) => o.created_at >= startOfDayISO())
    .reduce((sum, o) => sum + o.sale_price_cents, 0);

  const ordersToday = todayOrders?.length ?? 0;
  const processingCount = (todayOrders ?? []).filter((o) => o.order_status === "PROCESSING").length;
  const completedCount = (todayOrders ?? []).filter((o) => o.order_status === "COMPLETED").length;
  const failedCount = (todayOrders ?? []).filter((o) => o.order_status === "FAILED").length;

  const cards = [
    { label: "Faturamento total", value: formatCentsToBRL(totalRevenueCents), icon: DollarSign },
    { label: "Faturamento hoje", value: formatCentsToBRL(revenueTodayCents), icon: TrendingUp },
    { label: "Faturamento 7 dias", value: formatCentsToBRL(revenue7dCents), icon: TrendingUp },
    { label: "Lucro estimado", value: formatCentsToBRL(totalProfitCents), icon: DollarSign },
    { label: "Ticket médio", value: formatCentsToBRL(ticketMedioCents), icon: ShoppingCart },
    { label: "Pedidos hoje", value: String(ordersToday), icon: Clock },
    { label: "Em processamento", value: String(processingCount), icon: Clock },
    { label: "Concluídos hoje", value: String(completedCount), icon: CheckCircle2 },
    { label: "Falhas hoje", value: String(failedCount), icon: AlertTriangle },
  ];

  return (
    <div className="px-6 py-6 sm:px-8">
      <h1 className="text-xl font-semibold tracking-tight">Dashboard</h1>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border border-border bg-card p-4">
            <c.icon className="h-4 w-4 text-muted-foreground" />
            <p className="mt-2 text-lg font-semibold">{c.value}</p>
            <p className="text-xs text-muted-foreground">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium">Pedidos recentes</h2>
          <Link href="/admin/pedidos" className="text-xs text-muted-foreground hover:text-foreground">
            Ver todos
          </Link>
        </div>

        <div className="mt-3 overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="px-4 py-2.5 font-medium">Pedido</th>
                <th className="px-4 py-2.5 font-medium">Cliente</th>
                <th className="px-4 py-2.5 font-medium">Valor</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5 font-medium">Data</th>
              </tr>
            </thead>
            <tbody>
              {(recentOrders ?? []).map((o) => (
                <tr key={o.order_number} className="border-b border-border last:border-0">
                  <td className="px-4 py-2.5 font-medium">{o.order_number}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{o.customer_input}</td>
                  <td className="px-4 py-2.5">{formatCentsToBRL(o.sale_price_cents)}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{ORDER_STATUS_LABELS[o.order_status]}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">
                    {new Date(o.created_at).toLocaleDateString("pt-BR")}
                  </td>
                </tr>
              ))}
              {(!recentOrders || recentOrders.length === 0) && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    Nenhum pedido ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
