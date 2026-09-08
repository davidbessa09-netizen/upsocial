import { Compass, PackageCheck, AtSign, CreditCard } from "lucide-react";

const STEPS = [
  {
    icon: Compass,
    title: "Escolha sua plataforma",
    description: "Instagram, TikTok, YouTube e outras — selecione onde você quer crescer.",
  },
  {
    icon: PackageCheck,
    title: "Selecione seu pacote",
    description: "Pacotes fechados e transparentes, sem complicação de quantidade livre.",
  },
  {
    icon: AtSign,
    title: "Informe seu perfil ou link",
    description: "Sem senha, sem risco. Só o essencial para processar seu pedido.",
  },
  {
    icon: CreditCard,
    title: "Pague e acompanhe",
    description: "PIX ou cartão. Depois, acompanhe tudo em tempo real no seu painel.",
  },
];

export function HowItWorks() {
  return (
    <section id="como-funciona" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Como funciona</h2>
        <p className="mt-3 text-muted-foreground">
          Do zero ao pedido concluído em menos de 2 minutos.
        </p>
      </div>

      <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((step, index) => (
          <div
            key={step.title}
            className="relative rounded-2xl border border-border/60 bg-card/50 p-6"
          >
            <span className="absolute -top-3 -left-3 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground shadow-lg shadow-primary/30">
              {index + 1}
            </span>
            <step.icon className="h-8 w-8 text-primary" strokeWidth={1.5} />
            <h3 className="mt-4 font-semibold">{step.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{step.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
