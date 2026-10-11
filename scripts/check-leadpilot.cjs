// Full admin flow with isolated storage; no production data or paid AI calls.
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');
const output = path.join(root, '.tmp-leadpilot'); fs.mkdirSync(output, { recursive: true });
const base = 'http://localhost:3238';
const uuid = '11111111-1111-4111-8111-111111111111';
const daysAgo = n => new Date(Date.now() - n * 86400000).toISOString();
const proposal = { requirements: ['Read Gmail'], solution: 'Gmail → review → CRM', assumptions: ['FAQ provided'], exclusions: ['Booking'], questions: ['Which CRM?'], hours_min: 40, hours_max: 60, days_min: 8, days_max: 12, hourly_rate: 35, recurring_costs: 'API usage separate', reply_body: 'I can build your requested email workflow with human approval.', reply_language: 'en' };
const leads = [{ id: uuid, created_at: daysAgo(1), source_url: 'https://www.upwork.com/freelance-jobs/apply/test/', title: 'TEST ONLY · Gmail automation request', summary: 'Client wants email classification and CRM logging.', category: 'email', region: 'USA', budget_text: '$30–60 / h', published_at: daysAgo(1), publication_evidence: 'Posted yesterday', fetched_at: daysAgo(0), demand_excerpt: 'We need a developer to automate customer email responses.', verification: 'verified', status: 'new', score: 85, proposal }, { id: '22222222-2222-4222-8222-222222222222', created_at: daysAgo(21), source_url: 'https://community.n8n.io/t/test/123', title: 'TEST ONLY · Old request', summary: 'Old request', category: 'other', region: null, budget_text: null, published_at: daysAgo(21), publication_evidence: 'Original date', fetched_at: daysAgo(0), demand_excerpt: 'We need a developer to implement a workflow.', verification: 'verified', status: 'new', score: 50, proposal: null }];
let failure = false, storageReads = 0, app, browser;
const server = http.createServer(async (req, res) => {
  let raw = ''; for await (const chunk of req) raw += chunk;
  const input = JSON.parse(raw); assert.equal(req.headers['x-bendalabs-key'], 'test-only-key');
  res.setHeader('content-type', 'application/json');
  if (failure) { res.statusCode = 503; return res.end('{}'); }
  const params = new URLSearchParams(input.query);
  if (input.method === 'GET') storageReads++;
  if (input.table === 'opportunities') {
    const id = params.get('id')?.replace(/^eq\./, '');
    const matching = id ? leads.filter(lead => lead.id === id) : leads;
    if (input.method === 'PATCH') matching.forEach(lead => Object.assign(lead, input.body));
    return res.end(JSON.stringify(matching));
  }
  if (input.table === 'contact_requests') return res.end(JSON.stringify([{ id: 'contact', created_at: daysAgo(1), name: 'TEST ONLY client', email: 'client@company.sk', message: 'Need invoice automation.' }, { id: 'technical', created_at: daysAgo(1), name: 'Technical', email: 'form-check-20261006@example.com', message: 'MUST NOT APPEAR' }]));
  res.end('[]');
});
async function run() {
  await new Promise(resolve => server.listen(4338, '127.0.0.1', resolve));
  const log = fs.openSync(path.join(output, 'server.log'), 'w');
  app = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '--hostname', '127.0.0.1', '--port', '3238'], { cwd: root, stdio: ['ignore', log, log], env: { ...process.env, ADMIN_LEADS_PASSWORD: 'isolated-admin-test', BENDALABS_LEADS_URL: 'http://127.0.0.1:4338/edge', BENDALABS_LEADS_KEY: 'test-only-key', SUPABASE_URL: '', SUPABASE_SERVICE_ROLE_KEY: '', OPENAI_API_KEY: 'isolated-not-a-real-api-key' } });
  let ready = false;
  for (let i = 0; i < 60; i++) { try { ready = (await fetch(base + '/admin/leads')).ok; } catch {} if (ready) break; await new Promise(resolve => setTimeout(resolve, 500)); }
  assert.ok(ready);
  assert.equal(storageReads, 0, 'Anonymous page load never reads private data');
  assert.equal((await fetch(base + '/api/admin/leadpilot', { method: 'POST', body: '{}' })).status, 401);
  const login = await fetch(base + '/admin/leads/login', { method: 'POST', body: new URLSearchParams({ password: 'isolated-admin-test' }), redirect: 'manual' });
  const cookie = login.headers.get('set-cookie').split(';')[0];
  const call = body => fetch(base + '/api/admin/leadpilot', { method: 'POST', headers: { cookie, origin: base, 'content-type': 'application/json' }, body: JSON.stringify(body) });
  assert.equal((await fetch(base + '/api/admin/leadpilot', { method: 'POST', headers: { cookie, origin: 'https://foreign.test' }, body: '{}' })).status, 403);
  assert.equal((await call({ action: 'import', url: 'http://127.0.0.1/secret' })).status, 400);
  assert.equal((await call({ action: 'update', id: uuid, hourly_rate: -1 })).status, 400);
  const html = await (await fetch(base + '/admin/leads', { headers: { cookie } })).text();
  assert.ok(html.includes('LeadPilot')); assert.ok(!html.includes('Audit leads'));
  assert.ok(!html.includes('SUPABASE_SERVICE_ROLE_KEY'));
  const launchOptions = { ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}), args: ['--no-sandbox', '--disable-dev-shm-usage', '--single-process', '--no-zygote', '--in-process-gpu', '--use-gl=angle', '--use-angle=swiftshader'], headless: true };
  const errors = [];
  for (const width of [1440, 390]) {
    browser = await chromium.launch(launchOptions);
    const context = await browser.newContext({ viewport: { width, height: 950 } });
    const page = await context.newPage(); page.on('pageerror', error => errors.push(error.message));
    await page.goto(base + '/admin/leads');
    await page.getByLabel('Heslo', { exact: true }).fill('isolated-admin-test');
    await page.getByRole('button', { name: 'Prihlásiť sa', exact: true }).click();
    await page.getByRole('heading', { name: 'LeadPilot.' }).waitFor();
    assert.equal(await page.locator('.lp-card').count(), 1);
    assert.ok(!await page.getByText('TEST ONLY · Old request', { exact: true }).count());
    await page.screenshot({ path: path.join(output, `dashboard-${width}.png`), fullPage: true });
    await page.locator('.lp-detail > summary').click();
    await page.getByLabel('Stav dopytu').selectOption('proposal');
    await page.getByLabel('Pracovná sadzba (€ / h)').fill('40');
    await page.getByRole('button', { name: 'Uložiť zmeny', exact: true }).click();
    await page.getByText('Zmeny uložené.', { exact: true }).waitFor();
    assert.equal(leads[0].status, 'proposal'); assert.equal(leads[0].proposal.hourly_rate, 40);
    await page.reload(); await page.locator('.lp-detail > summary').click();
    assert.equal(await page.getByLabel('Stav dopytu').inputValue(), 'proposal');
    await page.getByRole('button', { name: 'Dopyty z webu', exact: true }).click();
    assert.equal(await page.locator('.lp-contact').count(), 1); assert.ok(!await page.getByText('MUST NOT APPEAR').count());
    await page.getByRole('button', { name: 'Na preverenie', exact: true }).click();
    await page.getByText('TEST ONLY · Old request', { exact: true }).waitFor();
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await browser.close(); browser = null;
  }
  failure = true;
  assert.equal((await call({ action: 'update', id: uuid, status: 'sent' })).status, 503);
  const failed = await (await fetch(base + '/admin/leads', { headers: { cookie } })).text();
  assert.ok(failed.includes('Nedostupné údaje sa nezapočítavajú ako nula'));
  assert.deepEqual(errors, []);
  console.log('PASS: admin auth, private reads, CSRF, validation, freshness, test exclusion, desktop/mobile, persisted proposal/status and explicit storage failure. No paid AI calls.');
}
run().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => { if (browser) await browser.close(); if (app) app.kill(); server.close(); });
