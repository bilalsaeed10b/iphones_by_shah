import test from 'node:test';
import assert from 'node:assert/strict';
import {pageFiles, productPath, legacyDestination, ownerLoginURL} from '../src/navigation.js';
import {whatsappURL} from '../src/domain.js';
import {seedDevices} from '../src/seed.js';

test('public pages and individual products resolve under a repository folder',()=>{
  const origin='https://example.github.io/iphones_by_shah/stock.html';
  for(const file of Object.values(pageFiles))assert.equal(new URL('./'+file,origin).pathname,'/iphones_by_shah/'+file);
  const link=new URL(productPath('phone with & signs'),origin);
  assert.equal(link.pathname,'/iphones_by_shah/phone.html');
  assert.equal(link.searchParams.get('id'),'phone with & signs');
  assert.equal(link.hash,'');
});

test('old collection, product and owner links migrate while in-page scroll anchors remain',()=>{
  assert.equal(legacyDestination('#stock'),'./stock.html');
  assert.equal(legacyDestination('#sold'),'./sold.html');
  assert.equal(legacyDestination('#visit'),'./contact.html');
  assert.equal(legacyDestination('#admin'),'./admin.html');
  assert.equal(legacyDestination('#phone/123'), './phone.html?id=123');
  assert.equal(legacyDestination('#duo-story'),null);
  assert.equal(legacyDestination('#stock-preview'),null);
});

test('Google login returns to the owner document without product query strings or old fragments',()=>{
  assert.equal(ownerLoginURL('https://example.github.io/iphones_by_shah/phone.html?id=123#old'),'https://example.github.io/iphones_by_shah/admin.html');
  assert.equal(ownerLoginURL('http://127.0.0.1:4173/admin.html','/'),'http://127.0.0.1:4173/admin.html');
  assert.equal(ownerLoginURL('https://example.com/shop/contact.html','/shop/'),'https://example.com/shop/admin.html');
});

test('WhatsApp enquiries include a shareable exact product page, preserving the hosted folder',()=>{
  const saved=globalThis.location;
  try{
    globalThis.location={href:'https://example.github.io/iphones_by_shah/stock.html'};
    const device=seedDevices('./')[0];
    const message=new URL(whatsappURL(device)).searchParams.get('text');
    assert.ok(message.includes(`https://example.github.io/iphones_by_shah/phone.html?id=${device.id}`));
    assert.ok(message.includes(device.model));
    assert.ok(message.includes('Condition 9.5/10'));
    assert.ok(!message.includes('#phone/'));
  }finally{if(saved===undefined)delete globalThis.location;else globalThis.location=saved;}
});
