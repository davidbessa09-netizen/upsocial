"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Envio das respostas do briefing pelo cliente. Usa o client autenticado
 * (não admin) para o insert em briefing_answers — RLS
 * (briefing_answers_insert_own) garante que só o dono do pedido pode
 * responder. orders só é atualizável por staff via RLS
 * (orders_update_staff_only), então confirmamos a posse do pedido com o
 * client autenticado antes de usar o client admin para essa única
 * coluna (manual_service_stage) — nunca confiamos em orderId vindo do
 * form sem essa checagem.
 */
export async function submitBriefingAnswers(orderId: string, orderNumber: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: order } = await supabase
    .from("orders")
    .select("id, user_id")
    .eq("id", orderId)
    .maybeSingle();
  if (!order || order.user_id !== user.id) return;

  const entries = [...formData.entries()].filter(([key]) => key.startsWith("question_"));
  const rows = entries.map(([key, value]) => ({
    order_id: orderId,
    question_id: key.replace("question_", ""),
    answer_text: String(value),
  }));

  if (rows.length > 0) {
    const { error } = await supabase.from("briefing_answers").insert(rows);
    if (error) throw new Error(error.message);
  }

  const admin = createAdminClient();
  await admin.from("orders").update({ manual_service_stage: "BRIEFING_RECEIVED" }).eq("id", orderId);

  revalidatePath(`/pedido/${orderNumber}`);
}
