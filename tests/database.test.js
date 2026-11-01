import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile,readdir } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

test('delivery database permissions, prices, workflow, and GPS privacy', async t => {
  const db = new PGlite();
  const ids = { customer:'10000000-0000-0000-0000-000000000001',other:'10000000-0000-0000-0000-000000000002',admin:'10000000-0000-0000-0000-000000000003',rider:'10000000-0000-0000-0000-000000000004',rider2:'10000000-0000-0000-0000-000000000005' };
  await db.exec(`create role anon; create role authenticated; create schema auth;
    create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb $$;
    grant usage on schema public,auth to anon,authenticated;
    grant execute on function auth.uid(),auth.jwt() to anon,authenticated;`);
  for(const migration of (await readdir(new URL('../supabase/migrations/',import.meta.url))).filter(f=>f.endsWith('.sql')).sort()){
    await db.exec(await readFile(new URL(`../supabase/migrations/${migration}`,import.meta.url),'utf8'));
  }
  for (const id of Object.values(ids)) await db.query('insert into auth.users(id) values($1)',[id]);
  await db.query("insert into public.staff_users(user_id,display_name,role) values($1,'Store Admin','admin'),($2,'Rider One','rider'),($3,'Rider Two','rider')",[ids.admin,ids.rider,ids.rider2]);
  const product = (await db.query("insert into public.menu_items(name,category,price,active) values('Test Meal','Meals',100,true) returning id")).rows[0].id;
  const items = JSON.stringify([{id:product,quantity:2,price:1}]);
  const act = async (user, query, params=[]) => {
    await db.exec('reset role');
    await db.query("select set_config('request.jwt.claim.sub',$1,false),set_config('request.jwt.claims',$2,false)",[user ? ids[user]:'',JSON.stringify({is_anonymous:false})]);
    await db.exec(`set role ${user ? 'authenticated':'anon'}`);
    return db.query(query,params);
  };
  const place = (user,token,fulfillment='delivery') => act(user,'select public.place_order($1,$2::jsonb,$3,$4,$5,$6,$7,$8,$9) as id',[token,items,fulfillment,'Test Customer','09123456789','Test street, test city','',10,123]);
  const transition = (user,id,status,rider=null) => act(user,'select public.transition_order($1,$2,$3)',[id,status,rider]);
  let order;
  await t.test('store starts closed and sample menu stays inactive',async()=>{
    await assert.rejects(()=>place('customer',crypto.randomUUID()),/not accepting/);
    await db.exec('reset role');
    await db.exec(await readFile(new URL('../supabase/sample-menu.sql',import.meta.url),'utf8'));
    assert.equal((await db.query('select count(*)::int as n from public.menu_items where active')).rows[0].n,1);
    await db.exec("update public.shop_settings set accepting_orders=true,latitude=10,longitude=123,delivery_fee=35");
  });
  await t.test('anonymous callers cannot place orders',async()=>{
    await assert.rejects(()=>place(null,crypto.randomUUID()),/permission denied/);
  });
  await t.test('server ignores client prices and rejects invalid quantities and coverage',async()=>{
    const q=(await act('customer','select public.quote_order($1::jsonb,$2,$3,$4) as q',[items,'delivery',10,123])).rows[0].q;
    assert.equal(q.subtotal,200); assert.equal(q.total,235);
    await assert.rejects(()=>act('customer',"select public.quote_order($1::jsonb,'delivery',20,123)",[items]),/Outside/);
    for (const quantity of [0,21,-1,1.5,null]) await assert.rejects(()=>act('customer',"select public.quote_order($1::jsonb,'pickup')",[JSON.stringify([{id:product,quantity}])]),/quantity|Maximum/);
    await assert.rejects(()=>act('customer',"select public.quote_order($1::jsonb,'pickup')",[JSON.stringify([{id:product,quantity:1},{id:product,quantity:1}])]),/Duplicate/);
  });
  await t.test('checkout is idempotent and one active order is enforced',async()=>{
    const token=crypto.randomUUID(); order=(await place('customer',token)).rows[0].id;
    assert.equal((await place('customer',token)).rows[0].id,order);
    await assert.rejects(()=>place('customer',crypto.randomUUID()),/active order/);
  });
  await t.test('customers cannot read other orders or modify orders and staff grants directly',async()=>{
    assert.equal((await act('other','select * from public.orders')).rows.length,0);
    await assert.rejects(()=>act('customer',"update public.orders set total=1"),/permission denied/);
    await assert.rejects(()=>act('customer',"insert into public.staff_users values($1,'Bad Admin','admin')",[ids.other]),/permission denied/);
    assert.equal((await act('customer',"update public.shop_settings set delivery_fee=0 returning *")).rows.length,0);
    await assert.rejects(()=>transition('other',order,'preparing'),/cannot make/);
  });
  await t.test('unassigned riders and customers cannot bypass transitions with nulls',async()=>{
    await transition('admin',order,'preparing');
    await transition('admin',order,'ready');
    await assert.rejects(()=>transition('rider',order,'dispatched'),/cannot make/);
    await assert.rejects(()=>transition('customer',order,null),/cannot make/);
    await assert.rejects(()=>transition('customer',order,'completed'),/cannot make/);
    await assert.rejects(()=>transition('customer',order,'cancelled'),/cannot make/);
  });
  await t.test('only assigned rider can dispatch, publish GPS, and complete delivery',async()=>{
    await transition('admin',order,'assign',ids.rider);
    assert.equal((await act('rider','select * from public.orders')).rows.length,1);
    assert.equal((await act('rider2','select * from public.orders')).rows.length,0);
    await assert.rejects(()=>transition('rider2',order,'dispatched'),/cannot make/);
    await transition('rider',order,'dispatched');
    await assert.rejects(()=>act('customer','select public.share_location($1,10,123,10)',[order]),/No active/);
    await assert.rejects(()=>act('rider','select public.share_location($1,10,123,1001)',[order]),/insufficient/);
    await act('rider','select public.share_location($1,10,123,10)',[order]);
    assert.equal((await act('customer','select * from public.delivery_locations')).rows.length,1);
    assert.equal((await act('other','select * from public.delivery_locations')).rows.length,0);
    assert.equal((await act('rider2','select * from public.delivery_locations')).rows.length,0);
    await act('rider','select public.share_location($1,11,124,10)',[order]);
    assert.equal((await act('customer','select * from public.delivery_locations')).rows[0].latitude,10);
    await transition('rider',order,'completed');
    assert.equal((await act('customer','select * from public.delivery_locations')).rows.length,0);
    assert.equal((await act('rider','select * from public.orders')).rows.length,0);
    await assert.rejects(()=>act('rider','select public.share_location($1,10,123,10)',[order]),/No active/);
    assert.equal((await act('customer','select * from public.order_events order by id')).rows.length,5);
  });
  await t.test('pickup has no delivery fee and only admin can complete ready pickup',async()=>{
    const pickup=(await place('customer',crypto.randomUUID(),'pickup')).rows[0].id;
    const o=(await act('customer','select * from public.orders where id=$1',[pickup])).rows[0];
    assert.equal(Number(o.total),200); assert.equal(o.latitude,null);
    await transition('admin',pickup,'preparing'); await transition('admin',pickup,'ready');
    await assert.rejects(()=>transition('rider',pickup,'completed'),/cannot make/);
    await transition('admin',pickup,'completed');
  });
  await t.test('customer can cancel their pending order and closed orders cannot reopen',async()=>{
    const pending=(await place('customer',crypto.randomUUID(),'pickup')).rows[0].id;
    await transition('customer',pending,'cancelled');
    await assert.rejects(()=>transition('admin',pending,'preparing'),/closed/);
  });
  await db.close();
});
