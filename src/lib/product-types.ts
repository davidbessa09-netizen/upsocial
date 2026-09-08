import type { ProductType } from "@/types/database";

/**
 * Central de configuração por product_type. Usado pelo catálogo, pela
 * página de produto (para decidir o formulário certo) e pelo checkout
 * universal (para decidir o fluxo pós-pagamento).
 */
export const PRODUCT_TYPE_LABELS: Record<ProductType, string> = {
  AUTOMATED_SERVICE: "Serviço automatizado",
  DIGITAL_PRODUCT: "Produto digital",
  MANUAL_SERVICE: "Serviço manual",
  SUBSCRIPTION: "Assinatura",
  SAAS: "Ferramenta",
};

/**
 * O que acontece imediatamente após o pagamento ser aprovado, por tipo
 * de produto. Guia a implementação do checkout universal (Etapa 2+).
 */
export const PRODUCT_TYPE_POST_PAYMENT_FLOW: Record<ProductType, string> = {
  AUTOMATED_SERVICE: "Pedido enviado automaticamente ao fornecedor via SupplierService",
  DIGITAL_PRODUCT: "Acesso de download liberado (customer_downloads)",
  MANUAL_SERVICE: "Formulário de briefing é aberto para o cliente responder",
  SUBSCRIPTION: "Assinatura criada em product_subscriptions com status ACTIVE",
  SAAS: "Assinatura criada em saas_subscriptions com status ACTIVE",
};

/** Produtos que pedem @usuário/link (fluxo atual de redes sociais). */
export function requiresSocialInput(productType: ProductType): boolean {
  return productType === "AUTOMATED_SERVICE";
}

/** Produtos que liberam algo para download/acesso imediato após o pagamento. */
export function grantsImmediateAccess(productType: ProductType): boolean {
  return productType === "DIGITAL_PRODUCT" || productType === "SAAS" || productType === "SUBSCRIPTION";
}

/** Produtos que exigem preenchimento de briefing após o pagamento. */
export function requiresBriefing(productType: ProductType): boolean {
  return productType === "MANUAL_SERVICE";
}
