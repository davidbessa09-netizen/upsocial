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

// --- Fase 2: e-commerce modular (migrations 0004-0011) ---
export type ProductType = "AUTOMATED_SERVICE" | "DIGITAL_PRODUCT" | "MANUAL_SERVICE" | "SUBSCRIPTION" | "SAAS";
export type DeliveryType = "DOWNLOAD" | "EMAIL" | "ACCESS_LINK";
export type ManualServiceStage =
  | "BRIEFING_PENDING"
  | "BRIEFING_RECEIVED"
  | "IN_PROGRESS"
  | "WAITING_CLIENT"
  | "REVISION"
  | "DELIVERED"
  | "COMPLETED";
export type BriefingFieldType = "text" | "textarea" | "select" | "file" | "url";
export type SubscriptionStatus = "ACTIVE" | "PAST_DUE" | "CANCELED" | "EXPIRED";
export type BillingInterval = "MONTHLY" | "QUARTERLY" | "YEARLY";
export type ProductRelationType = "RELATED" | "UPSELL" | "CROSS_SELL";

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

export interface ProductCategory {
  id: string;
  parent_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  icon: string;
  display_order: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  product_type: ProductType;
  /** Obrigatórios apenas quando product_type = AUTOMATED_SERVICE. */
  platform_id: string | null;
  category_id: string | null;
  product_category_id: string | null;
  name: string;
  slug: string;
  description: string;
  short_description: string | null;
  input_field_type: InputFieldType;
  estimated_time: string | null;
  has_refill: boolean;
  refill_duration_days: number | null;
  /** DIGITAL_PRODUCT */
  download_limit: number | null;
  access_duration_days: number | null;
  delivery_type: DeliveryType | null;
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
  /** Usados apenas quando o produto pai é product_type = SUBSCRIPTION. */
  billing_interval: BillingInterval | null;
  trial_days: number | null;
  setup_fee_cents: number | null;
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
  product_type: ProductType;
  /** Obrigatórios apenas quando product_type = AUTOMATED_SERVICE. */
  platform_id: string | null;
  category_id: string | null;
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
  /** Preenchido apenas quando product_type = MANUAL_SERVICE. */
  manual_service_stage: ManualServiceStage | null;
  supplier_id: string | null;
  supplier_service_id: string | null;
  supplier_order_id: string | null;
  supplier_last_status: string | null;
  start_count: number | null;
  remains: number | null;
  admin_notes: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  referrer: string | null;
  landing_page_slug: string | null;
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

// ============================================================
// Fase 2: e-commerce modular
// ============================================================

// --- Digital products (0005) ---

export interface DigitalFile {
  id: string;
  product_id: string;
  file_name: string;
  storage_path: string;
  file_size_bytes: number | null;
  mime_type: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface CustomerDownload {
  id: string;
  order_id: string;
  digital_file_id: string;
  user_id: string;
  download_count: number;
  download_limit: number | null;
  expires_at: string | null;
  first_downloaded_at: string | null;
  last_downloaded_at: string | null;
  created_at: string;
}

// --- Manual services (0006) ---

export interface BriefingForm {
  id: string;
  product_id: string;
  title: string;
  description: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BriefingQuestion {
  id: string;
  briefing_form_id: string;
  question_text: string;
  field_type: BriefingFieldType;
  options: Record<string, unknown> | null;
  required: boolean;
  display_order: number;
  created_at: string;
}

export interface BriefingAnswer {
  id: string;
  order_id: string;
  question_id: string;
  answer_text: string | null;
  answer_file_url: string | null;
  created_at: string;
}

export interface ProjectDelivery {
  id: string;
  order_id: string;
  title: string;
  description: string | null;
  file_url: string | null;
  delivered_at: string;
  created_at: string;
}

export interface ProjectMessage {
  id: string;
  order_id: string;
  sender: TicketSender;
  sender_id: string | null;
  message: string;
  created_at: string;
}

// --- SaaS & subscriptions (0007) ---

export interface SaasApp {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SaasPlan {
  id: string;
  app_id: string;
  name: string;
  price_cents: number;
  billing_interval: BillingInterval | null;
  usage_limit: number | null;
  monthly_limit: number | null;
  active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface SaasSubscription {
  id: string;
  app_id: string;
  plan_id: string;
  user_id: string;
  order_id: string | null;
  status: SubscriptionStatus;
  started_at: string;
  current_period_end: string | null;
  canceled_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SaasUsage {
  id: string;
  subscription_id: string;
  period_start: string;
  period_end: string;
  usage_count: number;
  updated_at: string;
}

export interface ProductSubscription {
  id: string;
  order_id: string;
  product_id: string;
  package_id: string;
  user_id: string;
  status: SubscriptionStatus;
  started_at: string;
  trial_ends_at: string | null;
  current_period_end: string | null;
  canceled_at: string | null;
  created_at: string;
  updated_at: string;
}

// --- Bundles (0008) ---

export interface Bundle {
  id: string;
  product_id: string;
  discount_percent: number | null;
  created_at: string;
  updated_at: string;
}

export interface BundleItem {
  id: string;
  bundle_id: string;
  item_product_id: string;
  display_order: number;
  created_at: string;
}

// --- Landing pages (0009) ---

export interface ProductLandingPage {
  id: string;
  product_id: string;
  slug: string;
  headline: string;
  subheadline: string | null;
  hero_image_url: string | null;
  sections: unknown[];
  cta_text: string;
  seo_title: string | null;
  seo_description: string | null;
  pixel_config: Record<string, unknown>;
  active: boolean;
  created_at: string;
  updated_at: string;
}

// --- Relations (0010) ---

export interface ProductRelation {
  id: string;
  product_id: string;
  related_product_id: string;
  relation_type: ProductRelationType;
  display_order: number;
  created_at: string;
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
      product_categories: TableDef<ProductCategory>;
      digital_files: TableDef<DigitalFile>;
      customer_downloads: TableDef<CustomerDownload>;
      briefing_forms: TableDef<BriefingForm>;
      briefing_questions: TableDef<BriefingQuestion>;
      briefing_answers: TableDef<BriefingAnswer>;
      project_deliveries: TableDef<ProjectDelivery>;
      project_messages: TableDef<ProjectMessage>;
      saas_apps: TableDef<SaasApp>;
      saas_plans: TableDef<SaasPlan>;
      saas_subscriptions: TableDef<SaasSubscription>;
      saas_usage: TableDef<SaasUsage>;
      product_subscriptions: TableDef<ProductSubscription>;
      bundles: TableDef<Bundle>;
      bundle_items: TableDef<BundleItem>;
      product_landing_pages: TableDef<ProductLandingPage>;
      product_relations: TableDef<ProductRelation>;
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
      product_type: ProductType;
      delivery_type: DeliveryType;
      manual_service_stage: ManualServiceStage;
      briefing_field_type: BriefingFieldType;
      subscription_status: SubscriptionStatus;
      product_relation_type: ProductRelationType;
    };
  };
}
