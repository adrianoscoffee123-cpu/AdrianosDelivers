import { products,categories,shop } from '../data/menu.js';
import { readFile,writeFile,readdir } from 'node:fs/promises';
const literal=value=>value==null?'null':`'${String(value).replaceAll("'","''")}'`;
export function catalogSql(){
  const lines = products.flatMap(product=>product.variants.map(variant=>{
    const category=categories.find(c=>c.id===product.category);
    return `(${[variant.key,product.id,product.name,category.title,product.category,variant.label,(variant.price/100).toFixed(2),product.page,product.sort,product.review||null].map(literal).join(',')},true,false)`;
  }));
  return `-- Generated from data/menu.js. Review changes against the nine owner-supplied images.\n-- Repeatable: updates official catalog metadata and prices, never opens ordering.\ninsert into public.menu_items(catalog_key,product_key,name,category,category_key,variant_label,price,source_page,sort_order,review_note,published,active) values\n${lines.join(',\n')}\non conflict(catalog_key) do update set product_key=excluded.product_key,name=excluded.name,category=excluded.category,category_key=excluded.category_key,variant_label=excluded.variant_label,price=excluded.price,source_page=excluded.source_page,sort_order=excluded.sort_order,review_note=excluded.review_note,published=excluded.published;\n\n-- The supplied store location is confirmed. Delivery fee and radius remain unapproved.\nupdate public.shop_settings set name=${literal(shop.name)},address=${literal(`${shop.address} (${shop.landmark})`)},latitude=${shop.latitude},longitude=${shop.longitude},accepting_orders=false where id;\n`;
}
const destination=new URL('../supabase/catalog-seed.sql',import.meta.url);
const sql=catalogSql();
if(process.argv.includes('--check')){
  const existing=await readFile(destination,'utf8');
  if(existing!==sql)throw new Error('Catalog SQL is out of date. Run npm run catalog:sql.');
}else{
  await writeFile(destination,sql);
  console.log(`Generated ${products.length} products / ${products.flatMap(p=>p.variants).length} priced choices.`);
}
