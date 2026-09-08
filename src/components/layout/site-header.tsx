import Link from "next/link";
import { Sparkles, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BRAND } from "@/lib/brand";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { MobileNav } from "./mobile-nav";

export async function SiteHeader() {
  let user = null;
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    user = authUser;
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </span>
          <span className="text-lg">{BRAND.name}</span>
        </Link>

        <nav className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex">
          <Link href="/servicos" className="transition-colors hover:text-foreground">
            Serviços
          </Link>
          <Link href="/#como-funciona" className="transition-colors hover:text-foreground">
            Como funciona
          </Link>
          <Link href="/contato" className="transition-colors hover:text-foreground">
            Contato
          </Link>
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <Button asChild variant="ghost">
              <Link href="/minha-conta">
                <User className="h-4 w-4" />
                Minha conta
              </Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost">
                <Link href="/login">Entrar</Link>
              </Button>
              <Button asChild>
                <Link href="/servicos">Começar agora</Link>
              </Button>
            </>
          )}
        </div>

        <MobileNav isAuthenticated={!!user} />
      </div>
    </header>
  );
}
