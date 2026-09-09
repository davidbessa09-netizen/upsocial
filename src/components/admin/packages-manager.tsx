import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { formatCentsToBRL } from "@/lib/money";
import { createPackage, updatePackage, deletePackage } from "@/lib/admin/actions";
import type { Package, Supplier } from "@/types/database";

export function PackagesManager({
  productId,
  packages,
  suppliers,
}: {
  productId: string;
  packages: Package[];
  suppliers: Supplier[];
}) {
  return (
    <div className="flex flex-col gap-4">
      {packages.map((pkg) => (
        <details key={pkg.id} className="rounded-xl border border-border bg-card">
          <summary className="flex cursor-pointer items-center justify-between px-4 py-3 text-sm">
            <span className="font-medium">
              {pkg.name} — {pkg.quantity.toLocaleString("pt-BR")} un.
            </span>
            <span className="flex items-center gap-3 text-xs text-muted-foreground">
              {formatCentsToBRL(pkg.sale_price_cents)}
              <span className={pkg.active ? "text-primary" : ""}>{pkg.active ? "Ativo" : "Inativo"}</span>
            </span>
          </summary>

          <div className="border-t border-border p-4">
            <form action={updatePackage.bind(null, productId, pkg.id)} className="flex flex-col gap-4">
              <PackageFields pkg={pkg} suppliers={suppliers} />
              <div className="flex items-center gap-3">
                <Button type="submit" size="sm">
                  Salvar
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  variant="outline"
                  formAction={deletePackage.bind(null, productId, pkg.id)}
                >
                  Desativar
                </Button>
              </div>
            </form>
          </div>
        </details>
      ))}

      <details className="rounded-xl border border-dashed border-border">
        <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-primary">+ Adicionar pacote</summary>
        <div className="border-t border-border p-4">
          <form action={createPackage.bind(null, productId)} className="flex flex-col gap-4">
            <PackageFields suppliers={suppliers} />
            <Button type="submit" size="sm" className="w-fit">
              Adicionar pacote
            </Button>
          </form>
        </div>
      </details>
    </div>
  );
}

function PackageFields({ pkg, suppliers }: { pkg?: Package; suppliers: Supplier[] }) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label>Nome do pacote</Label>
          <Input name="name" defaultValue={pkg?.name} placeholder="PACOTE POPULAR" required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Quantidade</Label>
          <Input name="quantity" type="number" defaultValue={pkg?.quantity} required />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label>Preço de venda (R$)</Label>
          <Input
            name="sale_price"
            type="number"
            step="0.01"
            defaultValue={pkg ? pkg.sale_price_cents / 100 : undefined}
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Preço de custo (R$)</Label>
          <Input
            name="cost_price"
            type="number"
            step="0.01"
            defaultValue={pkg ? pkg.cost_price_cents / 100 : undefined}
            required
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label>Fornecedor</Label>
          <select
            name="supplier_id"
            defaultValue={pkg?.supplier_id ?? ""}
            className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
          >
            <option value="">—</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>ID do serviço no fornecedor</Label>
          <Input name="supplier_service_id" defaultValue={pkg?.supplier_service_id ?? ""} />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Selo (opcional)</Label>
        <Input name="badge" defaultValue={pkg?.badge ?? ""} placeholder="MAIS VENDIDO" />
      </div>

      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="is_best_seller" defaultChecked={pkg?.is_best_seller} className="h-4 w-4" />
          Marcar como mais vendido
        </label>
        {pkg && (
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="active" defaultChecked={pkg.active} className="h-4 w-4" />
            Ativo
          </label>
        )}
      </div>
    </>
  );
}
