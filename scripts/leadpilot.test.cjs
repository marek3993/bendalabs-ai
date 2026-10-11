const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function moduleAt(file, globals = {}, dependencies = {}) {
  const exports = {};
  const source = fs.readFileSync(file, 'utf8');
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText,
    { exports, require: name => dependencies[name] ?? require(name), URL, URLSearchParams, Response, AbortSignal, TextDecoder, Date, process, console, ...globals });
  return exports;
}
const model = moduleAt('src/lib/leadpilot/model.ts');
const schedule = moduleAt('src/lib/leadpilot/schedule.ts');
const source = (fetch) => moduleAt('src/lib/leadpilot/sources.ts', { fetch }, { './model': model });
const analysis = { is_paid_demand: true, is_closed: false, title: 'Automate invoice extraction', demand_excerpt: 'We need a developer to automate invoice extraction.', hours_min: 20, hours_max: 30, days_min: 4, days_max: 6, budget_text: '$900', budget_excerpt: 'Budget $900', region: 'USA' };
test('only fresh, recently verified, unresolved demands belong to the active queue', () => {
  const now = Date.parse('2026-10-11T12:00:00Z');
  const lead = { verification: 'verified', status: 'new', published_at: '2026-10-10T12:00:00Z', fetched_at: '2026-10-11T10:00:00Z' };
  assert.equal(model.isActiveOpportunity(lead, now), true);
  for (const patch of [{ published_at: null }, { published_at: 'invalid' }, { published_at: '2026-09-10' }, { fetched_at: '2026-10-01' }, { verification: 'review' }, { status: 'review' }, { status: 'archived' }, { status: 'won' }, { published_at: '2026-11-01' }]) assert.equal(model.isActiveOpportunity({ ...lead, ...patch }, now), false);
});
test('unsupported buying intent and fabricated budget cannot become verified facts', () => {
  const text = 'We need a developer to automate invoice extraction. Budget $900. USA';
  assert.ok(model.groundedAnalysis(analysis, text));
  assert.equal(model.groundedAnalysis({ ...analysis, demand_excerpt: 'A company might need automation in future.' }, text), null);
  assert.equal(model.groundedAnalysis({ ...analysis, is_paid_demand: false }, text), null);
  assert.equal(model.groundedAnalysis({ ...analysis, is_closed: true }, text), null);
  assert.equal(model.groundedAnalysis({ ...analysis, title: '[For Hire] Developer' }, text), null);
  assert.equal(model.groundedAnalysis({ ...analysis, hours_max: 10 }, text), null);
  assert.equal(model.groundedAnalysis({ ...analysis, budget_text: '$99999' }, text).budget_text, 'Budget $900');
  assert.equal(model.groundedAnalysis({ ...analysis, budget_excerpt: 'Budget $99999' }, text).budget_text, null);
  assert.equal(model.groundedAnalysis({ ...analysis, region: 'Slovakia' }, text).region, null);
});
test('technical form submissions are not customers', () => {
  for (const email of ['form-check-20261006@example.com', 'intake-check-20261006@example.com', 'automation@example.com', 'call@bendalabs.invalid', 'test-check@company.sk']) assert.equal(model.isTechnicalTest(email), true);
  assert.equal(model.isTechnicalTest('client@company.sk'), false);
});
test('source URLs reject private addresses, credentials, arbitrary domains and category pages', () => {
  const s = source();
  for (const url of ['http://localhost/x', 'https://127.0.0.1/x', 'https://community.n8n.io.evil.test/t/job/123', 'https://u:p@community.n8n.io/t/job/123', 'https://community.n8n.io:8443/t/job/123', 'https://community.n8n.io/c/jobs/13', 'https://www.upwork.com/freelance-jobs/']) assert.equal(s.canonicalSourceUrl(url), null);
  assert.equal(s.canonicalSourceUrl('https://community.n8n.io/t/job/123/?utm_source=test#reply'), 'https://community.n8n.io/t/job/123');
});
test('forum evidence uses the original buyer post and its date, never vendor replies', async () => {
  const s = source(async () => Response.json({ title: 'Need invoice automation', category_id: 13, closed: false, archived: false, post_stream: { posts: [
    { post_number: 1, created_at: '2026-09-01T10:00:00Z', cooked: '<p>We need a developer for a paid project.</p>' },
    { post_number: 2, created_at: '2026-10-11T10:00:00Z', cooked: '<p>My new automation services.</p>' },
  ] } }));
  const page = await s.fetchDemandPage('https://community.n8n.io/t/job/123');
  assert.equal(page.publishedAt, '2026-09-01T10:00:00Z');
  assert.ok(page.text.includes('paid project'));
  assert.ok(!page.text.includes('My new'));
  assert.equal(model.isFresh(page.publishedAt), false);
});
test('redirects cannot move source fetching outside approved public portals', async () => {
  let calls = 0;
  const s = source(async () => { calls++; return new Response('', { status: 302, headers: { location: 'http://169.254.169.254/latest/meta-data' } }); });
  await assert.rejects(s.fetchDemandPage('https://community.n8n.io/t/job/123'), /Nepovolený zdroj/);
  assert.equal(calls, 1);
});
test('English replies contain the calculated quote and conditional delivery in English', () => {
  const reply = model.quotedReply({ reply_body: 'I can build your Gmail workflow.', reply_language: 'en', hours_min: 40, hours_max: 60, hourly_rate: 35, days_min: 8, days_max: 12 });
  assert.ok(reply.includes('1')); assert.ok(reply.includes('working days')); assert.ok(reply.includes('preliminary estimate'));
  assert.ok(!reply.includes('Orientačná'));
});
test('discovery saves grounded demands and shares exactly two slots between manual and scheduled runs', async () => {
  let analyses = 0, searches = 0;
  const original = 'We need a developer to automate invoice extraction. Budget $900. USA';
  const duplicate = 'https://community.n8n.io/t/old/123';
  const fresh = 'https://community.n8n.io/t/new/456';
  const runs = [], saved = [];
  class FakeOpenAI {
    responses = { parse: async () => { searches++; return { output_parsed: { urls: [duplicate, fresh, 'https://evil.test/'] } }; } };
    chat = { completions: { parse: async () => { analyses++; return { choices: [{ message: { parsed: { ...analysis, summary: 'Request', category: 'documents', requirements: [], solution: 'PDF → Excel', assumptions: [], exclusions: [], questions: [], recurring_costs: 'Separate', reply_body: 'I can implement your workflow.', reply_language: 'en' } } }] }; } } };
  }
  const sources = source();
  const repository = {
    listOpportunities: async () => [{ source_url: duplicate }, ...saved],
    getRun: async key => runs.find(run => run.run_key === key) ?? null,
    startRun: async key => { const run = { id: `run-${runs.length + 1}`, run_key: key }; runs.push(run); return run; },
    finishRun: async (id, result) => Object.assign(runs.find(run => run.id === id), result),
    saveOpportunity: async lead => { saved.push(lead); return lead; },
  };
  const scout = moduleAt('src/lib/leadpilot/scout.ts', { process: { env: { OPENAI_API_KEY: 'isolated-only' } } }, {
    openai: FakeOpenAI, 'openai/helpers/zod': { zodResponseFormat: () => ({}), zodTextFormat: () => ({}) }, './model': model,
    './sources': { ...sources, communityCandidates: async () => [duplicate, fresh], fetchDemandPage: async url => ({ url, text: original, publishedAt: new Date().toISOString(), publicationEvidence: 'Original post #1', closed: false }) }, './repository': repository, './schedule': schedule,
  });
  const first = await scout.runScout(new Date('2026-10-11T04:00:00Z'));
  assert.equal(first.saved, 1); assert.equal(analyses, 1); assert.equal(searches, 1);
  assert.equal(first.run_key, '2026-10-11@06:00');
  assert.equal(saved[0].verification, 'verified'); assert.equal(saved[0].budget_text, 'Budget $900');
  const second = await scout.runScout(new Date('2026-10-11T10:00:00Z'));
  assert.equal(second.reused, true); assert.equal(analyses, 1); assert.equal(searches, 1);
  const afternoon = await scout.runScout(new Date('2026-10-11T11:30:00Z'));
  assert.equal(afternoon.reused, false); assert.equal(afternoon.run_key, '2026-10-11@13:30');
  assert.equal(searches, 2); assert.equal(analyses, 1); assert.equal(afternoon.saved, 0);
  assert.equal((await scout.runScout(new Date('2026-10-11T20:00:00Z'))).reused, true);
  assert.equal(searches, 2);
  await scout.runScout(new Date('2026-10-12T04:00:00Z'));
  assert.equal(searches, 3); assert.equal(analyses, 1);
});

