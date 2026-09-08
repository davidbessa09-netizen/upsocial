import { MockSupplierService } from "./mock-supplier";
import { GenericHttpSupplierService } from "./generic-http-supplier";
import type { SupplierService } from "./types";

export type { SupplierService } from "./types";
export * from "./types";

/**
 * Factory central de fornecedores.
 *
 * SUPPLIER_MODE=mock (padrão em dev) → usa MockSupplierService, que nunca
 * chama uma API externa. Trocar para "real" (e configurar SUPPLIER_API_URL/
 * SUPPLIER_API_KEY) apenas quando um fornecedor de produção for integrado.
 *
 * Chamar apenas em código de servidor (route handlers, jobs de
 * processamento). As credenciais nunca devem chegar ao client.
 */
export function getSupplierService(): SupplierService {
  const mode = process.env.SUPPLIER_MODE ?? "mock";

  if (mode === "mock") {
    return new MockSupplierService();
  }

  const apiUrl = process.env.SUPPLIER_API_URL;
  const apiKey = process.env.SUPPLIER_API_KEY;

  if (!apiUrl || !apiKey) {
    throw new Error(
      "SUPPLIER_MODE=real requer SUPPLIER_API_URL e SUPPLIER_API_KEY configurados em .env.local",
    );
  }

  return new GenericHttpSupplierService(apiUrl, apiKey);
}
