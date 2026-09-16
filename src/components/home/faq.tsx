import Link from "next/link";
import { ChevronDown } from "lucide-react";

/**
 * Respostas refletem exatamente o que já é verdade no produto (fluxo de
 * checkout, política de reembolso) — nada aqui é promessa que o site
 * não cumpre.
 */
const FAQ_ITEMS = [
  {
    question: "Preciso informar minha senha?",
    answer:
      "Não. Nunca pedimos senha de nenhuma rede social. Para processar o pedido, usamos apenas o @usuário ou o link do seu perfil/publicação, conforme o serviço.",
  },
  {
    question: "Quais as formas de pagamento?",
    answer: "PIX (aprovação em poucos minutos) ou cartão de crédito, ambos processados pelo Mercado Pago.",
  },
  {
    question: "Qual o prazo de entrega?",
    answer:
      "Varia por serviço — o prazo estimado aparece na página de cada produto antes da compra. A maioria dos pedidos de redes sociais começa a ser processada logo após o pagamento ser aprovado.",
  },
  {
    question: "E se o pedido não for concluído corretamente?",
    answer:
      "Produtos com reposição garantida são repostos dentro do prazo indicado na página do produto. Fora isso, nossa política de reembolso cobre reprocessamento ou devolução proporcional — os detalhes completos estão na página de Reembolso.",
    href: "/politica-de-reembolso",
    hrefLabel: "Ver política de reembolso",
  },
  {
    question: "Posso cancelar antes da entrega?",
    answer: "Sim, pedidos ainda não enviados para processamento podem ser cancelados com reembolso integral.",
  },
];

export function Faq() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <h2 className="text-center text-xl font-semibold tracking-tight sm:text-2xl">Perguntas frequentes</h2>

      <div className="mt-8 flex flex-col gap-3">
        {FAQ_ITEMS.map((item) => (
          <details key={item.question} className="group rounded-xl border border-border bg-card px-4 py-3.5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-medium text-foreground">
              {item.question}
              <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
            </summary>
            <p className="mt-2.5 text-sm text-muted-foreground">
              {item.answer}
              {item.href && (
                <>
                  {" "}
                  <Link href={item.href} className="font-medium text-primary hover:underline">
                    {item.hrefLabel}
                  </Link>
                  .
                </>
              )}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}
