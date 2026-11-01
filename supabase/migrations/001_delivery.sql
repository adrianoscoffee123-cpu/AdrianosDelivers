-- Run ONCE in a NEW Supabase project's SQL editor. No reference-project data is needed.
begin;
create table public.shop_settings (
  id boolean primary key default true check (id),
  name text not null default 'Adriano’s' check (length(name) between 2 and 80),
  address text not null default '' check (length(address) <= 400),
  contact text not null default '' check (length(contact) <= 100),
  latitude double precision check (latitude between -90 and 90),
  longitude double precision check (longitude between -180 and 180),
  radius_km numeric not null default 5 check (radius_km > 0 and radius_km <= 50),
  delivery_fee numeric(10,2) not null default 35 check (delivery_fee between 0 and 5000),
  minimum_order numeric(10,2) not null default 0 check (minimum_order between 0 and 10000),
  accepting_orders boolean not null default false
);
insert into public.shop_settings(id) values(true);
create table public.menu_items (
  id uuid primary key default gen_random_uuid(), name text not null check (length(name) between 2 and 100),
  description text not null default '' check (length(description) <= 400),
  category text not null check (length(category) between 1 and 60),
  price numeric(10,2) not null check (price > 0 and price <= 10000),
  art text not null default 'chicken' check (art in ('chicken','bbq','pasta','burger','fries','tea')),
  active boolean not null default false, featured boolean not null default false,
  sort_order integer not null default 0
);
create table public.staff_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (length(display_name) between 2 and 80),
  role text not null check (role in ('admin','rider'))
);
create function public.is_admin() returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.staff_users where user_id = auth.uid() and role = 'admin');
$$;
create table public.orders (
  id uuid primary key default gen_random_uuid(), customer_id uuid not null references auth.users(id),
  client_token uuid not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  customer_name text not null, phone text not null, fulfillment text not null check (fulfillment in ('delivery','pickup')),
  address text not null, latitude double precision, longitude double precision, notes text not null default '',
  items jsonb not null, subtotal numeric(10,2) not null, delivery_fee numeric(10,2) not null,
  total numeric(10,2) not null, distance_km numeric, payment_method text not null default 'cash' check (payment_method='cash'),
  status text not null default 'pending' check (status in ('pending','preparing','ready','dispatched','completed','cancelled')),
  rider_id uuid references auth.users(id), unique(customer_id,client_token)
);
create unique index one_active_order_per_customer on public.orders(customer_id) where status not in ('completed','cancelled');
create index orders_rider_idx on public.orders(rider_id) where status not in ('completed','cancelled');
create index orders_created_idx on public.orders(created_at desc);
create table public.delivery_locations (
  order_id uuid primary key references public.orders(id) on delete cascade,
  latitude double precision not null, longitude double precision not null,
  accuracy double precision not null, updated_at timestamptz not null default now()
);
create table public.order_events (
  id bigint generated always as identity primary key, order_id uuid not null references public.orders(id) on delete cascade,
  status text not null, created_at timestamptz not null default now()
);
create index order_events_order_idx on public.order_events(order_id);

alter table public.shop_settings enable row level security;
alter table public.menu_items enable row level security;
alter table public.staff_users enable row level security;
alter table public.orders enable row level security;
alter table public.delivery_locations enable row level security;
alter table public.order_events enable row level security;
create policy shop_read on public.shop_settings for select to anon,authenticated using(true);
create policy shop_admin on public.shop_settings for update to authenticated using(public.is_admin()) with check(public.is_admin());
create policy menu_read on public.menu_items for select to anon,authenticated using(active or public.is_admin());
create policy menu_admin on public.menu_items for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy staff_read on public.staff_users for select to authenticated using(user_id=auth.uid() or public.is_admin());
create policy order_read on public.orders for select to authenticated using (
  customer_id=auth.uid() or public.is_admin() or
  (rider_id=auth.uid() and status in ('preparing','ready','dispatched') and exists(select 1 from public.staff_users where user_id=auth.uid() and role='rider'))
);
create policy location_read on public.delivery_locations for select to authenticated using (
  exists(select 1 from public.orders o where o.id=order_id and o.status='dispatched')
);
create policy events_read on public.order_events for select to authenticated using(exists(select 1 from public.orders o where o.id=order_id));

-- All order and GPS writes must pass an authorized, validating RPC.
revoke all on public.shop_settings,public.menu_items,public.staff_users,public.orders,public.delivery_locations,public.order_events from anon,authenticated;
grant select on public.shop_settings,public.menu_items to anon,authenticated;
grant update on public.shop_settings to authenticated;
grant insert,update,delete on public.menu_items to authenticated;
grant select on public.staff_users,public.orders,public.delivery_locations,public.order_events to authenticated;

