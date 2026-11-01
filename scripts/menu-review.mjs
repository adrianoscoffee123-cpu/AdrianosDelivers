import { products,categories,shop } from '../data/menu.js';
import { writeFile,readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const pesos=cents=>`₱${(cents/100).toFixed(2)}`;
const lines=["# Adriano’s menu transcription",'', 'Source: nine owner-supplied menu photographs on November 1, 2026. No sample prices are used in the storefront.', '',`Store: ${shop.address} (${shop.landmark}). Pin: ${shop.latitude}, ${shop.longitude}.`,'','126 products · 170 priced choices · 22 categories. Ordering remains closed.',''];
for(const category of categories){
  lines.push(`## ${category.title}`,`Source page ${category.page}: ${category.subtitle} / ${category.section}.`,'','| Item | Printed choices and prices | Review |','| --- | --- | --- |');
  for(const product of products.filter(p=>p.category===category.id))lines.push(`| ${product.name} | ${product.variants.map(v=>`${v.label}: ${pesos(v.price)}`).join('; ')} | ${product.review||product.sourceName&&`Source spelling: ${product.sourceName}`||'—'} |`);
  lines.push('');
}
lines.push('## Source image integrity','','Images are copied unchanged; hashes let us compare later imports.','');
for(let page=1;page<=9;page++){const content=await readFile(new URL(`../public/menus/page-${page}.jpg`,import.meta.url));lines.push(`- Page ${page}: SHA-256 \`${createHash('sha256').update(content).digest('hex')}\``);}
await writeFile(new URL('../MENU_REVIEW.md',import.meta.url),lines.join('\n')+'\n');
console.log('Wrote MENU_REVIEW.md.');
