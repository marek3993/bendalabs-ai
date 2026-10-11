const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function moduleAt(file, globals = {}, dependencies = {}) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText, { exports, require: name => dependencies[name] ?? require(name), Date, process, Buffer, Response, console: { error() {} }, ...globals });
  return exports;
}
const schedule = moduleAt('src/lib/leadpilot/schedule.ts');
test('both Slovakia times survive the spring and autumn DST transitions', () => {
  for (const [day, offset] of [['2026-01-15', 1], ['2026-03-28', 1], ['2026-03-29', 2], ['2026-10-11', 2], ['2026-10-24', 2], ['2026-10-25', 1], ['2026-12-15', 1]]) {
    for (const [hour, minute, label] of [[6, 0, '06:00'], [13, 30, '13:30']]) {
      const iso = `${day}T${String(hour - offset).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00Z`;
      const now = new Date(iso);
      assert.equal(schedule.isScheduledScoutTime(now), true, iso);
      assert.equal(schedule.scoutRunKey(now), `${day}@${label}`);
      assert.equal(schedule.isScheduledScoutTime(new Date(now.getTime() - 60_000)), false);
      assert.equal(schedule.isScheduledScoutTime(new Date(now.getTime() + 14 * 60_000)), true);
      assert.equal(schedule.isScheduledScoutTime(new Date(now.getTime() + 15 * 60_000)), false);
    }
  }
  assert.equal(schedule.scoutRunKey(new Date('2026-10-11T22:05:00Z')), '2026-10-12@06:00');
});
test('UTC cron triggers start two paid slots, not four, in either season', () => {
  const config = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
  for (const day of ['2026-01-15', '2026-07-15', '2026-10-25']) {
    const keys = [];
    for (const cron of config.crons) {
      assert.equal(cron.path, '/api/cron/leadpilot');
      const [minute, hour, ...rest] = cron.schedule.split(' ');
      assert.deepEqual(rest, ['*', '*', '*']);
      const now = new Date(`${day}T${hour.padStart(2, '0')}:${minute.padStart(2, '0')}:00Z`);
      if (schedule.isScheduledScoutTime(now)) keys.push(schedule.scoutRunKey(now));
    }
    assert.deepEqual(keys, [`${day}@06:00`, `${day}@13:30`]);
  }
});
async function invoke({ env = {}, token = 'isolated-cron-secret', when = '2026-10-11T04:00:00Z', result = {}, throwing = false, query = '' } = {}) {
  let calls = 0;
  class Clock extends Date { constructor(...args) { super(...(args.length ? args : [when])); } }
  const processMock = { env: { CRON_SECRET: 'isolated-cron-secret', LEADPILOT_SCHEDULE_ENABLED: 'true', VERCEL_ENV: 'production', ...env } };
  const configured = moduleAt('src/lib/leadpilot/schedule.ts', { process: processMock });
  const route = moduleAt('src/app/api/cron/leadpilot/route.ts', { Date: Clock, process: processMock }, {
    '@/lib/leadpilot/schedule': configured,
    '@/lib/leadpilot/scout': { runScout: async now => {
      calls++;
      if (throwing) throw new Error('secret credential MUST NOT LEAK');
      return { run_key: configured.scoutRunKey(now), status: 'completed', found: 10, saved: 2, skipped: 8, reused: false, errors: [], source_text: 'PRIVATE LEAD MUST NOT LEAK', ...result };
    } },
  });
  const response = await route.GET(new Request(`https://bendalabs.sk/api/cron/leadpilot${query}`, {
    headers: { ...(token === null ? {} : { authorization: `Bearer ${token}` }), 'user-agent': 'vercel-cron/1.0' },
  }));
  const body = await response.json();
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.ok(!JSON.stringify(body).includes('MUST NOT LEAK'));
  return { response, body, calls };
}
test('cron requires its own secret; user-agent, missing config and false tokens never call AI', async () => {
  for (const options of [{ token: null }, { token: 'wrong' }, { env: { CRON_SECRET: '' } }, { env: { CRON_SECRET: undefined } }]) {
    const result = await invoke(options);
    assert.equal(result.response.status, 401); assert.equal(result.calls, 0);
  }
});
test('disabled, preview and wrong-time cron calls do no paid work, including force queries', async () => {
  for (const options of [{ env: { LEADPILOT_SCHEDULE_ENABLED: 'false' } }, { env: { VERCEL_ENV: 'preview' } }, { when: '2026-10-11T05:00:00Z', query: '?force=true' }]) {
    const result = await invoke(options);
    assert.equal(result.response.status, 200); assert.equal(result.body.skipped, true); assert.equal(result.calls, 0);
  }
});
test('scheduled route passes the correct slot, reports counts and fails honestly without leaking data', async () => {
  const morning = await invoke(); assert.equal(morning.calls, 1); assert.equal(morning.body.run_key, '2026-10-11@06:00');
  const afternoon = await invoke({ when: '2026-10-11T11:30:00Z', result: { reused: true } });
  assert.equal(afternoon.body.run_key, '2026-10-11@13:30'); assert.equal(afternoon.body.reused, true);
  const winter = await invoke({ when: '2026-10-25T05:00:00Z' }); assert.equal(winter.calls, 1);
  assert.equal((await invoke({ result: { status: 'failed' } })).response.status, 503);
  assert.equal((await invoke({ throwing: true })).response.status, 503);
});
