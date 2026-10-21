const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

let response, lastRequest;
const modules = new Map();
class FakeOpenAI { responses = { create: async input => { lastRequest = input; return response; } }; }
function load(name) {
  if (modules.has(name)) return modules.get(name);
  const output = {};
  modules.set(name, output);
  const code = ts.transpileModule(fs.readFileSync(`src/lib/life/${name}.ts`, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  vm.runInNewContext(code, { exports: output, require: id => id === 'server-only' ? {} : id === 'openai' ? FakeOpenAI : id.startsWith('./') ? load(id.slice(2)) : require(id), structuredClone, URL, Date, Intl, process: { env: { OPENAI_API_KEY: 'synthetic', OPENAI_MODEL: 'synthetic-model' } } });
  return output;
}
const domain = load('domain'), radar = load('radar');
const empty = () => domain.createEmptyLifeState('2026-10-19T10:00:00.000Z');
function result(url = 'https://example.org/research', title = 'Original research') {
  return { output: [{ type: 'web_search_call', status: 'completed' }, { type: 'message', content: [{ type: 'output_text', text: 'Relevant finding. CITATION', annotations: [{ type: 'url_citation', url, title, start_index: 18, end_index: 26 }] }] }] };
}

test('source annotations alone produce clickable references and reviewable saves', () => {
  const state = empty();
  const output = radar.groundedRadarResult(result(), state, 'robotics');
  assert.equal(output.sources.length, 1);
  assert.equal(output.reply, 'Relevant finding. [1]');
  assert.equal(output.proposals[0].command.record.url, 'https://example.org/research');
  assert.equal(output.proposals[0].command.collection, 'radarItems');
  assert.equal(state.radarItems.length, 0, 'search never saves a bookmark');
  domain.applyLifeCommand(state, output.proposals[0].command);
});

test('no completed search or missing citations cannot become fabricated results', () => {
  assert.throws(() => radar.groundedRadarResult({ output: [{ type: 'message', content: [{ type: 'output_text', text: 'https://fabricated.example/news', annotations: [] }] }] }, empty(), 'AI'), /nedokončil/);
  const uncited = result(); uncited.output[1].content[0].annotations = [];
  assert.throws(() => radar.groundedRadarResult(uncited, empty(), 'AI'), /overiteľným/);
  for (const url of ['javascript:alert(1)', 'http://127.0.0.1/private', 'https://secret@public.example/page', 'http://192.168.1.1/']) assert.throws(() => radar.groundedRadarResult(result(url), empty(), 'AI'), /overiteľným/);
});

test('invalid offsets fall back to a bounded cited source list and saved links are deduplicated', () => {
  const first = radar.groundedRadarResult(result(), empty(), 'AI');
  const state = domain.applyLifeCommand(empty(), first.proposals[0].command);
  const invalid = result(); invalid.output[1].content[0].annotations[0].end_index = 100000;
  const output = radar.groundedRadarResult(invalid, state, 'AI');
  assert.match(output.reply, /Original research \[1\]/);
  assert.equal(output.proposals.length, 0);
  const tooMany = result();
  tooMany.output[1].content[0].annotations = Array.from({ length: 7 }, (_, index) => ({ type: 'url_citation', url: `https://example.org/${index}`, title: `Source ${index}`, start_index: 18, end_index: 26 }));
  const limited = radar.groundedRadarResult(tooMany, empty(), 'AI');
  assert.equal(limited.sources.length, 5);
  assert.equal(limited.proposals.length, 5);
});

test('Radar requires web search and sends no health, finance, or private memory context', async () => {
  response = result();
  const state = domain.applyLifeCommand(empty(), { type: 'upsert', collection: 'memories', record: { id: 'private_memory', title: 'PRIVATE HEALTH', content: 'PRIVATE MEDICAL NOTE', scope: 'health', source: 'Synthetic', active: true } });
  await radar.searchLifeRadar(state, 'robotics');
  assert.equal(lastRequest.store, false);
  assert.equal(lastRequest.tool_choice, 'required');
  assert.equal(lastRequest.tools[0].type, 'web_search');
  assert.equal(lastRequest.max_tool_calls, 2);
  assert.equal(JSON.stringify(lastRequest.input).includes('PRIVATE MEDICAL NOTE'), false);
});

function routeHarness({ allowed = true, unauthorized = false, searchFails = false } = {}) {
  const events = [];
  const output = {};
  const json = (value, status = 200) => Response.json(value, { status });
  const dependencies = {
    '@/lib/life/api': {
      requireLifeRequest: async (_request, write) => { events.push('authenticate'); assert.equal(write, true); if (unauthorized) throw Object.assign(new Error('Unauthorized'), { status: 401 }); return { id: 'synthetic-session' }; },
      readLifeJson: request => request.json(), loadValidatedLifeState: async () => ({ state: empty(), version: 7 }), lifeJson: json, lifeError: error => json({ error: 'Failed' }, error.status || 400),
    },
    '@/lib/life/assistant': load('assistant'),
    '@/lib/life/storage': { claimLifeAiUsage: async (id, kind) => { events.push('claim'); assert.equal(id, 'synthetic-session'); assert.equal(kind, 'chat'); return { allowed, leaseId: allowed ? 'lease' : undefined, retryAfter: 60 }; }, releaseLifeAiUsage: async id => { assert.equal(id, 'lease'); events.push('release'); } },
    '@/lib/life/radar': { searchLifeRadar: async () => { events.push('search'); if (searchFails) throw new Error('Provider failed'); return { reply: 'Found [1]', sources: [{ title: 'Source', url: 'https://example.org' }], proposals: [] }; } },
  };
  const code = ts.transpileModule(fs.readFileSync('src/app/life/api/radar/route.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  vm.runInNewContext(code, { exports: output, require: id => dependencies[id] || require(id), Date });
  return { ...output, events };
}
const request = expectedVersion => new Request('https://bendalabs.sk/life/api/radar', { method: 'POST', body: JSON.stringify({ query: 'robotics', expectedVersion }), headers: { 'content-type': 'application/json' } });

test('Radar checks auth/version/rate before paying for search, and always releases the lease', async () => {
  for (const options of [{ unauthorized: true }, { allowed: false }]) {
    const route = routeHarness(options);
    const result = await route.POST(request(7));
    assert.equal(result.status, options.unauthorized ? 401 : 429);
    assert.equal(route.events.includes('search'), false);
  }
  const stale = routeHarness();
  assert.equal((await stale.POST(request(6))).status, 409);
  assert.equal(stale.events.includes('claim'), false);
  const success = routeHarness();
  const output = await success.POST(request(7));
  assert.equal(output.status, 200);
  assert.equal((await output.json()).version, 7);
  assert.deepEqual(success.events, ['authenticate', 'claim', 'search', 'release']);
  const failure = routeHarness({ searchFails: true });
  assert.equal((await failure.POST(request(7))).status, 503);
  assert.equal(failure.events.at(-1), 'release');
});
