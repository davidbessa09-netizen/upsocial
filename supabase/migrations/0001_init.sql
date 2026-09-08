-- ============================================================
-- UP SOCIAL — Migration 0001: Schema inicial
-- ============================================================
-- Convenções:
--   * auth.users (Supabase Auth) é a fonte de verdade de autenticação.
--   * profiles estende auth.users com dados de perfil/role.
--   * Todo valor monetário é armazenado em centavos (integer) para evitar
--     problemas de arredondamento com float.
--   * RLS habilitado em todas as tabelas. Acesso administrativo via
--     service role key (bypassa RLS) nas rotas de servidor do admin.
-- ============================================================

create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- ENUM TYPES
-- ------------------------------------------------------------

create type user_role as enum ('customer', 'admin', 'support');

create type input_field_type as enum ('username', 'link', 'username_and_link');

create type order_status as enum (
  'PENDING_PAYMENT',
  'PAID',
  'PROCESSING',
  'PARTIAL',
  'COMPLETED',
  'CANCELED',
  'REFUNDED',
  'FAILED'
);

create type payment_status as enum (
  'PENDING',
  'APPROVED',
  'REJECTED',
  'REFUNDED',
  'EXPIRED',
  'CANCELED'
);

create type payment_method as enum ('PIX', 'CREDIT_CARD');

create type coupon_type as enum ('PERCENTAGE', 'FIXED');

create type ticket_category as enum ('DUVIDA', 'PEDIDO', 'PAGAMENTO', 'REPOSICAO', 'OUTRO');

create type ticket_status as enum ('ABERTO', 'EM_ANDAMENTO', 'RESPONDIDO', 'FINALIZADO');

create type ticket_sender as enum ('customer', 'admin');

-- ------------------------------------------------------------
-- PROFILES (estende auth.users)
-- ------------------------------------------------------------

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  role user_role not null default 'customer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table profiles is 'Dados de perfil do usuário, estendendo auth.users. role controla acesso ao /admin.';

-- ------------------------------------------------------------
-- PLATFORMS (Instagram, TikTok, YouTube, ...)
-- ------------------------------------------------------------

create table platforms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  icon text not null default 'circle', -- nome do ícone lucide-react
  color text not null default '#8b5cf6', -- cor de destaque (hex) para UI
  display_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- CATEGORIES (Seguidores, Curtidas, ... por plataforma)
-- ------------------------------------------------------------

create table categories (
  id uuid primary key default gen_random_uuid(),
  platform_id uuid not null references platforms(id) on delete cascade,
  name text not null,
  slug text not null,
  icon text not null default 'circle',
  description text,
  display_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (platform_id, slug)
);

create index idx_categories_platform on categories(platform_id);

-- ------------------------------------------------------------
-- SUPPLIERS (fornecedores SMM — dados sensíveis, admin-only)
-- ------------------------------------------------------------

create table suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  api_url text not null,
  api_key_encrypted text not null, -- criptografado com ENCRYPTION_SECRET
  provider_type text not null default 'generic', -- 'mock' | 'generic' | outros adapters futuros
  active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table suppliers is 'Credenciais de fornecedores SMM. NUNCA expor via API pública. Acesso apenas server-side com service role.';

-- ------------------------------------------------------------
-- PRODUCTS (produto "lógico": ex. Instagram > Seguidores)
-- ------------------------------------------------------------

