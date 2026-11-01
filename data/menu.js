// Transcribed from the nine menu photographs supplied by the owner, 2026-11-01.
// Prices are PHP centavos. Only options explicitly printed on the menu are offered.
const single = (name, price, label = 'Regular', extra = {}) => ({ name, variants: [{ label, price: price * 100 }], ...extra });
const sizes = (name, small, large) => ({ name, variants: [{ label: '16 oz', price: small * 100 }, { label: '22 oz', price: large * 100 }] });
const options = (name, values) => ({ name, variants: values.map(([label, price]) => ({ label, price: price * 100 })) });
const slug = value => value.toLowerCase().normalize('NFKD').replace(/[’']/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
export const shop = Object.freeze({
  name: 'Adriano’s', tagline: 'Coffee + Shawarma',
  latitude: 10.423282164368267, longitude: 122.91901469110203,
  address: 'Burgos Street, Brgy. 3 Poblacion, La Carlota City',
  landmark: 'In front of McDonald’s Drive Thru',
  acceptingOrders: false, currency: 'PHP', timezone: 'Asia/Manila',
});
const groups = [
  { id: 'rice-meals', title: 'Rice meals', subtitle: 'Rice is life', section: 'Kanin-get enough', page: 1, icon: '🍛', items: [
    single('Burger Steak',165),single('Chicken Tenders',155),single('Hungarian',145),single('Fish Fillet',155),single('Liempo',165),single('Sisig',145),single('Backribs',200),single('Chicken Katsu Curry',195),single('Chicken Tonkatsu',195),
  ]},
  { id: 'rice-wraps', title: 'Shawarma rice & burritos', subtitle: 'Rice is life', section: 'The flavor trip', page: 1, icon: '🌯', items: [
    options('Shawarma Rice',[['Chicken',110],['Pork',115],['Beef',125]]), options('Burrito',[['Chicken',125],['Pork',135],['Beef',145]]),
  ]},
  { id: 'burgers', title: 'Burgers', subtitle: 'Bite society', section: 'Bun intended', page: 2, icon: '🍔', items: [
    single('Cheese Burger',145),single('Chicken Burger',135),single('Smoked Grilled Burger',150),
  ]},
  { id: 'shawarma', title: 'Shawarma wraps', subtitle: 'Bite society', section: 'That’s a wrap!', page: 2, icon: '🌯', items: [
    options('Shawarma Wrap',[['Beef',85],['Pork',80],['Chicken',75]]),
  ]},
  { id: 'food-extras', title: 'Food extras', subtitle: 'Bite society', section: 'Add ons', page: 2, icon: '＋', items: [
    single('Steam Rice',25),single('Java Rice',30),single('Garlic Rice',30),single('Take-out Box',10,'Each',{ review: 'Confirm whether a box is required per meal, per order, or optional. No automatic packaging fee is applied.' }),single('Egg',25),single('Sauce',25,'Regular',{review:'Confirm sauce choices and serving size.'}),
  ]},
  { id: 'crunch', title: 'Crunch club', subtitle: 'Crunch club', section: 'Dip it good', page: 3, icon: '🥨', items: [
    single('Chips N’ Dip',125),single('Onion Rings',145),single('Lumpia Shanghai',135),single('Chicken Skin',160),single('Fish N’ Chips',135),
  ]},
  { id: 'hunger', title: 'Noodles & pasta', subtitle: 'Crunch club', section: 'Hunger crushers', page: 3, icon: '🍜', items: [
    single('Chicken Tenders w/ Fries',145),single('Ramen',135),single('Vietnamese Beef Pho',135,'Regular',{sourceName:'Vietnameses Beef Pho'}),single('Chicken Alfredo',170),single('Pork Lasagna',180),single('Beef Lasagna',200),
  ]},
  { id: 'snack-bar', title: 'Snack bar', subtitle: 'Crunch club', section: 'Snack-bar', page: 3, icon: '🌮', items: [
    single('Vcut Con Nacho Fries',135),single('Vcut Con Nachos',105),options('Chippy Con Carne',[['Small',60],['Big',90]]),
  ]},
  { id: 'fries', title: 'Fries & nachos', subtitle: 'Tasty bites', section: 'Fries and nachos series', page: 4, icon: '🍟', items: [
    options('French Fries',[['Sour Cream',90],['BBQ',90],['Cheese',90]]),single('Nachos',95),single('Nachos Fries',155),single('Shawarma Fries',100),single('Cheesy Fries',100),
  ]},
  { id: 'quesadillas', title: 'Quesadillas', subtitle: 'Tasty bites', section: 'Quesadilla spree', page: 4, icon: '🫓', items: [
    single('Cheese Quesadillas',105),single('Chicken Quesadillas',110),single('Pork Quesadillas',115),single('Beef Quesadillas',125),single('Tuna Melt Quesadillas',135),single('Hawaiian Quesadillas',145),
  ]},
  { id: 'premium-milk', title: 'Premium milk', subtitle: 'Milk magic', section: 'Premium milk based', page: 5, icon: '🥛', items: [
    ...['Oreo','Matcha Milk','Strawberry Matcha','Pure Cocoa','Ube Milk','Biscoff Milk','Mango Graham'].map(name=>single(name,125,'22 oz')),
  ]},
  { id: 'milk', title: 'Milk based', subtitle: 'Milk magic', section: 'Milk based', page: 5, icon: '🥛', items: [
    ...['Blueberry','Strawberry','Mango'].map(name=>sizes(name,75,85)),
  ]},
  { id: 'other-drinks', title: 'More to enjoy', subtitle: 'Milk magic', section: 'More to enjoy', page: 5, icon: '🧋', items: [
    single('Thai Milk Tea',130,'Menu serving',{review:'Cup size is not printed on the supplied menu.'}),single('Hot Chocolate',70,'Menu serving',{review:'Cup size is not printed on the supplied menu.'}),single('Mineral Water',25,'Bottle',{review:'Bottle volume is not printed on the supplied menu.'}),single('Coke in Can',70,'Can',{review:'Can volume is not printed on the supplied menu.'}),
  ]},
  { id: 'drink-extras', title: 'Drink extras', subtitle: 'Milk magic', section: 'Add ons', page: 5, icon: '＋', items: [
    single('Nata',20,'Extra',{review:'Confirm compatible drinks and serving size.'}),single('Cold Foam',20,'Extra',{review:'Confirm compatible drinks and serving size.'}),single('Oat Milk',50,'Extra',{review:'Confirm whether this is a milk substitution or an extra serving, and compatible drinks.'}),
  ]},
  { id: 'iced-espresso', title: 'Iced espresso', subtitle: 'Espresso', section: 'Espresso (iced)', page: 6, icon: '☕', items: [
    ...['Americano','Latte','Spanish Latte','Cream Cheese Latte','French Vanilla','Salted Caramel','Hazelnut Mocha','Mocha','Caramel'].map(name=>sizes(name,120,130)),
  ]},
  { id: 'hot-espresso', title: 'Hot espresso', subtitle: 'Espresso', section: 'Espresso (hot)', page: 6, icon: '☕', items: [
    ...['Americano','Cappuccino','Latte'].map(name=>single(name,100,'8 oz')),
  ]},
  { id: 'premium-espresso', title: 'Premium espresso', subtitle: 'Espresso', section: 'Premium espresso', page: 6, icon: '☕', items: [
    ...['Biscoff Latte','Sea Salt Latte','Salted Matcha','Pistachio Cream Latte','Kape Palma','Dirty Matcha','Ube Latte','Adz Latte','Yema Affogato','Espresso Sunrise'].map(name=>single(name,140,'22 oz')),
  ]},
  { id: 'soda', title: 'Soda', subtitle: 'Stay fresh', section: 'Soda', page: 7, icon: '🥤', items: [
    ...['Strawberry','Lychee','Blueberry','Bubblegum','Green Apple','Watermelon','Grapes'].map(name=>sizes(name,65,75)),
  ]},
  { id: 'fruit-tea', title: 'Fruit tea', subtitle: 'Stay fresh', section: 'Fruit tea', page: 7, icon: '🍹', items: [
    ...['Strawberry','Lychee','Blueberry','Bubblegum','Grapes','Mixed Berries','Green Apple','Watermelon'].map(name=>sizes(name,75,80)),
  ]},
  { id: 'cold-brew', title: 'Cold brew', subtitle: 'Let’s brew', section: 'Cold brew', page: 8, icon: '🧊', items: [
    ...['Spanish Latte','Caramel Macchiato','Salted Caramel','Mocha Latte','Hazelnut Mocha','Americano','Cream Cheese Latte','French Vanilla'].map(name=>sizes(name,80,90)),
  ]},
  { id: 'premium-cold-brew', title: 'Premium cold brew', subtitle: 'Let’s brew', section: 'Premium cold brew', page: 8, icon: '🧊', items: [
    ...['Biscoff Latte','Ube Latte','Sea Salt Latte','Yema Affogato','Pistachio Cream Latte','Adz Latte','Salted Matcha','Vietnamese','Dirty Matcha','Kape Palma'].map(name=>single(name,125,'22 oz')),
  ]},
  { id: 'frappes', title: 'Blended frappes', subtitle: 'Frappes', section: 'Blended frappes', page: 9, icon: '🧋', items: [
    ...['Ube Frappe','Vanilla Frappe','Matcha Frappe','Strawberry Frappe','Mango Frappe','Blueberry Frappe','Cookies N’ Cream Frappe','Choco Java Frappe'].map(name=>single(name,145,'22 oz')),
  ]},
];
export const categories = groups.map(({items,...group})=>group);
export const products = groups.flatMap(group=>group.items.map((item,index)=>({
  ...item, id:`${group.id}-${slug(item.name)}`, category:group.id, page:group.page, sort:index,
  variants:item.variants.map(variant=>({...variant,key:`${group.id}-${slug(item.name)}-${slug(variant.label)}`})),
})));
export const menuPages = ['Rice is life','Bite society','Crunch club','Tasty bites','Milk magic','Espresso','Stay fresh','Let’s brew','Frappes'].map((title,i)=>({page:i+1,title,image:`/menus/page-${i+1}.jpg`}));
