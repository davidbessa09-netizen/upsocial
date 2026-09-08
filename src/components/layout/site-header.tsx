import Link from "next/link";
import { User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BRAND } from "@/lib/brand";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { SearchBar } from "./search-bar";
import { CartButton } from "./cart-button";
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
    <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-lg">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-6 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-2 font-semibold tracking-tight">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <span className="text-sm font-bold">U</span>
          </span>
          <span className="hidden text-[15px] sm:inline">{BRAND.name}</span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex">
          <Link href="/catalogo" className="transition-colors hover:text-foreground">
            Explorar
          </Link>
          <Link href="/catalogo#categorias" className="transition-colors hover:text-foreground">
            Categorias
          </Link>
          <Link href="/ofertas" className="transition-colors hover:text-foreground">
            Ofertas
          </Link>
        </nav>

        <div className="hidden flex-1 justify-center px-4 lg:flex">
          <SearchBar className="w-full max-w-sm" />
        </div>

        <div className="ml-auto flex items-center gap-1.5">
          <CartButton />

          {user ? (
            <Button
              size="sm"
              variant="ghost"
              className="hidden md:inline-flex"
              nativeButton={false}
              render={<Link href="/minha-conta" />}
            >
              <User className="h-4 w-4" />
              Minha conta
            </Button>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              className="hidden md:inline-flex"
              nativeButton={false}
              render={<Link href="/login" />}
            >
              Entrar
            </Button>
          )}

          <MobileNav isAuthenticated={!!user} />
        </div>
      </div>
    </header>
  );
}