create table products (
  id uuid primary key default gen_random_uuid(),
  platform_id uuid not null references platforms(id) on delete restrict,
  category_id uuid not null references categories(id) on delete restrict,
  name text not null,
  slug text not null unique,
  description text not null default '',
  short_description text,
  input_field_type input_field_type not null default 'username',
  estimated_time text, -- texto livre, ex: "0-24 horas"
  has_refill boolean not null default false,
  refill_duration_days integer,
  active boolean not null default true,
  featured boolean not null default false,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_products_platform on products(platform_id);
create index idx_products_category on products(category_id);

-- ------------------------------------------------------------
-- PACKAGES (pacotes fechados de um produto)
-- ------------------------------------------------------------

create table packages (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  name text not null, -- "PACOTE POPULAR"
  quantity integer not null check (quantity > 0),
  sale_price_cents integer not null check (sale_price_cents >= 0),
  cost_price_cents integer not null check (cost_price_cents >= 0), -- NUNCA exposto ao cliente
  supplier_id uuid references suppliers(id) on delete set null,
  supplier_service_id text, -- ID do serviço no fornecedor — NUNCA exposto ao cliente
  badge text, -- ex: "MAIS VENDIDO", "MELHOR CUSTO"
  is_best_seller boolean not null default false,
  active boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_packages_product on packages(product_id);

comment on column packages.cost_price_cents is 'Preço de custo — visível apenas no admin, nunca em respostas de API públicas.';
comment on column packages.supplier_service_id is 'ID técnico do serviço no fornecedor — visível apenas no admin.';

-- ------------------------------------------------------------
-- COUPONS
-- ------------------------------------------------------------

create table coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  type coupon_type not null,
  discount_value integer not null check (discount_value > 0), -- % (1-100) ou centavos, conforme type
  starts_at timestamptz,
  ends_at timestamptz,
  usage_limit integer, -- null = ilimitado
  usage_count integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table coupon_usage (
  id uuid primary key default gen_random_uuid(),
  coupon_id uuid not null references coupons(id) on delete cascade,
  order_id uuid, -- FK adicionada depois que orders existir
  user_id uuid references auth.users(id) on delete set null,
  discount_applied_cents integer not null,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- ORDERS
-- ------------------------------------------------------------

create table orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique, -- ex: "UPS-2026-000123", gerado por trigger
  user_id uuid not null references auth.users(id) on delete restrict,

  platform_id uuid not null references platforms(id) on delete restrict,
  category_id uuid not null references categories(id) on delete restrict,
  product_id uuid not null references products(id) on delete restrict,
  package_id uuid not null references packages(id) on delete restrict,

  customer_input text not null, -- @usuário e/ou link informado pelo cliente
  quantity integer not null,

  sale_price_cents integer not null,   -- preço final cobrado (após cupom)
  cost_price_cents integer not null,   -- snapshot do custo no momento da compra
  profit_estimated_cents integer generated always as (sale_price_cents - cost_price_cents) stored,

  coupon_id uuid references coupons(id) on delete set null,
  discount_applied_cents integer not null default 0,

  payment_status payment_status not null default 'PENDING',
  order_status order_status not null default 'PENDING_PAYMENT',

  supplier_id uuid references suppliers(id) on delete set null,
  supplier_service_id text,
  supplier_order_id text, -- ID retornado pelo fornecedor após criação do pedido
  supplier_last_status text, -- status bruto retornado pelo fornecedor (debug/admin)

  start_count integer, -- contagem inicial informada pelo fornecedor, se disponível
  remains integer,     -- quantidade restante informada pelo fornecedor, se disponível

  admin_notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table coupon_usage
  add constraint coupon_usage_order_id_fkey
  foreign key (order_id) references orders(id) on delete cascade;

create index idx_orders_user on orders(user_id);
create index idx_orders_status on orders(order_status);
create index idx_orders_payment_status on orders(payment_status);
create index idx_orders_created_at on orders(created_at desc);
create unique index idx_orders_order_number on orders(order_number);

comment on column orders.cost_price_cents is 'Snapshot do custo no momento da venda — visível apenas no admin.';
comment on column orders.supplier_order_id is 'ID do pedido no fornecedor — visível apenas no admin.';

-- Sequência + trigger para gerar order_number legível (ex: UPS-2026-000123)
create sequence if not exists orders_number_seq start 1;

create or replace function generate_order_number()
returns trigger as $$
begin
  if new.order_number is null then
    new.order_number := 'UPS-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('orders_number_seq')::text, 6, '0');
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_orders_order_number
  before insert on orders
  for each row
  execute function generate_order_number();

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_orders_updated_at before update on orders
  for each row execute function set_updated_at();
create trigger trg_products_updated_at before update on products
  for each row execute function set_updated_at();
create trigger trg_packages_updated_at before update on packages
  for each row execute function set_updated_at();
create trigger trg_platforms_updated_at before update on platforms
  for each row execute function set_updated_at();
create trigger trg_categories_updated_at before update on categories
  for each row execute function set_updated_at();
create trigger trg_suppliers_updated_at before update on suppliers
  for each row execute function set_updated_at();
create trigger trg_coupons_updated_at before update on coupons
  for each row execute function set_updated_at();
create trigger trg_profiles_updated_at before update on profiles
  for each row execute function set_updated_at();

-- ------------------------------------------------------------
-- PAYMENTS (registro de transações de pagamento, 1:N com orders
-- para permitir retries)
-- ------------------------------------------------------------

create table payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  method payment_method not null,
  status payment_status not null default 'PENDING',
  amount_cents integer not null,
  gateway text not null default 'mercadopago',
  gateway_payment_id text, -- ID da transação no gateway
  gateway_status_detail text,
  pix_qr_code text,
  pix_qr_code_base64 text,
  pix_expires_at timestamptz,
  raw_payload jsonb, -- payload bruto do gateway (debug/auditoria)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_payments_order on payments(order_id);
create index idx_payments_gateway_id on payments(gateway_payment_id);

create trigger trg_payments_updated_at before update on payments
  for each row execute function set_updated_at();

-- ------------------------------------------------------------
-- SUPPORT TICKETS
-- ------------------------------------------------------------

create table support_tickets (
  id uuid primary key default gen_random_uuid(),
  ticket_number text not null unique,
  user_id uuid not null references auth.users(id) on delete cascade,
  order_id uuid references orders(id) on delete set null,
  category ticket_category not null,
  subject text not null,
  status ticket_status not null default 'ABERTO',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create sequence if not exists tickets_number_seq start 1;

create or replace function generate_ticket_number()
returns trigger as $$
begin
  if new.ticket_number is null then
    new.ticket_number := 'TK-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('tickets_number_seq')::text, 5, '0');
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_tickets_number before insert on support_tickets
  for each row execute function generate_ticket_number();

create trigger trg_tickets_updated_at before update on support_tickets
  for each row execute function set_updated_at();

create table ticket_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references support_tickets(id) on delete cascade,
  sender ticket_sender not null,
  sender_id uuid references auth.users(id) on delete set null,
  message text not null,
  created_at timestamptz not null default now()
);

create index idx_ticket_messages_ticket on ticket_messages(ticket_id);

-- ------------------------------------------------------------
-- SETTINGS (chave/valor, config global editável no admin)
-- ------------------------------------------------------------

create table settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

create trigger trg_settings_updated_at before update on settings
  for each row execute function set_updated_at();

insert into settings (key, value) values
  ('brand', '{"name": "UP SOCIAL", "logo_url": null, "primary_color": "#8b5cf6", "support_email": "suporte@upsocial.com"}'),
  ('checkout', '{"allow_guest_checkout": false}');

-- ------------------------------------------------------------
-- PROFILE AUTO-CREATE ON SIGNUP
-- ------------------------------------------------------------

create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, new.raw_user_meta_data->>'full_name', 'customer');
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
