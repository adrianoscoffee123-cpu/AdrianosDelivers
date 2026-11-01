export const money = cents => new Intl.NumberFormat('en-PH',{style:'currency',currency:'PHP',maximumFractionDigits:2}).format(cents/100);
export const escapeHtml = value => String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
export function findVariant(products,key) {
  for(const product of products){ const variant=product.variants.find(v=>v.key===key); if(variant)return {product,variant}; }
  return null;
}
export function basketLines(products,basket) {
  return Object.entries(basket).flatMap(([key,quantity])=>{
    const match=findVariant(products,key);
    return match && Number.isInteger(quantity) && quantity>0 && quantity<=20 ? [{...match,key,quantity,total:match.variant.price*quantity}] : [];
  });
}
export function hydrateBasket(products,raw) {
  try { const saved=JSON.parse(raw); if(!saved || typeof saved!=='object' || Array.isArray(saved))return {}; return Object.fromEntries(basketLines(products,saved).map(l=>[l.key,l.quantity])); } catch { return {}; }
}
export function filterProducts(products,category,query) {
  const term=query.trim().toLocaleLowerCase();
  return products.filter(p=>(category==='all' || p.category===category) && (!term || `${p.name} ${p.category.replaceAll('-',' ')} ${p.variants.map(v=>v.label).join(' ')}`.toLocaleLowerCase().includes(term)));
}
export const mapUrl = shop => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${shop.latitude},${shop.longitude}`)}`;
