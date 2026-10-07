const assert = require('node:assert/strict');
const { test } = require('node:test');
const { readFileSync } = require('node:fs');
const vm = require('node:vm');
const { createHash, webcrypto } = require('node:crypto');
const ts = require('typescript');

function loadTs(file, globals = {}, transform = value => value) {
  const code = ts.transpileModule(transform(readFileSync(file, 'utf8')), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  const exports = {};
  const context = { exports, Request, Response, TextEncoder, TextDecoder, URL, URLSearchParams, AbortSignal, Uint8Array, crypto: webcrypto, ...globals };
  vm.runInNewContext(code, context, { filename: file });
  return exports;
}
const validation = loadTs('src/lib/university-feedback/validation.ts');
const curriculum = require('../src/components/robotics-university/lib/curriculum.json');
const courseLessons = require('../src/components/robotics-university/lib/course-lessons.json');
const courseIds = ['sideways-parking', 'robot-components', 'robot-frame', 'manual-sequence', 'command-parameters', 'time-distance', 'variables', 'loops', 'functions', 'range-input'];
const allLessons = [...courseLessons, ...curriculum];
const unknownIds = ['unknown', 'conditions', 'debug-mission', 'range_input', 'SIDEWAYS-PARKING'];
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

test('published course is exactly the agreed ten lessons and preserves 24 reference chapters', () => {
  assert.deepEqual(courseLessons.map(lesson => lesson.id), courseIds);
  assert.equal(curriculum.length, 24);
  assert.equal(new Set(allLessons.map(lesson => lesson.id)).size, 34);
});

function lessonModule(name) {
  if (name.endsWith('/lib/curriculum.json')) return { default: curriculum };
  if (name.endsWith('/lib/course-lessons.json')) return { default: courseLessons };
  throw new Error('Unexpected lesson module: ' + name);
}

test('native API accepts all ten course lessons and all existing chapters, rejecting unpublished or unknown IDs before storage', async () => {
  const stored = [];
  const api = loadTs('src/app/api/university-feedback/route.ts', {
    require: name => {
      if (name.endsWith('.json')) return lessonModule(name);
      if (name === '@/lib/university-feedback/validation') return validation;
      if (name === '@/lib/university-feedback/server') return {
        feedbackActorHash: () => 'a'.repeat(64),
        submitFeedback: async feedback => { stored.push(feedback.chapterId); return { ok: true }; },
      };
      throw new Error('Unexpected API import: ' + name);
    },
  });
  for (const [index, lesson] of allLessons.entries()) {
    const result = await api.POST(request({ ...valid, chapterId: lesson.id, lang: index % 2 ? 'en' : 'sk' }));
    assert.equal(result.status, 200, lesson.id);
    assert.deepEqual(await result.json(), { ok: true });
    assert.equal(stored.at(-1), lesson.id);
  }
  for (const chapterId of unknownIds) assert.equal((await api.POST(request({ ...valid, chapterId }))).status, 400, chapterId);
  assert.deepEqual(stored, allLessons.map(lesson => lesson.id));
});

test('Edge accepts the same 34 IDs and persists each submitted lesson ID unchanged', async () => {
  const stored = [];
  const edge = loadEdge(async (url, options) => {
    assert.ok(url.endsWith('/rpc/university_submit_feedback'));
    stored.push(JSON.parse(options.body).p_chapter_id);
    return Response.json('stored');
  });
  for (const lesson of allLessons) {
    const result = await edge.handler(edgeRequest({ ...payload, feedback: { ...valid, chapterId: lesson.id } }));
    assert.equal(result.status, 200, lesson.id);
    assert.deepEqual(await result.json(), { ok: true });
    assert.equal(stored.at(-1), lesson.id);
  }
  for (const chapterId of unknownIds) assert.equal((await edge.handler(edgeRequest({ ...payload, feedback: { ...valid, chapterId } }))).status, 400, chapterId);
  assert.deepEqual(stored, allLessons.map(lesson => lesson.id));
});

test('private Edge filters accept all ten course lessons and reject unpublished or unknown IDs without storage access', async () => {
  const filters = [];
  const edge = loadEdge(async url => {
    if (url.includes('/rpc/')) return Response.json([]);
    filters.push(new URL(url).searchParams.get('chapter_id'));
    return new Response('[]', { headers: { 'content-type': 'application/json', 'content-range': '*/0' } });
  });
  for (const chapter of courseIds) assert.equal((await edge.handler(edgeRequest({ action: 'list', chapter, status: 'all', page: 1 }))).status, 200, chapter);
  for (const chapter of unknownIds) assert.equal((await edge.handler(edgeRequest({ action: 'list', chapter, status: 'all', page: 1 }))).status, 400, chapter);
  assert.deepEqual(filters, courseIds.map(id => 'eq.' + id));
});

function loadAdmin(authenticated, getFeedbackDashboard) {
  return loadTs('src/app/admin/university/page.tsx', {
    require: name => {
      if (name.endsWith('.json')) return lessonModule(name);
      if (name === 'react/jsx-runtime') return require(name);
      if (name === 'next/link') return { default: function Link() {} };
      if (name === '@/lib/bendalabs/seo') return { privatePageMetadata: () => ({}) };
      if (name === '@/lib/leads/auth') return { isAdminAuthenticated: async () => authenticated, isAdminProtectionConfigured: () => true };
      if (name === '@/lib/university-feedback/server') return { getFeedbackDashboard };
      if (name === './university-admin.module.css') return { default: {} };
      throw new Error('Unexpected admin import: ' + name);
    },
  }).default;
}
function elements(root) {
  if (Array.isArray(root)) return Array.from(root).flatMap(elements);
  if (!root || typeof root !== 'object' || !root.props) return [];
  return [root, ...elements(root.props.children)];
}

test('admin includes 34 filter choices and routes new lesson links to course while preserving chapter links', async () => {
  let selected;
  const admin = loadAdmin(true, async filter => {
    selected = filter.chapter;
    return {
      summaries: [], total: allLessons.length,
      rows: allLessons.map((lesson, index) => ({ submission_id: String(index), chapter_id: lesson.id, created_at: '2026-10-07T12:00:00.000Z', lang: 'sk', status: 'reviewed', rating: null, suggestion: '' })),
    };
  });
  const nodes = elements(await admin({ searchParams: Promise.resolve({ chapter: 'range-input' }) }));
  assert.equal(selected, 'range-input');
  const links = nodes.filter(node => typeof node.props.href === 'string').map(node => node.props.href);
  for (const id of courseIds) assert.ok(links.includes('/roboticka-univerzita#course/' + id), id);
  for (const chapter of curriculum) assert.ok(links.includes('/roboticka-univerzita#chapter/' + chapter.id), chapter.id);
  const select = nodes.find(node => node.type === 'select' && node.props.name === 'chapter');
  const options = elements(select.props.children).filter(node => node.type === 'option');
  assert.deepEqual(options.map(node => node.props.value), ['', ...allLessons.map(lesson => lesson.id)]);
  for (const lesson of allLessons) assert.equal(options.find(node => node.props.value === lesson.id).props.children, lesson.title.sk);
});

test('admin still requires authentication before loading feedback for a course lesson', async () => {
  let loaded = false;
  const admin = loadAdmin(false, async () => { loaded = true; throw new Error('Must not read private feedback'); });
  const nodes = elements(await admin({ searchParams: Promise.resolve({ chapter: 'range-input' }) }));
  assert.equal(loaded, false);
  assert.ok(nodes.some(node => node.type === 'form' && node.props.action === '/admin/university/login'));
});
