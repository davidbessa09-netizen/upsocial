import type { Metadata } from "next";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { AuthCard } from "@/components/auth/auth-card";
import { SignupForm } from "@/components/auth/signup-form";
import { GoogleButton } from "@/components/auth/google-button";

export const metadata: Metadata = {
  title: "Criar conta",
};

export default function CadastroPage() {
  return (
    <AuthCard
      title="Criar conta"
      subtitle="Leva menos de um minuto."
      footer={
        <>
          Já tem uma conta?{" "}
          <Link href="/login" className="font-medium text-foreground hover:underline">
            Entrar
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
        <SignupForm />
      </div>
    </AuthCard>
  );
}
