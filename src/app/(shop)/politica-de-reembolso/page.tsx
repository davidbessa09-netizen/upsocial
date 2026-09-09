import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = { title: "Política de Reembolso" };

export default function RefundPolicyPage() {
  return (
    <LegalPage title="Política de Reembolso" updatedAt="09 de setembro de 2026">
      <p>
        As condições abaixo variam conforme o tipo de produto comprado. A descrição de cada
        produto pode detalhar condições específicas de reposição e garantia.
      </p>

      <h2>1. Serviços automatizados (redes sociais)</h2>
      <p>
        Reembolso integral é possível caso o pedido não tenha sido enviado ao fornecedor. Após o
        início do processamento, caso o serviço não seja entregue dentro do prazo estimado ou
        conforme as condições descritas no produto, oferecemos reprocessamento ou reembolso
        proporcional à parte não entregue. Reposição, quando disponível, segue o prazo indicado
        na página do produto.
      </p>

      <h2>2. Produtos digitais</h2>
      <p>
        Por se tratar de conteúdo entregue digitalmente e de acesso imediato após a compra, não
        oferecemos reembolso após o download ou acesso ao arquivo, exceto em caso de defeito
        comprovado no arquivo entregue.
      </p>

      <h2>3. Serviços manuais</h2>
      <p>
        Pedidos cancelados antes do início da produção (briefing) são reembolsáveis
        integralmente. Após o início da produção, o reembolso é proporcional ao trabalho já
        realizado.
      </p>

      <h2>4. Assinaturas e ferramentas SaaS</h2>
      <p>
        Assinaturas podem ser canceladas a qualquer momento; o cancelamento interrompe a
        renovação futura, sem reembolso do período já pago, salvo indicação em contrário na
        oferta.
      </p>

      <h2>5. Como solicitar</h2>
      <p>
        Solicitações de reembolso podem ser abertas pela área de suporte na sua conta,
        informando o número do pedido, ou pelo e-mail {BRAND.supportEmail}.
      </p>
    </LegalPage>
  );
}
