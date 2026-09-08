-- ============================================================
-- UP SOCIAL — Migration 0009: Landing Pages & Rastreamento de Marketing
-- ============================================================
-- Landing pages dedicadas por produto (para campanhas segmentadas por
-- nicho) e captura de UTM/referrer em cada pedido, para saber qual
-- anúncio/campanha/landing page gerou cada venda.
-- ============================================================

create table product_landing_pages (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  slug text not null unique, -- ex: "pack-restaurantes" -> /lp/pack-restaurantes
  headline text not null,
  subheadline text,
  hero_image_url text,
  sections jsonb not null default '[]', -- blocos de conteúdo editáveis (admin monta a página)
  cta_text text not null default 'Quero este pack',
  seo_title text,
  seo_description text,
  pixel_config jsonb not null default '{}', -- ex: {"meta_pixel_id": "...", "gtm_id": "..."}
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_landing_pages_product on product_landing_pages(product_id);

create trigger trg_landing_pages_updated_at before update on product_landing_pages
  for each row execute function set_updated_at();

comment on table product_landing_pages is 'Um produto pode ter 0..N landing pages (uma por segmento/campanha), cada uma com seu próprio slug, copy e pixels.';

-- ------------------------------------------------------------
-- ORDERS — rastreamento de origem da venda.
-- ------------------------------------------------------------

alter table orders
  add column utm_source text,
  add column utm_medium text,
  add column utm_campaign text,
  add column utm_content text,
  add column utm_term text,
  add column referrer text,
  add column landing_page_slug text;

comment on column orders.landing_page_slug is 'Slug de product_landing_pages (quando o pedido veio de uma LP específica) — não é FK para permitir manter o histórico mesmo se a LP for removida depois.';
