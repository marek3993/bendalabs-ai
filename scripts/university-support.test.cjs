const assert = require('node:assert/strict');
const { test } = require('node:test');
const { readFileSync } = require('node:fs');
const vm = require('node:vm');
const { createHash, webcrypto } = require('node:crypto');
const ts = require('typescript');

function loadTs(file, globals = {}, transform = value => value) {
  const code = ts.transpileModule(transform(readFileSync(file, 'utf8')), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const exports = {};
  vm.runInNewContext(code, { exports, Request, Response, TextEncoder, TextDecoder, URL, URLSearchParams, AbortSignal, Uint8Array, crypto: webcrypto, ...globals }, { filename: file });
  return exports;
}
const validation = loadTs('src/lib/university-support/validation.ts');
const bodyValidation = loadTs('src/lib/university-feedback/validation.ts');
const valid = { submissionId: 'c6ead813-0b65-44e4-a0a7-c58d99d265d9', kind: 'question', lang: 'sk', name: '', email: 'student@example.test', projectUrl: '', message: 'Potrebujem vysvetliť rozdiel medzi momentom a výkonom.', consent: true, website: '' };

test('normalizes a private enquiry and accepts an optional HTTPS project link', () => {
  const item = validation.validateStudentSupport({ ...valid, name: '  Študent  ', email: ' student@example.test ', projectUrl: ' HTTPS://Example.test/robot ', submissionId: valid.submissionId.toUpperCase() });
  assert.equal(item.name, 'Študent');
  assert.equal(item.email, valid.email);
  assert.equal(item.projectUrl, 'https://example.test/robot');
  assert.equal(item.submissionId, valid.submissionId);
  assert.equal(validation.validateStudentSupport({ ...valid, kind: 'project', lang: 'en' }).kind, 'project');
});
test('requires consent and rejects bad email, short message, unsafe URL and honeypot', () => {
  assert.equal(validation.validateStudentSupport({ ...valid, kind: { toString: null } }), null);
  assert.equal(validation.validateStudentSupport({ ...valid, lang: { toString: null } }), null);
  for (const fields of [{ consent: false }, { consent: 'true' }, { website: 'spam' }, { website: undefined }, { lang: 'cs' }, { kind: 'other' }, { email: '' }, { email: 'invalid' }, { email: 'a@example.test\r\nBcc:a@example.test' }, { message: 'Too short' }, { message: 'a'.repeat(4001) }, { message: `Long enough but null\0hidden` }, { projectUrl: 'http://example.test' }, { projectUrl: 'javascript:alert(1)' }, { projectUrl: 'https://user:password@example.test' }, { projectUrl: 'https://example.test/' + 'a'.repeat(2000) }, { name: 'a'.repeat(101) }, { name: 'a\nb' }, { submissionId: 'invalid' }]) {
    assert.equal(validation.validateStudentSupport({ ...valid, ...fields }), null, JSON.stringify(fields));
  }
});

const testKey = 'test-only-university-support-secret-not-for-production';
const testHash = createHash('sha256').update(testKey).digest('hex');
function loadEdge(fetcher = async () => { throw new Error('Unexpected database request'); }) {
  return loadTs('supabase/functions/university-feedback/index.ts', { Deno: { env: { get: name => ({ SUPABASE_URL: 'https://database.test', SUPABASE_SERVICE_ROLE_KEY: 'server-only-test-value' })[name] }, serve: () => {} }, fetch: fetcher }, source => source.replace(/const EXPECTED_KEY_SHA256 = "[^"]+";/, `const EXPECTED_KEY_SHA256 = "${testHash}";`));
}
const edgeRequest = (payload, key = testKey) => new Request('https://edge.test', { method: 'POST', headers: { 'x-university-key': key, 'content-type': 'application/json' }, body: JSON.stringify(payload) });
const payload = { action: 'support-submit', support: valid, actorHash: 'a'.repeat(64) };

test('support list and submit cannot be called without server authentication', async () => {
  const edge = loadEdge();
  assert.equal((await edge.handler(edgeRequest(payload, 'wrong'))).status, 401);
  assert.equal((await edge.handler(edgeRequest({ action: 'support-list', kind: 'all', status: 'all', page: 1 }, 'wrong'))).status, 401);
});
test('Edge validates support data and pagination before touching storage', async () => {
  const edge = loadEdge();
  for (const fields of [{ consent: false }, { email: 'bad' }, { projectUrl: 'http://example.test' }, { projectUrl: 'https://a:b@example.test' }, { message: '' }]) assert.equal((await edge.handler(edgeRequest({ ...payload, support: { ...valid, ...fields } }))).status, 400);
  assert.equal((await edge.handler(edgeRequest({ action: 'support-list', kind: 'unknown', status: 'all', page: 1 }))).status, 400);
  assert.equal((await edge.handler(edgeRequest({ action: 'support-list', kind: 'all', status: 'all', page: 0 }))).status, 400);
});
test('only stored/duplicate outcomes confirm delivery; database errors stay private', async () => {
  for (const [outcome, status] of [['stored', 200], ['duplicate', 200], ['conflict', 409], ['rate_limited', 429], ['invalid', 400], ['unexpected', 503]]) {
    const edge = loadEdge(async (url, options) => { assert.ok(url.endsWith('/rpc/university_submit_support')); const input = JSON.parse(options.body); assert.equal(input.p_email, valid.email); assert.equal(input.p_consent, true); return Response.json(outcome); });
    assert.equal((await edge.handler(edgeRequest(payload))).status, status);
  }
  const unavailable = await loadEdge(async () => new Response('secret diagnostic', { status: 500 })).handler(edgeRequest(payload));
  assert.equal(unavailable.status, 503);
  assert.deepEqual(await unavailable.json(), { error: 'unavailable' });
});
test('private list is paginated and review updates only the requested record', async () => {
  const list = loadEdge(async url => { assert.ok(url.includes('limit=25')); assert.ok(url.includes('offset=25')); assert.ok(url.includes('kind=eq.project')); return new Response('[]', { headers: { 'content-range': '*/30' } }); });
  const response = await list.handler(edgeRequest({ action: 'support-list', kind: 'project', status: 'new', page: 2 }));
  assert.deepEqual(await response.json(), { rows: [], total: 30 });
  const review = loadEdge(async (url, options) => { assert.ok(url.includes(valid.submissionId)); assert.equal(options.method, 'PATCH'); assert.equal(JSON.parse(options.body).status, 'reviewed'); return Response.json([{ submission_id: valid.submissionId }]); });
  assert.equal((await review.handler(edgeRequest({ action: 'support-review', submissionId: valid.submissionId }))).status, 200);
});
test('public route rejects cross-origin, malformed and oversized submissions without storage', async () => {
  let calls = 0;
  const route = loadTs('src/app/api/university-support/route.ts', { require: name => name.endsWith('/university-feedback/server') ? { feedbackActorHash: () => 'a'.repeat(64) } : name.endsWith('/university-support/server') ? { submitStudentSupport: async () => { calls++; return { ok: true }; } } : name.endsWith('/university-feedback/validation') ? bodyValidation : validation });
  const request = (body, origin = 'https://bendalabs.sk') => new Request('https://bendalabs.sk/api/university-support', { method: 'POST', headers: { origin, 'content-type': 'application/json' }, body });
  assert.equal((await route.POST(request(JSON.stringify(valid), 'https://evil.test'))).status, 403);
  assert.equal((await route.POST(request('{broken'))).status, 400);
  assert.equal((await route.POST(request(JSON.stringify({ ...valid, consent: false })))).status, 400);
  assert.equal((await route.POST(request('ž'.repeat(20000)))).status, 400);
  assert.equal(calls, 0);
  assert.equal((await route.POST(request(JSON.stringify(valid)))).status, 200);
  assert.equal(calls, 1);
});
