import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { ProductForm } from "@/components/admin/product-form";
import { PackagesManager } from "@/components/admin/packages-manager";
import { updateProduct, deleteProduct } from "@/lib/admin/actions";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Editar produto" };

type Params = { id: string };

export default async function EditProductPage({ params }: { params: Promise<Params> }) {
  const { id } = await params;
  const admin = createAdminClient();

  const { data: product } = await admin.from("products").select("*").eq("id", id).maybeSingle();
  if (!product) notFound();

  const [{ data: packages }, { data: suppliers }] = await Promise.all([
    admin.from("packages").select("*").eq("product_id", id).order("display_order"),
    admin.from("suppliers").select("*").eq("active", true),
  ]);

  return (
    <div className="max-w-2xl px-6 py-6 sm:px-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">{product.name}</h1>
        <form action={deleteProduct.bind(null, id)}>
          <Button type="submit" size="sm" variant="outline">
            Desativar produto
          </Button>
        </form>
      </div>

      <div className="mt-6">
        <ProductForm product={product} action={updateProduct.bind(null, id)} />
      </div>

      <h2 className="mt-10 text-sm font-medium">Pacotes</h2>
      <div className="mt-3">
        <PackagesManager productId={id} packages={packages ?? []} suppliers={suppliers ?? []} />
      </div>
    </div>
  );
}
