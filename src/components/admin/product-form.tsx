import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { createAdminClient } from "@/lib/supabase/admin";
import { PRODUCT_TYPE_LABELS } from "@/lib/product-types";
import type { Product } from "@/types/database";

const PRODUCT_TYPES = Object.keys(PRODUCT_TYPE_LABELS) as (keyof typeof PRODUCT_TYPE_LABELS)[];
const INPUT_FIELD_TYPES = [
  { value: "username", label: "@usuário" },
  { value: "link", label: "Link" },
  { value: "username_and_link", label: "@usuário e link" },
];

export async function ProductForm({
  product,
  action,
}: {
  product?: Product;
  action: (formData: FormData) => Promise<void>;
}) {
  const admin = createAdminClient();
  const [{ data: platforms }, { data: productCategories }] = await Promise.all([
    admin.from("platforms").select("id, name").order("display_order"),
    admin.from("product_categories").select("id, name").order("display_order"),
  ]);

  let categories: { id: string; name: string }[] = [];
  if (product?.platform_id) {
    const { data } = await admin.from("categories").select("id, name").eq("platform_id", product.platform_id);
    categories = data ?? [];
  }

  return (
    <form action={action} className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="name">Nome</Label>
          <Input id="name" name="name" defaultValue={product?.name} required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="slug">Slug</Label>
          <Input id="slug" name="slug" defaultValue={product?.slug} placeholder="gerado do nome se vazio" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="product_type">Tipo de produto</Label>
          <select
            id="product_type"
            name="product_type"
            defaultValue={product?.product_type ?? "AUTOMATED_SERVICE"}
            className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
          >
            {PRODUCT_TYPES.map((t) => (
              <option key={t} value={t}>
                {PRODUCT_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="product_category_id">Categoria (vitrine)</Label>
          <select
            id="product_category_id"
            name="product_category_id"
            defaultValue={product?.product_category_id ?? ""}
            className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
          >
            <option value="">—</option>
            {(productCategories ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="platform_id">Plataforma (apenas serviço automatizado)</Label>
          <select
            id="platform_id"
            name="platform_id"
            defaultValue={product?.platform_id ?? ""}
            className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
          >
            <option value="">—</option>
            {(platforms ?? []).map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="category_id">Categoria da plataforma</Label>
          <select
            id="category_id"
            name="category_id"
            defaultValue={product?.category_id ?? ""}
            className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
          >
            <option value="">—</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">Salve a plataforma e edite novamente para ver as categorias.</p>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="short_description">Descrição curta (usada nos cards)</Label>
        <Input id="short_description" name="short_description" defaultValue={product?.short_description ?? ""} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="description">Descrição completa</Label>
        <textarea
          id="description"
          name="description"
          defaultValue={product?.description}
          rows={4}
          className="rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="input_field_type">Campo solicitado ao cliente</Label>
          <select
            id="input_field_type"
            name="input_field_type"
            defaultValue={product?.input_field_type ?? "username"}
            className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
          >
            {INPUT_FIELD_TYPES.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="estimated_time">Prazo estimado</Label>
          <Input id="estimated_time" name="estimated_time" defaultValue={product?.estimated_time ?? ""} placeholder="0 a 24 horas" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="refill_duration_days">Reposição (dias)</Label>
          <Input
            id="refill_duration_days"
            name="refill_duration_days"
            type="number"
            defaultValue={product?.refill_duration_days ?? ""}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="download_limit">Limite de downloads (apenas Produto digital)</Label>
          <Input
            id="download_limit"
            name="download_limit"
            type="number"
            placeholder="Ilimitado"
            defaultValue={product?.download_limit ?? ""}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="access_duration_days">Acesso válido por (dias, apenas Produto digital)</Label>
          <Input
            id="access_duration_days"
            name="access_duration_days"
            type="number"
            placeholder="Vitalício"
            defaultValue={product?.access_duration_days ?? ""}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-6">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="has_refill" defaultChecked={product?.has_refill} className="h-4 w-4" />
          Possui reposição
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="featured" defaultChecked={product?.featured} className="h-4 w-4" />
          Destaque (mais vendidos)
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="active" defaultChecked={product?.active ?? true} className="h-4 w-4" />
          Ativo
        </label>
      </div>

      <Button type="submit" className="w-fit">
        {product ? "Salvar alterações" : "Criar produto"}
      </Button>
    </form>
  );
}
