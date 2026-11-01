begin;
-- Snapshot the trusted variant and category so equally named drinks stay distinguishable.
create or replace function private.quote_order(p_items jsonb,p_fulfillment text,p_lat double precision default null,p_lng double precision default null)
returns jsonb language plpgsql stable security definer set search_path='' as $$
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
    v_items:=v_items||jsonb_build_array(jsonb_build_object('id',m.id,'name',m.name,'category',m.category,'variant_label',m.variant_label,'catalog_key',m.catalog_key,'price',m.price,'quantity',q));
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
commit;
