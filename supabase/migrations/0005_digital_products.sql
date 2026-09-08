-- ============================================================
-- UP SOCIAL — Migration 0005: Digital Products
-- ============================================================
-- Suporte a ebooks, packs, templates, arquivos, planilhas, prompts.
-- Arquivos NUNCA ficam em bucket público — apenas storage_path é
-- armazenado aqui; a URL de download é sempre uma signed URL gerada
-- server-side (service role) após validar que o pedido está pago e
-- dentro do limite/prazo de acesso.
-- ============================================================

create type delivery_type as enum ('DOWNLOAD', 'EMAIL', 'ACCESS_LINK');

alter table products
  alter column delivery_type type delivery_type using delivery_type::delivery_type;

-- ------------------------------------------------------------
-- DIGITAL_FILES — um produto pode ter 1..N arquivos (ex: pack com
-- vários templates). storage_path referencia um bucket PRIVADO do
-- Supabase Storage (ex: "digital-products").
-- ------------------------------------------------------------

create table digital_files (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  file_name text not null,
  storage_path text not null, -- caminho no bucket privado, nunca uma URL pública
  file_size_bytes bigint,
  mime_type text,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_digital_files_product on digital_files(product_id);

create trigger trg_digital_files_updated_at before update on digital_files
  for each row execute function set_updated_at();

comment on table digital_files is 'Metadados de arquivos digitais. O binário vive em bucket privado do Supabase Storage — download só via signed URL gerada no servidor após validar o pedido.';

-- ------------------------------------------------------------
-- CUSTOMER_DOWNLOADS — controla quantas vezes/até quando um cliente
-- pode baixar um arquivo, de acordo com products.download_limit /
-- products.access_duration_days no momento da compra.
-- ------------------------------------------------------------

create table customer_downloads (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  digital_file_id uuid not null references digital_files(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  download_count integer not null default 0,
  download_limit integer, -- snapshot de products.download_limit no momento da compra
  expires_at timestamptz, -- snapshot de (compra + access_duration_days), null = vitalício
  first_downloaded_at timestamptz,
  last_downloaded_at timestamptz,
  created_at timestamptz not null default now(),
  unique (order_id, digital_file_id)
);

create index idx_customer_downloads_user on customer_downloads(user_id);
create index idx_customer_downloads_order on customer_downloads(order_id);

comment on table customer_downloads is 'Uma linha por (pedido, arquivo). Toda liberação de download passa por aqui — nunca expor storage_path direto ao cliente.';
