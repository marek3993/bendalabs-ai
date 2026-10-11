const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { createHash, webcrypto } = require('node:crypto');
const ts = require('typescript');
const key = 'test-only-dedicated-key-not-production';
const hash = createHash('sha256').update(key).digest('hex');
function edge(fetcher = () => { throw new Error('Unexpected database access'); }) {
  const source = fs.readFileSync('supabase/functions/bendalabs-leads/index.ts', 'utf8').replace(/const EXPECTED_KEY_SHA256 = "[^"]+";/, `const EXPECTED_KEY_SHA256 = "${hash}";`);
  const exports = {};
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, { exports, crypto: webcrypto, Request, Response, Headers, TextEncoder, URL, URLSearchParams, AbortSignal, Uint8Array, fetch: fetcher, Deno: { env: { get: name => name === 'SUPABASE_URL' ? 'https://database.test' : 'test-service-role' }, serve() {} } });
  return exports;
}
const payload = { table: 'contact_requests', method: 'GET', query: 'select=id&limit=10', prefer: 'count=exact' };
const request = (body = payload, secret = key) => new Request('https://edge.test', { method: 'POST', headers: { 'x-bendalabs-key': secret }, body: JSON.stringify(body) });
test('storage bridge authenticates before reading input or accessing storage', async () => {
  const api = edge();
  for (const secret of ['', 'incorrect-key-that-is-long-enough']) assert.equal((await api.handler(request(payload, secret))).status, 401);
  assert.equal(await api.authorized(key, ''), false);
});
test('storage bridge cannot access other tables or mutate/delete existing rows', async () => {
  const api = edge();
  for (const patch of [{ table: 'users' }, { table: '../contact_requests' }, { method: 'DELETE' }, { method: 'PATCH' }, { method: 'POST', table: 'audit_lead_rollups', body: {} }, { prefer: 'resolution=merge-duplicates' }]) assert.equal((await api.handler(request({ ...payload, ...patch }))).status, 400);
});
test('private reads preserve counts and target only the dedicated prefixed table', async () => {
  const api = edge(async (url, options) => {
    assert.equal(url.href, 'https://database.test/rest/v1/bendalabs_contact_requests?select=id&limit=10');
    assert.equal(options.headers.authorization, 'Bearer test-service-role');
    return Response.json([{ id: 'test-id' }], { headers: { 'content-range': '0-0/1' } });
  });
  const response = await api.handler(request());
  assert.equal(response.status, 200); assert.equal(response.headers.get('content-range'), '0-0/1');
});
test('inserts preserve repository payloads and return a confirmed database receipt', async () => {
  const body = { name: 'TEST', message: 'Synthetic only' };
  const api = edge(async (url, options) => { assert.deepEqual(JSON.parse(options.body), body); return Response.json([{ ...body, id: 'saved-id' }], { status: 201 }); });
  const response = await api.handler(request({ ...payload, method: 'POST', query: '', prefer: 'return=representation', body }));
  assert.equal(response.status, 201); assert.equal((await response.json())[0].id, 'saved-id');
});
test('database failures never report success or expose service details', async () => {
  const api = edge(async () => Response.json({ key: 'must-not-leak' }, { status: 500 }));
  const response = await api.handler(request());
  assert.equal(response.status, 503); assert.deepEqual(await response.json(), { error: 'unavailable' });
});
test('LeadPilot edits cannot update all rows, alter identity, or mutate contact data', async () => {
  const api = edge();
  for (const patch of [{ query: '' }, { query: 'id=gt.0' }, { query: 'id=eq.11111111-1111-4111-8111-111111111111&status=eq.new' }, { body: { source_url: 'https://evil.test' } }, { table: 'contact_requests' }, { body: [] }]) {
    assert.equal((await api.handler(request({ ...payload, table: 'opportunities', method: 'PATCH', query: 'id=eq.11111111-1111-4111-8111-111111111111', body: { status: 'sent' }, ...patch }))).status, 400);
  }
});
test('LeadPilot saves a state only to the requested dedicated record', async () => {
  const api = edge(async (url, options) => {
    assert.equal(url.pathname, '/rest/v1/bendalabs_opportunities');
    assert.equal(url.searchParams.get('id'), 'eq.11111111-1111-4111-8111-111111111111');
    assert.equal(options.method, 'PATCH');
    assert.deepEqual(JSON.parse(options.body), { status: 'sent' });
    return Response.json([{ id: '11111111-1111-4111-8111-111111111111', status: 'sent' }]);
  });
  assert.equal((await api.handler(request({ ...payload, table: 'opportunities', method: 'PATCH', query: 'id=eq.11111111-1111-4111-8111-111111111111', body: { status: 'sent' } }))).status, 200);
});
