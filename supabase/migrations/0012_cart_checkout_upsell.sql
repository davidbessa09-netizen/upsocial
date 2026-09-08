-- ============================================================
-- UP SOCIAL — Migration 0012: Carrinho, Checkout Sessions, Order Items,
-- Order Bumps e Upsell
-- ============================================================
-- orders continua sendo o PEDIDO PRINCIPAL, sem nenhuma coluna removida ou
-- relaxada — todo código existente que lê orders.product_id/package_id/
-- sale_price_cents/etc continua funcionando (esses campos sempre refletem
-- o item MAIN do pedido). order_items é a nova fonte de verdade completa
-- (1..N linhas por pedido); pedidos antigos recebem backfill automático
-- abaixo, então tudo fica uniforme sem quebrar nada.
-- ============================================================

create type order_role as enum ('STANDARD', 'UPSELL');
create type item_role as enum ('MAIN', 'ORDER_BUMP');
create type order_item_status as enum ('PENDING', 'PROCESSING', 'PARTIAL', 'COMPLETED', 'CANCELED', 'FAILED');
create type checkout_session_status as enum ('OPEN', 'CONVERTED', 'ABANDONED', 'EXPIRED');

-- ------------------------------------------------------------
-- ORDERS — colunas aditivas para suportar upsell pós-compra e
-- totalização de múltiplos itens. Nada existente é alterado.
-- ------------------------------------------------------------

alter table orders
  add column parent_order_id uuid references orders(id) on delete set null,
  add column order_role order_role not null default 'STANDARD',
  add column subtotal_cents integer; -- soma dos itens antes do desconto; null em pedidos antigos (equivalente a sale_price_cents + discount_applied_cents)

create index idx_orders_parent on orders(parent_order_id);

comment on column orders.sale_price_cents is 'Valor TOTAL do pedido (soma de order_items - desconto). Em pedidos de item único, permanece idêntico ao preço do item, mantendo compatibilidade total com o comportamento anterior.';
comment on column orders.parent_order_id is 'Preenchido apenas quando order_role = UPSELL: aponta para o pedido original que originou a oferta.';

-- ------------------------------------------------------------
-- ORDER_ITEMS — detalhamento por produto dentro de um pedido.
-- ------------------------------------------------------------

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  item_role item_role not null default 'MAIN',

  product_type product_type not null,
  platform_id uuid references platforms(id) on delete restrict,
  category_id uuid references categories(id) on delete restrict,
  product_id uuid not null references products(id) on delete restrict,
  package_id uuid not null references packages(id) on delete restrict,

  customer_input text,
  quantity integer not null,

  unit_sale_price_cents integer not null,
  unit_cost_price_cents integer not null,

  item_status order_item_status not null default 'PENDING',
  manual_service_stage manual_service_stage,

  supplier_id uuid references suppliers(id) on delete set null,
  supplier_service_id text,
  supplier_order_id text,
  supplier_last_status text,
  start_count integer,
  remains integer,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_order_items_order on order_items(order_id);
create index idx_order_items_product on order_items(product_id);
create index idx_order_items_status on order_items(item_status);

create trigger trg_order_items_updated_at before update on order_items
  for each row execute function set_updated_at();

comment on table order_items is 'Fonte de verdade completa dos produtos de um pedido. orders.product_id/package_id continuam espelhando o item MAIN para compatibilidade.';

