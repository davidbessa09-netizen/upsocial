import { Zap, ShieldCheck, Sparkles, Headset } from "lucide-react";

const BENEFITS = [
  { icon: Zap, title: "Entrega rápida", description: "Acesso liberado assim que o pagamento é aprovado." },
  { icon: ShieldCheck, title: "Pagamento seguro", description: "PIX e cartão processados por gateways confiáveis." },
  { icon: Sparkles, title: "Produtos selecionados", description: "Curadoria própria — sem enrolação, sem promessa vazia." },
  { icon: Headset, title: "Suporte", description: "Time disponível para dúvidas antes e depois da compra." },
];

export function Benefits() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
        {BENEFITS.map((b) => (
          <div key={b.title} className="flex flex-col items-start gap-2">
            <b.icon className="h-5 w-5 text-primary" strokeWidth={1.75} />
            <p className="text-sm font-medium text-foreground">{b.title}</p>
            <p className="text-xs text-muted-foreground">{b.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
