-- ============================================================
-- UP SOCIAL — Migration 0011: RLS das tabelas da Fase 2
-- ============================================================
-- Mesmo modelo do 0002_rls.sql: leitura pública de catálogo ativo,
-- dados pessoais só para o dono ou staff (is_staff(), definida em 0002),
-- e nenhuma policy para tabelas sensíveis (acesso só via service role).
-- ============================================================

-- ------------------------------------------------------------
-- CATÁLOGO GENÉRICO
-- ------------------------------------------------------------

alter table product_categories enable row level security;
create policy "product_categories_public_read"
  on product_categories for select
  using (active = true or is_staff());

-- ------------------------------------------------------------
-- DIGITAL PRODUCTS
-- ------------------------------------------------------------

alter table digital_files enable row level security;
-- Sem policy de select para anon/authenticated: metadados de arquivo só
-- são lidos via service role (rota de geração de signed URL), nunca
-- diretamente pelo client — evita vazar storage_path.
create policy "digital_files_staff_read"
  on digital_files for select
  using (is_staff());

alter table customer_downloads enable row level security;
create policy "customer_downloads_select_own_or_staff"
  on customer_downloads for select
  using (user_id = auth.uid() or is_staff());
-- Inserts/updates de customer_downloads acontecem via service role
-- (rota de checkout aprovado / rota de download).

-- ------------------------------------------------------------
-- MANUAL SERVICES
-- ------------------------------------------------------------

alter table briefing_forms enable row level security;
create policy "briefing_forms_public_read"
  on briefing_forms for select
  using (active = true or is_staff());

alter table briefing_questions enable row level security;
create policy "briefing_questions_public_read"
  on briefing_questions for select
  using (
    is_staff() or
    exists (select 1 from briefing_forms f where f.id = briefing_questions.briefing_form_id and f.active = true)
  );

alter table briefing_answers enable row level security;
create policy "briefing_answers_select_own_or_staff"
  on briefing_answers for select
  using (
    is_staff() or
    exists (select 1 from orders o where o.id = briefing_answers.order_id and o.user_id = auth.uid())
  );
create policy "briefing_answers_insert_own"
  on briefing_answers for insert
  with check (
    exists (select 1 from orders o where o.id = briefing_answers.order_id and o.user_id = auth.uid())
  );

alter table project_deliveries enable row level security;
create policy "project_deliveries_select_own_or_staff"
  on project_deliveries for select
  using (
    is_staff() or
    exists (select 1 from orders o where o.id = project_deliveries.order_id and o.user_id = auth.uid())
  );

alter table project_messages enable row level security;
create policy "project_messages_select_own_or_staff"
  on project_messages for select
  using (
    is_staff() or
    exists (select 1 from orders o where o.id = project_messages.order_id and o.user_id = auth.uid())
  );
create policy "project_messages_insert_own_or_staff"
  on project_messages for insert
  with check (
    is_staff() or
    exists (select 1 from orders o where o.id = project_messages.order_id and o.user_id = auth.uid())
  );

-- ------------------------------------------------------------
-- SAAS
-- ------------------------------------------------------------

alter table saas_apps enable row level security;
create policy "saas_apps_public_read"
  on saas_apps for select
  using (active = true or is_staff());

alter table saas_plans enable row level security;
create policy "saas_plans_public_read"
  on saas_plans for select
  using (active = true or is_staff());

alter table saas_subscriptions enable row level security;
create policy "saas_subscriptions_select_own_or_staff"
  on saas_subscriptions for select
  using (user_id = auth.uid() or is_staff());

alter table saas_usage enable row level security;
create policy "saas_usage_select_own_or_staff"
  on saas_usage for select
  using (
    is_staff() or
    exists (select 1 from saas_subscriptions s where s.id = saas_usage.subscription_id and s.user_id = auth.uid())
  );

alter table product_subscriptions enable row level security;
create policy "product_subscriptions_select_own_or_staff"
  on product_subscriptions for select
  using (user_id = auth.uid() or is_staff());

-- ------------------------------------------------------------
-- BUNDLES
-- ------------------------------------------------------------

alter table bundles enable row level security;
create policy "bundles_public_read"
  on bundles for select
  using (
    is_staff() or
    exists (select 1 from products p where p.id = bundles.product_id and p.active = true)
  );

alter table bundle_items enable row level security;
create policy "bundle_items_public_read"
  on bundle_items for select
  using (
    is_staff() or
    exists (select 1 from bundles b where b.id = bundle_items.bundle_id)
  );

-- ------------------------------------------------------------
-- LANDING PAGES
-- ------------------------------------------------------------

alter table product_landing_pages enable row level security;
create policy "landing_pages_public_read"
  on product_landing_pages for select
  using (active = true or is_staff());

-- ------------------------------------------------------------
-- RELATIONS
-- ------------------------------------------------------------

alter table product_relations enable row level security;
create policy "product_relations_public_read"
  on product_relations for select
  using (
    is_staff() or
    exists (select 1 from products p where p.id = product_relations.related_product_id and p.active = true)
  );
