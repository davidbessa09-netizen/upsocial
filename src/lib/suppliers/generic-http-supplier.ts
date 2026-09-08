import type {
  SupplierService,
  SupplierServiceInfo,
  CreateSupplierOrderInput,
  CreateSupplierOrderResult,
  SupplierOrderStatusResult,
  CreateRefillResult,
  SupplierOrderStatus,
} from "./types";

/**
 * Adapter genérico para fornecedores SMM que seguem o padrão de API comum
 * do setor (action=services/add/status/refill/cancel via POST + api_key).
 *
 * Ajustar o mapeamento de campos/status conforme a documentação do
 * fornecedor real escolhido para produção. A URL e a chave vêm de
 * variáveis de ambiente — nunca hardcoded.
 */
export class GenericHttpSupplierService implements SupplierService {
  constructor(
    private readonly apiUrl: string,
    private readonly apiKey: string,
  ) {}

  private async call<T>(params: Record<string, string | number>): Promise<T> {
    const body = new URLSearchParams({
      key: this.apiKey,
      ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])),
    });

    const response = await fetch(this.apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Supplier API respondeu com status ${response.status}`);
    }

    return response.json() as Promise<T>;
  }

  async getServices(): Promise<SupplierServiceInfo[]> {
    const data = await this.call<
      Array<{ service: string; name: string; min: string; max: string; rate: string }>
    >({ action: "services" });

    return data.map((s) => ({
      serviceId: s.service,
      name: s.name,
      min: Number(s.min),
      max: Number(s.max),
      rateCentsPer1000: Math.round(Number(s.rate) * 100),
    }));
  }

  async createOrder(input: CreateSupplierOrderInput): Promise<CreateSupplierOrderResult> {
    const data = await this.call<{ order?: string; error?: string }>({
      action: "add",
      service: input.serviceId,
      link: input.target,
      quantity: input.quantity,
    });

    if (!data.order) {
      throw new Error(data.error ?? "Fornecedor não retornou order_id");
    }

    return { supplierOrderId: data.order, rawResponse: data };
  }

  async getOrderStatus(supplierOrderId: string): Promise<SupplierOrderStatusResult> {
    const data = await this.call<{
      status?: string;
      start_count?: string;
      remains?: string;
      error?: string;
    }>({ action: "status", order: supplierOrderId });

    return {
      status: this.mapStatus(data.status),
      startCount: data.start_count ? Number(data.start_count) : null,
      remains: data.remains ? Number(data.remains) : null,
      rawResponse: data,
    };
  }

  async createRefill(supplierOrderId: string): Promise<CreateRefillResult> {
    const data = await this.call<{ refill?: string; error?: string }>({
      action: "refill",
      order: supplierOrderId,
    });

    if (!data.refill) {
      throw new Error(data.error ?? "Fornecedor não retornou refill_id");
    }

    return { refillId: data.refill, rawResponse: data };
  }

  async cancelOrder(supplierOrderId: string): Promise<{ success: boolean; rawResponse: unknown }> {
    const data = await this.call<{ cancel?: string; error?: string }>({
      action: "cancel",
      order: supplierOrderId,
    });

    return { success: !data.error, rawResponse: data };
  }

  private mapStatus(raw: string | undefined): SupplierOrderStatus {
    switch ((raw ?? "").toLowerCase()) {
      case "completed":
        return "COMPLETED";
      case "in progress":
      case "processing":
        return "IN_PROGRESS";
      case "partial":
        return "PARTIAL";
      case "canceled":
      case "cancelled":
        return "CANCELED";
      case "pending":
        return "PENDING";
      default:
        return "FAILED";
    }
  }
}
