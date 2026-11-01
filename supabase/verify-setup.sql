-- Read-only checks to run after schema + catalog seed. Do not return customer records.
select name,address,latitude,longitude,accepting_orders from public.shop_settings;
select count(distinct product_key) as products,count(*) as priced_choices,
       count(*) filter(where active) as orderable_choices
from public.menu_items where catalog_key is not null;
select category,count(distinct product_key) as products,count(*) as priced_choices
from public.menu_items where catalog_key is not null group by category order by category;
select tablename,rowsecurity from pg_tables where schemaname='public'
and tablename in ('shop_settings','menu_items','staff_users','orders','delivery_locations','order_events');
select n.nspname,p.proname,p.prosecdef from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where n.nspname in ('public','private') and p.proname in ('is_admin','quote_order','place_order','transition_order','share_location','stop_sharing') order by n.nspname,p.proname;