create function public.quote_order(p_items jsonb,p_fulfillment text,p_lat double precision default null,p_lng double precision default null)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare s public.shop_settings; v_sub numeric:=0; v_fee numeric:=0; v_distance double precision; v_items jsonb:='[]'; x jsonb; m public.menu_items; q integer;
begin
  select * into s from public.shop_settings where id;
  if not s.accepting_orders then raise exception 'The store is not accepting orders yet.'; end if;
  if p_fulfillment is null or p_fulfillment not in ('pickup','delivery') then raise exception 'Choose delivery or pickup.'; end if;
  if p_items is null or jsonb_typeof(p_items)<>'array' then raise exception 'Invalid basket.'; end if;
  if jsonb_array_length(p_items) not between 1 and 30 then raise exception 'Basket must have 1–30 lines.'; end if;
  for x in select * from jsonb_array_elements(p_items) loop
    if x->>'quantity' is null or (x->>'quantity') !~ '^[0-9]{1,2}$' then raise exception 'Invalid quantity.'; end if;
    q:=(x->>'quantity')::integer;
    if q not between 1 and 20 then raise exception 'Maximum 20 of each item.'; end if;
    select * into m from public.menu_items where id=(x->>'id')::uuid and active;
    if not found then raise exception 'An item is no longer available. Refresh your menu.'; end if;
    if exists(select 1 from jsonb_array_elements(v_items) y where y->>'id'=m.id::text) then raise exception 'Duplicate basket item.'; end if;
    v_sub:=v_sub+m.price*q;
    v_items:=v_items||jsonb_build_array(jsonb_build_object('id',m.id,'name',m.name,'price',m.price,'quantity',q));
  end loop;
  if v_sub<s.minimum_order then raise exception 'Minimum order is PHP %.',s.minimum_order; end if;
  if p_fulfillment='delivery' then
    if s.latitude is null or s.longitude is null then raise exception 'Store delivery location is not configured.'; end if;
    if p_lat is null or p_lng is null or not(p_lat between -90 and 90) or not(p_lng between -180 and 180) then raise exception 'Choose a valid delivery pin.'; end if;
    v_distance:=6371*2*asin(sqrt(least(1.0,power(sin(radians(p_lat-s.latitude)/2),2)+cos(radians(s.latitude))*cos(radians(p_lat))*power(sin(radians(p_lng-s.longitude)/2),2))));
    if v_distance>s.radius_km then raise exception 'Outside our % km delivery radius.',s.radius_km; end if;
    v_fee:=s.delivery_fee;
  end if;
  return jsonb_build_object('items',v_items,'subtotal',v_sub,'delivery_fee',v_fee,'total',v_sub+v_fee,'distance_km',round(v_distance::numeric,2));
end; $$;

create function public.place_order(p_token uuid,p_items jsonb,p_fulfillment text,p_customer_name text,p_phone text,p_address text,p_notes text default '',p_lat double precision default null,p_lng double precision default null)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_uid uuid:=auth.uid(); v_quote jsonb; v_id uuid;
begin
  if v_uid is null or coalesce((auth.jwt()->>'is_anonymous')::boolean,false) then raise exception 'Sign in with a permanent account to place an order.'; end if;
  perform pg_advisory_xact_lock(hashtextextended(v_uid::text,0));
  select id into v_id from public.orders where customer_id=v_uid and client_token=p_token;
  if found then return v_id; end if;
  if p_token is null then raise exception 'Missing order token.'; end if;
  if p_customer_name is null or length(trim(p_customer_name)) not between 2 and 80 then raise exception 'Enter your name.'; end if;
  if p_phone is null or p_phone !~ '^(09|\+639)[0-9]{9}$' then raise exception 'Enter a valid Philippine mobile number.'; end if;
  if p_address is null or length(p_address)>400 or (p_fulfillment='delivery' and length(trim(p_address))<10) then raise exception 'Enter a complete delivery address.'; end if;
  if p_notes is null or length(p_notes)>300 then raise exception 'Notes must be 300 characters or less.'; end if;
  if exists(select 1 from public.orders where customer_id=v_uid and status not in ('completed','cancelled')) then raise exception 'Finish or cancel your active order first.'; end if;
  if (select count(*) from public.orders where customer_id=v_uid and created_at>now()-interval '1 day')>=20 then raise exception 'Daily order limit reached. Contact the store.'; end if;
  v_quote:=public.quote_order(p_items,p_fulfillment,p_lat,p_lng);
  insert into public.orders(customer_id,client_token,customer_name,phone,fulfillment,address,notes,latitude,longitude,items,subtotal,delivery_fee,total,distance_km)
  values(v_uid,p_token,trim(p_customer_name),p_phone,p_fulfillment,case when p_fulfillment='pickup' then '' else trim(p_address) end,trim(p_notes),case when p_fulfillment='delivery' then p_lat end,case when p_fulfillment='delivery' then p_lng end,v_quote->'items',(v_quote->>'subtotal')::numeric,(v_quote->>'delivery_fee')::numeric,(v_quote->>'total')::numeric,(v_quote->>'distance_km')::numeric) returning id into v_id;
  insert into public.order_events(order_id,status) values(v_id,'pending');
  return v_id;
