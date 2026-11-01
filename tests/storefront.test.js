import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile,readdir } from 'node:fs/promises';
import { JSDOM } from 'jsdom';
import { build } from 'vite';

test('built storefront supports search, variants, bag persistence, and closed ordering',async()=>{
  // Build to an ignored test directory. No server or cloud service is started.
  await build({logLevel:'silent',build:{outDir:'test-output/storefront',emptyOutDir:true}});
  const html=await readFile(new URL('../test-output/storefront/index.html',import.meta.url),'utf8');
  const assets=await readdir(new URL('../test-output/storefront/assets/',import.meta.url));
  const script=await readFile(new URL(`../test-output/storefront/assets/${assets.find(f=>/^index-.*\.js$/.test(f))}`,import.meta.url),'utf8');
  const dom=new JSDOM(html,{url:'http://localhost/',runScripts:'outside-only'});
  const {window}=dom;window.structuredClone=structuredClone;
  window.HTMLDialogElement.prototype.showModal=function(){this.open=true;};
  window.HTMLDialogElement.prototype.close=function(){this.open=false;};
  try{
    window.eval(script);
    const $=selector=>window.document.querySelector(selector);const $$=selector=>[...window.document.querySelectorAll(selector)];
    assert.equal($$('.product-card').length,126);assert.equal($('#bag-count').textContent,'0');
    $('#search').value='Spanish Latte';$('#search').dispatchEvent(new window.Event('input',{bubbles:true}));assert.equal($$('.product-card').length,2);
    $('[data-category="iced-espresso"]').click();assert.equal($$('.product-card').length,1);
    $('.product-card').click();assert.equal($('#product-dialog').open,true);
    const large=$('#product-form input[value="iced-espresso-spanish-latte-22-oz"]');large.checked=true;large.dispatchEvent(new window.Event('change',{bubbles:true}));
    $('#detail-plus').click();assert.match($('#add-to-bag').textContent,/260\.00/);
    $('#product-form').dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true}));assert.equal($('#product-dialog').open,false);assert.equal($('#bag-count').textContent,'2');
    $('#bag-button').click();assert.equal($('#bag-dialog').open,true);assert.match($('#bag-lines').textContent,/22 oz/);assert.match($('#bag-summary').textContent,/260\.00/);assert.equal($('#bag-summary .button').disabled,true);
    assert.deepEqual(JSON.parse(window.localStorage.getItem('adrianos-menu-bag-v1')),{'iced-espresso-spanish-latte-22-oz':2});
    $('[data-adjust][data-delta="-1"]').click();assert.equal($('#bag-count').textContent,'1');
    $('[data-remove]').click();assert.equal($('#bag-count').textContent,'0');assert.match($('#bag-lines').textContent,/A good meal/);
    $('#bag-dialog .close').click();$('#originals-button').click();assert.equal($('#originals-dialog').open,true);assert.match($('#menu-page-image').src,/page-1\.jpg$/);
    $('#menu-page-select').value='9';$('#menu-page-select').dispatchEvent(new window.Event('change'));assert.match($('#menu-page-image').src,/page-9\.jpg$/);
    assert.match($('#store-directions').href,/10\.423282164368267/);assert.equal($('#account-button').hidden,true);
    assert.ok(!$$('button').some(button=>/Pay now|Place order/i.test(button.textContent)));
  }finally{window.close();}
});
