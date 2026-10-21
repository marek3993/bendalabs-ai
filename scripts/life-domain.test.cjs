const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const source = fs.readFileSync('src/lib/life/domain.ts', 'utf8');
const exportsObject = {};
vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, { exports: exportsObject, require, structuredClone, Date, Intl, URL });
const { createEmptyLifeState, applyLifeCommand, summarizeFinances, lifeStateSchema, lifeCommandSchema, parseEuroAmount, lifeToday } = exportsObject;
const { reminderOccurrenceForDay, nextReminderOccurrence, reminderDisplayOccurrence } = exportsObject;
const now = '2026-10-19T17:00:00.000Z';
const later = '2026-10-20T17:00:00.000Z';
const empty = () => createEmptyLifeState(now);
const write = (state, collection, record) => applyLifeCommand(state, { type: 'upsert', collection, record }, now);
const transaction = (id, kind, amountCents, extra = {}) => ({ id, kind, amountCents, date: '2026-09-12', title: 'Synthetic entry', category: 'Synthetic category', projectId: null, source: 'test fixture', confirmed: true, note: '', ...extra });
const invoice = (id, extra = {}) => ({ id, number: 'TEST-1', client: 'Synthetic client', issueDate: '2026-09-01', dueDate: '2026-09-30', grossCents: 500000, passThroughCents: 50000, status: 'issued', paidCents: 0, projectId: null, source: 'test fixture', note: '', ...extra });
const snapshot = (extra = {}) => ({ id: 'snapshot', month: '2026-09', asOfDate: '2026-10-02', confirmed: true, source: 'Synthetic historical summary', note: 'Aggregates only', incomeCents: 500000, refundCents: null, expenseCents: 100000, debtPrincipalCents: null, cashWithdrawalCents: null, cashOutflowCents: 150000, invoicedGrossCents: 600000, invoicedPassThroughCents: 80000, openingBalanceCents: null, closingBalanceCents: null, categories: [{ category: 'Food', amountCents: 30000 }], ...extra });

test('new workspace is empty and cannot expose preloaded private facts or demo balances', () => {
  const state = empty();
  for (const collection of exportsObject.collectionNames) assert.equal(state[collection].length, 0, collection);
  assert.equal(state.version, 0);
  assert.equal(state.settings.finance.openingBalanceCents, null);
  const summary = summarizeFinances(state, '2026-09', '2026-10-19');
  assert.equal(summary.basis, 'empty');
  assert.equal(summary.incomeCents, null);
  assert.equal(summary.recordedBalanceCents, null);
  assert.equal(summary.balanceVerified, false);
});

test('topups are excluded, principal repayments are cashflow rather than consumption, and cash withdrawals stay separate', () => {
  let state = empty();
  for (const record of [transaction('salary', 'income', 500000), transaction('topup', 'internal_transfer', 200000), transaction('food', 'expense', 90000), transaction('refund', 'refund', 10000), transaction('principal', 'debt_principal', 50000), transaction('atm', 'cash_withdrawal', 30000), transaction('unconfirmed', 'income', 999999, { confirmed: false })]) state = write(state, 'transactions', record);
  const summary = summarizeFinances(state, '2026-09', '2026-10-19');
  assert.equal(summary.incomeCents, 500000);
  assert.equal(summary.netConsumptionCents, 80000);
  assert.equal(summary.cashOutflowCents, 170000);
  assert.equal(summary.recordedNetFlowCents, 340000);
  assert.equal(summary.internalTransferCents, 200000);
  assert.equal(summary.categories.length, 1);
  assert.equal(summary.categories[0].amountCents, 80000);
  assert.equal(summary.pendingCount, 1);
  assert.equal(summary.basis, 'partial_transactions');
  assert.equal(summary.recordedBalanceCents, null);
});

test('issued and even paid invoices never manufacture received income; unknown payment is not overdue debt', () => {
  let state = write(empty(), 'invoices', invoice('open'));
  state = write(state, 'invoices', invoice('paid', { status: 'paid', paidCents: 500000 }));
  state = write(state, 'invoices', invoice('unknown', { status: 'unconfirmed' }));
  const summary = summarizeFinances(state, '2026-09', '2026-10-19');
  assert.equal(summary.incomeCents, null);
  assert.equal(summary.invoicedGrossCents, 1500000);
  assert.equal(summary.invoicedBeforeTaxCents, 1350000);
  assert.equal(summary.invoiceOutstandingCents, 500000);
  assert.equal(summary.invoiceUnknownPaymentCount, 1);
  assert.equal(summary.overdueInvoices.length, 1);
});

