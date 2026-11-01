begin;
-- Event-trigger execution is owned by postgres; clients must not invoke it as an RPC.
do $$ begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    revoke execute on function public.rls_auto_enable() from public,anon,authenticated;
  end if;
end $$;

-- Cache identity lookups once per statement and use one SELECT policy for the menu.
drop policy staff_read on public.staff_users;
create policy staff_read on public.staff_users for select to authenticated
using(user_id=(select auth.uid()) or (select private.is_admin()));
drop policy order_read on public.orders;
create policy order_read on public.orders for select to authenticated using(
  customer_id=(select auth.uid()) or (select private.is_admin()) or
  (rider_id=(select auth.uid()) and status in ('preparing','ready','dispatched') and exists(
    select 1 from public.staff_users where user_id=(select auth.uid()) and role='rider'
  ))
);
drop policy shop_admin on public.shop_settings;
create policy shop_admin on public.shop_settings for update to authenticated
using((select private.is_admin())) with check((select private.is_admin()));
drop policy menu_read on public.menu_items;
create policy menu_read on public.menu_items for select to anon,authenticated
using(published or active or (select private.is_admin()));
drop policy menu_admin on public.menu_items;
create policy menu_insert on public.menu_items for insert to authenticated with check((select private.is_admin()));
create policy menu_update on public.menu_items for update to authenticated using((select private.is_admin())) with check((select private.is_admin()));
create policy menu_delete on public.menu_items for delete to authenticated using((select private.is_admin()));
commit;
