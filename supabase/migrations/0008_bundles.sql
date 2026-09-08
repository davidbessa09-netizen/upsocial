-- ============================================================
-- UP SOCIAL — Migration 0008: Bundles (Packs)
-- ============================================================
-- Um "pack" (ex: PACK RESTAURANTE) é um product normal (qualquer
-- product_type) que, ao ser comprado, libera acesso a outros produtos
-- internos (ebook + templates + prompts + planilhas + serviços digitais).
-- ============================================================

create table bundles (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null unique references products(id) on delete cascade,
  discount_percent integer check (discount_percent between 0 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table bundles is 'Marca um product como pack/bundle. product_id é o produto "vitrine" vendido; os itens internos estão em bundle_items.';

create trigger trg_bundles_updated_at before update on bundles
  for each row execute function set_updated_at();

create table bundle_items (
  id uuid primary key default gen_random_uuid(),
  bundle_id uuid not null references bundles(id) on delete cascade,
  item_product_id uuid not null references products(id) on delete restrict,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (bundle_id, item_product_id)
);

create index idx_bundle_items_bundle on bundle_items(bundle_id);
create index idx_bundle_items_product on bundle_items(item_product_id);

comment on table bundle_items is 'Produtos internos liberados ao comprar o bundle. Ao aprovar o pagamento do produto-pack, o sistema deve conceder ao cliente o mesmo acesso que teria ao comprar cada item_product_id individualmente (ex: linhas em customer_downloads para DIGITAL_PRODUCT).';
