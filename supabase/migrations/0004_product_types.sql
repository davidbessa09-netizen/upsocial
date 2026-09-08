-- ============================================================
-- UP SOCIAL — Migration 0004: Product Types (evolução p/ e-commerce modular)
-- ============================================================
-- Transforma o catálogo de "só serviços de redes sociais" em um catálogo
-- multi-tipo: AUTOMATED_SERVICE, DIGITAL_PRODUCT, MANUAL_SERVICE,
-- SUBSCRIPTION, SAAS.
--
-- Compatibilidade: nenhuma coluna/tabela existente é removida. platform_id
-- e category_id em products/orders passam a ser opcionais (só continuam
-- obrigatórios para AUTOMATED_SERVICE, via CHECK). Os produtos sociais já
-- cadastrados (0003_seed.sql) permanecem válidos sem qualquer alteração de
-- dados, pois product_type assume 'AUTOMATED_SERVICE' por padrão.
-- ============================================================

create type product_type as enum (
  'AUTOMATED_SERVICE',
  'DIGITAL_PRODUCT',
  'MANUAL_SERVICE',
  'SUBSCRIPTION',
  'SAAS'
);

-- ------------------------------------------------------------
-- PRODUCT_CATEGORIES — taxonomia genérica e hierárquica,
-- independente de plataforma. Usada para navegação/vitrine do
-- e-commerce como um todo (não substitui `categories`, que continua
-- servindo à navegação específica de redes sociais por plataforma).
-- ------------------------------------------------------------

create table product_categories (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references product_categories(id) on delete set null,
  name text not null,
  slug text not null unique,
  description text,
  icon text not null default 'circle',
  display_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_product_categories_parent on product_categories(parent_id);

create trigger trg_product_categories_updated_at before update on product_categories
  for each row execute function set_updated_at();

insert into product_categories (id, name, slug, icon, display_order) values
  ('20000000-0000-0000-0000-000000000001', 'Redes Sociais',      'redes-sociais',      'Users',       1),
  ('20000000-0000-0000-0000-000000000002', 'Marketing Digital',  'marketing-digital',  'Megaphone',   2),
  ('20000000-0000-0000-0000-000000000003', 'Produtos Digitais',  'produtos-digitais',  'FileDown',    3),
  ('20000000-0000-0000-0000-000000000004', 'Ferramentas',        'ferramentas',        'Wrench',      4),
  ('20000000-0000-0000-0000-000000000005', 'Serviços',           'servicos',           'Briefcase',   5);

-- ------------------------------------------------------------
-- PRODUCTS — adiciona product_type + taxonomia genérica; relaxa
-- platform_id/category_id (agora exclusivos de AUTOMATED_SERVICE).
-- ------------------------------------------------------------

alter table products
  add column product_type product_type not null default 'AUTOMATED_SERVICE',
  add column product_category_id uuid references product_categories(id) on delete set null,
  add column download_limit integer,       -- usado por DIGITAL_PRODUCT (null = ilimitado)
  add column access_duration_days integer, -- usado por DIGITAL_PRODUCT (null = acesso vitalício)
  add column delivery_type text;           -- 'DOWNLOAD' | 'EMAIL' | 'ACCESS_LINK' — ver 0005

alter table products
  alter column platform_id drop not null,
  alter column category_id drop not null;

alter table products
  add constraint chk_products_automated_requires_platform
  check (
    product_type <> 'AUTOMATED_SERVICE'
    or (platform_id is not null and category_id is not null)
  );

create index idx_products_type on products(product_type);
create index idx_products_category_generic on products(product_category_id);

comment on column products.product_type is 'Define o fluxo de checkout/entrega. Ver src/lib/product-types.ts.';
comment on column products.product_category_id is 'Taxonomia genérica (product_categories) — não confundir com category_id, que é específico de redes sociais.';

-- Backfill: produtos sociais existentes ganham a categoria genérica "Redes Sociais"
update products
  set product_category_id = '20000000-0000-0000-0000-000000000001'
  where platform_id is not null;

-- ------------------------------------------------------------
-- ORDERS — mesma relaxação + snapshot de product_type (facilita
-- filtros/relatórios no admin sem precisar de join em products).
-- ------------------------------------------------------------

alter table orders
  add column product_type product_type not null default 'AUTOMATED_SERVICE';

alter table orders
  alter column platform_id drop not null,
  alter column category_id drop not null;

alter table orders
  add constraint chk_orders_automated_requires_platform
  check (
    product_type <> 'AUTOMATED_SERVICE'
    or (platform_id is not null and category_id is not null)
  );

create index idx_orders_product_type on orders(product_type);

-- ------------------------------------------------------------
-- PACKAGES — colunas opcionais de cobrança recorrente, usadas
-- apenas quando o produto pai é product_type = 'SUBSCRIPTION'.
-- Mantém packages como "SKU universal" para qualquer tipo de produto.
-- ------------------------------------------------------------

alter table packages
  add column billing_interval text,     -- 'MONTHLY' | 'QUARTERLY' | 'YEARLY' — null p/ produtos não recorrentes
  add column trial_days integer,
  add column setup_fee_cents integer;

comment on column packages.billing_interval is 'Usado apenas quando o produto pai é product_type = SUBSCRIPTION.';
