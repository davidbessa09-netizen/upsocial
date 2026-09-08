-- ============================================================
-- UP SOCIAL — Migration 0010: Relações entre produtos (upsell/cross-sell)
-- ============================================================

create type product_relation_type as enum ('RELATED', 'UPSELL', 'CROSS_SELL');

create table product_relations (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  related_product_id uuid not null references products(id) on delete cascade,
  relation_type product_relation_type not null default 'RELATED',
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (product_id, related_product_id, relation_type),
  check (product_id <> related_product_id)
);

create index idx_product_relations_product on product_relations(product_id);
create index idx_product_relations_type on product_relations(relation_type);

comment on table product_relations is 'RELATED = "você também pode gostar" na página do produto. UPSELL/CROSS_SELL = ofertas futuras no checkout/pós-compra.';
