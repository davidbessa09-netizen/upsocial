import Link from "next/link";
import { BRAND } from "@/lib/brand";

const LINKS = [
  { label: "Explorar", href: "/catalogo" },
  { label: "Ofertas", href: "/ofertas" },
  { label: "Termos", href: "/termos-de-uso" },
  { label: "Privacidade", href: "/politica-de-privacidade" },
  { label: "Reembolso", href: "/politica-de-reembolso" },
  { label: "Contato", href: "/contato" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border pb-20 md:pb-0">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-4 py-10 sm:flex-row sm:justify-between sm:px-6 lg:px-8">
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} {BRAND.name}
        </p>
        <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
          {LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="transition-colors hover:text-foreground">
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