test('recorded balance uses dated opening once and all covered months, reserves once; editing invalidates reconciliation', () => {
  let state = empty();
  state = write(state, 'transactions', transaction('before', 'income', 999999, { date: '2026-08-31' }));
  state = write(state, 'transactions', transaction('income', 'income', 500000));
  state = write(state, 'transactions', transaction('outflow', 'expense', 100000, { date: '2026-10-01' }));
  state = write(state, 'transactions', transaction('future', 'expense', 50000, { date: '2026-10-20' }));
  state = applyLifeCommand(state, { type: 'settings', patch: { finance: { ...state.settings.finance, openingBalanceCents: 200000, openingBalanceDate: '2026-09-01', dataThroughDate: '2026-10-01', reservedCents: 150000, reconciled: true, completeMonths: ['2026-09'] } } }, now);
  const summary = summarizeFinances(state, '2026-09', '2026-10-19');
  assert.equal(summary.recordedBalanceCents, 600000);
  assert.equal(summary.afterReservesCents, 450000);
  assert.equal(summary.daysStale, 18);
  assert.equal(summary.balanceVerified, true);
  assert.equal(summary.basis, 'transactions');
  const edited = write(state, 'transactions', transaction('income', 'income', 450000));
  assert.equal(edited.settings.finance.reconciled, false);
  assert.equal(edited.settings.finance.completeMonths.length, 0);
  assert.equal(state.settings.finance.reconciled, true, 'Original state is immutable');
});

test('historical snapshots take precedence over partial transaction imports without summing or inventing unknowns', () => {
  let state = write(empty(), 'monthlySnapshots', snapshot());
  state = write(state, 'transactions', transaction('partial', 'income', 10000));
  let summary = summarizeFinances(state, '2026-09', '2026-10-19');
  assert.equal(summary.basis, 'snapshot');
  assert.equal(summary.incomeCents, 500000);
  assert.equal(summary.refundCents, null);
  assert.equal(summary.debtPrincipalCents, null);
  assert.equal(summary.recordedNetFlowCents, null);
  assert.equal(summary.categories[0].amountCents, 30000);
  assert.equal(summary.recordedBalanceCents, null);
  state = applyLifeCommand(state, { type: 'settings', patch: { finance: { ...state.settings.finance, completeMonths: ['2026-09'] } } }, now);
  summary = summarizeFinances(state, '2026-09', '2026-10-19');
  assert.equal(summary.basis, 'transactions');
  assert.equal(summary.incomeCents, 10000);
  assert.equal(state.monthlySnapshots.length, 1, 'Historical provenance remains retained');
});

test('memory changes create immutable history, identical requests do not duplicate revisions, restoration appends history', () => {
  const first = { id: 'memory', title: 'Style', content: 'Brief answers', scope: 'general', source: 'Explicit user instruction', active: true };
  const state = write(empty(), 'memories', first);
  const duplicate = applyLifeCommand(state, { type: 'upsert', collection: 'memories', record: first }, later);
  assert.equal(duplicate.version, state.version);
  assert.equal(duplicate.memories[0].history.length, 1);
  const edited = write(state, 'memories', { ...first, content: 'Detailed answers' });
  assert.equal(edited.memories[0].revision, 2);
  assert.equal(state.memories[0].content, 'Brief answers');
  const restored = applyLifeCommand(edited, { type: 'restore_memory', id: 'memory', revision: 1 }, later);
  assert.equal(restored.memories[0].revision, 3);
  assert.equal(restored.memories[0].content, 'Brief answers');
  assert.equal(restored.memories[0].history[1].content, 'Detailed answers');
  assert.throws(() => applyLifeCommand(restored, { type: 'restore_memory', id: 'memory', revision: 99 }, later));
});

test('delete detaches project references and removing a task disables associated reminder', () => {
  let state = write(empty(), 'projects', { id: 'project', title: 'Synthetic project', description: '', status: 'active', nextStep: '', dueDate: null, budgetCents: null, priority: 'normal' });
  state = write(state, 'tasks', { id: 'task', title: 'Synthetic task', projectId: 'project', dueDate: null, done: false, priority: 'normal', note: '' });
  state = write(state, 'transactions', transaction('cost', 'expense', 1000, { projectId: 'project' }));
  state = write(state, 'reminders', { id: 'reminder', title: 'Synthetic reminder', dueAt: later, enabled: true, repeat: 'none', taskId: 'task', note: '' });
  state = applyLifeCommand(state, { type: 'remove', collection: 'projects', id: 'project' }, later);
  assert.equal(state.transactions[0].projectId, null);
  assert.equal(state.tasks[0].projectId, null);
  state = applyLifeCommand(state, { type: 'remove', collection: 'tasks', id: 'task' }, later);
  assert.equal(state.reminders[0].enabled, false);
  assert.equal(state.reminders[0].taskId, null);
});

