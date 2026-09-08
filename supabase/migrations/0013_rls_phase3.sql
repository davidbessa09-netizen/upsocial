-- ============================================================
-- UP SOCIAL — Migration 0013: RLS de carrinho/checkout/order_items/ofertas
-- ============================================================

alter table order_items enable row level security;
create policy "order_items_select_own_or_staff"
  on order_items for select
  using (
    is_staff() or
    exists (select 1 from orders o where o.id = order_items.order_id and o.user_id = auth.uid())
  );
-- Inserts/updates de order_items acontecem via service role (checkout e
-- processamento de pedidos) — sem policy de insert/update para o client.

alter table carts enable row level security;
create policy "carts_all_own"
  on carts for all
  using (user_id = auth.uid() or is_staff())
  with check (user_id = auth.uid());

alter table cart_items enable row level security;
create policy "cart_items_all_own"
  on cart_items for all
  using (
    is_staff() or
    exists (select 1 from carts c where c.id = cart_items.cart_id and c.user_id = auth.uid())
  )
  with check (
    exists (select 1 from carts c where c.id = cart_items.cart_id and c.user_id = auth.uid())
  );

alter table checkout_sessions enable row level security;
create policy "checkout_sessions_select_own_or_staff"
  on checkout_sessions for select
  using (user_id = auth.uid() or is_staff());
create policy "checkout_sessions_insert_own"
  on checkout_sessions for insert
  with check (user_id = auth.uid());
create policy "checkout_sessions_update_own"
  on checkout_sessions for update
  using (user_id = auth.uid() or is_staff())
  with check (user_id = auth.uid() or is_staff());
-- Confirmação de pagamento/conversão (status -> CONVERTED, order_id
-- setado) é feita via service role no webhook do gateway.

alter table order_bumps enable row level security;
create policy "order_bumps_public_read"
  on order_bumps for select
  using (active = true or is_staff());

alter table upsell_offers enable row level security;
create policy "upsell_offers_public_read"
  on upsell_offers for select
  using (active = true or is_staff());
