import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatCentsToBRL } from "@/lib/money";
import { ORDER_STATUS_LABELS, MANUAL_SERVICE_STAGE_LABELS } from "@/lib/order-status";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateManualServiceStage, addProjectMessage, addProjectDelivery } from "@/lib/admin/actions";
import type { ManualServiceStage } from "@/types/database";

const STAGES: ManualServiceStage[] = [
  "BRIEFING_PENDING",
  "BRIEFING_RECEIVED",
  "IN_PROGRESS",
  "WAITING_CLIENT",
  "REVISION",
  "DELIVERED",
  "COMPLETED",
];

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

      {order.product_type === "MANUAL_SERVICE" && (
        <ManualServiceSection admin={admin} order={order} />
      )}
    </div>
  );
}

async function ManualServiceSection({
  admin,
  order,
}: {
  admin: ReturnType<typeof createAdminClient>;
  order: { id: string; order_number: string; product_id: string; manual_service_stage: ManualServiceStage | null };
}) {
  const [{ data: form }, { data: messages }, { data: deliveries }] = await Promise.all([
    admin.from("briefing_forms").select("id").eq("product_id", order.product_id).maybeSingle(),
    admin.from("project_messages").select("*").eq("order_id", order.id).order("created_at"),
    admin.from("project_deliveries").select("*").eq("order_id", order.id).order("created_at", { ascending: false }),
  ]);

  let answers: { question_text: string; answer_text: string | null }[] = [];
  if (form) {
    const { data: questions } = await admin
      .from("briefing_questions")
      .select("id, question_text")
      .eq("briefing_form_id", form.id);
    const { data: rawAnswers } = await admin
      .from("briefing_answers")
      .select("question_id, answer_text")
      .eq("order_id", order.id);

    answers = (questions ?? []).map((q) => ({
      question_text: q.question_text,
      answer_text: (rawAnswers ?? []).find((a) => a.question_id === q.id)?.answer_text ?? null,
    }));
  }

  return (
    <>
      <h2 className="mt-8 text-sm font-medium">Estágio do projeto</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {STAGES.map((s) => (
          <form key={s} action={updateManualServiceStage.bind(null, order.order_number, s)}>
            <button
              type="submit"
              className={`rounded-md px-2.5 py-1.5 text-xs font-medium ${
                order.manual_service_stage === s
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground"
              }`}
            >
              {MANUAL_SERVICE_STAGE_LABELS[s]}
            </button>
          </form>
        ))}
      </div>

      {answers.length > 0 && (
        <>
          <h2 className="mt-8 text-sm font-medium">Respostas do briefing</h2>
          <div className="mt-3 flex flex-col gap-3">
            {answers.map((a) => (
              <div key={a.question_text} className="rounded-xl border border-border bg-card p-4">
                <p className="text-xs font-medium text-muted-foreground">{a.question_text}</p>
                <p className="mt-1 text-sm text-foreground">{a.answer_text ?? "—"}</p>
              </div>
            ))}
          </div>
        </>
      )}

      <h2 className="mt-8 text-sm font-medium">Entregas</h2>
      <div className="mt-3 flex flex-col gap-3">
        {(deliveries ?? []).map((d) => (
          <div key={d.id} className="rounded-xl border border-border bg-card p-4 text-sm">
            <p className="font-medium">{d.title}</p>
            {d.description && <p className="mt-1 text-muted-foreground">{d.description}</p>}
          </div>
        ))}

        <details className="rounded-xl border border-dashed border-border">
          <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-primary">+ Nova entrega</summary>
          <div className="border-t border-border p-4">
            <form
              action={addProjectDelivery.bind(null, order.id, order.order_number)}
              className="flex flex-col gap-3"
            >
              <Input name="title" placeholder="Título da entrega" required />
              <Input name="description" placeholder="Descrição (opcional)" />
              <Input name="file_url" placeholder="Link do arquivo (opcional)" />
              <Button type="submit" size="sm" className="w-fit">
                Registrar entrega
              </Button>
            </form>
          </div>
        </details>
      </div>

      <h2 className="mt-8 text-sm font-medium">Mensagens</h2>
      <div className="mt-3 flex flex-col gap-3">
        {(messages ?? []).map((m) => (
          <div
            key={m.id}
            className={`max-w-[85%] rounded-xl border p-3 text-sm ${
              m.sender === "admin" ? "self-end border-primary/30 bg-primary/5" : "self-start border-border bg-card"
            }`}
          >
            <p className="mb-1 text-xs font-medium text-muted-foreground">
              {m.sender === "admin" ? "Equipe" : "Cliente"}
            </p>
            {m.message}
          </div>
        ))}

        <form action={addProjectMessage.bind(null, order.id, order.order_number)} className="flex flex-col gap-2">
          <textarea
            name="message"
            rows={2}
            placeholder="Responder ao cliente..."
            className="rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm"
            required
          />
          <Button type="submit" size="sm" className="w-fit">
            Enviar
          </Button>
        </form>
      </div>
    </>
  );
}
