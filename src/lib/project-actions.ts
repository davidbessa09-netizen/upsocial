"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function sendProjectMessage(orderId: string, orderNumber: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const message = String(formData.get("message") ?? "").trim();
  if (!message) return;

  const { error } = await supabase.from("project_messages").insert({
    order_id: orderId,
    sender: "customer",
    sender_id: user.id,
    message,
  });
  if (error) throw new Error(error.message);

  revalidatePath(`/pedido/${orderNumber}`);
}