test('strict schemas reject invalid amounts, impossible dates, fabricated history and unscheduled reminders', () => {
  for (const amountCents of [-1, 1.5, Infinity, NaN, Number.MAX_SAFE_INTEGER + 1]) assert.equal(lifeCommandSchema.safeParse({ type: 'upsert', collection: 'transactions', record: transaction('bad', 'income', amountCents) }).success, false);
  for (const date of ['2026-02-29', '2026-13-01', '2026-04-31', '2026-1-1']) assert.equal(lifeCommandSchema.safeParse({ type: 'upsert', collection: 'transactions', record: transaction('bad', 'income', 100, { date }) }).success, false);
  assert.equal(lifeCommandSchema.safeParse({ type: 'upsert', collection: 'invoices', record: invoice('bad', { passThroughCents: 600000 }) }).success, false);
  assert.equal(lifeCommandSchema.safeParse({ type: 'upsert', collection: 'invoices', record: invoice('bad', { status: 'paid' }) }).success, false);
  assert.equal(lifeCommandSchema.safeParse({ type: 'upsert', collection: 'memories', record: { id: 'bad', title: 'Bad', content: 'Bad', scope: 'general', source: 'test', active: true, revision: 99 } }).success, false);
  assert.equal(lifeCommandSchema.safeParse({ type: 'upsert', collection: 'reminders', record: { id: 'bad', title: 'Bad', dueAt: null, enabled: true, repeat: 'none', taskId: null, note: '' } }).success, false);
  assert.equal(lifeStateSchema.safeParse({ ...empty(), transactions: [transaction('dangling', 'expense', 100, { projectId: 'missing' })] }).success, false);
});

test('untrusted metadata accepts only safe link protocols and no storage paths or arbitrary fields', () => {
  for (const url of ['javascript:alert(1)', 'data:text/html,evil', 'file:///etc/passwd']) assert.equal(lifeCommandSchema.safeParse({ type: 'upsert', collection: 'radarItems', record: { id: 'radar', title: 'Test', url, topic: 'Test', note: '', savedDate: '2026-10-19', projectId: null, archived: false } }).success, false);
  assert.equal(lifeCommandSchema.safeParse({ type: 'upsert', collection: 'documents', record: { id: 'doc', title: 'Test', kind: 'note', date: '2026-10-19', note: '', projectId: null, source: 'Test', filePath: '/etc/passwd' } }).success, false);
});

test('money arithmetic rejects totals that would break the next overview before state is persisted', () => {
  const state = write(empty(), 'transactions', transaction('a', 'income', Number.MAX_SAFE_INTEGER));
  assert.throws(() => write(state, 'transactions', transaction('b', 'income', 1)), /bezpečný/);
  assert.equal(state.transactions.length, 1);
  assert.equal(summarizeFinances(state, '2026-09', '2026-10-19').incomeCents, Number.MAX_SAFE_INTEGER);
  assert.equal(parseEuroAmount('1 234,56'), 123456);
  assert.equal(parseEuroAmount('0.01'), 1);
  for (const input of ['-1', '1.234', '1e5', 'Infinity', '90071992547410.00', '']) assert.equal(parseEuroAmount(input), null);
});

test('conversation records persist without being interpreted as memory and local dates respect timezone', () => {
  const state = write(empty(), 'chatMessages', { id: 'message', role: 'user', content: 'A synthetic message', createdAt: now });
  assert.equal(state.chatMessages.length, 1);
  assert.equal(state.memories.length, 0);
  assert.equal(lifeToday('Europe/Paris', new Date('2026-10-19T23:30:00Z')), '2026-10-20');
});

test('own transfers keep income correct but prevent claiming an account balance without transfer scope', () => {
  let state = write(empty(), 'transactions', transaction('topup', 'internal_transfer', 10000));
  state = applyLifeCommand(state, { type: 'settings', patch: { finance: { ...state.settings.finance, openingBalanceCents: 100000, openingBalanceDate: '2026-09-01', dataThroughDate: '2026-09-30', reconciled: true } } }, now);
  const summary = summarizeFinances(state, '2026-09', '2026-10-19');
  assert.equal(summary.incomeCents, 0);
  assert.equal(summary.recordedBalanceCents, null);
  assert.equal(summary.afterReservesCents, null);
  assert.equal(summary.balanceVerified, false);
  assert.equal(summary.balanceUnavailableReason, 'transfer_scope_unknown');
});

