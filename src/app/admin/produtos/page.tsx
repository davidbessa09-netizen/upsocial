import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { Button } from "@/components/ui/button";
import { PRODUCT_TYPE_LABELS } from "@/lib/product-types";

export const metadata: Metadata = { title: "Produtos" };

export default async function AdminProductsPage() {
  const admin = createAdminClient();

  const { data: products } = await admin
    .from("products")
    .select("id, name, slug, product_type, active, featured, platform_id")
    .order("created_at", { ascending: false });

  const { data: packageCounts } = await admin.from("packages").select("product_id");
  const countByProduct = new Map<string, number>();
  (packageCounts ?? []).forEach((p) => countByProduct.set(p.product_id, (countByProduct.get(p.product_id) ?? 0) + 1));

  return (
    <div className="px-6 py-6 sm:px-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Produtos</h1>
        <Button size="sm" nativeButton={false} render={<Link href="/admin/produtos/novo" />}>
          <Plus className="h-4 w-4" />
          Novo produto
        </Button>
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="px-4 py-2.5 font-medium">Nome</th>
              <th className="px-4 py-2.5 font-medium">Tipo</th>
              <th className="px-4 py-2.5 font-medium">Pacotes</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
              <th className="px-4 py-2.5 font-medium">Destaque</th>
              <th className="px-4 py-2.5 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {(products ?? []).map((p) => (
              <tr key={p.id} className="border-b border-border last:border-0">
                <td className="px-4 py-2.5 font-medium">{p.name}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{PRODUCT_TYPE_LABELS[p.product_type]}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{countByProduct.get(p.id) ?? 0}</td>
                <td className="px-4 py-2.5">
                  <span
                    className={`rounded-md px-2 py-0.5 text-xs font-medium ${
                      p.active ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {p.active ? "Ativo" : "Inativo"}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-muted-foreground">{p.featured ? "Sim" : "—"}</td>
                <td className="px-4 py-2.5 text-right">
                  <Link href={`/admin/produtos/${p.id}`} className="text-xs font-medium text-primary hover:underline">
                    Editar
                  </Link>
                </td>
              </tr>
            ))}
            {(!products || products.length === 0) && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  Nenhum produto cadastrado ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
