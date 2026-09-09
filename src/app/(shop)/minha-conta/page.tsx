import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Package, Download, Repeat, LifeBuoy } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "@/components/auth/logout-button";

export const metadata: Metadata = {
  title: "Minha conta",
};

const SECTIONS = [
  { icon: Package, label: "Meus pedidos", description: "Acompanhe o status das suas compras", href: null },
  {
    icon: Download,
    label: "Meus downloads",
    description: "Acesse seus produtos digitais",
    href: "/minha-conta/downloads",
  },
  {
    icon: Repeat,
    label: "Minhas assinaturas",
    description: "Ferramentas SaaS e produtos recorrentes",
    href: "/minha-conta/assinaturas",
  },
  { icon: LifeBuoy, label: "Suporte", description: "Abra ou acompanhe um ticket", href: null },
];

export default async function MinhaContaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirect=/minha-conta");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();

  const displayName = profile?.full_name || user.email?.split("@")[0] || "por aqui";

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Olá, {displayName}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
        </div>
        <LogoutButton />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {SECTIONS.map((section) => {
          const content = (
            <>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-foreground">
                <section.icon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-medium text-foreground">{section.label}</p>
                <p className="text-xs text-muted-foreground">{section.description}</p>
              </div>
            </>
          );

          return section.href ? (
            <Link
              key={section.label}
              href={section.href}
              className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/50"
            >
              {content}
            </Link>
          ) : (
            <div key={section.label} className="flex items-center gap-4 rounded-xl border border-border bg-card p-4">
              {content}
            </div>
          );
        })}
      </div>
    </div>
  );
}
