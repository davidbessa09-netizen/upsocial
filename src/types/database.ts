// ============================================================
// Tipos do banco de dados — espelham supabase/migrations/*.sql
// ============================================================
// Quando o projeto Supabase estiver linkado, este arquivo pode ser
// substituído por: `supabase gen types typescript --linked`
// ============================================================

export type UserRole = "customer" | "admin" | "support";
export type InputFieldType = "username" | "link" | "username_and_link";
export type OrderStatus =
  | "PENDING_PAYMENT"
  | "PAID"
  | "PROCESSING"
  | "PARTIAL"
  | "COMPLETED"
  | "CANCELED"
  | "REFUNDED"
  | "FAILED";
export type PaymentStatus = "PENDING" | "APPROVED" | "REJECTED" | "REFUNDED" | "EXPIRED" | "CANCELED";
export type PaymentMethod = "PIX" | "CREDIT_CARD";
export type CouponType = "PERCENTAGE" | "FIXED";
export type TicketCategory = "DUVIDA" | "PEDIDO" | "PAGAMENTO" | "REPOSICAO" | "OUTRO";
export type TicketStatus = "ABERTO" | "EM_ANDAMENTO" | "RESPONDIDO" | "FINALIZADO";
export type TicketSender = "customer" | "admin";

export interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Platform {
  id: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
  display_order: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  platform_id: string;
  name: string;
  slug: string;
  icon: string;
  description: string | null;
  display_order: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Supplier {
  id: string;
  name: string;
  api_url: string;
  api_key_encrypted: string;
  provider_type: string;
  active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  platform_id: string;
  category_id: string;
  name: string;
  slug: string;
  description: string;
  short_description: string | null;
  input_field_type: InputFieldType;
  estimated_time: string | null;
  has_refill: boolean;
  refill_duration_days: number | null;
  active: boolean;
  featured: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

/** Pacote fechado — versão pública (sem custo/fornecedor) usada no client. */
export interface PackagePublic {
  id: string;
  product_id: string;
  name: string;
  quantity: number;
  sale_price_cents: number;
  badge: string | null;
  is_best_seller: boolean;
  active: boolean;
  display_order: number;
}

/** Pacote fechado — versão completa (admin-only). */
export interface Package extends PackagePublic {
  cost_price_cents: number;
  supplier_id: string | null;
  supplier_service_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Coupon {
  id: string;
  code: string;
  type: CouponType;
  discount_value: number;
  starts_at: string | null;
  ends_at: string | null;
  usage_limit: number | null;
  usage_count: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  user_id: string;
  platform_id: string;
  category_id: string;
  product_id: string;
  package_id: string;
  customer_input: string;
  quantity: number;
  sale_price_cents: number;
  cost_price_cents: number;
  profit_estimated_cents: number;
  coupon_id: string | null;
  discount_applied_cents: number;
  payment_status: PaymentStatus;
  order_status: OrderStatus;
  supplier_id: string | null;
  supplier_service_id: string | null;
  supplier_order_id: string | null;
  supplier_last_status: string | null;
  start_count: number | null;
  remains: number | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

/** Pedido — versão segura para exibir ao cliente (sem custo/fornecedor). */
export type OrderPublic = Omit<
  Order,
  | "cost_price_cents"
  | "profit_estimated_cents"
  | "supplier_id"
  | "supplier_service_id"
  | "supplier_order_id"
  | "supplier_last_status"
  | "admin_notes"
>;

export interface Payment {
  id: string;
  order_id: string;
  method: PaymentMethod;
  status: PaymentStatus;
  amount_cents: number;
  gateway: string;
  gateway_payment_id: string | null;
  gateway_status_detail: string | null;
  pix_qr_code: string | null;
  pix_qr_code_base64: string | null;
  pix_expires_at: string | null;
  raw_payload: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface SupportTicket {
  id: string;
  ticket_number: string;
  user_id: string;
  order_id: string | null;
  category: TicketCategory;
  subject: string;
  status: TicketStatus;
  created_at: string;
  updated_at: string;
}

export interface TicketMessage {
  id: string;
  ticket_id: string;
  sender: TicketSender;
  sender_id: string | null;
  message: string;
  created_at: string;
}

export interface Settings {
  key: string;
  value: Record<string, unknown>;
  updated_at: string;
}

// ------------------------------------------------------------
// Database generic type (formato esperado por @supabase/ssr)
// ------------------------------------------------------------

type TableDef<Row> = {
  Row: Row;
  Insert: Partial<Row>;
  Update: Partial<Row>;
};

export interface Database {
  public: {
    Tables: {
      profiles: TableDef<Profile>;
      platforms: TableDef<Platform>;
      categories: TableDef<Category>;
      suppliers: TableDef<Supplier>;
      products: TableDef<Product>;
      packages: TableDef<Package>;
      coupons: TableDef<Coupon>;
      orders: TableDef<Order>;
      payments: TableDef<Payment>;
      support_tickets: TableDef<SupportTicket>;
      ticket_messages: TableDef<TicketMessage>;
      settings: TableDef<Settings>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_role: UserRole;
      order_status: OrderStatus;
      payment_status: PaymentStatus;
      payment_method: PaymentMethod;
      coupon_type: CouponType;
      ticket_category: TicketCategory;
      ticket_status: TicketStatus;
    };
  };
}
