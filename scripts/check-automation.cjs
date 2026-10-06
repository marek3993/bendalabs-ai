const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { spawn } = require('node:child_process');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');
const output = path.join(root, '.tmp-automation');
fs.mkdirSync(output, { recursive: true });
const base = 'http://127.0.0.1:3216';
const records = [];
let fail = false, app, browser;
const errors = [];
const server = http.createServer(async (req, res) => {
  let raw = ''; for await (const part of req) raw += part;
  if (req.url === '/edge') {
    const input = JSON.parse(raw);
    assert.equal(req.headers['x-bendalabs-key'], 'isolated-test-only');
    req.url = '/rest/v1/' + input.table;
    req.method = input.method;
    raw = JSON.stringify(input.body);
  }
  res.setHeader('content-type', 'application/json');
  if (fail) { res.statusCode = 503; return res.end('{}'); }
  if (req.method === 'POST' && req.url.endsWith('/contact_requests')) {
    const row = { ...JSON.parse(raw), id: crypto.randomUUID(), created_at: new Date().toISOString() };
    records.push(row); res.statusCode = 201; return res.end(JSON.stringify([row]));
  }
  res.end('[]');
});
const valid = { name: 'AUTOMATED TEST', email: 'automation@example.com', business: 'TEST ONLY', website: '', users: '1–5', modules: ['dokumenty'], details: { dokumenty: 'Test documents', prilezitosti: '' }, custom: '', company: '', campaign: '' };
async function post(body, headers = {}) {
  return fetch(base + '/api/automation-requests', { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: typeof body === 'string' ? body : JSON.stringify(body) });
}
async function run() {
  await new Promise(resolve => server.listen(4326, '127.0.0.1', resolve));
  const log = fs.openSync(path.join(output, 'server.log'), 'w');
  app = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '--hostname', '127.0.0.1', '--port', '3216'], { cwd: root, windowsHide: true, stdio: ['ignore', log, log], env: { ...process.env, BENDALABS_LEADS_URL: 'http://127.0.0.1:4326/edge', BENDALABS_LEADS_KEY: 'isolated-test-only', SUPABASE_URL: '', SUPABASE_SERVICE_ROLE_KEY: '', OPENAI_API_KEY: '', GOOGLE_ADS_CONVERSION_SEND_TO: '', RESEND_API_KEY: '' } });
  let ready = false;
  for (let i = 0; i < 60; i++) { try { ready = (await fetch(base + '/automatizacia', { signal: AbortSignal.timeout(2000) })).ok; } catch {} if (ready) break; await new Promise(resolve => setTimeout(resolve, 500)); }
  assert.ok(ready, 'Production server starts');
  for (const body of ['{', {}, { ...valid, email: 'bad' }, { ...valid, modules: [] }, { ...valid, modules: ['unknown'] }, { ...valid, website: 'javascript:alert(1)' }]) assert.equal((await post(body)).status, 400);
  assert.equal((await post(valid, { origin: 'https://foreign.example' })).status, 403);
  assert.equal((await post('x'.repeat(16001))).status, 413);
  assert.equal((await post({ ...valid, company: 'bot' })).status, 200);
  assert.equal(records.length, 0);
  for (const [modules, price] of [[['dokumenty'], '44,50'], [['prilezitosti'], '49,50'], [['dokumenty', 'prilezitosti'], '74,50'], [[], 'individuálne']]) {
    const response = await post({ ...valid, modules, custom: 'Vlastná požiadavka na automatizáciu' });
    assert.equal(response.status, 200);
    assert.ok(records.at(-1).message.includes(price));
  }
  fail = true; assert.equal((await post(valid)).status, 503); fail = false;
  const short = { email: 'short-form@example.com', situation: 'Potrebujeme zjednodušiť prípravu firemných dokumentov.', modules: [], campaign: 'utm_source=chatgpt; utm_content=short-intake' };
  const shortResponse = await post(short);
  assert.equal(shortResponse.status, 200);
  const shortResult = await shortResponse.json();
  assert.equal(shortResult.eventId, records.at(-1).id, 'Conversion id exists only after persistence');
  assert.equal(records.at(-1).name, 'Záujemca');
  assert.ok(records.at(-1).message.includes(short.situation));
  assert.ok(records.at(-1).message.includes(short.campaign));
  assert.ok(!records.at(-1).message.includes('500'), 'Intake does not store an order or quote');
  for (const situation of ['', 'short', 'x'.repeat(1201)]) assert.equal((await post({ ...short, situation })).status, 400);
  const beforeHoney = records.length;
  const honey = await (await post({ ...short, company: 'bot' })).json();
  assert.equal(honey.eventId, undefined);
  assert.equal(records.length, beforeHoney);
  fail = true;
  const unavailable = await post(short);
  assert.equal(unavailable.status, 503);
  assert.equal((await unavailable.json()).eventId, undefined);
  fail = false;
  if (process.argv.includes('--api-only')) {
    console.log('PASS: short intake, legacy requests, UTM preservation, validation, honeypot and storage failure; ' + records.length + ' isolated rows.');
    return;
  }
  browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  for (const width of [390, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 950 } });
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(base + '/automatizacia?utm_source=openai&utm_medium=ads&utm_campaign=verification&utm_content=service&utm_term=documents&utm_id=test');
    assert.match(await page.locator('h1').innerText(), /AI pripraví dokumenty/);
    assert.equal(await page.locator('html').getAttribute('lang'), 'sk');
    assert.equal(await page.locator('link[rel=canonical]').getAttribute('href'), 'https://bendalabs.sk/automatizacia');
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'No horizontal overflow');
    await page.screenshot({ path: path.join(output, `page-${width}.png`), fullPage: true });
    await page.getByRole('button', { name: 'Pripraviť nástupné dokumenty' }).click();
    assert.ok(await page.getByText('Pracovná zmluva', { exact: true }).isVisible());
    await page.getByRole('tab', { name: 'Dodatok', exact: true }).click();
    await page.getByLabel('Nová pracovná pozícia').selectOption('Projektová manažérka');
    await page.getByRole('button', { name: 'Pripraviť dodatok', exact: true }).click();
    assert.match(await page.locator('.auto-demo-result').innerText(), /Projektová manažérka/);
    await page.getByRole('tab', { name: 'Príležitosti', exact: true }).click();
    await page.getByRole('button', { name: 'Pozrieť pripravený e-mail' }).click();
    assert.match(await page.locator('.auto-demo-result').innerText(), /Predmet: Elektroinštalácia/);
    await page.getByRole('link', { name: 'Opísať prácu s dokumentmi' }).click();
    await page.waitForURL('**modul=dokumenty#konfigurator');
    assert.equal(new URL(page.url()).searchParams.get('utm_term'), 'documents');
    const form = page.locator('.auto-intake-form');
    assert.equal(await form.locator('[required]').count(), 2);
    await form.locator('[name=email]').fill('automation@example.com');
    await form.locator('[name=situation]').fill('Zachované podklady po chybe');
    fail = true;
    await form.getByRole('button', { name: 'Poslať situáciu na analýzu' }).click();
    await page.getByText(/Vaše údaje zostali vyplnené/).waitFor();
    assert.equal(await form.locator('[name=situation]').inputValue(), 'Zachované podklady po chybe');
    fail = false;
    await page.route('**/api/automation-requests', route => route.abort());
    await form.getByRole('button', { name: 'Poslať situáciu na analýzu' }).click();
    await page.getByText(/Situáciu sa nepodarilo odoslať/).waitFor();
    assert.equal(await form.locator('[name=situation]').inputValue(), 'Zachované podklady po chybe');
    await page.unroute('**/api/automation-requests');
    await form.getByRole('button', { name: 'Poslať situáciu na analýzu' }).click();
    await page.locator('#automation-success').waitFor();
    for (const value of ['utm_source=openai', 'utm_term=documents', 'utm_id=test', 'Zachované podklady po chybe']) assert.ok(records.at(-1).message.includes(value), value);
    await page.goto(base + '/automatizacia?modul=prilezitosti');
    assert.match(await page.locator('h1').innerText(), /AI hľadá zákazky za vás/);
    assert.equal(await page.getByRole('tab', { name: 'Príležitosti', exact: true }).getAttribute('aria-selected'), 'true');
    await page.goto(base + '/automatizacia?modul=spracovanie');
    assert.match(await page.locator('h1').innerText(), /Nahrajte doklad/);
    await page.close();
  }
  assert.deepEqual(errors, []);
  fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify({ passed: true, widths: [390, 1440], storedTestRows: records.length, pageErrors: errors, checks: ['pricing', 'module links', 'UTM persistence', 'previews', 'API validation', 'storage failure', 'network failure', 'retained form values', 'successful persistence'] }, null, 2));
  console.log('PASS: automation API and desktop/mobile flows; ' + records.length + ' isolated storage rows.');
}
run().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => { if (browser) await browser.close(); if (app) app.kill(); server.close(); });
