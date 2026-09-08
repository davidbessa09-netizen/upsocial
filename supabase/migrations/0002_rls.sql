-- ============================================================
-- UP SOCIAL — Migration 0002: Row Level Security
-- ============================================================
-- Modelo:
--   * Catálogo (platforms/categories/products/packages) e settings:
--     leitura pública de itens ativos; escrita apenas via service role (admin).
--   * suppliers: nenhuma leitura/escrita via anon/authenticated. Somente
--     service role (usado nas rotas server-side do admin e do processamento
--     de pedidos).
--   * orders/payments: cliente só vê os próprios; toda escrita de campos
--     sensíveis (preço, custo, fornecedor) acontece via service role a
--     partir de rotas de servidor — nunca diretamente do client.
--   * support_tickets/ticket_messages: cliente só vê/interage com os próprios.
--   * coupons: leitura pública apenas de cupons ativos (para validação no
--     checkout); dados de uso não expostos.
-- ============================================================

alter table profiles enable row level security;
alter table platforms enable row level security;
alter table categories enable row level security;
alter table products enable row level security;
alter table packages enable row level security;
alter table suppliers enable row level security;
alter table orders enable row level security;
alter table payments enable row level security;
alter table coupons enable row level security;
alter table coupon_usage enable row level security;
alter table support_tickets enable row level security;
alter table ticket_messages enable row level security;
alter table settings enable row level security;

-- Helper: verifica se o usuário autenticado é admin ou support
create or replace function is_staff()
returns boolean as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role in ('admin', 'support')
  );
$$ language sql stable security definer set search_path = public;

-- ------------------------------------------------------------
-- PROFILES
-- ------------------------------------------------------------

create policy "profiles_select_own_or_staff"
  on profiles for select
  using (id = auth.uid() or is_staff());

create policy "profiles_update_own"
  on profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());
-- Nota: alteração de `role` deve ser bloqueada a nível de aplicação/trigger,
-- pois RLS de coluna não impede update de outros campos pela mesma policy.

-- ------------------------------------------------------------
-- CATALOG (public read of active items; writes via service role only)
-- ------------------------------------------------------------

create policy "platforms_public_read"
  on platforms for select
  using (active = true or is_staff());

create policy "categories_public_read"
  on categories for select
  using (active = true or is_staff());

create policy "products_public_read"
  on products for select
  using (active = true or is_staff());

create policy "packages_public_read"
  on packages for select
  using (active = true or is_staff());
-- cost_price_cents e supplier_service_id continuam nessas linhas; a
-- responsabilidade de NUNCA enviar esses campos ao cliente é da camada de
-- API (select explícito de colunas), não do RLS.

-- ------------------------------------------------------------
-- SUPPLIERS — bloqueado para anon/authenticated
-- ------------------------------------------------------------
-- (nenhuma policy = nenhum acesso via anon/authenticated key; apenas
-- service role, que ignora RLS, pode ler/escrever)

-- ------------------------------------------------------------
-- ORDERS
-- ------------------------------------------------------------

create policy "orders_select_own_or_staff"
  on orders for select
  using (user_id = auth.uid() or is_staff());

create policy "orders_insert_own"
  on orders for insert
  with check (user_id = auth.uid());
-- Preço/custo/fornecedor são validados e preenchidos no servidor antes do
-- insert (rota de checkout usa service role, não o client diretamente).

create policy "orders_update_staff_only"
  on orders for update
  using (is_staff())
  with check (is_staff());

-- ------------------------------------------------------------
-- PAYMENTS
-- ------------------------------------------------------------

create policy "payments_select_own_or_staff"
  on payments for select
  using (
    is_staff() or
    exists (select 1 from orders o where o.id = payments.order_id and o.user_id = auth.uid())
  );
-- Inserts/updates de payments acontecem exclusivamente via service role
-- (webhook do gateway e rota de criação de pagamento) — sem policy para
-- anon/authenticated.

-- ------------------------------------------------------------
-- COUPONS
-- ------------------------------------------------------------

create policy "coupons_public_read_active"
  on coupons for select
  using (
    active = true
    and (starts_at is null or starts_at <= now())
    and (ends_at is null or ends_at >= now())
    or is_staff()
  );

create policy "coupon_usage_staff_only"
  on coupon_usage for select
  using (is_staff());

-- ------------------------------------------------------------
-- SUPPORT TICKETS
-- ------------------------------------------------------------

create policy "tickets_select_own_or_staff"
  on support_tickets for select
  using (user_id = auth.uid() or is_staff());

create policy "tickets_insert_own"
  on support_tickets for insert
  with check (user_id = auth.uid());

create policy "tickets_update_own_or_staff"
  on support_tickets for update
  using (user_id = auth.uid() or is_staff())
  with check (user_id = auth.uid() or is_staff());

create policy "ticket_messages_select_own_or_staff"
  on ticket_messages for select
  using (
    is_staff() or
    exists (select 1 from support_tickets t where t.id = ticket_messages.ticket_id and t.user_id = auth.uid())
  );

create policy "ticket_messages_insert_own_or_staff"
  on ticket_messages for insert
  with check (
    is_staff() or
    exists (select 1 from support_tickets t where t.id = ticket_messages.ticket_id and t.user_id = auth.uid())
  );

-- ------------------------------------------------------------
-- SETTINGS
-- ------------------------------------------------------------

create policy "settings_public_read"
  on settings for select
  using (true);
-- Escrita apenas via service role (painel admin).
