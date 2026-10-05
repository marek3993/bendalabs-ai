const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { spawn } = require('node:child_process');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');
const output = path.join(root, '.tmp-automation');
fs.mkdirSync(output, { recursive: true });
const base = 'http://localhost:3215';
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
  await new Promise(resolve => server.listen(4325, '127.0.0.1', resolve));
  const log = fs.openSync(path.join(output, 'server.log'), 'w');
  app = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '--port', '3215'], { cwd: root, windowsHide: true, stdio: ['ignore', log, log], env: { ...process.env, BENDALABS_LEADS_URL: 'http://127.0.0.1:4325/edge', BENDALABS_LEADS_KEY: 'isolated-test-only', SUPABASE_URL: '', SUPABASE_SERVICE_ROLE_KEY: '', OPENAI_API_KEY: '', GOOGLE_ADS_CONVERSION_SEND_TO: '', RESEND_API_KEY: '' } });
  let ready = false;
  for (let i = 0; i < 60; i++) { try { ready = (await fetch(base + '/automatizacia')).ok; } catch {} if (ready) break; await new Promise(resolve => setTimeout(resolve, 500)); }
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
  browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  for (const width of [390, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 950 } });
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(base + '/automatizacia?utm_source=openai&utm_medium=ads&utm_campaign=verification&utm_content=service&utm_term=documents&utm_id=test');
    assert.match(await page.locator('h1').innerText(), /Firemné dokumenty a zákazky bez zbytočnej ručnej práce\./);
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
    await page.getByRole('link', { name: 'Mám záujem o dokumenty' }).click();
    await page.waitForURL('**modul=dokumenty#konfigurator');
    assert.equal(new URL(page.url()).searchParams.get('utm_term'), 'documents');
    const docs = page.locator('input[value=dokumenty]'), opportunities = page.locator('input[value=prilezitosti]');
    assert.ok(await docs.isChecked());
    const quote = async (setup, monthly) => {
      assert.match(await page.locator('[data-price=setup]').innerText(), new RegExp(setup));
      assert.match(await page.locator('[data-price=monthly]').innerText(), new RegExp(monthly));
    };
    await quote('500', '44,50');
    await opportunities.check(); await quote('850', '74,50');
    await docs.uncheck(); await quote('500', '49,50');
    await opportunities.uncheck();
    const form = page.locator('.auto-config-form');
    await form.locator('[name=name]').fill('AUTOMATED TEST');
    await form.locator('[name=email]').fill('automation@example.com');
    await form.locator('[name=business]').fill('TEST ONLY');
    await form.getByRole('button', { name: 'Poslať nezáväzné zadanie' }).click();
    await form.getByRole('alert').waitFor();
    assert.match(await form.getByRole('alert').innerText(), /Vyberte aspoň/);
    await docs.check();
    await form.locator('[name=details-dokumenty]').fill('Zachované podklady po chybe');
    await form.locator('[name=custom]').fill('Vlastná požiadavka zostane zachovaná');
    fail = true;
    await form.getByRole('button', { name: 'Poslať nezáväzné zadanie' }).click();
    await page.getByText(/Vaše zadanie zostalo vyplnené/).waitFor();
    assert.equal(await form.locator('[name=name]').inputValue(), 'AUTOMATED TEST');
    assert.equal(await form.locator('[name=details-dokumenty]').inputValue(), 'Zachované podklady po chybe');
    fail = false;
    await page.route('**/api/automation-requests', route => route.abort());
    await form.getByRole('button', { name: 'Poslať nezáväzné zadanie' }).click();
    await page.getByText(/Dopyt sa nepodarilo odoslať/).waitFor();
    assert.equal(await form.locator('[name=custom]').inputValue(), 'Vlastná požiadavka zostane zachovaná');
    await page.unroute('**/api/automation-requests');
    await form.getByRole('button', { name: 'Poslať nezáväzné zadanie' }).click();
    await page.locator('#automation-success').waitFor();
    for (const value of ['utm_source=openai', 'utm_term=documents', 'utm_id=test', 'Zachované podklady po chybe']) assert.ok(records.at(-1).message.includes(value), value);
    await page.goto(base + '/automatizacia?modul=prilezitosti');
    assert.ok(await page.locator('input[value=prilezitosti]').isChecked());
    assert.equal(await page.getByRole('tab', { name: 'Príležitosti', exact: true }).getAttribute('aria-selected'), 'true');
    await page.goto(base + '/automatizacia?modul=dokumenty,prilezitosti'); await quote('850', '74,50');
    await page.goto(base + '/automatizacia?modul=spracovanie'); assert.ok(await page.locator('input[value=dokumenty]').isChecked());
    await page.close();
  }
  assert.deepEqual(errors, []);
  fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify({ passed: true, widths: [390, 1440], storedTestRows: records.length, pageErrors: errors, checks: ['pricing', 'module links', 'UTM persistence', 'previews', 'API validation', 'storage failure', 'network failure', 'retained form values', 'successful persistence'] }, null, 2));
  console.log('PASS: automation API and desktop/mobile flows; ' + records.length + ' isolated storage rows.');
}
run().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => { if (browser) await browser.close(); if (app) app.kill(); server.close(); });
