import { Zap, ShieldCheck, Sparkles, Headset, RotateCcw, Lock } from "lucide-react";

const BENEFITS = [
  { icon: Zap, title: "Entrega rápida", description: "Acesso liberado assim que o pagamento é aprovado." },
  { icon: ShieldCheck, title: "Pagamento seguro", description: "PIX e cartão processados por gateways confiáveis." },
  { icon: Lock, title: "Sem senha", description: "Pedimos só seu @usuário ou link — nunca sua senha." },
  { icon: RotateCcw, title: "Reposição", description: "Produtos com garantia de reposição, conforme cada pacote." },
  { icon: Sparkles, title: "Produtos selecionados", description: "Curadoria própria — sem enrolação, sem promessa vazia." },
  { icon: Headset, title: "Suporte", description: "Time disponível para dúvidas antes e depois da compra." },
];

export function Benefits() {
  return (
    <section className="border-t border-border bg-secondary/30">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <h2 className="text-center text-xl font-semibold tracking-tight sm:text-2xl">
          Por que comprar na UP SOCIAL
        </h2>
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5">
          {BENEFITS.map((b) => (
            <div key={b.title} className="rounded-xl border border-border bg-card p-4 sm:p-5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <b.icon className="h-4.5 w-4.5" strokeWidth={1.75} />
              </span>
              <p className="mt-3 text-sm font-medium text-foreground">{b.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">{b.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
