import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRight, Download } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { CustomerDownload } from "@/types/database";

export const metadata: Metadata = { title: "Meus downloads" };

type CustomerDownloadRow = CustomerDownload & {
  digital_files: { file_name: string; product_id: string } | null;
};

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("pt-BR");
}

export default async function MeusDownloadsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirect=/minha-conta/downloads");

  // digital_files só tem RLS de leitura para staff (metadados não devem vazar
  // pro client) — a listagem do próprio cliente precisa do client admin,
  // filtrando manualmente por user_id (nunca confiar em input externo aqui).
  const admin = createAdminClient();
  const { data: downloads } = await admin
    .from("customer_downloads")
    .select("*, digital_files(file_name, product_id)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .returns<CustomerDownloadRow[]>();

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/minha-conta" className="hover:text-foreground">
          Minha conta
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground">Meus downloads</span>
      </nav>

      <h1 className="mt-4 text-2xl font-semibold tracking-tight">Meus downloads</h1>

      {(!downloads || downloads.length === 0) && (
        <p className="mt-8 text-sm text-muted-foreground">Você ainda não tem nenhum produto digital liberado.</p>
      )}

      <div className="mt-8 flex flex-col gap-3">
        {(downloads ?? []).map((d) => {
          const expired = d.expires_at ? new Date(d.expires_at) < new Date() : false;
          const limitReached = d.download_limit !== null && d.download_count >= d.download_limit;
          const blocked = expired || limitReached;

          return (
            <div key={d.id} className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
              <div>
                <p className="text-sm font-medium text-foreground">{d.digital_files?.file_name ?? "Arquivo"}</p>
                <p className="text-xs text-muted-foreground">
                  {d.download_count} download{d.download_count === 1 ? "" : "s"}
                  {d.download_limit !== null ? ` de ${d.download_limit}` : ""}
                  {d.expires_at ? ` · válido até ${formatDate(d.expires_at)}` : ""}
                </p>
              </div>
              {blocked ? (
                <span className="rounded-md bg-secondary px-3 py-1.5 text-xs font-medium text-muted-foreground">
                  {expired ? "Expirado" : "Limite atingido"}
                </span>
              ) : (
                <a
                  href={`/api/downloads/${d.id}`}
                  className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                >
                  <Download className="h-3.5 w-3.5" />
                  Baixar
                </a>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
