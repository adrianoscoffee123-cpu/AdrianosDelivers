import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile,readdir } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { products,categories,shop } from '../data/menu.js';
import { basketLines,hydrateBasket,filterProducts,mapUrl,escapeHtml } from '../src/catalog.js';
import { validatePublicConfig } from '../scripts/public-config.mjs';

test('all nine pages transcribe to unique, priced choices',()=>{
  assert.equal(products.length,126);assert.equal(categories.length,22);
  const variants=products.flatMap(p=>p.variants);assert.equal(variants.length,170);
  assert.equal(new Set(variants.map(v=>v.key)).size,170);assert.equal(new Set(products.map(p=>p.id)).size,126);
  for(const variant of variants)assert.ok(Number.isSafeInteger(variant.price)&&variant.price>0);
  assert.equal(products.find(p=>p.id==='iced-espresso-latte').variants[1].price,13000);
  assert.equal(products.find(p=>p.id==='cold-brew-spanish-latte').variants[0].price,8000);
  assert.equal(products.find(p=>p.id==='fries-french-fries').variants.length,3);
  assert.equal(products.find(p=>p.id==='snack-bar-chippy-con-carne').variants[1].price,9000);
  assert.ok(products.find(p=>p.name==='Take-out Box').review);
});
test('bag rejects malformed persisted choices and totals the selected size',()=>{
  const key='iced-espresso-latte-22-oz';
  const bag=hydrateBasket(products,JSON.stringify({[key]:2,unknown:1,'rice-meals-burger-steak-regular':-1,'cold-brew-americano-16-oz':2.4}));
  assert.deepEqual(bag,{[key]:2});assert.equal(basketLines(products,bag)[0].total,26000);
  for(const raw of ['{',null,'[]','null','"x"'])assert.deepEqual(hydrateBasket(products,raw),{});
});
test('search, categories, safe text, and confirmed shop directions',()=>{
  assert.equal(filterProducts(products,'iced-espresso','Latte').length,3);
  assert.equal(filterProducts(products,'all','22 oz').length,products.filter(p=>p.variants.some(v=>v.label==='22 oz')).length);
  assert.ok(mapUrl(shop).includes(encodeURIComponent('10.423282164368267,122.91901469110203')));
  assert.equal(escapeHtml('<img src=x onerror="bad">'),'&lt;img src=x onerror=&quot;bad&quot;&gt;');
});
test('build-time configuration rejects private credentials and invalid destinations',()=>{
  const env={VITE_SUPABASE_URL:'https://project.supabase.co',VITE_SUPABASE_PUBLISHABLE_KEY:'sb_publishable_example'};
  assert.doesNotThrow(()=>validatePublicConfig({}));assert.doesNotThrow(()=>validatePublicConfig(env));
  assert.throws(()=>validatePublicConfig({...env,VITE_SUPABASE_PUBLISHABLE_KEY:'sb_secret_never-expose'}),/Only a Supabase/);
  const roleKey=`x.${Buffer.from(JSON.stringify({role:'service_role'})).toString('base64url')}.x`;
  assert.throws(()=>validatePublicConfig({...env,VITE_SUPABASE_PUBLISHABLE_KEY:roleKey}),/Only a Supabase/);
  assert.throws(()=>validatePublicConfig({...env,VITE_DATABASE_PASSWORD:'secret'}),/Unexpected/);
  assert.throws(()=>validatePublicConfig({...env,VITE_SUPABASE_URL:'https://user:password@project.supabase.co/'}),/without credentials/);
  assert.throws(()=>validatePublicConfig({...env,VITE_SUPABASE_URL:'https://project.supabase.co.attacker.com/'}),/Use the HTTPS/);
});
test('catalog seed is repeatable, read-only to visitors, and cannot open checkout',async()=>{
  const db=new PGlite();
  try{
    await db.exec(`create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key);
      create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
      create function auth.jwt() returns jsonb language sql stable as $$ select '{}'::jsonb $$;
      grant usage on schema public,auth to anon,authenticated;grant execute on function auth.uid(),auth.jwt() to anon,authenticated;`);
    for(const file of (await readdir(new URL('../supabase/migrations/',import.meta.url))).filter(f=>f.endsWith('.sql')).sort())await db.exec(await readFile(new URL(`../supabase/migrations/${file}`,import.meta.url),'utf8'));
    const seed=await readFile(new URL('../supabase/catalog-seed.sql',import.meta.url),'utf8');await db.exec(seed);await db.exec(seed);
    const snapshot=(await db.query('select latitude,longitude,accepting_orders from public.shop_settings')).rows[0];assert.equal(snapshot.latitude,shop.latitude);assert.equal(snapshot.longitude,shop.longitude);assert.equal(snapshot.accepting_orders,false);
    assert.equal((await db.query("select count(*)::int as n from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.prosecdef")).rows[0].n,0);
    await db.exec('set role anon');
    const rows=(await db.query('select * from public.menu_items')).rows;assert.equal(rows.length,170);assert.ok(rows.every(row=>!row.active&&row.published));
    for(const product of products)for(const variant of product.variants){const row=rows.find(row=>row.catalog_key===variant.key);assert.ok(row);assert.equal(row.variant_label,variant.label);assert.equal(Number(row.price)*100,variant.price);}
    await assert.rejects(()=>db.query('update public.menu_items set price=1'),/permission denied/);
    await assert.rejects(()=>db.query("select public.quote_order('[]'::jsonb,'pickup')"),/not accepting/);
    await db.exec('reset role');
    const row=rows.find(row=>row.catalog_key==='iced-espresso-latte-22-oz');
    await db.query('update public.menu_items set active=true where id=$1',[row.id]);await db.exec('update public.shop_settings set accepting_orders=true');
    await db.exec('set role anon');
    const q=(await db.query("select public.quote_order($1::jsonb,'pickup') as q",[JSON.stringify([{id:row.id,quantity:2,price:1,variant_label:'8 oz'}])])).rows[0].q;
    assert.equal(q.total,260);assert.equal(q.items[0].variant_label,'22 oz');assert.equal(q.items[0].category,'Iced espresso');
  }finally{await db.close();}
});
