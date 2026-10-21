const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

const modules = new Map();
let response = null;
let calls = 0;
let lastRequest = null;
class FakeOpenAI {
  responses = { parse: async input => { calls++; lastRequest = input; return response; } };
}
function load(name) {
  if (modules.has(name)) return modules.get(name);
  const output = {};
  modules.set(name, output);
  const code = ts.transpileModule(fs.readFileSync(`src/lib/life/${name}.ts`, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  vm.runInNewContext(code, {
    exports: output,
    require: id => id === 'server-only' ? {} : id === 'openai' ? FakeOpenAI : id.startsWith('./') ? load(id.slice(2)) : require(id),
    structuredClone, Date, Intl, URL, Buffer, TextDecoder, TextEncoder, Response, Request, File, FormData, Uint8Array,
    process: { env: { OPENAI_API_KEY: 'synthetic-test-key', OPENAI_MODEL: 'synthetic-test-model' } },
  });
  return output;
}
const domain = load('domain');
const assistant = load('assistant');
const importer = load('import');
const empty = () => domain.createEmptyLifeState('2026-10-19T10:00:00.000Z');
const transaction = { id: 'synthetic', date: '2026-09-01', title: 'Test merchant', amountCents: 1200, kind: 'expense', category: 'Food', projectId: null, source: 'Synthetic test', confirmed: true, note: '' };
const extraction = actions => ({ output_parsed: { title: 'Synthetic statement', kind: 'statement', documentDate: '2026-09-30', period: '2026-09', complete: true, notes: [], actions }, model: 'synthetic-test-model' });
const action = command => ({ label: 'Synthetic record', commandJson: JSON.stringify(command) });

test('only an explicit affirmative memory request enables automatic memory persistence', () => {
  assert.equal(assistant.explicitlyRequestsMemory('Zapamätaj si, že chcem krátke odpovede.'), true);
  assert.equal(assistant.explicitlyRequestsMemory('Prosím ulož to do pamäte.'), true);
  assert.equal(assistant.explicitlyRequestsMemory('Remember that I prefer concise answers.'), true);
  assert.equal(assistant.explicitlyRequestsMemory('Čo si o mne pamätáš?'), false);
  assert.equal(assistant.explicitlyRequestsMemory('Nechcem, aby si si toto zapamätal.'), false);
  assert.equal(assistant.explicitlyRequestsMemory("Do not remember that I like this."), false);
  assert.equal(assistant.explicitlyRequestsMemory('Nezapamätaj si túto informáciu.'), false);
  assert.equal(assistant.explicitlyRequestsMemory('Ukáž príklad. Zapamätaj si, že preferujem angličtinu.'), false);
  assert.equal(assistant.explicitlyRequestsMemory('Povedal mi: zapamätaj si toto pravidlo.'), false);
  assert.equal(assistant.explicitlyRequestsMemory('„Zapamätaj si toto pravidlo.“'), false);
  assert.equal(assistant.explicitlyRequestsMemory('Vieš čo znamená zapamätaj si toto pravidlo?'), false);
  assert.equal(assistant.explicitlyRequestsMemory('Dobre. Prosím, zapamätaj si toto pravidlo.'), true);
});

test('invalid and model-authored conversation commands never reach proposed writes', () => {
  const result = assistant.validateLifeProposals(empty(), [
    action({ type: 'upsert', collection: 'transactions', record: { ...transaction, amountCents: -5 } }),
    action({ type: 'remove', collection: 'chatMessages', id: 'existing' }),
    action({ type: 'upsert', collection: 'transactions', record: transaction }),
  ]);
  assert.equal(result.proposals.length, 1);
  assert.equal(result.warnings.length, 2);
  assert.equal(result.proposals[0].command.record.amountCents, 1200);
});

test('assistant context uses active memories and stored history; OpenAI retention is disabled', async () => {
  let state = empty();
  for (const [id, active] of [['active', true], ['inactive', false]]) state = domain.applyLifeCommand(state, { type: 'upsert', collection: 'memories', record: { id, title: id, content: `${id} preference`, scope: 'general', active, source: 'Synthetic test' } });
  state = assistant.appendLifeConversation(state, 'Stored question', 'Stored reply');
  response = { output_parsed: { reply: 'Synthetic reply', actions: [] }, model: 'synthetic-test-model', usage: { input_tokens: 12, output_tokens: 4 } };
  const reply = await assistant.generateLifeReply(state, 'Current question');
  assert.equal(reply.reply, 'Synthetic reply');
  assert.equal(lastRequest.store, false);
  assert.equal(lastRequest.model, 'synthetic-test-model');
  assert.ok(lastRequest.input.some(message => message.content === 'Stored question'));
  const context = assistant.lifeAssistantContext(state, 'preference');
  assert.equal(context.memories.length, 1);
  assert.equal(context.memories[0].id, 'active');
  assert.equal(state.chatMessages.length, 2, 'generation alone cannot save a reply');
});

test('an import returns a reviewable preview and never mutates canonical state', async () => {
  const state = empty();
  response = extraction([action({ type: 'upsert', collection: 'transactions', record: transaction })]);
  const preview = await importer.previewLifeImport(state, new File(['date,amount\n2026-09-01,12'], 'statement.csv', { type: 'text/csv' }));
  assert.equal(preview.proposals.length, 2);
  assert.equal(preview.proposals[0].command.collection, 'documents');
  assert.equal(preview.proposals[1].command.collection, 'transactions');
  assert.match(preview.proposals[1].command.record.source, /sha256:[a-f0-9]{64}/);
  assert.equal(preview.document.date, '2026-09-30', 'period comes from document content, not upload date');
  assert.equal(state.transactions.length, 0);
  assert.equal(state.documents.length, 0);
  assert.equal(lastRequest.store, false);
});

test('reimporting identical file skips the AI call and all duplicate writes', async () => {
  response = extraction([]);
  const file = new File(['synthetic text'], 'note.txt');
  const preview = await importer.previewLifeImport(empty(), file);
  const state = domain.applyLifeCommand(empty(), preview.proposals[0].command);
  const before = calls;
  const again = await importer.previewLifeImport(state, file);
  assert.equal(again.duplicate, true);
  assert.equal(again.proposals.length, 0);
  assert.equal(calls, before);
});

test('import cannot edit settings or silently duplicate overlapping payments', async () => {
  const state = domain.applyLifeCommand(empty(), { type: 'upsert', collection: 'transactions', record: transaction });
  response = extraction([
    action({ type: 'settings', patch: { displayName: 'Injected setting' } }),
    action({ type: 'upsert', collection: 'transactions', record: transaction }),
  ]);
  const preview = await importer.previewLifeImport(state, new File(['different synthetic file'], 'statement.csv'));
  assert.equal(preview.proposals.length, 1);
  assert.equal(preview.complete, false);
  assert.ok(preview.notes.some(note => note.includes('možné duplicity')));
  assert.ok(preview.document.note.includes('čiastočný náhľad'));
  assert.equal(state.settings.displayName, 'Môj priestor');
});

test('PDF parsing sends the actual file, and an invalid PDF is rejected', async () => {
  response = extraction([]);
  await importer.previewLifeImport(empty(), new File(['%PDF-1.7\nsynthetic test bytes'], 'test.pdf', { type: 'application/pdf' }));
  assert.equal(lastRequest.input[1].content[1].type, 'input_file');
  assert.match(lastRequest.input[1].content[1].file_data, /^data:application\/pdf;base64,/);
  await assert.rejects(importer.previewLifeImport(empty(), new File(['not a PDF'], 'bad.pdf')), /Podporované/);
});

test('multipart upload enforces file count and maximum size before AI processing', async () => {
  const form = new FormData();
  form.append('file', new File(['sample'], 'sample.txt'));
  const read = await importer.readLifeImportFile(new Request('https://bendalabs.sk/life/api/import', { method: 'POST', body: form }));
  assert.equal(await read.text(), 'sample');
  const oversized = new Request('https://bendalabs.sk/life/api/import', { method: 'POST', headers: { 'content-length': String(importer.LIFE_IMPORT_MAX_BYTES + 100000), 'content-type': 'multipart/form-data; boundary=abc' }, body: 'small actual body' });
  await assert.rejects(importer.readLifeImportFile(oversized), /4 MB/);
});

function chatRouteHarness({ state = empty(), unauthorized = false, failSave = false, denyRate = false } = {}) {
  const output = {};
  let savedState = null;
  const released = [];
  const json = (value, status = 200) => Response.json(value, { status });
  const dependencies = {
    '@/lib/life/assistant': assistant,
    '@/lib/life/domain': domain,
    '@/lib/life/api': {
      requireLifeRequest: async () => { if (unauthorized) throw Object.assign(new Error('Unauthenticated'), { status: 401 }); return { id: 'synthetic-session' }; },
      readLifeJson: request => request.json(),
      loadValidatedLifeState: async () => ({ state, version: state.version }),
      lifeJson: json,
      lifeError: error => json({ error: 'Could not save' }, error.status || 503),
    },
    '@/lib/life/storage': {
      claimLifeAiUsage: async (session, kind) => { assert.equal(session, 'synthetic-session'); assert.equal(kind, 'chat'); return denyRate ? { allowed: false, retryAfter: 17 } : { allowed: true, retryAfter: 0, leaseId: 'synthetic-lease' }; },
      releaseLifeAiUsage: async lease => { released.push(lease); },
      saveLifeState: async (next, version) => {
      assert.equal(version, state.version);
      if (failSave) throw Object.assign(new Error('Unavailable'), { status: 503 });
      savedState = { ...next, version: version + 1 };
      return { state: savedState, version: savedState.version };
    } },
  };
  const code = ts.transpileModule(fs.readFileSync('src/app/life/api/chat/route.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  vm.runInNewContext(code, { exports: output, require: name => dependencies[name] || require(name), Date });
  return { post: input => output.POST(new Request('https://bendalabs.sk/life/api/chat', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(input) })), saved: () => savedState, released };
}
const memoryAction = action({ type: 'upsert', collection: 'memories', record: { id: 'new-memory', title: 'Style preference', content: 'I prefer concise answers.', scope: 'general', active: true, source: 'Conversation' } });

test('chat rejects unauthorized and stale requests before any paid model call', async () => {
  const before = calls;
  assert.equal((await chatRouteHarness({ unauthorized: true }).post({ message: 'Hello' })).status, 401);
  assert.equal((await chatRouteHarness().post({ message: 'Hello', expectedVersion: 900 })).status, 409);
  assert.equal(calls, before);
});

test('chat commits explicit memory and conversation together, keeping financial changes as proposals', async () => {
  response = { output_parsed: { reply: 'Rozumiem.', actions: [memoryAction, action({ type: 'upsert', collection: 'transactions', record: transaction })] }, model: 'synthetic-test-model' };
  const harness = chatRouteHarness();
  const result = await harness.post({ message: 'Zapamätaj si, že chcem stručné odpovede.', expectedVersion: 0 });
  assert.equal(result.status, 200);
  const body = await result.json();
  assert.equal(body.memorySaved, true);
  assert.match(body.reply, /Uložené do pamäte/);
  assert.equal(harness.saved().memories.length, 1);
  assert.equal(harness.saved().chatMessages.length, 2);
  assert.equal(harness.saved().transactions.length, 0);
  assert.equal(body.proposals.length, 1);
  assert.deepEqual(harness.released, ['synthetic-lease']);
});

test('failed database commit never returns a successful memory receipt', async () => {
  response = { output_parsed: { reply: 'Rozumiem.', actions: [memoryAction] }, model: 'synthetic-test-model' };
  const harness = chatRouteHarness({ failSave: true });
  const result = await harness.post({ message: 'Zapamätaj si, že chcem stručné odpovede.', expectedVersion: 0 });
  assert.equal(result.status, 503);
  assert.equal(harness.saved(), null);
  const body = await result.json();
  assert.equal(body.memorySaved, undefined);
  assert.equal(body.reply, undefined);
  assert.deepEqual(harness.released, ['synthetic-lease']);
});

test('durable rate denial returns retry guidance before a paid request', async () => {
  const before = calls;
  const harness = chatRouteHarness({ denyRate: true });
  const result = await harness.post({ message: 'Hello', expectedVersion: 0 });
  assert.equal(result.status, 429);
  assert.equal(result.headers.get('retry-after'), '17');
  assert.equal((await result.json()).retryAfter, 17);
  assert.equal(calls, before);
  assert.equal(harness.released.length, 0);
});

test('conversation retention respects total characters and preserves complete pairs and memories', () => {
  let state = domain.applyLifeCommand(empty(), { type: 'upsert', collection: 'memories', record: memoryAction.commandJson ? JSON.parse(memoryAction.commandJson).record : null });
  state = { ...state, chatMessages: Array.from({ length: 500 }, (_, index) => ({ id: `message-${index}`, role: index % 2 ? 'assistant' : 'user', content: String(index).padEnd(1000, 'x'), createdAt: '2026-10-19T10:00:00.000Z' })) };
  const next = assistant.appendLifeConversation(state, 'u'.repeat(10000), 'a'.repeat(10000));
  assert.ok(next.chatMessages.length <= assistant.LIFE_CHAT_MAX_MESSAGES);
  assert.ok(next.chatMessages.reduce((sum, item) => sum + item.content.length, 0) <= assistant.LIFE_CHAT_MAX_CHARACTERS);
  assert.equal(next.chatMessages[0].role, 'user');
  assert.equal(next.chatMessages.length % 2, 0);
  assert.equal(next.memories.length, 1);
  assert.equal(state.chatMessages.length, 500, 'original log remains immutable');
});

test('conversation retention also caps many short messages at 500', () => {
  const state = { ...empty(), chatMessages: Array.from({ length: 600 }, (_, index) => ({ id: `message-${index}`, role: index % 2 ? 'assistant' : 'user', content: `Message ${index}`, createdAt: '2026-10-19T10:00:00.000Z' })) };
  const next = assistant.appendLifeConversation(state, 'new question', 'new answer');
  assert.equal(next.chatMessages.length, 500);
  assert.equal(next.chatMessages[0].id, 'message-102');
});

test('duplicate invoice proposals inside one import are caught against the evolving preview', async () => {
  const invoice = { id: 'inv-a', number: 'INV-TEST-01', client: 'Synthetic Client', issueDate: '2026-09-01', dueDate: '2026-09-15', grossCents: 10000, passThroughCents: 0, status: 'unconfirmed', paidCents: 0, projectId: null, source: 'test', note: '' };
  response = extraction([
    action({ type: 'upsert', collection: 'invoices', record: invoice }),
    action({ type: 'upsert', collection: 'invoices', record: { ...invoice, id: 'inv-b', number: ' inv-test-01 ', client: 'synthetic   client' } }),
  ]);
  const preview = await importer.previewLifeImport(empty(), new File(['synthetic invoice with repeated header'], 'invoice.txt'));
  assert.equal(preview.proposals.length, 2, 'one document and one invoice');
  assert.equal(preview.complete, false);
});

test('import rate admission occurs only after file validation and duplicate checks', async () => {
  let admissions = 0;
  const deny = async () => { admissions++; throw new assistant.LifeAiError('Rate limit', 429, 30); };
  const before = calls;
  await assert.rejects(importer.previewLifeImport(empty(), new File(['invalid'], 'invalid.pdf'), deny), /Podporované/);
  assert.equal(admissions, 0);
  await assert.rejects(importer.previewLifeImport(empty(), new File(['text'], 'valid.txt'), deny), /Rate limit/);
  assert.equal(admissions, 1);
  assert.equal(calls, before);
});
