import type { Metadata } from "next";
import { getActivePlatforms } from "@/lib/catalog";
import { isSupabaseConfigured } from "@/lib/env";
import { SetupNotice } from "@/components/setup-notice";
import { PlatformGrid } from "@/components/home/platform-grid";

export const metadata: Metadata = {
  title: "Serviços",
  description: "Escolha a plataforma para ver os pacotes disponíveis.",
};

export default async function ServicosPage() {
  if (!isSupabaseConfigured()) return <SetupNotice />;

  const platforms = await getActivePlatforms();

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="max-w-2xl">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Serviços</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Escolha a plataforma para ver as categorias e pacotes disponíveis.
        </p>
      </div>

      <div className="mt-8">
        <PlatformGrid platforms={platforms} />
      </div>
    </div>
  );
}
