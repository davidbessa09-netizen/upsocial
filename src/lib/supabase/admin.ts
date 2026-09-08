import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Cliente Supabase com SERVICE ROLE KEY — bypassa RLS totalmente.
 *
 * USO EXCLUSIVO EM CÓDIGO DE SERVIDOR:
 *   - Route handlers do /admin
 *   - Processamento de pedidos (checkout, webhooks de pagamento)
 *   - Integração com fornecedores
 *
 * NUNCA importar este arquivo em Client Components ou expor o resultado
 * ao browser. A service role key nunca deve sair do servidor.
 */
export function createAdminClient() {
  if (typeof window !== "undefined") {
    throw new Error(
      "createAdminClient() não pode ser chamado no browser. Use apenas em Server Components, Route Handlers ou Server Actions.",
    );
  }

  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
