import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getProductBySlug, getPackagesByProduct } from "@/lib/catalog";
import { getCartWithItems } from "@/lib/cart";
import { isSupabaseConfigured } from "@/lib/env";
import { isPaymentGatewayConfigured } from "@/lib/payments";
import { SetupNotice } from "@/components/setup-notice";
import { createClient } from "@/lib/supabase/server";
import { CheckoutClient } from "@/components/checkout/checkout-client";
import { formatCentsToBRL } from "@/lib/money";

export const metadata: Metadata = {
  title: "Checkout",
};

type SearchParams = {
  produto?: string;
  pacote?: string;
  input?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  lp?: string;
};

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  if (!isSupabaseConfigured()) return <SetupNotice />;

  const {
    produto: productSlug,
    pacote: packageId,
    input: customerInput,
    utm_source,
    utm_medium,
    utm_campaign,
    utm_content,
    utm_term,
    lp,
  } = await searchParams;
  const tracking = { utm_source, utm_medium, utm_campaign, utm_content, utm_term, landingPageSlug: lp };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const redirectTo = productSlug
      ? `/checkout?produto=${productSlug}&pacote=${packageId}&input=${customerInput}`
      : "/checkout";
    redirect(`/login?redirect=${encodeURIComponent(redirectTo)}`);
  }

  // --- Modo item único (vindo de "Comprar agora" na página de produto) ---
  if (productSlug && packageId && customerInput) {
    const product = await getProductBySlug(productSlug);
    if (!product) redirect("/catalogo");

    const packages = await getPackagesByProduct(product.id);
    const pkg = packages.find((p) => p.id === packageId);
    if (!pkg) redirect(`/produto/${productSlug}`);

    return (
      <div className="mx-auto max-w-md px-4 py-10 sm:px-6">
        <h1 className="text-xl font-semibold tracking-tight">Finalizar compra</h1>

        <div className="mt-6 rounded-xl border border-border bg-card p-5">
          <p className="text-xs font-medium text-muted-foreground">{product.name}</p>
          <p className="mt-0.5 text-sm font-semibold text-foreground">
            {pkg.quantity.toLocaleString("pt-BR")} — {pkg.name}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Para: {customerInput}</p>

          <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
            <span className="text-sm text-muted-foreground">Total</span>
            <span className="text-xl font-semibold">{formatCentsToBRL(pkg.sale_price_cents)}</span>
          </div>
        </div>

        <div className="mt-6">
          {isPaymentGatewayConfigured() ? (
            <CheckoutClient
              productSlug={productSlug}
              packageId={packageId}
              customerInput={customerInput}
              packagePriceCents={pkg.sale_price_cents}
              payerEmail={user.email!}
              tracking={tracking}
            />
          ) : (
            <GatewayNotConfiguredNotice />
          )}
        </div>
      </div>
    );
  }

  // --- Modo carrinho ---
  const items = await getCartWithItems(user.id);
  if (items.length === 0) redirect("/carrinho");

  const total = items.reduce((sum, i) => sum + i.unitPriceCents * i.quantity, 0);

  return (
    <div className="mx-auto max-w-md px-4 py-10 sm:px-6">
      <h1 className="text-xl font-semibold tracking-tight">Finalizar compra</h1>

      <div className="mt-6 flex flex-col gap-3 rounded-xl border border-border bg-card p-5">
        {items.map((item) => (
          <div key={item.cartItemId} className="flex items-center justify-between text-sm">
            <div>
              <p className="font-medium text-foreground">{item.productName}</p>
              <p className="text-xs text-muted-foreground">{item.packageName}</p>
            </div>
            <span className="font-semibold">{formatCentsToBRL(item.unitPriceCents * item.quantity)}</span>
          </div>
        ))}

        <div className="mt-2 flex items-center justify-between border-t border-border pt-4">
          <span className="text-sm text-muted-foreground">Total</span>
          <span className="text-xl font-semibold">{formatCentsToBRL(total)}</span>
        </div>
      </div>

      <div className="mt-6">
        {isPaymentGatewayConfigured() ? (
          <CheckoutClient fromCart packagePriceCents={total} payerEmail={user.email!} />
        ) : (
          <GatewayNotConfiguredNotice />
        )}
      </div>
    </div>
  );
}

function GatewayNotConfiguredNotice() {
  return (
    <p className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
      Pagamento ainda não configurado. Preencha{" "}
      <code className="rounded bg-secondary px-1.5 py-0.5">MERCADOPAGO_ACCESS_TOKEN</code> em{" "}
      <code className="rounded bg-secondary px-1.5 py-0.5">.env.local</code> para ativar o PIX.
    </p>
  );
}
