import type { Metadata } from "next";
import { Mail, LifeBuoy } from "lucide-react";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = { title: "Contato" };

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-14 text-center sm:px-6">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Fale com a gente</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Dúvidas sobre um pedido? Se você já tem uma conta, a forma mais rápida é abrir um ticket em{" "}
        <span className="text-foreground">Minha Conta → Suporte</span>.
      </p>

      <div className="mt-8 flex flex-col gap-3">
        <a
          href={`mailto:${BRAND.supportEmail}`}
          className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 text-left transition-colors hover:border-primary/50"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-foreground">
            <Mail className="h-5 w-5" />
          </span>
          <span>
            <span className="block text-sm font-medium text-foreground">E-mail</span>
            <span className="text-sm text-muted-foreground">{BRAND.supportEmail}</span>
          </span>
        </a>

        <a
          href="/minha-conta"
          className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 text-left transition-colors hover:border-primary/50"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-foreground">
            <LifeBuoy className="h-5 w-5" />
          </span>
          <span>
            <span className="block text-sm font-medium text-foreground">Central de suporte</span>
            <span className="text-sm text-muted-foreground">Acompanhe pedidos e abra tickets</span>
          </span>
        </a>
      </div>
    </div>
  );
}
