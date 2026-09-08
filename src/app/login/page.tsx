import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Separator } from "@/components/ui/separator";
import { AuthCard } from "@/components/auth/auth-card";
import { LoginForm } from "@/components/auth/login-form";
import { GoogleButton } from "@/components/auth/google-button";

export const metadata: Metadata = {
  title: "Entrar",
};

export default function LoginPage() {
  return (
    <AuthCard
      title="Entrar"
      subtitle="Acesse sua conta para acompanhar seus pedidos."
      footer={
        <>
          Não tem uma conta?{" "}
          <Link href="/cadastro" className="font-medium text-foreground hover:underline">
            Criar conta
          </Link>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <GoogleButton />
        <div className="flex items-center gap-3">
          <Separator className="flex-1" />
          <span className="text-xs text-muted-foreground">ou</span>
          <Separator className="flex-1" />
        </div>
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </div>
    </AuthCard>
  );
}
