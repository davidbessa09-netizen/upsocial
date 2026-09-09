import type { Metadata } from "next";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "Suporte" };

const STATUS_LABELS: Record<string, string> = {
  ABERTO: "Aberto",
  EM_ANDAMENTO: "Em andamento",
  RESPONDIDO: "Respondido",
  FINALIZADO: "Finalizado",
};

export default async function AdminSupportPage() {
  const admin = createAdminClient();
  const { data: tickets } = await admin
    .from("support_tickets")
    .select("id, ticket_number, subject, category, status, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="px-6 py-6 sm:px-8">
      <h1 className="text-xl font-semibold tracking-tight">Suporte</h1>

      <div className="mt-6 overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="px-4 py-2.5 font-medium">Ticket</th>
              <th className="px-4 py-2.5 font-medium">Assunto</th>
              <th className="px-4 py-2.5 font-medium">Categoria</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
              <th className="px-4 py-2.5 font-medium">Data</th>
              <th className="px-4 py-2.5 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {(tickets ?? []).map((t) => (
              <tr key={t.id} className="border-b border-border last:border-0">
                <td className="px-4 py-2.5 font-medium">{t.ticket_number}</td>
                <td className="px-4 py-2.5">{t.subject}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{t.category}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{STATUS_LABELS[t.status]}</td>
                <td className="px-4 py-2.5 text-muted-foreground">
                  {new Date(t.created_at).toLocaleDateString("pt-BR")}
                </td>
                <td className="px-4 py-2.5 text-right">
                  <Link href={`/admin/suporte/${t.id}`} className="text-xs font-medium text-primary hover:underline">
                    Abrir
                  </Link>
                </td>
              </tr>
            ))}
            {(!tickets || tickets.length === 0) && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  Nenhum ticket de suporte ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
