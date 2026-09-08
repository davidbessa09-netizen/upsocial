import type {
  SupplierService,
  SupplierServiceInfo,
  CreateSupplierOrderInput,
  CreateSupplierOrderResult,
  SupplierOrderStatusResult,
  CreateRefillResult,
} from "./types";

/**
 * Fornecedor simulado para desenvolvimento e testes.
 *
 * NÃO envia nada a nenhuma API externa. Gera IDs falsos e simula avanço de
 * status ao longo do tempo com base no timestamp de criação embutido no ID,
 * para que o fluxo completo (PAID → PROCESSING → COMPLETED) possa ser
 * testado de ponta a ponta sem depender de um fornecedor real.
 *
 * Claramente identificado como MOCK — nunca deve ser usado em produção.
 * Trocar SUPPLIER_MODE=real e configurar um adapter real para produção.
 */
export class MockSupplierService implements SupplierService {
  private static readonly PROCESSING_DURATION_MS = 60_000; // simula 1 min de processamento

  async getServices(): Promise<SupplierServiceInfo[]> {
    return [
      { serviceId: "MOCK-IG-FOL-100", name: "[MOCK] Instagram Seguidores", min: 100, max: 10000, rateCentsPer1000: 900 },
      { serviceId: "MOCK-IG-LIK-100", name: "[MOCK] Instagram Curtidas", min: 50, max: 5000, rateCentsPer1000: 400 },
      { serviceId: "MOCK-YT-SUB-100", name: "[MOCK] YouTube Inscritos", min: 100, max: 5000, rateCentsPer1000: 1500 },
    ];
  }

  async createOrder(input: CreateSupplierOrderInput): Promise<CreateSupplierOrderResult> {
    const fakeId = `MOCK-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    return {
      supplierOrderId: fakeId,
      rawResponse: {
        mock: true,
        order: fakeId,
        serviceId: input.serviceId,
        target: input.target,
        quantity: input.quantity,
        createdAt: new Date().toISOString(),
      },
    };
  }

  async getOrderStatus(supplierOrderId: string): Promise<SupplierOrderStatusResult> {
    const createdAtMs = this.extractTimestamp(supplierOrderId);
    const elapsed = Date.now() - createdAtMs;

    if (elapsed < 0) {
      return { status: "PENDING", startCount: null, remains: null, rawResponse: { mock: true } };
    }

    if (elapsed < MockSupplierService.PROCESSING_DURATION_MS) {
      return {
        status: "IN_PROGRESS",
        startCount: 0,
        remains: Math.max(1, Math.floor(100 * (1 - elapsed / MockSupplierService.PROCESSING_DURATION_MS))),
        rawResponse: { mock: true, elapsed },
      };
    }

    return {
      status: "COMPLETED",
      startCount: 0,
      remains: 0,
      rawResponse: { mock: true, elapsed },
    };
  }

  async createRefill(supplierOrderId: string): Promise<CreateRefillResult> {
    return {
      refillId: `MOCK-REFILL-${Date.now()}`,
      rawResponse: { mock: true, originalOrder: supplierOrderId },
    };
  }

  async cancelOrder(supplierOrderId: string): Promise<{ success: boolean; rawResponse: unknown }> {
    return { success: true, rawResponse: { mock: true, canceled: supplierOrderId } };
  }

  private extractTimestamp(supplierOrderId: string): number {
    const match = supplierOrderId.match(/^MOCK-(\d+)-/);
    return match ? Number(match[1]) : Date.now();
  }
}
