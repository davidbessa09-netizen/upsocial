import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCentsToBRL } from "@/lib/money";
import type { PackagePublic } from "@/types/database";

const CHECKLIST = [
  "Pedido simples",
  "Sem necessidade de senha",
  "Acompanhamento pelo painel",
];

export function PackageCard({
  pkg,
  productSlug,
  productName,
  hasRefill,
}: {
  pkg: PackagePublic;
  productSlug: string;
  productName: string;
  hasRefill: boolean;
}) {
  return (
    <div
      className={`relative flex flex-col rounded-2xl border bg-card/50 p-6 transition-all hover:-translate-y-1 hover:shadow-xl ${
        pkg.is_best_seller
          ? "border-primary shadow-lg shadow-primary/10"
          : "border-border/60 hover:border-primary/40"
      }`}
    >
      {pkg.badge && (
        <span className="absolute -top-3 left-6 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground shadow-md">
          {pkg.badge}
        </span>
      )}

      <p className="text-xs font-medium text-muted-foreground">{productName}</p>
      <p className="mt-1 text-xl font-bold tracking-tight">
        {pkg.quantity.toLocaleString("pt-BR")}
      </p>
      <p className="text-xs font-semibold tracking-wide text-primary uppercase">{pkg.name}</p>

      <p className="mt-4 text-3xl font-bold text-foreground">
        {formatCentsToBRL(pkg.sale_price_cents)}
      </p>

      <ul className="mt-5 flex flex-1 flex-col gap-2 text-sm text-muted-foreground">
        {CHECKLIST.map((item) => (
          <li key={item} className="flex items-center gap-2">
            <Check className="h-4 w-4 shrink-0 text-primary" />
            {item}
          </li>
        ))}
        {hasRefill && (
          <li className="flex items-center gap-2">
            <Check className="h-4 w-4 shrink-0 text-primary" />
            Reposição conforme condições do serviço
          </li>
        )}
      </ul>

      <Button
        className="mt-6 w-full"
        nativeButton={false}
        render={<Link href={`/produto/${productSlug}?pacote=${pkg.id}`} />}
      >
        Escolher pacote
      </Button>
    </div>
  );
}
