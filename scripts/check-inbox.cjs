// End-to-end form/storage/admin regression with isolated data. No production writes.
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { once } = require('node:events');
const root = path.resolve(__dirname, '..');
const output = path.join(root, '.tmp-inbox');
fs.mkdirSync(output, { recursive: true });
const records = [], reads = [];
let unavailable = false, app;
const storage = http.createServer(async (req, res) => {
  try {
    let raw = ''; for await (const chunk of req) raw += chunk;
    const input = JSON.parse(raw);
    assert.equal(req.headers['x-bendalabs-key'], 'inbox-isolated-storage');
    res.setHeader('content-type', 'application/json');
    if (input.method === 'GET') reads.push(input.table);
    if (input.table !== 'contact_requests' || unavailable) { res.statusCode = 503; return res.end('{}'); }
    if (input.method === 'POST') {
      const row = { ...input.body, id: crypto.randomUUID(), created_at: new Date().toISOString() };
      records.unshift(row); res.statusCode = 201; return res.end(JSON.stringify([row]));
    }
    const params = new URLSearchParams(input.query), offset = Number(params.get('offset') || 0), limit = Number(params.get('limit') || 50);
    const sorted = [...records].sort((a, b) => b.created_at.localeCompare(a.created_at) || b.id.localeCompare(a.id));
    if (input.prefer === 'count=exact') res.setHeader('content-range', `${offset}-${offset + Math.max(0, Math.min(limit, sorted.length - offset)) - 1}/${sorted.length}`);
    res.end(JSON.stringify(sorted.slice(offset, offset + limit)));
  } catch (error) { res.statusCode = 500; res.end('{}'); console.error(error); }
});
async function run() {
  storage.listen(0, '127.0.0.1'); await once(storage, 'listening');
  const base = 'http://localhost:3241';
  const log = fs.openSync(path.join(output, 'server.log'), 'w');
  app = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '--hostname', '127.0.0.1', '--port', '3241'], { cwd: root, stdio: ['ignore', log, log], env: { ...process.env, ADMIN_LEADS_PASSWORD: 'inbox-isolated-admin', BENDALABS_LEADS_URL: `http://127.0.0.1:${storage.address().port}/edge`, BENDALABS_LEADS_KEY: 'inbox-isolated-storage', SUPABASE_URL: '', SUPABASE_SERVICE_ROLE_KEY: '', OPENAI_API_KEY: '', RESEND_API_KEY: '', LEADPILOT_SCHEDULE_ENABLED: 'false' } });
  let ready = false;
  for (let i = 0; i < 60; i++) { try { ready = (await fetch(base + '/admin/leads', { signal: AbortSignal.timeout(2000) })).ok; } catch {} if (ready) break; await new Promise(resolve => setTimeout(resolve, 500)); }
  assert.ok(ready, 'Production server starts');
  assert.equal(reads.length, 0, 'Anonymous requests never read private storage');
  const login = await fetch(base + '/admin/leads/login', { method: 'POST', body: new URLSearchParams({ password: 'inbox-isolated-admin' }), redirect: 'manual' });
  const cookie = login.headers.get('set-cookie').split(';')[0];
  const page = async (suffix = '') => {
    const response = await fetch(base + '/admin/leads' + suffix, { headers: { cookie } });
    assert.equal(response.status, 200); assert.match(response.headers.get('cache-control'), /no-store|private/);
    return (await response.text()).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
  };
  assert.match(await page(), /Zatiaľ nie sú uložené žiadne odpovede/);
  const situation = 'Potrebujeme automatizovať prípravu faktúr a posielanie reportov.';
  const campaign = 'utm_source=chatgpt; utm_campaign=inbox-regression';
  const response = await fetch(base + '/api/automation-requests', { method: 'POST', headers: { origin: base, 'content-type': 'application/json', referer: base + '/automatizacia?utm_source=chatgpt' }, body: JSON.stringify({ email: 'inbox-check@example.com', situation, campaign, modules: [], company: '' }) });
  assert.equal(response.status, 200); assert.equal((await response.json()).eventId, records[0].id);
  let html = await page();
  for (const text of [situation, campaign, 'inbox-check@example.com', 'Pravdepodobne testovací záznam', 'Uložené odpovede: 1']) assert.ok(html.includes(text), text);
  assert.ok(!html.includes('Nájsť nové zadania'), 'Inbox is the default');
  assert.ok(reads.every(table => table === 'contact_requests'), 'Inbox never queries LeadPilot');
  records.push({ id: 'old', created_at: '2025-01-01T10:00:00Z', name: 'Starý dopyt', email: 'older@company.sk', message: 'OLDER_THAN_THIRTY_DAYS', source: 'contact_section', website: 'javascript:alert(1)' });
  records.push({ id: 'call', created_at: '2025-01-02T10:00:00Z', name: 'Telefonát', email: 'no-email-call@bendalabs.invalid', message: 'Telefon: +421900000000', source: 'contact_section' });
  html = await page();
  assert.ok(html.includes('OLDER_THAN_THIRTY_DAYS')); assert.ok(html.includes('Žiadosť o telefonát'));
  assert.ok(!html.includes('mailto:no-email-call@')); assert.ok(!html.includes('href="javascript:'));
  for (let i = 0; i < 205; i++) records.push({ id: `page-${i}`, created_at: '2026-09-01T10:00:00Z', name: `Stránkovaný dopyt ${i}`, email: 'client@company.sk', message: 'PAGINATED', source: 'contact_section' });
  html = await page();
  assert.equal((html.match(/<article\b/g) || []).length, 50); assert.ok(html.includes('/admin/leads?page=2')); assert.ok(html.includes('Uložené odpovede: 208'));
  html = await page('?page=5');
  assert.ok(html.includes('OLDER_THAN_THIRTY_DAYS'), 'Records beyond 200 stay reachable'); assert.ok(!html.includes('/admin/leads?page=6')); assert.ok(html.includes('/admin/leads?page=4'));
  unavailable = true; html = await page();
  assert.ok(html.includes('Odpovede z formulárov sa nepodarilo načítať')); assert.ok(!html.includes('Zatiaľ nie sú uložené žiadne odpovede')); assert.ok(!html.includes('Uložené odpovede: 0'));
  unavailable = false; html = await page('?view=leadpilot');
  assert.ok(html.includes('Nájsť nové zadania')); assert.ok(html.includes('Nájdené dopyty sa nepodarilo načítať'));
  html = await page(); assert.ok(html.includes('Uložené odpovede: 208'), 'LeadPilot failure cannot hide the inbox');
  const anonymous = await (await fetch(base + '/admin/leads')).text();
  assert.ok(!anonymous.includes('inbox-check@example.com')); assert.ok(!html.includes('inbox-isolated-storage'));
  fs.writeFileSync(path.join(output, 'inbox-rendered.html'), html);
  console.log('PASS: form → saved receipt → default inbox; campaign, old/test/call records; 208-row pagination; auth; storage errors; LeadPilot failure isolation. Production untouched.');
}
run().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => { app?.kill(); storage.close(); });
