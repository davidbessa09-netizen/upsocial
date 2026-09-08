-- ============================================================
-- UP SOCIAL — Migration 0007: SaaS & Subscriptions
-- ============================================================
-- Base para (a) ferramentas SaaS simples plugáveis à plataforma e
-- (b) produtos recorrentes genéricos (product_type = 'SUBSCRIPTION').
-- Nenhuma cobrança recorrente automática é implementada agora — apenas
-- a estrutura de dados para suportá-la depois.
-- ============================================================

create type subscription_status as enum ('ACTIVE', 'PAST_DUE', 'CANCELED', 'EXPIRED');

-- ------------------------------------------------------------
-- SAAS_APPS — catálogo de ferramentas (calculadoras, geradores,
-- dashboards, etc). Novas ferramentas = nova linha aqui, sem alterar
-- schema.
-- ------------------------------------------------------------

create table saas_apps (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  icon text not null default 'circle',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_saas_apps_updated_at before update on saas_apps
  for each row execute function set_updated_at();

-- ------------------------------------------------------------
-- SAAS_PLANS — planos de acesso por ferramenta (grátis ou pago).
-- ------------------------------------------------------------

create table saas_plans (
  id uuid primary key default gen_random_uuid(),
  app_id uuid not null references saas_apps(id) on delete cascade,
  name text not null,
  price_cents integer not null default 0,
  billing_interval text, -- 'MONTHLY' | 'YEARLY' | null (plano grátis/vitalício)
  usage_limit integer,   -- limite de uso total, null = ilimitado
  monthly_limit integer, -- limite de uso por mês, null = ilimitado
  active boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_saas_plans_app on saas_plans(app_id);

create trigger trg_saas_plans_updated_at before update on saas_plans
  for each row execute function set_updated_at();

-- ------------------------------------------------------------
-- SAAS_SUBSCRIPTIONS — assinatura de um usuário a um plano de app.
-- ------------------------------------------------------------

create table saas_subscriptions (
  id uuid primary key default gen_random_uuid(),
  app_id uuid not null references saas_apps(id) on delete cascade,
  plan_id uuid not null references saas_plans(id) on delete restrict,
  user_id uuid not null references auth.users(id) on delete cascade,
  order_id uuid references orders(id) on delete set null, -- pedido que originou a assinatura (planos pagos)
  status subscription_status not null default 'ACTIVE',
  started_at timestamptz not null default now(),
  current_period_end timestamptz,
  canceled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (app_id, user_id)
);

create index idx_saas_subscriptions_user on saas_subscriptions(user_id);

create trigger trg_saas_subscriptions_updated_at before update on saas_subscriptions
  for each row execute function set_updated_at();

-- ------------------------------------------------------------
-- SAAS_USAGE — contadores de uso por período, para aplicar
-- usage_limit/monthly_limit do plano.
-- ------------------------------------------------------------

create table saas_usage (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references saas_subscriptions(id) on delete cascade,
  period_start date not null,
  period_end date not null,
  usage_count integer not null default 0,
  updated_at timestamptz not null default now(),
  unique (subscription_id, period_start)
);

create index idx_saas_usage_subscription on saas_usage(subscription_id);

-- ------------------------------------------------------------
-- PRODUCT_SUBSCRIPTIONS — assinatura genérica para product_type =
-- 'SUBSCRIPTION' (ex: conteúdo recorrente), distinta de saas_subscriptions
-- (que é específico de ferramentas SaaS internas).
-- ------------------------------------------------------------

create table product_subscriptions (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid not null references products(id) on delete restrict,
  package_id uuid not null references packages(id) on delete restrict,
  user_id uuid not null references auth.users(id) on delete cascade,
  status subscription_status not null default 'ACTIVE',
  started_at timestamptz not null default now(),
  trial_ends_at timestamptz,
  current_period_end timestamptz,
  canceled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_product_subscriptions_user on product_subscriptions(user_id);

create trigger trg_product_subscriptions_updated_at before update on product_subscriptions
  for each row execute function set_updated_at();
