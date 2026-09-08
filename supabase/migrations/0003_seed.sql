-- ============================================================
-- UP SOCIAL — Migration 0003: Seed inicial
-- ============================================================
-- Dados de exemplo (plataformas, categorias, fornecedor mock e alguns
-- produtos/pacotes). Tudo 100% editável depois via /admin.
-- ============================================================

-- ------------------------------------------------------------
-- SUPPLIER: MOCK (usado em desenvolvimento — nunca envia pedidos reais)
-- ------------------------------------------------------------

insert into suppliers (id, name, api_url, api_key_encrypted, provider_type, active, notes)
values (
  '00000000-0000-0000-0000-000000000001',
  'Mock Supplier (dev/test)',
  'https://mock.local/api',
  'mock-key-not-encrypted', -- em produção: valor sempre criptografado pela app antes do insert
  'mock',
  true,
  'Fornecedor simulado para desenvolvimento e testes. Não envia pedidos reais.'
);

-- ------------------------------------------------------------
-- PLATFORMS
-- ------------------------------------------------------------

-- Nota: "icon" referencia um nome de ícone genérico mapeado em
-- src/lib/icons.tsx (lucide-react não distribui mais logos de marca).
insert into platforms (id, name, slug, icon, color, display_order) values
  ('10000000-0000-0000-0000-000000000001', 'Instagram', 'instagram', 'Camera',    '#E1306C', 1),
  ('10000000-0000-0000-0000-000000000002', 'TikTok',    'tiktok',    'Music2',    '#000000', 2),
  ('10000000-0000-0000-0000-000000000003', 'YouTube',   'youtube',   'Tv',        '#FF0000', 3),
  ('10000000-0000-0000-0000-000000000004', 'Facebook',  'facebook',  'ThumbsUp',  '#1877F2', 4),
  ('10000000-0000-0000-0000-000000000005', 'Telegram',  'telegram',  'Send',      '#26A5E4', 5),
  ('10000000-0000-0000-0000-000000000006', 'Kwai',      'kwai',      'PlayCircle','#FF6E00', 6);

-- ------------------------------------------------------------
-- CATEGORIES
-- ------------------------------------------------------------

-- Instagram
insert into categories (platform_id, name, slug, icon, display_order) values
  ('10000000-0000-0000-0000-000000000001', 'Seguidores', 'seguidores', 'Users', 1),
  ('10000000-0000-0000-0000-000000000001', 'Curtidas', 'curtidas', 'Heart', 2),
  ('10000000-0000-0000-0000-000000000001', 'Visualizações', 'visualizacoes', 'Eye', 3),
  ('10000000-0000-0000-0000-000000000001', 'Visualizações de Reels', 'visualizacoes-reels', 'Clapperboard', 4),
  ('10000000-0000-0000-0000-000000000001', 'Visualizações de Stories', 'visualizacoes-stories', 'CircleDot', 5),
  ('10000000-0000-0000-0000-000000000001', 'Visitas ao Perfil', 'visitas-perfil', 'UserCheck', 6),
  ('10000000-0000-0000-0000-000000000001', 'Impressões', 'impressoes', 'TrendingUp', 7),
  ('10000000-0000-0000-0000-000000000001', 'Alcance', 'alcance', 'Radar', 8),
  ('10000000-0000-0000-0000-000000000001', 'Salvamentos', 'salvamentos', 'Bookmark', 9),
  ('10000000-0000-0000-0000-000000000001', 'Compartilhamentos', 'compartilhamentos', 'Share2', 10);

-- TikTok
insert into categories (platform_id, name, slug, icon, display_order) values
  ('10000000-0000-0000-0000-000000000002', 'Seguidores', 'seguidores', 'Users', 1),
  ('10000000-0000-0000-0000-000000000002', 'Curtidas', 'curtidas', 'Heart', 2),
  ('10000000-0000-0000-0000-000000000002', 'Visualizações', 'visualizacoes', 'Eye', 3),
  ('10000000-0000-0000-0000-000000000002', 'Compartilhamentos', 'compartilhamentos', 'Share2', 4);

-- YouTube
insert into categories (platform_id, name, slug, icon, display_order) values
  ('10000000-0000-0000-0000-000000000003', 'Inscritos', 'inscritos', 'Users', 1),
  ('10000000-0000-0000-0000-000000000003', 'Visualizações', 'visualizacoes', 'Eye', 2),
  ('10000000-0000-0000-0000-000000000003', 'Curtidas', 'curtidas', 'Heart', 3);

-- Facebook
insert into categories (platform_id, name, slug, icon, display_order) values
  ('10000000-0000-0000-0000-000000000004', 'Seguidores', 'seguidores', 'Users', 1),
  ('10000000-0000-0000-0000-000000000004', 'Curtidas', 'curtidas', 'Heart', 2),
  ('10000000-0000-0000-0000-000000000004', 'Visualizações', 'visualizacoes', 'Eye', 3),
  ('10000000-0000-0000-0000-000000000004', 'Reações', 'reacoes', 'Smile', 4);

-- Telegram
insert into categories (platform_id, name, slug, icon, display_order) values
  ('10000000-0000-0000-0000-000000000005', 'Membros', 'membros', 'Users', 1),
  ('10000000-0000-0000-0000-000000000005', 'Visualizações', 'visualizacoes', 'Eye', 2);

-- Kwai
insert into categories (platform_id, name, slug, icon, display_order) values
  ('10000000-0000-0000-0000-000000000006', 'Seguidores', 'seguidores', 'Users', 1),
  ('10000000-0000-0000-0000-000000000006', 'Curtidas', 'curtidas', 'Heart', 2),
  ('10000000-0000-0000-0000-000000000006', 'Visualizações', 'visualizacoes', 'Eye', 3);

