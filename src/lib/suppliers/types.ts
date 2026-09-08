// ============================================================
// Contrato comum que qualquer fornecedor SMM deve implementar.
// Isso permite trocar/adicionar fornecedores sem alterar o restante
// do sistema (checkout, processamento de pedidos, admin).
// ============================================================

export interface SupplierServiceInfo {
  serviceId: string;
  name: string;
  min: number;
  max: number;
  /** custo por 1000 unidades, em centavos, na moeda do fornecedor */
  rateCentsPer1000: number;
}

export interface CreateSupplierOrderInput {
  serviceId: string;
  /** @usuário, link, ou "usuario|link" dependendo do produto */
  target: string;
  quantity: number;
}

export interface CreateSupplierOrderResult {
  supplierOrderId: string;
  rawResponse: unknown;
}

export type SupplierOrderStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "PARTIAL"
  | "CANCELED"
  | "FAILED";

export interface SupplierOrderStatusResult {
  status: SupplierOrderStatus;
  startCount: number | null;
  remains: number | null;
  rawResponse: unknown;
}

export interface CreateRefillResult {
  refillId: string;
  rawResponse: unknown;
}

/**
 * Interface que toda integração de fornecedor deve implementar.
 * Nenhuma chave de API deve transitar fora de implementações desta
 * interface — todas rodam exclusivamente em código de servidor.
 */
export interface SupplierService {
  getServices(): Promise<SupplierServiceInfo[]>;
  createOrder(input: CreateSupplierOrderInput): Promise<CreateSupplierOrderResult>;
  getOrderStatus(supplierOrderId: string): Promise<SupplierOrderStatusResult>;
  createRefill(supplierOrderId: string): Promise<CreateRefillResult>;
  cancelOrder(supplierOrderId: string): Promise<{ success: boolean; rawResponse: unknown }>;
}
