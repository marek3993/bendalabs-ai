const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const resolve = Module._resolveFilename;
Module._resolveFilename = function (request, ...args) { return resolve.call(this, request.startsWith('@/') ? path.resolve(__dirname, '../src', request.slice(2)) : request, ...args); };
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText, filename);
const audit = {
  score: 7, is_good_fit: true, site_type: 'Business services website', recommended_ai_type: ['navigator', 'lead qualifier'],
  summary: 'The website offers several services. An AI layer could guide visitors to the right one and prepare a better enquiry.',
  why_fit: ['Several services require a choice before contact.', 'Visitors can benefit from help clarifying their needs.'],
  friction_points: ['The right service may be unclear at first.', 'General enquiries can lack important project details.'],
  upsell_opportunities: ['Related services could be suggested when relevant.'],
  phase_one_plan: ['Start with the main service selection page.', 'Ask for the goal and relevant project context.', 'Measure completed enquiries and their quality.'],
  example_user_flows: Array.from({ length: 3 }, (_, i) => ({ user_intent: `I need guidance with business service ${i + 1}.`, ai_action: 'Clarify the goal and suggest a relevant service.', business_value: 'A more useful enquiry with clear context.' })),
};
let modelRequest, failModel = false, failStorage = false;
class OpenAIStub { constructor() { this.chat = { completions: { parse: async request => { modelRequest = request; if (failModel) throw Error('Simulated provider failure'); return { choices: [{ message: { parsed: audit } }] }; } } }; } }
const originalLoad = Module._load;
Module._load = function (id, ...args) { return id === 'openai' ? OpenAIStub : originalLoad.call(this, id, ...args); };
process.env.OPENAI_API_KEY = 'local-test-only';
process.env.SUPABASE_URL = 'http://storage.test';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'local-test-only';
process.env.RESEND_API_KEY = '';
const writes = [], crawled = [];
global.fetch = async (input, init = {}) => {
  const url = new URL(String(input));
  if (url.hostname === 'storage.test') {
    if (init.method === 'POST') {
      if (failStorage) return new Response('Simulated storage failure', { status: 503 });
      const data = JSON.parse(init.body); writes.push(data);
      return Response.json([{ ...data, id: 'local-record', created_at: new Date().toISOString() }]);
    }
    return Response.json([], { headers: { 'content-range': '0-0/0' } });
  }
  crawled.push(url.href);
  if (url.hostname === 'blocked.example') return new Response('Access denied', { status: 403 });
  if (url.hostname === 'unavailable.example') return new Response('Not found', { status: 404 });
  const response = new Response('<html><head><title>Business services</title></head><body><h1>Services for your business</h1><p>We offer consulting, process improvement and software implementation. Tell us your goals and project requirements to arrange a consultation with the appropriate specialist.</p><a href="/services">Services</a><a href="/contact">Contact our team</a></body></html>', { headers: { 'content-type': 'text/html' } });
  Object.defineProperty(response, 'url', { value: url.href });
  return response;
};
const { POST: auditPost } = require('../src/app/api/audit/route.ts');
const { POST: proposalPost } = require('../src/app/api/ai-custom-proposal/route.ts');
const { POST: contactPost } = require('../src/app/api/contact-requests/route.ts');
const request = (route, data) => new Request('http://localhost' + route, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(data) });
async function run() {
  let response = await auditPost(request('/api/audit', { url: 'not a URL', locale: 'en' }));
  assert.equal(response.status, 400); assert.match((await response.json()).error, /valid website/);
  response = await auditPost(request('/api/audit', { url: 'https://example.com', locale: 'en' }));
  assert.equal(response.status, 200); const payload = await response.json(); assert.ok(payload.audit.summary.includes('AI layer'));
  assert.ok(crawled.length > 1, 'The real crawler must follow relevant pages');
  assert.match(modelRequest.messages[0].content, /every user-facing field in natural, precise English/);
  assert.ok(modelRequest.messages[1].content.includes('Services for your business'));
  assert.ok(writes.some(row => row.summary === payload.audit.summary));
  response = await auditPost(request('/api/audit', { url: 'https://blocked.example', locale: 'en' }));
  assert.equal(response.status, 422); assert.match((await response.json()).error, /automated access/);
  response = await auditPost(request('/api/audit', { url: 'https://unavailable.example', locale: 'en' }));
  assert.equal(response.status, 422); assert.match((await response.json()).error, /could not load/);
  failModel = true;
  response = await auditPost(request('/api/audit', { url: 'https://example.com', locale: 'en' }));
  assert.equal(response.status, 500); assert.match((await response.json()).error, /could not generate/);
  const data = { locale: 'en', website: 'example.com', businessType: 'clinic', mainGoal: 'simplify_contact', visitorNextStep: 'book_appointment', opportunityText: 'Visitors need clearer booking guidance.', dashboardData: ['contact_reasons'], successMetric: 'More complete appointment enquiries.', name: 'Local Customer', email: 'local@example.com', phone: '', company: '' };
  response = await proposalPost(request('/api/ai-custom-proposal', { ...data, email: 'invalid' }));
  assert.equal(response.status, 400); assert.match((await response.json()).error, /email address/);
  response = await proposalPost(request('/api/ai-custom-proposal', data));
  const proposal = await response.json(); assert.equal(proposal.leadSaved, true); assert.match(proposal.recommendation.summary, /existing website/);
  failStorage = true;
  response = await proposalPost(request('/api/ai-custom-proposal', data));
  const failed = await response.json(); assert.equal(failed.leadSaved, false); assert.ok(failed.recommendation); assert.match(failed.error, /could not be saved/);
  failStorage = false;
  const form = new FormData(); for (const [key, value] of Object.entries({ locale: 'en', name: 'Local Customer', email: 'local@example.com', website: 'example.com', message: 'We need a clearer way to select our services.', source: 'contact_section' })) form.set(key, value);
  response = await contactPost(new Request('http://localhost/api/contact-requests', { method: 'POST', body: form }));
  assert.equal(response.status, 303); assert.equal(new URL(response.headers.get('location')).pathname, '/en/thank-you');
  form.set('email', 'invalid');
  response = await contactPost(new Request('http://localhost/api/contact-requests', { method: 'POST', body: form }));
  assert.equal(new URL(response.headers.get('location')).pathname, '/en/submission-failed');
  assert.match(new URL(response.headers.get('location')).searchParams.get('details'), /email address/);
  console.log('PASS: actual crawl → English model directive → audit normalization → persistence; English blocked/load/model errors; proposal success/save failure; contact validation and EN redirects. External model and storage are isolated test doubles.');
}
run().catch(error => { console.error(error); process.exitCode = 1; });
