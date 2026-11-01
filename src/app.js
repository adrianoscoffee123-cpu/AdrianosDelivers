import './style.css';
import { products as sourceProducts,categories,menuPages,shop } from '../data/menu.js';
import { money,escapeHtml as e,findVariant,basketLines,hydrateBasket,filterProducts,mapUrl } from './catalog.js';

const $=selector=>document.querySelector(selector);
const storageKey='adrianos-menu-bag-v1';
const state={products:structuredClone(sourceProducts),basket:{},category:'all',query:'',client:null,user:null,role:null,catalogStatus:'Local menu · transcribed from the supplied menu photos',connection:'Not linked in this build',authEnabled:false,authStatus:'Not connected',selected:null,quantity:1,sessionGeneration:0};
try{state.basket=hydrateBasket(state.products,localStorage.getItem(storageKey));}catch{/* Browsing works with storage disabled. */}
let toastTimer;
function toast(message){clearTimeout(toastTimer);$('#toast').textContent=message;$('#toast').hidden=false;toastTimer=setTimeout(()=>{$('#toast').hidden=true;},3500);}
function saveBag(){try{localStorage.setItem(storageKey,JSON.stringify(state.basket));}catch{} renderBag();}
function openDialog(id){const dialog=$(id);if(!dialog.open)dialog.showModal();}
function renderCategories(){
  $('#categories').innerHTML=[{id:'all',title:'All favorites',icon:'✦'},...categories].map(c=>`<button class="category ${state.category===c.id?'selected':''}" data-category="${e(c.id)}" aria-pressed="${state.category===c.id}"><span aria-hidden="true">${c.icon}</span>${e(c.title)}<small>${c.id==='all'?state.products.length:state.products.filter(p=>p.category===c.id).length}</small></button>`).join('');
}
function renderProducts(){
  const visible=filterProducts(state.products,state.category,state.query);
  $('#category-title').textContent=state.category==='all'?'All favorites':categories.find(c=>c.id===state.category)?.title||'Our menu';
  $('#results-count').textContent=`${visible.length} ${visible.length===1?'favorite':'favorites'}`;
  $('#catalog-status').textContent=state.catalogStatus;
  $('#products').innerHTML=visible.map(p=>{
    const category=categories.find(c=>c.id===p.category); const min=Math.min(...p.variants.map(v=>v.price));
    const note=p.variants.length>1?`${p.variants.length} ${p.variants.some(v=>v.label.includes('oz'))?'sizes':'choices'} available`:p.variants[0].label;
    return `<button class="product-card" data-product="${e(p.id)}" aria-label="Choose ${e(p.name)}, ${e(category.title)}, from ${e(money(min))}"><div class="product-art art-${p.page}"><span class="product-emoji" aria-hidden="true">${category.icon}</span><span class="product-art-label">${e(category.subtitle)}</span></div><div class="product-copy"><span class="product-category">${e(category.title)}</span><h4>${e(p.name)}</h4><p>${e(note)}</p><div class="product-bottom"><strong>${p.variants.length>1?'<small>from </small>':''}${money(min)}</strong><span class="add-circle" aria-hidden="true">＋</span></div></div></button>`;
  }).join('');
  $('#empty-state').hidden=visible.length!==0;
}
function renderBag(){
  const lines=basketLines(state.products,state.basket);const count=lines.reduce((sum,line)=>sum+line.quantity,0);const total=lines.reduce((sum,line)=>sum+line.total,0);
  $('#bag-count').textContent=count;
  $('#bag-button').setAttribute('aria-label',`Open your bag, ${count} ${count===1?'item':'items'}`);
  $('#bag-lines').innerHTML=lines.length?lines.map(l=>`<article class="bag-line"><span class="bag-icon" aria-hidden="true">${categories.find(c=>c.id===l.product.category).icon}</span><div><strong>${e(l.product.name)}</strong><small>${e(categories.find(c=>c.id===l.product.category).title)} · ${e(l.variant.label)}</small><div class="quantity-control"><button data-adjust="${e(l.key)}" data-delta="-1" aria-label="Remove one ${e(l.product.name)} ${e(l.variant.label)}">−</button><span>${l.quantity}</span><button data-adjust="${e(l.key)}" data-delta="1" ${l.quantity>=20?'disabled':''} aria-label="Add one ${e(l.product.name)} ${e(l.variant.label)}">＋</button></div></div><div class="line-end"><strong>${money(l.total)}</strong><button class="text-button" data-remove="${e(l.key)}" aria-label="Remove ${e(l.product.name)} ${e(l.variant.label)}">Remove</button></div></article>`).join(''):'<div class="empty-bag"><span aria-hidden="true">♧</span><h3>A good meal starts here.</h3><p>Add a few favorites and save your cravings.</p><button class="button secondary" data-close>Explore the menu ↗</button></div>';
  $('#bag-summary').innerHTML=lines.length?`<div class="subtotal"><span>Menu subtotal</span><strong>${money(total)}</strong></div><p class="muted">Delivery and packaging fees will be shown when ordering opens. Your bag is saved on this device; it has not been sent to the store.</p><button class="button wide" disabled>Ordering opens soon</button><button class="text-button clear-bag" id="clear-bag">Clear bag</button>`:'';
}
function showProduct(id){
  const p=state.products.find(p=>p.id===id);if(!p)return;state.selected=p;state.quantity=1;
  const category=categories.find(c=>c.id===p.category);
  $('#product-details').innerHTML=`<div class="detail-art art-${p.page}"><span aria-hidden="true">${category.icon}</span><small>${e(category.section)}</small></div><span class="eyebrow">${e(category.title)}</span><h2>${e(p.name)}</h2><p class="muted">Choose your favorite. All prices are in Philippine pesos.</p><form id="product-form"><fieldset><legend>${p.variants.some(v=>v.label.includes('oz'))?'Choose a size':'Choose an option'}</legend>${p.variants.map((v,i)=>`<label class="variant-option"><input type="radio" name="variant" value="${e(v.key)}" ${i===0?'checked':''} required><span>${e(v.label)}</span><strong>${money(v.price)}</strong></label>`).join('')}</fieldset><div class="detail-actions"><div class="quantity-control"><button type="button" id="detail-minus" aria-label="Decrease quantity" disabled>−</button><output id="detail-quantity">1</output><button type="button" id="detail-plus" aria-label="Increase quantity">＋</button></div><button class="button" id="add-to-bag">Add to bag · ${money(p.variants[0].price)}</button></div><p class="muted">Menu preview only. Adding to your bag does not place an order.</p></form><button class="source-link" data-source="${p.page}">View original menu page ↗</button>`;
  $('#product-form').addEventListener('change',updateDetail);
  $('#product-form').addEventListener('submit',event=>{
    event.preventDefault();const key=new FormData(event.currentTarget).get('variant');
    if(!findVariant(state.products,key))return;
    const next=(state.basket[key]||0)+state.quantity;if(next>20){toast('You can save up to 20 of the same option.');return;}
    if(Object.keys(state.basket).length>=30 && !state.basket[key]){toast('Your bag can hold up to 30 different choices.');return;}
    state.basket[key]=next;saveBag();$('#product-dialog').close();toast(`${p.name} added to your bag.`);
  });
  openDialog('#product-dialog');
}
function updateDetail(){
  const selected=$('#product-form input:checked');const v=state.selected?.variants.find(v=>v.key===selected?.value);if(!v)return;
  $('#detail-quantity').value=state.quantity;$('#detail-minus').disabled=state.quantity<=1;$('#detail-plus').disabled=state.quantity>=20;
  $('#add-to-bag').textContent=`Add to bag · ${money(v.price*state.quantity)}`;
}
function showOriginals(page=1){
  $('#product-dialog').close();$('#menu-page-select').value=String(page);updateOriginal();openDialog('#originals-dialog');
}
function updateOriginal(){const page=menuPages.find(p=>p.page===Number($('#menu-page-select').value))||menuPages[0];$('#menu-page-image').src=page.image;$('#menu-page-image').alt=`Adriano’s original menu: ${page.title}`;}
function showInfo(html){$('#info-content').innerHTML=html;openDialog('#info-dialog');}
function showSetup(){
  showInfo(`<span class="eyebrow">PARTIAL SETUP</span><h2>A good start.</h2><p>The menu and shop location are ready to review. Live ordering stays closed in this release.</p><dl class="setup-list"><div><dt>Menu</dt><dd>126 products · 170 priced choices · 9 source pages</dd></div><div><dt>Store location</dt><dd>${e(shop.latitude)}, ${e(shop.longitude)}</dd></div><div><dt>Supabase</dt><dd>${e(state.connection)}</dd></div><div><dt>Sign-in</dt><dd>${e(state.authStatus)}</dd></div><div><dt>Ordering</dt><dd>Closed in this partial release</dd></div><div><dt>Delivery & packaging</dt><dd>Awaiting approved fees and service area</dd></div><div><dt>Staff workspaces</dt><dd>Database permissions prepared; admin and rider screens are next</dd></div></dl><p class="muted">The bag is a menu subtotal only. It does not submit orders, accept payments, or share a location.</p>`);
}
function showAccount(){
  if(!state.client)return;
  $('#account-content').innerHTML=state.user?`<span class="eyebrow">YOUR ACCOUNT</span><h2>Welcome to Adriano’s.</h2><p>${e(state.user.email||'Signed in')}</p><p class="muted">${state.role?`Authorized ${e(state.role)} account.`:'Customer account.'} Ordering and staff screens are not enabled in this partial release.</p><button id="sign-out" class="button wide secondary">Sign out</button>`:`<span class="eyebrow">WELCOME TO ADRIANO’S</span><h2>Your favorites, closer.</h2><p>Use your Google account to sign in. Ordering is opening soon.</p><button id="google-sign-in" class="button wide">Continue with Google ↗</button><p class="muted">We use your email to identify your account. No orders or precise locations are collected in this partial release.</p>`;
  openDialog('#account-dialog');
}
async function loadCloud(){
  const url=import.meta.env.VITE_SUPABASE_URL;const key=import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if(!url && !key)return;
  if(!url||!key){state.connection='Incomplete public connection settings';return;}
  try{
    const {createClient}=await import('@supabase/supabase-js');
    state.client=createClient(url,key,{auth:{flowType:'pkce',detectSessionInUrl:true,persistSession:true,autoRefreshToken:true}});
    const {data,error}=await state.client.from('menu_items').select('catalog_key,product_key,name,price,variant_label,published,active').not('catalog_key','is',null).order('sort_order');
    if(error)throw error;
    const rows=new Map((data||[]).map(row=>[row.catalog_key,row]));
    if(rows.size!==170 || !sourceProducts.every(p=>p.variants.every(v=>rows.has(v.key))))throw new Error('Catalog setup is incomplete');
    const updated=structuredClone(sourceProducts);
    for(const product of updated){for(const variant of product.variants){const row=rows.get(variant.key);const cents=Math.round(Number(row.price)*100);if(!Number.isSafeInteger(cents)||cents<=0)throw new Error('Invalid catalog price');variant.price=cents;}}
    state.products=updated;state.connection='Connected · menu loaded from Supabase';state.catalogStatus='Menu prices loaded from Adriano’s Supabase catalog';
    renderProducts();renderBag();
    try{
      const settings=await fetch(new URL('/auth/v1/settings',url),{headers:{apikey:key},credentials:'omit'});
      if(!settings.ok)throw new Error('Sign-in settings unavailable');
      state.authEnabled=Boolean((await settings.json()).external?.google);
      state.authStatus=state.authEnabled?'Google sign-in configured':'Google sign-in awaiting setup';
    }catch{state.authStatus='Sign-in settings could not be verified';}
    const applyUser=async user=>{
      const generation=++state.sessionGeneration;state.user=user;state.role=null;
      if(user){const {data}=await state.client.from('staff_users').select('role').eq('user_id',user.id).maybeSingle();if(generation!==state.sessionGeneration)return;state.role=data?.role||null;}
      $('#account-button').textContent=user?'My account':'Sign in';
      $('#account-button').hidden=!user&&!state.authEnabled;
    };
    state.client.auth.onAuthStateChange((_event,session)=>{queueMicrotask(()=>{void applyUser(session?.user||null);});});
    const {data:auth,error:authError}=await state.client.auth.getSession();if(authError)throw authError;await applyUser(auth.session?.user||null);
  }catch{
    state.connection='Connection needs attention · showing the supplied menu';state.catalogStatus='Supplied menu shown · live connection has not been verified';$('#catalog-status').textContent=state.catalogStatus;
  }
}

