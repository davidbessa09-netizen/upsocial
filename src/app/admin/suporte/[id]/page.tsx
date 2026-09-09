import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { Button } from "@/components/ui/button";
import { replyTicket, updateTicketStatus } from "@/lib/admin/actions";
import type { TicketStatus } from "@/types/database";

export const metadata: Metadata = { title: "Ticket de suporte" };

type Params = { id: string };

const STATUSES: TicketStatus[] = ["ABERTO", "EM_ANDAMENTO", "RESPONDIDO", "FINALIZADO"];

export default async function AdminTicketPage({ params }: { params: Promise<Params> }) {
  const { id } = await params;
  const admin = createAdminClient();

  const { data: ticket } = await admin.from("support_tickets").select("*").eq("id", id).maybeSingle();
  if (!ticket) notFound();

  const { data: messages } = await admin
    .from("ticket_messages")
    .select("*")
    .eq("ticket_id", id)
    .order("created_at", { ascending: true });

  return (
    <div className="max-w-2xl px-6 py-6 sm:px-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">{ticket.ticket_number}</p>
          <h1 className="text-xl font-semibold tracking-tight">{ticket.subject}</h1>
        </div>
        <div className="flex gap-2">
          {STATUSES.map((s) => (
            <form key={s} action={updateTicketStatus.bind(null, id, s)}>
              <button
                type="submit"
                className={`rounded-md px-2 py-1 text-xs font-medium ${
                  ticket.status === s ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                }`}
              >
                {s}
              </button>
            </form>
          ))}
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3">
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
        {(!messages || messages.length === 0) && (
          <p className="text-sm text-muted-foreground">Nenhuma mensagem ainda.</p>
        )}
      </div>

      <form action={replyTicket.bind(null, id)} className="mt-6 flex flex-col gap-3">
        <textarea
          name="message"
          rows={3}
          placeholder="Escreva uma resposta..."
          className="rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm"
          required
        />
        <Button type="submit" size="sm" className="w-fit">
          Enviar resposta
        </Button>
      </form>
    </div>
  );
}
