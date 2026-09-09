"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Copy, Check, Loader2, QrCode, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCentsToBRL } from "@/lib/money";
import { CardPaymentBrick, type CardFormData } from "./card-payment-brick";

type Method = "PIX" | "CREDIT_CARD";

type CheckoutState =
  | { step: "idle" }
  | { step: "loading" }
  | {
      step: "pix";
      orderNumber: string;
      pixQrCode: string;
      pixQrCodeBase64: string;
      amountCents: number;
    }
  | { step: "card-rejected"; message: string }
  | { step: "error"; message: string };

export function CheckoutClient({
  productSlug,
  packageId,
  customerInput,
  packagePriceCents,
  payerEmail,
}: {
  productSlug: string;
  packageId: string;
  customerInput: string;
  packagePriceCents: number;
  payerEmail: string;
}) {
  const router = useRouter();
  const [method, setMethod] = useState<Method>("PIX");
  const [state, setState] = useState<CheckoutState>({ step: "idle" });
  const [copied, setCopied] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function handlePayPix() {
    setState({ step: "loading" });
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productSlug, packageId, customerInput, method: "PIX" }),
      });
      const data = await res.json();

      if (!res.ok) {
        setState({ step: "error", message: data.error ?? "Não foi possível gerar o pagamento." });
        return;
      }

      setState({
        step: "pix",
        orderNumber: data.orderNumber,
        pixQrCode: data.pixQrCode,
        pixQrCodeBase64: data.pixQrCodeBase64,
        amountCents: data.amountCents,
      });
    } catch {
      setState({ step: "error", message: "Erro de conexão. Tente novamente." });
    }
  }

  async function handleCardSubmit(formData: CardFormData) {
    setState({ step: "loading" });
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productSlug,
          packageId,
          customerInput,
          method: "CREDIT_CARD",
          card: {
            token: formData.token,
            paymentMethodId: formData.payment_method_id,
            issuerId: formData.issuer_id,
            installments: formData.installments,
          },
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setState({ step: "error", message: data.error ?? "Não foi possível processar o cartão." });
        return;
      }

      if (data.status === "APPROVED") {
        router.push(`/pedido/${data.orderNumber}`);
        return;
      }

      if (data.status === "REJECTED") {
        setState({
          step: "card-rejected",
          message: "Pagamento recusado pela operadora do cartão. Tente outro cartão.",
        });
        return;
      }

      // PENDING/in_process — leva para a página de acompanhamento mesmo assim.
      router.push(`/pedido/${data.orderNumber}`);
    } catch {
      setState({ step: "error", message: "Erro de conexão. Tente novamente." });
    }
  }

  // Poll simples do status do pedido enquanto aguarda o pagamento PIX.
  useEffect(() => {
    if (state.step !== "pix") return;

    pollRef.current = setInterval(async () => {
      const res = await fetch(`/api/pedido/${state.orderNumber}/status`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.paymentStatus === "APPROVED") {
        if (pollRef.current) clearInterval(pollRef.current);
        router.push(`/pedido/${state.orderNumber}`);
      }
    }, 4000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [state, router]);

  function handleCopy() {
    if (state.step !== "pix") return;
    navigator.clipboard.writeText(state.pixQrCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (state.step === "pix") {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <p className="text-sm text-muted-foreground">
          Pedido <span className="font-medium text-foreground">{state.orderNumber}</span> criado.
          Escaneie o QR Code ou copie o código PIX.
        </p>

        <div className="rounded-xl border border-border bg-white p-3">
          <Image
            src={`data:image/png;base64,${state.pixQrCodeBase64}`}
            alt="QR Code PIX"
            width={220}
            height={220}
          />
        </div>

        <p className="text-2xl font-semibold">{formatCentsToBRL(state.amountCents)}</p>

        <Button variant="outline" onClick={handleCopy} className="w-full">
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? "Copiado!" : "Copiar código PIX"}
        </Button>

        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Aguardando confirmação do pagamento...
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setMethod("PIX")}
          className={`flex items-center justify-center gap-2 rounded-lg border p-2.5 text-sm font-medium transition-colors ${
            method === "PIX" ? "border-primary bg-primary/5 text-foreground" : "border-border text-muted-foreground"
          }`}
        >
          <QrCode className="h-4 w-4" />
          PIX
        </button>
        <button
          type="button"
          onClick={() => setMethod("CREDIT_CARD")}
          className={`flex items-center justify-center gap-2 rounded-lg border p-2.5 text-sm font-medium transition-colors ${
            method === "CREDIT_CARD"
              ? "border-primary bg-primary/5 text-foreground"
              : "border-border text-muted-foreground"
          }`}
        >
          <CreditCard className="h-4 w-4" />
          Cartão
        </button>
      </div>

      {(state.step === "error" || state.step === "card-rejected") && (
        <p className="text-sm text-destructive">{state.message}</p>
      )}

      {method === "PIX" ? (
        <Button size="lg" className="w-full" disabled={state.step === "loading"} onClick={handlePayPix}>
          {state.step === "loading" ? "Gerando PIX..." : `Pagar com PIX — ${formatCentsToBRL(packagePriceCents)}`}
        </Button>
      ) : (
        <CardPaymentBrick amount={packagePriceCents / 100} payerEmail={payerEmail} onSubmit={handleCardSubmit} />
      )}
    </div>
  );
}
