import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Check, Circle, X } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getOrderByNumberForCurrentUser } from "@/lib/orders";
import { isSupabaseConfigured } from "@/lib/env";
import { SetupNotice } from "@/components/setup-notice";
import { formatCentsToBRL } from "@/lib/money";
import {
  ORDER_STATUS_LABELS,
  ORDER_TIMELINE_STEPS,
  MANUAL_SERVICE_STAGE_LABELS,
  getTimelineStepIndex,
  isErrorStatus,
} from "@/lib/order-status";
import { BriefingForm } from "@/components/catalog/briefing-form";
import { ProjectThread } from "@/components/catalog/project-thread";
import type { BriefingQuestion } from "@/types/database";

export const metadata: Metadata = {
  title: "Acompanhar pedido",
};

type Params = { order_number: string };

export default async function OrderTrackingPage({ params }: { params: Promise<Params> }) {
  if (!isSupabaseConfigured()) return <SetupNotice />;

  const { order_number: orderNumber } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?redirect=/pedido/${orderNumber}`);

  const order = await getOrderByNumberForCurrentUser(orderNumber);
  if (!order) notFound();

  const { data: product } = await supabase
    .from("products")
    .select("name")
    .eq("id", order.product_id)
    .maybeSingle();
  const { data: pkg } = await supabase
    .from("packages")
    .select("name, quantity")
    .eq("id", order.package_id)
    .maybeSingle();

  const currentStep = getTimelineStepIndex(order.order_status);
  const failed = isErrorStatus(order.order_status);
  const isManualService = order.product_type === "MANUAL_SERVICE";

  let briefingQuestions: BriefingQuestion[] = [];
  if (isManualService && order.manual_service_stage === "BRIEFING_PENDING") {
    const { data: form } = await supabase
      .from("briefing_forms")
      .select("id")
      .eq("product_id", order.product_id)
      .maybeSingle();
    if (form) {
      const { data: questions } = await supabase
        .from("briefing_questions")
        .select("*")
        .eq("briefing_form_id", form.id)
        .order("display_order");
      briefingQuestions = questions ?? [];
    }
  }

  const { data: projectMessages } = isManualService
    ? await supabase.from("project_messages").select("*").eq("order_id", order.id).order("created_at")
    : { data: [] };
  const { data: projectDeliveries } = isManualService
    ? await supabase.from("project_deliveries").select("*").eq("order_id", order.id).order("created_at")
    : { data: [] };

  return (
    <div className="mx-auto max-w-lg px-4 py-10 sm:px-6">
      <p className="text-xs font-medium text-muted-foreground">Pedido</p>
      <h1 className="text-xl font-semibold tracking-tight">{order.order_number}</h1>

      <div className="mt-6 rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Produto</span>
          <span className="font-medium text-foreground">{product?.name ?? "—"}</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Pacote</span>
          <span className="font-medium text-foreground">
            {pkg ? `${pkg.quantity.toLocaleString("pt-BR")} — ${pkg.name}` : "—"}
          </span>
        </div>
        <div className="mt-2 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Perfil/Link</span>
          <span className="font-medium text-foreground">{order.customer_input}</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Data</span>
          <span className="font-medium text-foreground">
            {new Date(order.created_at).toLocaleDateString("pt-BR")}
          </span>
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
          <span className="text-sm text-muted-foreground">Valor</span>
          <span className="text-lg font-semibold">{formatCentsToBRL(order.sale_price_cents)}</span>
        </div>
      </div>

      <div className="mt-8">
        <p className="mb-4 text-sm font-medium text-foreground">
          Status: {ORDER_STATUS_LABELS[order.order_status]}
        </p>

        {failed ? (
          <div className="flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            <X className="h-4 w-4 shrink-0" />
            {ORDER_STATUS_LABELS[order.order_status]}
          </div>
        ) : isManualService && order.order_status !== "PENDING_PAYMENT" ? (
          <p className="rounded-xl border border-border bg-card p-4 text-sm text-foreground">
            {order.manual_service_stage
              ? MANUAL_SERVICE_STAGE_LABELS[order.manual_service_stage]
              : ORDER_STATUS_LABELS[order.order_status]}
          </p>
        ) : (
          <ol className="flex flex-col gap-4">
            {ORDER_TIMELINE_STEPS.map((step, i) => {
              const done = i <= currentStep;
              return (
                <li key={step.key} className="flex items-center gap-3">
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                      done
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border text-muted-foreground"
                    }`}
                  >
                    {done ? <Check className="h-3.5 w-3.5" /> : <Circle className="h-2 w-2 fill-current" />}
                  </span>
                  <span className={done ? "text-sm text-foreground" : "text-sm text-muted-foreground"}>
                    {step.label}
                  </span>
                </li>
              );
            })}
          </ol>
        )}
      </div>

      {isManualService && order.manual_service_stage === "BRIEFING_PENDING" && briefingQuestions.length > 0 && (
        <div className="mt-6">
          <BriefingForm orderId={order.id} orderNumber={order.order_number} questions={briefingQuestions} />
        </div>
      )}

      {isManualService && order.manual_service_stage && order.manual_service_stage !== "BRIEFING_PENDING" && (
        <div className="mt-6">
          <ProjectThread
            orderId={order.id}
            orderNumber={order.order_number}
            messages={projectMessages ?? []}
            deliveries={projectDeliveries ?? []}
          />
        </div>
      )}
    </div>
  );
}
