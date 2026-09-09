import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Confirma que o usuário autenticado é admin/support. proxy.ts já
 * bloqueia /admin no nível de rota; isso é defesa em profundidade caso
 * uma página seja acessada diretamente ou o proxy seja contornado.
 */
export async function requireStaff() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirect=/admin");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();

  if (!profile || (profile.role !== "admin" && profile.role !== "support")) {
    redirect("/");
  }

  return { user, role: profile.role };
}