end; $$;

create function public.transition_order(p_order_id uuid,p_status text,p_rider_id uuid default null)
returns void language plpgsql security definer set search_path = '' as $$
declare o public.orders; v_admin boolean:=public.is_admin(); v_uid uuid:=auth.uid();
begin
  if v_uid is null then raise exception 'Sign in required.'; end if;
  select * into o from public.orders where id=p_order_id for update;
  if not found then raise exception 'Order unavailable.'; end if;
  if o.status in ('completed','cancelled') then raise exception 'This order is closed.'; end if;
  if p_status='assign' then
    if not v_admin or o.fulfillment<>'delivery' or o.status not in ('preparing','ready') then raise exception 'Only an admin can assign a prepared delivery.'; end if;
    if not exists(select 1 from public.staff_users where user_id=p_rider_id and role='rider') then raise exception 'Choose an authorized rider.'; end if;
    update public.orders set rider_id=p_rider_id,updated_at=now() where id=o.id;
    return;
  end if;
  if not coalesce((
    (p_status='cancelled' and (v_admin or (o.customer_id=v_uid and o.status='pending'))) or
    (v_admin and ((o.status='pending' and p_status='preparing') or (o.status='preparing' and p_status='ready') or (o.status='ready' and p_status='completed' and o.fulfillment='pickup'))) or
    (o.rider_id=v_uid and exists(select 1 from public.staff_users where user_id=v_uid and role='rider') and o.fulfillment='delivery' and ((o.status='ready' and p_status='dispatched') or (o.status='dispatched' and p_status='completed')))
  ),false) then raise exception 'You cannot make this order change.'; end if;
  update public.orders set status=p_status,updated_at=now() where id=o.id;
  insert into public.order_events(order_id,status) values(o.id,p_status);
  if p_status in ('completed','cancelled') then delete from public.delivery_locations where order_id=o.id; end if;
end; $$;

create function public.share_location(p_order_id uuid,p_lat double precision,p_lng double precision,p_accuracy double precision)
returns void language plpgsql security definer set search_path = '' as $$
declare o public.orders;
begin
  -- Same row lock as transition_order: a racing GPS write cannot outlive completion.
  select * into o from public.orders where id=p_order_id for update;
  if not found or o.rider_id is distinct from auth.uid() or auth.uid() is null or o.status<>'dispatched' or not exists(select 1 from public.staff_users where user_id=auth.uid() and role='rider') then raise exception 'No active assigned delivery.'; end if;
  if p_lat is null or p_lng is null or p_accuracy is null or not(p_lat between -90 and 90) or not(p_lng between -180 and 180) or not(p_accuracy between 0 and 1000) then raise exception 'GPS accuracy is insufficient.'; end if;
  if exists(select 1 from public.delivery_locations where order_id=o.id and updated_at>now()-interval '15 seconds') then return; end if;
  insert into public.delivery_locations(order_id,latitude,longitude,accuracy) values(o.id,p_lat,p_lng,p_accuracy)
  on conflict(order_id) do update set latitude=excluded.latitude,longitude=excluded.longitude,accuracy=excluded.accuracy,updated_at=now();
end; $$;
create function public.stop_sharing(p_order_id uuid) returns void language plpgsql security definer set search_path = '' as $$
begin
  if not exists(select 1 from public.orders where id=p_order_id and rider_id=auth.uid()) then raise exception 'Not your delivery.'; end if;
  delete from public.delivery_locations where order_id=p_order_id;
end; $$;

revoke all on function public.is_admin(),public.quote_order(jsonb,text,double precision,double precision),public.place_order(uuid,jsonb,text,text,text,text,text,double precision,double precision),public.transition_order(uuid,text,uuid),public.share_location(uuid,double precision,double precision,double precision),public.stop_sharing(uuid) from public,anon,authenticated;
grant execute on function public.is_admin() to anon,authenticated;
grant execute on function public.quote_order(jsonb,text,double precision,double precision) to anon,authenticated;
grant execute on function public.place_order(uuid,jsonb,text,text,text,text,text,double precision,double precision),public.transition_order(uuid,text,uuid),public.share_location(uuid,double precision,double precision,double precision),public.stop_sharing(uuid) to authenticated;
-- Realtime sends only rows readable through RLS. No public channel contains GPS.
do $$ begin
  if exists(select 1 from pg_publication where pubname='supabase_realtime') then
    alter publication supabase_realtime add table public.orders,public.delivery_locations;
  end if;
end $$;
commit;
