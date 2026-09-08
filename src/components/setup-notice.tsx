import { DatabaseZap } from "lucide-react";

/**
 * Exibido no lugar de páginas que dependem do banco quando o Supabase
 * ainda não foi configurado (.env.local com placeholders). Some assim que
 * NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY forem preenchidos.
 */
export function SetupNotice() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-4 px-4 py-24 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <DatabaseZap className="h-7 w-7" />
      </span>
      <h1 className="text-2xl font-semibold">Configuração pendente</h1>
      <p className="text-muted-foreground">
        Preencha <code className="rounded bg-muted px-1.5 py-0.5">NEXT_PUBLIC_SUPABASE_URL</code>,{" "}
        <code className="rounded bg-muted px-1.5 py-0.5">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> e{" "}
        <code className="rounded bg-muted px-1.5 py-0.5">SUPABASE_SERVICE_ROLE_KEY</code> em{" "}
        <code className="rounded bg-muted px-1.5 py-0.5">.env.local</code> e rode as migrations em{" "}
        <code className="rounded bg-muted px-1.5 py-0.5">supabase/migrations</code> para ativar o
        catálogo, o checkout e a área de conta.
      </p>
    </div>
  );
}
