import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = { title: "Termos de Uso" };

export default function TermsPage() {
  return (
    <LegalPage title="Termos de Uso" updatedAt="09 de setembro de 2026">
      <p>
        Estes Termos de Uso regulam o acesso e uso da plataforma {BRAND.name} ({BRAND.domain}).
        Ao criar uma conta ou realizar uma compra, você concorda com os termos abaixo.
      </p>

      <h2>1. Sobre a plataforma</h2>
      <p>
        O {BRAND.name} é um marketplace de produtos e serviços digitais, incluindo serviços
        automatizados para redes sociais, produtos digitais (ebooks, templates, packs), serviços
        executados manualmente, assinaturas e ferramentas. Cada produto tem sua própria descrição,
        prazo estimado e condições, disponíveis na página do produto antes da compra.
      </p>

      <h2>2. Cadastro e conta</h2>
      <p>
        Você é responsável por manter a confidencialidade da sua senha e por todas as atividades
        realizadas em sua conta. Não compartilhamos nem solicitamos sua senha de redes sociais ou
        de qualquer outro serviço em nenhum momento do processo de compra.
      </p>

      <h2>3. Compra e pagamento</h2>
      <p>
        Os preços exibidos são finais e incluem todos os custos do pedido, exceto quando indicado
        de outra forma. O pagamento é processado via PIX ou cartão de crédito através de gateways
        de pagamento parceiros. O pedido só é processado após a confirmação do pagamento.
      </p>

      <h2>4. Natureza dos serviços</h2>
      <p>
        Os serviços de redes sociais oferecidos dependem de fornecedores terceiros e das políticas
        de cada plataforma social, que podem mudar sem aviso prévio. Não garantimos resultado
        específico de engajamento, alcance, conversão em vendas ou qualquer métrica além da
        entrega da quantidade contratada, descrita na página de cada produto.
      </p>

      <h2>5. Cancelamento e reembolso</h2>
      <p>
        As condições de cancelamento e reembolso estão descritas em nossa{" "}
        <a href="/politica-de-reembolso" className="text-foreground underline">
          Política de Reembolso
        </a>
        .
      </p>

      <h2>6. Suporte</h2>
      <p>
        Dúvidas sobre pedidos, pagamentos ou produtos podem ser abertas através da área de suporte
        na sua conta ou pelo e-mail {BRAND.supportEmail}.
      </p>

      <h2>7. Alterações destes termos</h2>
      <p>
        Podemos atualizar estes termos periodicamente. A versão vigente estará sempre disponível
        nesta página.
      </p>
    </LegalPage>
  );
}
