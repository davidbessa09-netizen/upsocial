"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCentsToBRL } from "@/lib/money";
import type { InputFieldType, PackagePublic } from "@/types/database";

const FIELD_CONFIG: Record<InputFieldType, { label: string; placeholder: string }[]> = {
  username: [{ label: "@usuário", placeholder: "@seuusuario" }],
  link: [{ label: "Link da publicação/vídeo", placeholder: "https://..." }],
  username_and_link: [
    { label: "@usuário", placeholder: "@seuusuario" },
    { label: "Link", placeholder: "https://..." },
  ],
};

export function ProductPurchaseForm({
  packages,
  inputFieldType,
  productSlug,
}: {
  packages: PackagePublic[];
  inputFieldType: InputFieldType;
  productSlug: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselected = searchParams.get("pacote");

  const [selectedId, setSelectedId] = useState<string>(
    preselected && packages.some((p) => p.id === preselected)
      ? preselected
      : (packages.find((p) => p.is_best_seller)?.id ?? packages[0]?.id ?? ""),
  );
  const [values, setValues] = useState<string[]>(() =>
    FIELD_CONFIG[inputFieldType].map(() => ""),
  );

  const selectedPackage = useMemo(
    () => packages.find((p) => p.id === selectedId),
    [packages, selectedId],
  );

  const fields = FIELD_CONFIG[inputFieldType];
  const canSubmit = selectedPackage && values.every((v) => v.trim().length > 0);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || !selectedPackage) return;
    const customerInput = values.join(" | ");
    const params = new URLSearchParams({
      produto: productSlug,
      pacote: selectedPackage.id,
      input: customerInput,
    });
    router.push(`/checkout?${params.toString()}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div>
        <p className="mb-3 text-sm font-medium text-foreground">Escolha o pacote</p>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {packages.map((pkg) => {
            const active = pkg.id === selectedId;
            return (
              <button
                key={pkg.id}
                type="button"
                onClick={() => setSelectedId(pkg.id)}
                className={`relative flex items-center justify-between rounded-xl border p-3.5 text-left transition-all ${
                  active
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-border/60 hover:border-primary/40"
                }`}
              >
                <span>
                  <span className="block text-sm font-semibold">
                    {pkg.quantity.toLocaleString("pt-BR")} unidades
                  </span>
                  <span className="text-xs text-muted-foreground">{pkg.name}</span>
                </span>
                <span className="flex items-center gap-2">
                  <span className="font-bold">{formatCentsToBRL(pkg.sale_price_cents)}</span>
                  {active && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Check className="h-3 w-3" />
                    </span>
                  )}
                </span>
                {pkg.badge && (
                  <span className="absolute -top-2 left-3 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
                    {pkg.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {fields.map((field, i) => (
          <div key={field.label} className="flex flex-col gap-1.5">
            <Label htmlFor={`field-${i}`}>{field.label}</Label>
            <Input
              id={`field-${i}`}
              placeholder={field.placeholder}
              value={values[i]}
              onChange={(e) => {
                const next = [...values];
                next[i] = e.target.value;
                setValues(next);
              }}
              required
            />
          </div>
        ))}
        <p className="text-xs text-muted-foreground">
          Nunca solicitamos sua senha. Usamos apenas as informações acima para processar o pedido.
        </p>
      </div>

      <Button type="submit" size="lg" disabled={!canSubmit} className="w-full text-base">
        <ShoppingCart className="h-4 w-4" />
        Comprar agora
        {selectedPackage && ` — ${formatCentsToBRL(selectedPackage.sale_price_cents)}`}
      </Button>
    </form>
  );
}
