const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const crypto = require('node:crypto');
const ts = require('typescript');
const secret = 'test-only-life-bridge-secret-at-least-32';
const secretHash = crypto.createHash('sha256').update(secret).digest('hex');
const sessionToken = 'a'.repeat(43);
const tokenHash = crypto.createHash('sha256').update(sessionToken).digest('hex');
const password = 'test-password-123';
const credential = crypto.createHmac('sha256', secret).update(`life-credential-v1:${password}`).digest('hex');

function moduleAt(path, globals = {}, deps = {}, transform = x => x) {
  const source = transform(fs.readFileSync(path, 'utf8'));
  const exports = {};
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText, { exports, require: name => name in deps ? deps[name] : require(name), crypto: crypto.webcrypto, Request, Response, Headers, TextEncoder, TextDecoder, URL, URLSearchParams, AbortSignal, Uint8Array, Buffer, ...globals });
  return exports;
}
function edge(fetcher = () => { throw Error('Unexpected database access'); }) {
  return moduleAt('supabase/functions/bendalabs-life/index.ts', { fetch: fetcher, Deno: { env: { get: name => name === 'SUPABASE_URL' ? 'https://database.test' : 'test-service-role' }, serve() {} } }, {}, source => source.replace(/const EXPECTED_KEY_SHA256 = "[^"]+";/, `const EXPECTED_KEY_SHA256 = "${secretHash}";`));
}
const edgeRequest = (body = { operation: 'load_state', payload: {} }, key = secret) => new Request('https://edge.test', { method: 'POST', headers: { 'x-bendalabs-key': key }, body: JSON.stringify(body) });
function auth(operation = () => { throw Error('Unexpected storage access'); }, cookie = null, env = {}) {
  const writes = [];
  const api = moduleAt('src/lib/life/auth.ts', { process: { env: { NODE_ENV: 'production', BENDALABS_LEADS_KEY: secret, ADMIN_LEADS_PASSWORD: password, ...env } } }, {
    'server-only': {},
    'next/headers': { cookies: async () => ({ get: () => cookie ? { value: cookie } : undefined, set: (...args) => writes.push(args) }) },
    './storage': { lifeStorageOperation: operation, isLifeStorageConfigured: () => true },
  });
  return { api, writes };
}
const loginRequest = (origin = 'https://bendalabs.sk') => new Request('https://bendalabs.sk/life/api/login', { method: 'POST', headers: origin ? { origin } : {} });

test('private bridge authenticates before reading malformed input or accessing data', async () => {
  const api = edge();
  for (const key of ['', 'wrong-key-with-sufficient-length-123456']) assert.equal((await api.handler(edgeRequest({}, key))).status, 401);
  assert.equal(await api.authorized(secret, ''), false);
});
test('private bridge rejects arbitrary tables, SQL paths, extra keys and malformed mutations', async () => {
  const api = edge();
  const invalid = [
    { operation: '../users', payload: {} }, { operation: 'load_state', payload: { table: 'users' } },
    { operation: 'load_state', payload: {}, query: 'select=*' }, { operation: 'save_state', payload: { state: {}, expectedVersion: -1 } },
    { operation: 'save_state', payload: { state: [], expectedVersion: 0 } }, { operation: 'load_session', payload: { tokenHash: 'x' } },
    { operation: 'create_session', payload: { tokenHash, credentialVersion: credential, remember: true, ttlSeconds: 9_999_999_999 } },
    { operation: 'claim_ai', payload: { tokenHash, kind: 'arbitrary-tool', leaseId: 'a'.repeat(32) } },
    { operation: 'claim_ai', payload: { tokenHash, kind: 'chat', leaseId: 'x' } },
    { operation: 'release_ai', payload: { leaseId: 'a'.repeat(32), tokenHash } },
  ];
  for (const input of invalid) assert.equal((await api.handler(edgeRequest(input))).status, 400);
});
test('CAS conflicts reach caller, never falsely reporting a successful save', async () => {
  const api = edge(async (url, options) => {
    assert.equal(url.href, 'https://database.test/rest/v1/rpc/bendalabs_life_rpc');
    assert.equal(options.headers.authorization, 'Bearer test-service-role');
    assert.deepEqual(JSON.parse(options.body), { p_operation: 'save_state', p_payload: { state: { test: true }, expectedVersion: 4 } });
    return Response.json({ error: 'conflict' });
  });
  assert.equal((await api.handler(edgeRequest({ operation: 'save_state', payload: { state: { test: true }, expectedVersion: 4 } }))).status, 409);
});
test('bridge failures hide database details and oversized chunked requests are rejected', async () => {
  const api = edge(async () => Response.json({ secret: 'must-not-leak' }, { status: 500 }));
  assert.deepEqual(await (await api.handler(edgeRequest())).json(), { error: 'unavailable' });
  assert.equal((await api.handler(edgeRequest({ operation: 'save_state', payload: { expectedVersion: 0, state: { note: 'a'.repeat(2_100_000) } } }))).status, 413);
});
test('paid request claims target only the private RPC and preserve durable denial', async () => {
  const leaseId = 'a'.repeat(32);
  const api = edge(async (url, options) => {
    assert.equal(url.pathname, '/rest/v1/rpc/bendalabs_life_rpc');
    assert.deepEqual(JSON.parse(options.body), { p_operation: 'claim_ai', p_payload: { tokenHash, kind: 'chat', leaseId } });
    return Response.json({ allowed: false, retryAfter: 120 });
  });
  const response = await api.handler(edgeRequest({ operation: 'claim_ai', payload: { tokenHash, kind: 'chat', leaseId } }));
  assert.equal(response.status, 200); assert.deepEqual(await response.json(), { allowed: false, retryAfter: 120 });
  const revoked = edge(async () => Response.json({ error: 'unauthorized' }));
  assert.equal((await revoked.handler(edgeRequest({ operation: 'claim_ai', payload: { tokenHash, kind: 'chat', leaseId } }))).status, 401);
});
test('storage derives a separate bridge and paid calls use distinct leases for safe release', async () => {
  const claims = [];
  const released = [];
  const api = moduleAt('src/lib/life/storage.ts', {
    process: { env: { BENDALABS_LEADS_URL: 'https://database.test/functions/v1/bendalabs-leads', BENDALABS_LEADS_KEY: secret } },
    fetch: async (url, options) => {
      assert.equal(url, 'https://database.test/functions/v1/bendalabs-life');
      assert.equal(options.headers['x-bendalabs-key'], secret);
      const input = JSON.parse(options.body);
      if (input.operation === 'release_ai') { released.push(input.payload.leaseId); return Response.json({ ok: true }); }
      assert.equal(input.operation, 'claim_ai'); assert.equal(input.payload.tokenHash, tokenHash); assert.equal(input.payload.kind, 'chat');
      claims.push(input.payload.leaseId); return Response.json({ allowed: true, retryAfter: 0, leaseId: input.payload.leaseId });
    },
  }, { 'server-only': {} });
  const first = await api.claimLifeAiUsage(tokenHash, 'chat');
  const second = await api.claimLifeAiUsage(tokenHash, 'chat');
  assert.match(first.leaseId, /^[0-9a-f]{32}$/); assert.notEqual(first.leaseId, second.leaseId);
  await api.releaseLifeAiUsage(first.leaseId);
  assert.deepEqual(released, [claims[0]]);
});
test('missing and malformed session cookies do not authorize requests', async () => {
  for (const cookie of [null, 'short', '../secret', 'a'.repeat(44)]) {
    const { api } = auth(undefined, cookie);
    assert.equal(await api.getLifeSession(), null);
    await assert.rejects(api.requireLifeSession(), error => error.status === 401);
  }
});
test('expired, revoked and previous-password sessions are rejected', async () => {
  for (const session of [null, { tokenHash, remember: true, credentialVersion: credential, expiresAt: '2020-01-01T00:00:00Z' }, { tokenHash, remember: true, credentialVersion: '0'.repeat(64), expiresAt: '2099-01-01T00:00:00Z' }]) {
    const { api } = auth(async (op, payload) => { assert.equal(op, 'load_session'); assert.equal(payload.tokenHash, tokenHash); return session; }, sessionToken);
    assert.equal(await api.getLifeSession(), null);
  }
});
test('all browser writes require a same-origin request, including login', async () => {
  const { api } = auth();
  for (const origin of [null, 'null', 'https://attacker.test', 'https://bendalabs.sk.attacker.test', 'https://bendalabs.sk/']) {
    assert.throws(() => api.assertLifeSameOrigin(loginRequest(origin)), error => error.status === 403);
  }
  assert.doesNotThrow(() => api.assertLifeSameOrigin(loginRequest()));
});
test('canonical browser origin survives a Vercel internal request URL without trusting hostile hosts', () => {
  const { api } = auth(undefined, null, { VERCEL: '1', VERCEL_URL: 'preview-benda.vercel.app' });
  const internal = headers => new Request('http://localhost:3000/life/api/state', { method: 'POST', headers });
  assert.doesNotThrow(() => api.assertLifeSameOrigin(internal({ origin: 'https://bendalabs.sk', host: 'bendalabs.sk' })));
  assert.doesNotThrow(() => api.assertLifeSameOrigin(internal({ origin: 'https://bendalabs.sk', host: 'localhost:3000', 'x-forwarded-host': 'bendalabs.sk' })));
  assert.doesNotThrow(() => api.assertLifeSameOrigin(new Request('https://preview-benda.vercel.app/life/api/state', { method: 'POST', headers: { origin: 'https://preview-benda.vercel.app' } })));
  for (const headers of [
    { origin: 'https://attacker.test', host: 'attacker.test' },
    { origin: 'https://bendalabs.sk', host: 'attacker.test' },
    { origin: 'https://bendalabs.sk', host: 'localhost:3000', 'x-forwarded-host': 'bendalabs.sk, attacker.test' },
    { origin: 'https://bendalabs.sk', host: 'bendalabs.sk', 'sec-fetch-site': 'cross-site' },
  ]) assert.throws(() => api.assertLifeSameOrigin(internal(headers)), error => error.status === 403);
  const local = auth(undefined, null, { NODE_ENV: 'development' }).api;
  assert.throws(() => local.assertLifeSameOrigin(internal({ origin: 'https://bendalabs.sk', host: 'bendalabs.sk' })), error => error.status === 403);
});
test('login throttling is durable and blocks session issuance', async () => {
  const { api, writes } = auth(async (op, payload) => { assert.equal(op, 'claim_login'); assert.match(payload.key, /^[0-9a-f]{64}$/); return { allowed: false, retryAfter: 120 }; });
  const result = await api.createLifeSession(password, true, loginRequest());
  assert.equal(result.reason, 'rate_limited'); assert.equal(result.retryAfter, 120); assert.equal(writes.length, 0);
});
test('password success issues a random opaque cookie only after durable session creation', async () => {
  let storedHash;
  const { api, writes } = auth(async (op, payload) => {
    if (op === 'claim_login') return { allowed: true, retryAfter: 0 };
    assert.equal(op, 'create_session'); assert.equal(payload.ttlSeconds, 31_536_000);
    assert.equal(payload.credentialVersion, credential); storedHash = payload.tokenHash;
    return { ...payload, expiresAt: '2099-01-01T00:00:00Z' };
  });
  assert.equal((await api.createLifeSession(password, true, loginRequest())).ok, true);
  const [name, value, options] = writes[0];
  assert.equal(name, 'bendalabs_life_session'); assert.match(value, /^[A-Za-z0-9_-]{43}$/); assert.notEqual(value, password);
  assert.equal(crypto.createHash('sha256').update(value).digest('hex'), storedHash);
  assert.equal(options.httpOnly, true); assert.equal(options.secure, true); assert.equal(options.path, '/life'); assert.equal(options.maxAge, 31_536_000);
});
test('wrong password and storage outage cannot issue a cookie', async () => {
  const invalid = auth(async op => { assert.equal(op, 'claim_login'); return { allowed: true, retryAfter: 0 }; });
  assert.equal((await invalid.api.createLifeSession('wrong', true, loginRequest())).reason, 'invalid_password');
  assert.equal(invalid.writes.length, 0);
  const down = auth(async () => { throw Error('offline'); });
  assert.equal((await down.api.createLifeSession(password, true, loginRequest())).reason, 'unavailable'); assert.equal(down.writes.length, 0);
});
test('logout revokes the server session before removing the browser credential', async () => {
  let revoked = false;
  const { api, writes } = auth(async (op, payload) => { assert.equal(op, 'delete_session'); assert.equal(payload.tokenHash, tokenHash); revoked = true; }, sessionToken);
  await api.deleteLifeSession(); assert.equal(revoked, true); assert.equal(writes[0][2].maxAge, 0); assert.equal(writes[0][2].path, '/life');
});
test('schema denies browser roles access and function execution', () => {
  const sql = fs.readFileSync('supabase/bendalabs-life.sql', 'utf8');
  for (const table of ['state', 'snapshots', 'sessions', 'login_limits', 'usage_limits']) assert.ok(sql.includes(`alter table public.bendalabs_life_${table} enable row level security`));
  assert.match(sql, /revoke all on function public\.bendalabs_life_rpc\(text, jsonb\) from public, anon, authenticated/);
  assert.match(sql, /security invoker/); assert.doesNotMatch(sql, /security definer/i);
});
test('small migration batches keep private helper creation and revocation atomic', () => {
  const sql = fs.readFileSync('supabase/bendalabs-life.sql', 'utf8');
  const batches = sql.split(/-- life-batch: \d+_[a-z_]+\n/).slice(1);
  assert.equal(batches.length, 8);
  for (const batch of batches) {
    assert.ok(Buffer.byteLength(batch.trim()) < 4000);
    assert.match(batch.trim(), /^begin;[\s\S]+commit;$/);
    for (const match of batch.matchAll(/create or replace function (bendalabs_life_private\.\w+)\(([^)]+)\)/g)) {
      const types = match[2].split(',').map(parameter => parameter.trim().split(/\s+/)[1]).join(', ');
      assert.ok(batch.includes(`revoke all on function ${match[1]}(${types}) from public, anon, authenticated;`));
      assert.ok(batch.includes(`grant execute on function ${match[1]}(${types}) to service_role;`));
      assert.match(batch, /security invoker/);
    }
  }
  assert.match(sql, /revoke all on schema bendalabs_life_private from public, anon, authenticated/);
});