document.addEventListener('click',async event=>{
  const button=event.target.closest('button');if(!button)return;
  if(button.hasAttribute('data-close')){button.closest('dialog')?.close();return;}
  if(button.dataset.category){state.category=button.dataset.category;renderCategories();renderProducts();return;}
  if(button.dataset.product){showProduct(button.dataset.product);return;}
  if(button.dataset.source){showOriginals(Number(button.dataset.source));return;}
  if(button.dataset.adjust){const key=button.dataset.adjust;const next=(state.basket[key]||0)+Number(button.dataset.delta);if(next<=0)delete state.basket[key];else state.basket[key]=Math.min(20,next);saveBag();return;}
  if(button.dataset.remove){delete state.basket[button.dataset.remove];saveBag();return;}
  if(button.id==='detail-minus'||button.id==='detail-plus'){state.quantity=Math.max(1,Math.min(20,state.quantity+(button.id==='detail-minus'?-1:1)));updateDetail();}
  if(button.id==='clear-bag'){state.basket={};saveBag();}
  if(button.id==='google-sign-in'){
    button.disabled=true;
    const {error}=await state.client.auth.signInWithOAuth({provider:'google',options:{redirectTo:window.location.origin+'/'}});
    if(error){toast('Sign-in could not start. Please try again later.');button.disabled=false;}
  }
  if(button.id==='sign-out'){
    button.disabled=true;const {error}=await state.client.auth.signOut();if(error){toast('Could not sign out. Try again.');button.disabled=false;return;}
    state.sessionGeneration++;state.user=null;state.role=null;$('#account-button').textContent='Sign in';$('#account-dialog').close();toast('Signed out.');
  }
});
$('#search').addEventListener('input',event=>{state.query=event.target.value;renderProducts();});
$('#reset-search').addEventListener('click',()=>{state.query='';state.category='all';$('#search').value='';renderCategories();renderProducts();});
$('#bag-button').addEventListener('click',()=>{renderBag();openDialog('#bag-dialog');});
$('#originals-button').addEventListener('click',()=>showOriginals());
$('#setup-button').addEventListener('click',showSetup);
$('#account-button').addEventListener('click',showAccount);
$('#privacy-button').addEventListener('click',()=>showInfo('<span class="eyebrow">YOUR PRIVACY</span><h2>A little clarity.</h2><p>Your bag is saved in this browser on this device. Nothing in the bag is sent as an order in this partial release.</p><p>If sign-in is connected, Supabase processes your account and session, and Google handles Google sign-in. Hosting providers receive normal web request information.</p><p>Opening Google Maps sends you to Google’s service with the public shop location. This version does not ask for your location.</p><p>Use “Clear bag” to remove saved choices. Sign out on a shared device. Store contact details and the full order-data policy will be added before live ordering.</p>'));
$('#menu-page-select').innerHTML=menuPages.map(p=>`<option value="${p.page}">${p.page}. ${e(p.title)}</option>`).join('');
$('#menu-page-select').addEventListener('change',updateOriginal);
$('#store-directions').href=mapUrl(shop);$('#year').textContent=new Date().getFullYear();
document.addEventListener('keydown',event=>{if(event.key==='/'&&!event.ctrlKey&&!event.metaKey&&!event.altKey&&!event.target.closest('input,textarea,select')&&!document.querySelector('dialog[open]')){event.preventDefault();$('#search').focus();}});
renderCategories();renderProducts();renderBag();void loadCloud();
