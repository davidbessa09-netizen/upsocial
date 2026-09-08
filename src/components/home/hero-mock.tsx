import { Search, TrendingUp, Users, Sparkles } from "lucide-react";

/**
 * Ilustração abstrata de "produto/interface" para o hero — não é um
 * screenshot real, é uma composição minimalista que sugere um painel de
 * produto sem competir visualmente com a headline.
 */
export function HeroMock() {
  return (
    <div className="relative mx-auto w-full max-w-md rounded-2xl border border-border bg-card p-4 shadow-2xl shadow-black/40">
      <div className="flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full bg-border" />
        <span className="h-2.5 w-2.5 rounded-full bg-border" />
        <span className="h-2.5 w-2.5 rounded-full bg-border" />
        <div className="ml-3 flex h-6 flex-1 items-center rounded-md bg-secondary px-2 text-[11px] text-muted-foreground">
          <Search className="mr-1.5 h-3 w-3" />
          upsocial.com/catalogo
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2.5">
        <div className="col-span-2 rounded-lg border border-border bg-secondary/60 p-3">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-medium text-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Pack Empreendedor
            </span>
            <span className="text-xs font-semibold text-primary">R$ 79,90</span>
          </div>
          <div className="mt-2 h-1.5 w-3/4 rounded-full bg-border" />
        </div>

        <div className="rounded-lg border border-border p-3">
          <Users className="h-4 w-4 text-muted-foreground" />
          <div className="mt-2 h-1.5 w-full rounded-full bg-border" />
          <div className="mt-1.5 h-1.5 w-2/3 rounded-full bg-border" />
        </div>

        <div className="rounded-lg border border-border p-3">
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
          <div className="mt-2 h-1.5 w-full rounded-full bg-border" />
          <div className="mt-1.5 h-1.5 w-1/2 rounded-full bg-border" />
        </div>
      </div>
    </div>
  );
}
