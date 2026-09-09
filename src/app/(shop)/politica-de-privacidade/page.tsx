import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = { title: "Política de Privacidade" };

export default function PrivacyPage() {
  return (
    <LegalPage title="Política de Privacidade" updatedAt="09 de setembro de 2026">
      <p>
        Esta política explica quais dados coletamos, por que os coletamos e como você pode
        controlá-los ao usar o {BRAND.name}.
      </p>

      <h2>1. Dados que coletamos</h2>
      <p>
        Coletamos os dados necessários para processar sua conta e seus pedidos: nome, e-mail,
        histórico de pedidos, e as informações que você mesmo informa em cada compra (como
        @usuário ou link do conteúdo, conforme o produto). Nunca coletamos senhas de redes
        sociais ou de outros serviços — nenhum produto exige isso.
      </p>

      <h2>2. Como usamos seus dados</h2>
      <p>
        Usamos seus dados para processar pedidos, entrar em contato sobre o status de compras e
        suporte, e melhorar a plataforma. Dados de pagamento são processados diretamente pelos
        gateways parceiros (Mercado Pago) — não armazenamos números de cartão de crédito em
        nossos servidores.
      </p>

      <h2>3. Compartilhamento com terceiros</h2>
      <p>
        Para executar serviços automatizados, repassamos ao fornecedor apenas o necessário para a
        entrega (ex: @usuário ou link informado), sem expor seus dados de conta ou pagamento.
      </p>

      <h2>4. Cookies</h2>
      <p>
        Usamos cookies essenciais para manter sua sessão de login. Não usamos cookies de
        rastreamento de terceiros sem seu consentimento.
      </p>

      <h2>5. Seus direitos</h2>
      <p>
        Você pode solicitar acesso, correção ou exclusão dos seus dados a qualquer momento pelo
        e-mail {BRAND.supportEmail}.
      </p>

      <h2>6. Segurança</h2>
      <p>
        Adotamos controles de acesso e criptografia para proteger seus dados. Nenhuma
        transmissão pela internet é 100% segura, mas trabalhamos continuamente para reduzir riscos.
      </p>
    </LegalPage>
  );
}
