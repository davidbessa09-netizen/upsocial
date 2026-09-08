-- ============================================================
-- UP SOCIAL — Migration 0006: Manual Services
-- ============================================================
-- Suporte a serviços executados manualmente (criação de site, gestão de
-- redes sociais, tráfego pago, design, consultoria): briefing → produção
-- → acompanhamento → entrega.
--
-- orders.order_status (PENDING_PAYMENT/PAID/...) continua sendo o status
-- "alto nível" universal de todo pedido. manual_service_stage é um
-- detalhamento adicional, exclusivo de MANUAL_SERVICE, que preenche o
-- "meio do caminho" entre PAID e COMPLETED com granularidade de projeto.
-- ============================================================

create type manual_service_stage as enum (
  'BRIEFING_PENDING',
  'BRIEFING_RECEIVED',
  'IN_PROGRESS',
  'WAITING_CLIENT',
  'REVISION',
  'DELIVERED',
  'COMPLETED'
);

create type briefing_field_type as enum ('text', 'textarea', 'select', 'file', 'url');

alter table orders
  add column manual_service_stage manual_service_stage;

create index idx_orders_manual_service_stage on orders(manual_service_stage);

comment on column orders.manual_service_stage is 'Preenchido apenas quando orders.product_type = MANUAL_SERVICE.';

-- ------------------------------------------------------------
-- BRIEFING_FORMS / BRIEFING_QUESTIONS — formulário configurável por
-- produto (admin monta as perguntas do briefing de cada serviço).
-- ------------------------------------------------------------

create table briefing_forms (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  title text not null default 'Briefing do projeto',
  description text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id)
);

create trigger trg_briefing_forms_updated_at before update on briefing_forms
  for each row execute function set_updated_at();

create table briefing_questions (
  id uuid primary key default gen_random_uuid(),
  briefing_form_id uuid not null references briefing_forms(id) on delete cascade,
  question_text text not null,
  field_type briefing_field_type not null default 'text',
  options jsonb, -- usado quando field_type = 'select'
  required boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index idx_briefing_questions_form on briefing_questions(briefing_form_id);

-- ------------------------------------------------------------
-- BRIEFING_ANSWERS — respostas do cliente, vinculadas ao pedido.
-- ------------------------------------------------------------

create table briefing_answers (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  question_id uuid not null references briefing_questions(id) on delete cascade,
  answer_text text,
  answer_file_url text, -- signed URL/storage_path quando field_type = 'file'
  created_at timestamptz not null default now(),
  unique (order_id, question_id)
);

create index idx_briefing_answers_order on briefing_answers(order_id);

-- ------------------------------------------------------------
-- PROJECT_DELIVERIES — entregas/versões do projeto ao cliente.
-- ------------------------------------------------------------

create table project_deliveries (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  title text not null,
  description text,
  file_url text,
  delivered_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index idx_project_deliveries_order on project_deliveries(order_id);

-- ------------------------------------------------------------
-- PROJECT_MESSAGES — chat simples entre cliente e equipe sobre o
-- projeto. Reaproveita o enum ticket_sender criado em 0001.
-- ------------------------------------------------------------

create table project_messages (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  sender ticket_sender not null,
  sender_id uuid references auth.users(id) on delete set null,
  message text not null,
  created_at timestamptz not null default now()
);

create index idx_project_messages_order on project_messages(order_id);
