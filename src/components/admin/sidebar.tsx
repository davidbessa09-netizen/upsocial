"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Package, ShoppingCart, Tag, LifeBuoy, ArrowLeft } from "lucide-react";
import { BRAND } from "@/lib/brand";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/produtos", label: "Produtos", icon: Package },
  { href: "/admin/pedidos", label: "Pedidos", icon: ShoppingCart },
  { href: "/admin/cupons", label: "Cupons", icon: Tag },
  { href: "/admin/suporte", label: "Suporte", icon: LifeBuoy },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 border-r border-border bg-card/40 md:block">
      <div className="flex h-14 items-center gap-2 border-b border-border px-5 font-semibold">
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <span className="text-sm font-bold">U</span>
        </span>
        {BRAND.name}
        <span className="ml-auto rounded-md bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
          admin
        </span>
      </div>

      <nav className="flex flex-col gap-0.5 p-3">
        {NAV.map((item) => {
          const active = item.exact ? pathname === item.href : pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                active ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto p-3">
        <Link
          href="/"
          className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao site
        </Link>
      </div>
    </aside>
  );
}
