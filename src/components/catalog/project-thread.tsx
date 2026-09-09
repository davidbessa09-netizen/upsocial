import { Download } from "lucide-react";
import { sendProjectMessage } from "@/lib/project-actions";
import type { ProjectMessage, ProjectDelivery } from "@/types/database";

export function ProjectThread({
  orderId,
  orderNumber,
  messages,
  deliveries,
}: {
  orderId: string;
  orderNumber: string;
  messages: ProjectMessage[];
  deliveries: ProjectDelivery[];
}) {
  return (
    <div className="flex flex-col gap-4">
      {deliveries.length > 0 && (
        <div className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold text-foreground">Entregas</h2>
          {deliveries.map((d) => (
            <div key={d.id} className="rounded-xl border border-primary/30 bg-primary/5 p-4">
              <p className="text-sm font-medium text-foreground">{d.title}</p>
              {d.description && <p className="mt-1 text-sm text-muted-foreground">{d.description}</p>}
              {d.file_url && (
                <a
                  href={d.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                >
                  <Download className="h-3.5 w-3.5" />
                  Baixar arquivo
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      <h2 className="text-sm font-semibold text-foreground">Mensagens</h2>
      <div className="flex flex-col gap-3">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`max-w-[85%] rounded-xl border p-3 text-sm ${
              m.sender === "customer"
                ? "self-end border-primary/30 bg-primary/5"
                : "self-start border-border bg-card"
            }`}
          >
            <p className="mb-1 text-xs font-medium text-muted-foreground">
              {m.sender === "customer" ? "Você" : "Equipe"}
            </p>
            {m.message}
          </div>
        ))}
        {messages.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma mensagem ainda.</p>}
      </div>

      <form action={sendProjectMessage.bind(null, orderId, orderNumber)} className="flex flex-col gap-2">
        <textarea
          name="message"
          rows={2}
          placeholder="Escreva uma mensagem para a equipe..."
          className="rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm"
          required
        />
        <button
          type="submit"
          className="w-fit rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
        >
          Enviar
        </button>
      </form>
    </div>
  );
}
