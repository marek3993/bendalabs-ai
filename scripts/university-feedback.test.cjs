const assert = require('node:assert/strict');
const { test } = require('node:test');
const { readFileSync } = require('node:fs');
const vm = require('node:vm');
const { createHash, webcrypto } = require('node:crypto');
const ts = require('typescript');

function loadTs(file, globals = {}, transform = value => value) {
  const code = ts.transpileModule(transform(readFileSync(file, 'utf8')), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const exports = {};
  const context = { exports, Request, Response, TextEncoder, TextDecoder, URL, URLSearchParams, AbortSignal, Uint8Array, crypto: webcrypto, ...globals };
  vm.runInNewContext(code, context, { filename: file });
  return exports;
}
const validation = loadTs('src/lib/university-feedback/validation.ts');
const ids = new Set(['energy', 'loop']);
const valid = { chapterId: 'energy', lang: 'sk', rating: 5, suggestion: '', submissionId: '31246037-aadf-482e-913b-f8c235cded2f', website: '' };
const request = (body, extra = {}) => new Request('https://bendalabs.sk/api/university-feedback', { method: 'POST', headers: { origin: 'https://bendalabs.sk', 'content-type': 'application/json', ...extra }, body: JSON.stringify(body) });

test('accepts rating-only and suggestion-only; normalizes text and UUID', () => {
  assert.equal(validation.validateFeedback(valid, ids).rating, 5);
  const output = validation.validateFeedback({ ...valid, rating: null, suggestion: '  Pridajte viac príkladov.  ', submissionId: valid.submissionId.toUpperCase() }, ids);
  assert.equal(output.suggestion, 'Pridajte viac príkladov.');
  assert.equal(output.submissionId, valid.submissionId);
});
test('rejects unknown chapter, unsupported language, invalid stars, empty feedback and honeypot', () => {
  for (const fields of [{ chapterId: 'unknown' }, { lang: 'cs' }, { rating: 6 }, { rating: 1.2 }, { rating: '5' }, { rating: null }, { rating: undefined }, { website: 'spam.test' }, { website: undefined }, { submissionId: 'invalid' }, { suggestion: 'short' }, { suggestion: 'x'.repeat(2001) }]) {
    assert.equal(validation.validateFeedback({ ...valid, ...fields }, ids), null, JSON.stringify(fields));
  }
});
test('enforces exact origin, rejects missing origin and cross-site fetch', () => {
  assert.equal(validation.isSameOriginRequest(request(valid)), true);
  assert.equal(validation.isSameOriginRequest(request(valid, { origin: 'https://evil.test' })), false);
  assert.equal(validation.isSameOriginRequest(request(valid, { 'sec-fetch-site': 'cross-site' })), false);
  assert.equal(validation.isSameOriginRequest(new Request('https://bendalabs.sk/api/university-feedback')), false);
});
test('bounds UTF-8 request bytes even without Content-Length', async () => {
  assert.equal(await validation.readBoundedBody(request(valid), 10), null);
  assert.equal(await validation.readBoundedBody(request(valid)), JSON.stringify(valid));
  const unicode = new Request('https://bendalabs.sk/api/university-feedback', { method: 'POST', body: 'ž'.repeat(40) });
  assert.equal(await validation.readBoundedBody(unicode, 60), null);
});

const testKey = 'unit-test-server-key-that-is-not-a-production-secret';
const testHash = createHash('sha256').update(testKey).digest('hex');
function loadEdge(fetcher = async () => { throw new Error('Unexpected storage request'); }) {
  return loadTs('supabase/functions/university-feedback/index.ts', { Deno: { env: { get: name => ({ SUPABASE_URL: 'https://database.test', SUPABASE_SERVICE_ROLE_KEY: 'server-only-test-key' })[name] }, serve: () => {} }, fetch: fetcher }, source => source.replace(/const EXPECTED_KEY_SHA256 = "[^"]+";/, `const EXPECTED_KEY_SHA256 = "${testHash}";`));
}
const edgeRequest = (payload, key = testKey) => new Request('https://edge.test', { method: 'POST', headers: { 'x-university-key': key, 'content-type': 'application/json' }, body: JSON.stringify(payload) });
const payload = { action: 'submit', feedback: valid, actorHash: 'a'.repeat(64) };

test('Edge authentication fails closed for missing, incorrect and unconfigured key', async () => {
  const edge = loadEdge();
  assert.equal(await edge.authorized(testKey), true);
  assert.equal(await edge.authorized(null), false);
  assert.equal(await edge.authorized('x'.repeat(48)), false);
  assert.equal(await edge.authorized(testKey, '__UNCONFIGURED__'), false);
  assert.equal((await edge.handler(edgeRequest(payload, 'wrong'))).status, 401);
});
test('Edge rejects invalid payload before database access', async () => {
  const edge = loadEdge();
  assert.equal((await edge.handler(edgeRequest({ ...payload, actorHash: '127.0.0.1' }))).status, 400);
  assert.equal((await edge.handler(edgeRequest({ ...payload, feedback: { ...valid, chapterId: 'unknown' } }))).status, 400);
  assert.equal((await edge.handler(edgeRequest({ action: 'list', chapter: '', status: 'all', page: -1 }))).status, 400);
});
test('success only follows confirmed persistence; identical retries succeed and conflicts do not', async () => {
  for (const [outcome, status] of [['stored', 200], ['duplicate', 200], ['conflict', 409], ['rate_limited', 429], ['invalid', 400], ['unknown', 503]]) {
    let called = false;
    const edge = loadEdge(async (url, options) => { called = true; assert.ok(url.endsWith('/rpc/university_submit_feedback')); const body = JSON.parse(options.body); assert.equal(body.p_actor_hash, 'a'.repeat(64)); assert.equal(body.p_submission_id, valid.submissionId); return Response.json(outcome); });
    const result = await edge.handler(edgeRequest(payload));
    assert.equal(result.status, status, outcome);
    assert.equal(called, true);
    assert.equal((await result.json()).ok === true, status === 200);
  }
});
test('storage errors are generic and cannot yield a success receipt or leak keys', async () => {
  const edge = loadEdge(async () => new Response('sensitive database diagnostics', { status: 500 }));
  const result = await edge.handler(edgeRequest(payload));
  assert.equal(result.status, 503);
  assert.deepEqual(await result.json(), { error: 'unavailable' });
});
test('private list remains authenticated and preserves count with fixed pagination', async () => {
  const edge = loadEdge(async url => url.includes('/rpc/') ? Response.json([]) : new Response('[]', { headers: { 'content-type': 'application/json', 'content-range': '*/0' } }));
  const result = await edge.handler(edgeRequest({ action: 'list', chapter: '', status: 'all', page: 1 }));
  assert.equal(result.status, 200);
  assert.deepEqual(await result.json(), { rows: [], summaries: [], total: 0 });
});
