import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { ProductForm } from "@/components/admin/product-form";
import { PackagesManager } from "@/components/admin/packages-manager";
import { BriefingManager } from "@/components/admin/briefing-manager";
import { updateProduct, deleteProduct } from "@/lib/admin/actions";
import { Button } from "@/components/ui/button";
import type { SaasPlan, SaasApp } from "@/types/database";

export const metadata: Metadata = { title: "Editar produto" };

type SaasPlanRow = SaasPlan & { saas_apps: Pick<SaasApp, "name"> | null };

type Params = { id: string };

export default async function EditProductPage({ params }: { params: Promise<Params> }) {
  const { id } = await params;
  const admin = createAdminClient();

  const { data: product } = await admin.from("products").select("*").eq("id", id).maybeSingle();
  if (!product) notFound();

  const [{ data: packages }, { data: suppliers }, { data: saasPlans }] = await Promise.all([
    admin.from("packages").select("*").eq("product_id", id).order("display_order"),
    admin.from("suppliers").select("*").eq("active", true),
    admin
      .from("saas_plans")
      .select("*, saas_apps(name)")
      .eq("active", true)
      .order("display_order")
      .returns<SaasPlanRow[]>(),
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
        <PackagesManager
          productId={id}
          productType={product.product_type}
          packages={packages ?? []}
          suppliers={suppliers ?? []}
          saasPlans={saasPlans ?? []}
        />
      </div>

      {product.product_type === "MANUAL_SERVICE" && (
        <>
          <h2 className="mt-10 text-sm font-medium">Briefing do projeto</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Perguntas que o cliente responde logo após o pagamento ser aprovado.
          </p>
          <div className="mt-3">
            <BriefingManager productId={id} />
          </div>
        </>
      )}
    </div>
  );
}