test('a concurrently claimed slot and a legacy daily run cannot trigger additional paid calls', async () => {
  let apiCalls = 0;
  class ForbiddenOpenAI { constructor() { apiCalls++; throw new Error('Paid call forbidden'); } }
  const legacy = { id: 'legacy', run_key: '2026-10-11', created_at: '2026-10-11T15:00:00Z' };
  let claimed = null;
  const scout = moduleAt('src/lib/leadpilot/scout.ts', { process: { env: { OPENAI_API_KEY: 'isolated-only' } } }, {
    openai: ForbiddenOpenAI, 'openai/helpers/zod': {}, './model': model, './sources': {}, './schedule': schedule,
    './repository': {
      getRun: async key => key === legacy.run_key ? legacy : claimed?.run_key === key ? claimed : null,
      startRun: async key => { claimed = { id: 'winner', run_key: key, status: 'running' }; throw new Error('Unique constraint'); },
    },
  });
  const reused = await scout.runScout(new Date('2026-10-11T16:00:00Z'));
  assert.equal(reused.id, 'legacy'); assert.equal(reused.reused, true);
  const collision = await scout.runScout(new Date('2026-10-11T04:00:00Z'));
  assert.equal(collision.id, 'winner'); assert.equal(collision.reused, true); assert.equal(apiCalls, 0);
  claimed.status = 'failed';
  assert.equal((await scout.runScout(new Date('2026-10-11T05:00:00Z'))).status, 'failed');
  assert.equal(apiCalls, 0);
});
