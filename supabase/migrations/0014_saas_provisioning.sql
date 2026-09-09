-- ============================================================
-- UP SOCIAL — Migration 0014: liga pacotes a planos SaaS
-- ============================================================
-- Falta o único elo que impedia o provisionamento automático de SAAS:
-- nenhuma coluna ligava um `packages` (o que o cliente de fato compra)
-- a um `saas_plans` (o que concede acesso). Sem isso, o webhook de
-- pagamento aprovado não teria como saber qual saas_plan ativar.
-- ============================================================

alter table packages add column saas_plan_id uuid references saas_plans(id) on delete set null;

comment on column packages.saas_plan_id is
  'Usado apenas quando o produto pai é product_type = SAAS: liga o pacote comprado ao plano correspondente em saas_plans, permitindo o provisionamento automático no webhook de pagamento aprovado.';