test('category totals group case differences and offset their refunds consistently', () => {
  let state = write(empty(), 'transactions', transaction('one', 'expense', 10000, { category: 'Jedlo' }));
  state = write(state, 'transactions', transaction('two', 'expense', 10000, { category: 'jedlo' }));
  state = write(state, 'transactions', transaction('three', 'refund', 2000, { category: 'JEDLO' }));
  const summary = summarizeFinances(state, '2026-09', '2026-10-19');
  assert.equal(summary.categories.length, 1);
  assert.equal(summary.categories[0].category, 'Jedlo');
  assert.equal(summary.categories[0].amountCents, 18000);
});

const reminder = (repeat, dueAt, extra = {}) => ({ id: 'reminder', title: 'Synthetic reminder', dueAt, enabled: true, repeat, taskId: null, note: '', ...extra });
test('daily reminder maintains local wall time across DST and resolves gaps and folds once', () => {
  const morning = reminder('daily', '2026-03-28T08:00:00.000Z');
  assert.equal(reminderOccurrenceForDay(morning, '2026-03-29', 'Europe/Paris'), '2026-03-29T07:00:00.000Z');
  const gap = reminder('daily', '2026-03-28T01:30:00.000Z');
  assert.equal(reminderOccurrenceForDay(gap, '2026-03-29', 'Europe/Paris'), '2026-03-29T01:30:00.000Z');
  assert.equal(reminderOccurrenceForDay(gap, '2026-03-30', 'Europe/Paris'), '2026-03-30T00:30:00.000Z');
  const fold = reminder('daily', '2026-10-24T00:30:00.000Z');
  assert.equal(reminderOccurrenceForDay(fold, '2026-10-25', 'Europe/Paris'), '2026-10-25T00:30:00.000Z');
  const explicitFold = reminder('daily', '2026-10-25T01:30:00.000Z');
  assert.equal(reminderOccurrenceForDay(explicitFold, '2026-10-25', 'Europe/Paris'), '2026-10-25T01:30:00.000Z');
});

test('weekday, weekly and monthly reminders follow calendar boundaries and preserve their original anchor', () => {
  const workday = reminder('weekdays', '2026-10-16T07:00:00.000Z');
  assert.equal(reminderOccurrenceForDay(workday, '2026-10-17', 'Europe/Paris'), null);
  assert.equal(nextReminderOccurrence(workday, 'Europe/Paris', '2026-10-16T12:00:00.000Z'), '2026-10-19T07:00:00.000Z');
  const weekly = reminder('weekly', '2026-10-19T07:00:00.000Z');
  assert.equal(nextReminderOccurrence(weekly, 'Europe/Paris', '2026-10-19T12:00:00.000Z'), '2026-10-26T08:00:00.000Z');
  const monthly = reminder('monthly', '2026-01-31T09:00:00.000Z');
  assert.equal(reminderOccurrenceForDay(monthly, '2026-02-28', 'Europe/Paris'), '2026-02-28T09:00:00.000Z');
  assert.equal(reminderOccurrenceForDay(monthly, '2026-03-28', 'Europe/Paris'), null);
  assert.equal(reminderOccurrenceForDay(monthly, '2026-03-31', 'Europe/Paris'), '2026-03-31T08:00:00.000Z');
});

test('reminder display shows due recurring slots, upcoming slots and overdue one-offs without inventing delivery', () => {
  const daily = reminder('daily', '2026-10-01T07:00:00.000Z');
  const due = reminderDisplayOccurrence(daily, 'Europe/Paris', '2026-10-19T08:00:00.000Z');
  assert.equal(due.dueAt, '2026-10-19T07:00:00.000Z');
  assert.equal(due.status, 'due');
  assert.equal(reminderDisplayOccurrence(daily, 'Europe/Paris', '2026-10-19T06:00:00.000Z').status, 'upcoming');
  assert.equal(reminderDisplayOccurrence(reminder('none', '2026-10-01T07:00:00.000Z'), 'Europe/Paris', now).status, 'overdue');
  assert.equal(nextReminderOccurrence(reminder('none', '2026-10-01T07:00:00.000Z'), 'Europe/Paris', now), null);
  assert.equal(reminderDisplayOccurrence({ ...daily, enabled: false }, 'Europe/Paris', now), null);
  assert.equal(reminderDisplayOccurrence({ ...daily, dueAt: null }, 'Europe/Paris', now), null);
  assert.equal(reminderOccurrenceForDay(daily, '2026-09-30', 'Europe/Paris'), null);
});