-- Backfill: todo pedido já existente ganha sua linha MAIN correspondente.
insert into order_items (
  order_id, item_role, product_type, platform_id, category_id, product_id, package_id,
  customer_input, quantity, unit_sale_price_cents, unit_cost_price_cents, item_status,
  manual_service_stage, supplier_id, supplier_service_id, supplier_order_id, supplier_last_status,
  start_count, remains, created_at, updated_at
)
select
  o.id, 'MAIN', o.product_type, o.platform_id, o.category_id, o.product_id, o.package_id,
  o.customer_input, o.quantity, o.sale_price_cents, o.cost_price_cents,
  case
    when o.order_status in ('PENDING_PAYMENT') then 'PENDING'
    when o.order_status in ('PROCESSING') then 'PROCESSING'
    when o.order_status in ('PARTIAL') then 'PARTIAL'
    when o.order_status in ('COMPLETED') then 'COMPLETED'
    when o.order_status in ('CANCELED', 'REFUNDED') then 'CANCELED'
    when o.order_status in ('FAILED') then 'FAILED'
    else 'PENDING'
  end::order_item_status,
  o.manual_service_stage, o.supplier_id, o.supplier_service_id, o.supplier_order_id, o.supplier_last_status,
  o.start_count, o.remains, o.created_at, o.updated_at
from orders o;

-- ------------------------------------------------------------
-- CARTS / CART_ITEMS
-- ------------------------------------------------------------

create table carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id) -- um carrinho ativo por usuário
);

create trigger trg_carts_updated_at before update on carts
  for each row execute function set_updated_at();

create table cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references carts(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  package_id uuid not null references packages(id) on delete cascade,
  customer_input text,
  quantity integer not null default 1 check (quantity > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (cart_id, product_id, package_id)
);

create index idx_cart_items_cart on cart_items(cart_id);

create trigger trg_cart_items_updated_at before update on cart_items
  for each row execute function set_updated_at();

-- ------------------------------------------------------------
-- CHECKOUT_SESSIONS — rascunho de compra: cupom, rastreamento de
-- campanha e bumps aceitos, antes de virar um `orders` de verdade.
-- ------------------------------------------------------------

create table checkout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  cart_id uuid references carts(id) on delete set null,
  coupon_id uuid references coupons(id) on delete set null,
  status checkout_session_status not null default 'OPEN',

  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  referrer text,
  landing_page_slug text,

  order_id uuid references orders(id) on delete set null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '2 hours')
);

create index idx_checkout_sessions_user on checkout_sessions(user_id);
create index idx_checkout_sessions_status on checkout_sessions(status);

create trigger trg_checkout_sessions_updated_at before update on checkout_sessions
  for each row execute function set_updated_at();

-- ------------------------------------------------------------
-- ORDER_BUMPS — oferta exibida DURANTE o checkout (pré-pagamento).
-- Se aceita, vira um order_items adicional (item_role='ORDER_BUMP')
-- no mesmo pedido/pagamento.
-- ------------------------------------------------------------

create table order_bumps (
  id uuid primary key default gen_random_uuid(),
  trigger_product_id uuid not null references products(id) on delete cascade,
  bump_product_id uuid not null references products(id) on delete cascade,
  headline text not null,
  description text,
  discount_percent integer check (discount_percent between 0 and 100),
  custom_price_cents integer, -- alternativa a discount_percent: preço fixo da oferta
  active boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (trigger_product_id <> bump_product_id)
);

create index idx_order_bumps_trigger on order_bumps(trigger_product_id);

create trigger trg_order_bumps_updated_at before update on order_bumps
  for each row execute function set_updated_at();

-- ------------------------------------------------------------
-- UPSELL_OFFERS — oferta exibida DEPOIS do pagamento aprovado
-- (tela de obrigado). Se aceita, gera um NOVO orders (order_role
-- ='UPSELL', parent_order_id = pedido original) com seu próprio
-- pagamento — não fazemos cobrança 1-click sem tokenização de cartão.
-- ------------------------------------------------------------

create table upsell_offers (
  id uuid primary key default gen_random_uuid(),
  trigger_product_id uuid not null references products(id) on delete cascade,
  offer_product_id uuid not null references products(id) on delete cascade,
  headline text not null,
  description text,
  discount_percent integer check (discount_percent between 0 and 100),
  custom_price_cents integer,
  active boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (trigger_product_id <> offer_product_id)
);

create index idx_upsell_offers_trigger on upsell_offers(trigger_product_id);

create trigger trg_upsell_offers_updated_at before update on upsell_offers
  for each row execute function set_updated_at();
