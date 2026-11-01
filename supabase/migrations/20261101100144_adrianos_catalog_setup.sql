-- Partial setup: browsable owner-supplied menu, no live checkout activation.
begin;
alter table public.menu_items
  add column catalog_key text unique,
  add column product_key text,
  add column category_key text,
  add column variant_label text not null default 'Regular',
  add column source_page integer check(source_page between 1 and 9),
  add column review_note text,
  add column published boolean not null default false;
create index menu_product_key_idx on public.menu_items(product_key);
drop policy menu_read on public.menu_items;
create policy menu_read on public.menu_items for select to anon,authenticated
  using(published or active or (select public.is_admin()));
create index orders_customer_created_idx on public.orders(customer_id,created_at desc);
create index orders_rider_all_idx on public.orders(rider_id);

-- Privileged implementations live outside the exposed Data API schema.
-- Invoker wrappers in public retain the documented RPC names and signatures.
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to anon,authenticated;
alter function public.is_admin() set schema private;
create function public.is_admin() returns boolean language sql stable security invoker set search_path='' as $$ select private.is_admin() $$;
alter function public.quote_order(jsonb,text,double precision,double precision) set schema private;
create function public.quote_order(p_items jsonb,p_fulfillment text,p_lat double precision default null,p_lng double precision default null)
returns jsonb language sql stable security invoker set search_path='' as $$ select private.quote_order(p_items,p_fulfillment,p_lat,p_lng) $$;
alter function public.place_order(uuid,jsonb,text,text,text,text,text,double precision,double precision) set schema private;
create function public.place_order(p_token uuid,p_items jsonb,p_fulfillment text,p_customer_name text,p_phone text,p_address text,p_notes text default '',p_lat double precision default null,p_lng double precision default null)
returns uuid language sql security invoker set search_path='' as $$ select private.place_order(p_token,p_items,p_fulfillment,p_customer_name,p_phone,p_address,p_notes,p_lat,p_lng) $$;
alter function public.transition_order(uuid,text,uuid) set schema private;
create function public.transition_order(p_order_id uuid,p_status text,p_rider_id uuid default null)
returns void language sql security invoker set search_path='' as $$ select private.transition_order(p_order_id,p_status,p_rider_id) $$;
alter function public.share_location(uuid,double precision,double precision,double precision) set schema private;
create function public.share_location(p_order_id uuid,p_lat double precision,p_lng double precision,p_accuracy double precision)
returns void language sql security invoker set search_path='' as $$ select private.share_location(p_order_id,p_lat,p_lng,p_accuracy) $$;
alter function public.stop_sharing(uuid) set schema private;
create function public.stop_sharing(p_order_id uuid) returns void language sql security invoker set search_path='' as $$ select private.stop_sharing(p_order_id) $$;
revoke all on function public.is_admin(),public.quote_order(jsonb,text,double precision,double precision),public.place_order(uuid,jsonb,text,text,text,text,text,double precision,double precision),public.transition_order(uuid,text,uuid),public.share_location(uuid,double precision,double precision,double precision),public.stop_sharing(uuid) from public,anon,authenticated;
grant execute on function public.is_admin(),public.quote_order(jsonb,text,double precision,double precision) to anon,authenticated;
grant execute on function public.place_order(uuid,jsonb,text,text,text,text,text,double precision,double precision),public.transition_order(uuid,text,uuid),public.share_location(uuid,double precision,double precision,double precision),public.stop_sharing(uuid) to authenticated;
commit;
