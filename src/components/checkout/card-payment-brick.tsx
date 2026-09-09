"use client";

import { useEffect, useRef } from "react";
import Script from "next/script";

declare global {
  interface Window {
    MercadoPago: new (publicKey: string, options?: { locale?: string }) => {
      bricks: () => {
        create: (
          brickType: string,
          containerId: string,
          settings: Record<string, unknown>,
        ) => Promise<{ unmount: () => void }>;
      };
    };
  }
}

export interface CardFormData {
  token: string;
  payment_method_id: string;
  issuer_id?: string;
  installments: number;
}

export function CardPaymentBrick({
  amount,
  payerEmail,
  onSubmit,
  onReady,
}: {
  amount: number;
  payerEmail: string;
  onSubmit: (formData: CardFormData) => Promise<void>;
  onReady?: () => void;
}) {
  const containerId = "card-payment-brick-container";
  const brickControllerRef = useRef<{ unmount: () => void } | null>(null);
  const sdkReadyRef = useRef(false);

  function initBrick() {
    if (!window.MercadoPago || brickControllerRef.current || sdkReadyRef.current) return;
    sdkReadyRef.current = true;

    const publicKey = process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY;
    if (!publicKey) return;

    const mp = new window.MercadoPago(publicKey, { locale: "pt-BR" });

    mp.bricks()
      .create("cardPayment", containerId, {
        initialization: { amount, payer: { email: payerEmail } },
        callbacks: {
          onReady: () => onReady?.(),
          onSubmit: (formData: CardFormData) => onSubmit(formData),
          onError: (error: unknown) => console.error("Card Brick error:", error),
        },
      })
      .then((controller) => {
        brickControllerRef.current = controller;
      });
  }

  useEffect(() => {
    return () => {
      brickControllerRef.current?.unmount();
    };
  }, []);

  return (
    <>
      <Script src="https://sdk.mercadopago.com/js/v2" strategy="afterInteractive" onLoad={initBrick} />
      <div id={containerId} />
    </>
  );
}