-- ------------------------------------------------------------
-- PRODUTO DE EXEMPLO: Instagram > Seguidores
-- (todos os valores abaixo são EXEMPLO — editar livremente no /admin)
-- ------------------------------------------------------------

do $$
declare
  v_platform_id uuid := '10000000-0000-0000-0000-000000000001';
  v_category_id uuid;
  v_product_id uuid;
  v_supplier_id uuid := '00000000-0000-0000-0000-000000000001';
begin
  select id into v_category_id from categories
    where platform_id = v_platform_id and slug = 'seguidores';

  insert into products (
    id, platform_id, category_id, name, slug, description, short_description,
    input_field_type, estimated_time, has_refill, refill_duration_days, featured
  ) values (
    gen_random_uuid(), v_platform_id, v_category_id,
    'Seguidores Instagram', 'instagram-seguidores',
    'Aumente sua base de seguidores no Instagram com pacotes fechados e entrega gradual. Pedido simples, sem necessidade de senha — basta informar seu @usuário.',
    'Seguidores para perfis do Instagram',
    'username', '0 a 24 horas', true, 30, true
  ) returning id into v_product_id;

  insert into packages (product_id, name, quantity, sale_price_cents, cost_price_cents, supplier_id, supplier_service_id, badge, is_best_seller, display_order) values
    (v_product_id, 'PACOTE START',   100,   1990,  900,  v_supplier_id, 'MOCK-IG-FOL-100',   null,             false, 1),
    (v_product_id, 'PACOTE POPULAR', 500,   5990,  3200, v_supplier_id, 'MOCK-IG-FOL-500',   null,             false, 2),
    (v_product_id, 'PACOTE MAIS VENDIDO', 1000, 9990, 5800, v_supplier_id, 'MOCK-IG-FOL-1000', 'MAIS VENDIDO', true,  3),
    (v_product_id, 'PACOTE PRO',     2500,  19990, 13500, v_supplier_id, 'MOCK-IG-FOL-2500',  null,            false, 4),
    (v_product_id, 'PACOTE PREMIUM', 5000,  34990, 25000, v_supplier_id, 'MOCK-IG-FOL-5000',  null,            false, 5),
    (v_product_id, 'PACOTE MAX',     10000, 59990, 46000, v_supplier_id, 'MOCK-IG-FOL-10000', null,            false, 6);
end $$;

-- ------------------------------------------------------------
-- PRODUTO DE EXEMPLO: Instagram > Curtidas
-- ------------------------------------------------------------

do $$
declare
  v_platform_id uuid := '10000000-0000-0000-0000-000000000001';
  v_category_id uuid;
  v_product_id uuid;
  v_supplier_id uuid := '00000000-0000-0000-0000-000000000001';
begin
  select id into v_category_id from categories
    where platform_id = v_platform_id and slug = 'curtidas';

  insert into products (
    id, platform_id, category_id, name, slug, description, short_description,
    input_field_type, estimated_time, has_refill, featured
  ) values (
    gen_random_uuid(), v_platform_id, v_category_id,
    'Curtidas Instagram', 'instagram-curtidas',
    'Curtidas para suas publicações no Instagram. Basta informar o link da publicação.',
    'Curtidas para posts do Instagram',
    'link', '0 a 12 horas', false, false
  ) returning id into v_product_id;

  insert into packages (product_id, name, quantity, sale_price_cents, cost_price_cents, supplier_id, supplier_service_id, badge, is_best_seller, display_order) values
    (v_product_id, 'PACOTE START',   100,  990,  400,  v_supplier_id, 'MOCK-IG-LIK-100',  null,          false, 1),
    (v_product_id, 'PACOTE POPULAR', 500,  2990, 1600, v_supplier_id, 'MOCK-IG-LIK-500',  null,          false, 2),
    (v_product_id, 'PACOTE MAIS VENDIDO', 1000, 4990, 2900, v_supplier_id, 'MOCK-IG-LIK-1000', 'MAIS VENDIDO', true, 3),
    (v_product_id, 'PACOTE PRO',     2500, 9990, 6500, v_supplier_id, 'MOCK-IG-LIK-2500', null,          false, 4);
end $$;

-- ------------------------------------------------------------
-- PRODUTO DE EXEMPLO: YouTube > Inscritos
-- ------------------------------------------------------------

do $$
declare
  v_platform_id uuid := '10000000-0000-0000-0000-000000000003';
  v_category_id uuid;
  v_product_id uuid;
  v_supplier_id uuid := '00000000-0000-0000-0000-000000000001';
begin
  select id into v_category_id from categories
    where platform_id = v_platform_id and slug = 'inscritos';

  insert into products (
    id, platform_id, category_id, name, slug, description, short_description,
    input_field_type, estimated_time, has_refill, featured
  ) values (
    gen_random_uuid(), v_platform_id, v_category_id,
    'Inscritos YouTube', 'youtube-inscritos',
    'Inscritos para seu canal do YouTube. Informe o link do canal.',
    'Inscritos para canais do YouTube',
    'link', '1 a 3 dias', false, true
  ) returning id into v_product_id;

  insert into packages (product_id, name, quantity, sale_price_cents, cost_price_cents, supplier_id, supplier_service_id, badge, is_best_seller, display_order) values
    (v_product_id, 'PACOTE START',   100,  2990,  1500, v_supplier_id, 'MOCK-YT-SUB-100',  null,           false, 1),
    (v_product_id, 'PACOTE POPULAR', 500,  12990, 7500, v_supplier_id, 'MOCK-YT-SUB-500',  'MAIS VENDIDO', true,  2),
    (v_product_id, 'PACOTE PRO',     1000, 23990, 15000,v_supplier_id, 'MOCK-YT-SUB-1000', null,           false, 3);
end $$;
