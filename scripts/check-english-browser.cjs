const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { spawn } = require('node:child_process');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');
const output = path.join(root, '.tmp-en/browser-results');
fs.mkdirSync(output, { recursive: true });
const base = process.env.TEST_BASE_URL || 'http://localhost:3202';
const storage = process.env.TEST_STORAGE_URL || 'http://127.0.0.1:4323';
const records = [];
let failStorage = false, server, app, browser;
const findings = { routes: [], flows: [], consoleErrors: [], pageErrors: [], failedResources: [], screenshots: [] };
const enRoutes = ['/en', '/en/labs', '/en/robotics', '/en/ai-website-audit', '/en/custom-ai-proposal', '/en/ai-layer-for-finance-and-insurance', '/en/ai-layer-for-marketplaces-and-rentals', '/en/thank-you', '/en/submission-failed'];
const expectedPairs = [['/', '/cs'], ['/labs', '/cs/labs'], ['/robotics', '/cs/robotics'], ['/ai-audit-webu', '/cs/ai-audit-webu'], ['/ai-navrh-na-mieru', '/cs'], ['/ai-vrstva-pre-financne-a-poistne-weby', '/cs/ai-vrstva-pro-financni-a-pojistne-weby'], ['/ai-vrstva-pre-marketplace-a-rental-weby', '/cs/ai-vrstva-pro-marketplace-a-rental-weby'], ['/dakujem', '/cs/dekujeme'], ['/odoslanie-zlyhalo', '/cs/odeslani-selhalo']];
const slavic = /[áäčďéíľĺňóôŕšťúýžěůř]/i;
async function start() {
  if (!process.env.TEST_BASE_URL) {
    server = http.createServer(async (req, res) => {
      let data = ''; for await (const chunk of req) data += chunk;
      const url = new URL(req.url.replace(/^\/+/, '/'), storage);
      res.setHeader('content-type', 'application/json');
      if (url.pathname === '/control') { failStorage = JSON.parse(data || '{}').fail === true; return res.end('{}'); }
      if (url.pathname === '/records') return res.end(JSON.stringify(records));
      if (req.method === 'POST' && url.pathname.replace(/^\/+/, '/').startsWith('/rest/v1/')) {
        if (failStorage && url.pathname.endsWith('/contact_requests')) { res.statusCode = 503; return res.end('{"message":"Local test storage failure"}'); }
        const row = { ...JSON.parse(data), id: crypto.randomUUID(), created_at: new Date().toISOString() };
        records.push({ path: url.pathname, ...row }); res.statusCode = 201; return res.end(JSON.stringify([row]));
      }
      res.setHeader('content-range', '0-0/1'); res.end('[]');
    });
    await new Promise(resolve => server.listen(Number(new URL(storage).port), '127.0.0.1', resolve));
    const log = fs.openSync(path.join(output, 'server.log'), 'w');
    app = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '--hostname', '127.0.0.1', '--port', new URL(base).port], {
      cwd: root, windowsHide: true, stdio: ['ignore', log, log],
      env: { ...process.env, SUPABASE_URL: storage, SUPABASE_SERVICE_ROLE_KEY: 'local-test-only', OPENAI_API_KEY: '', RESEND_API_KEY: '', GOOGLE_ADS_CONVERSION_SEND_TO: '' },
    });
    let ready = false;
    for (let i = 0; i < 60; i++) { try { ready = (await fetch(base + '/en')).ok; } catch {} if (ready) break; await new Promise(resolve => setTimeout(resolve, 500)); }
    assert.ok(ready, 'Local production server did not start');
  }
  const chrome = process.env.CHROME_PATH || (process.platform === 'win32' ? 'C:/Program Files/Google/Chrome/Application/chrome.exe' : undefined);
  browser = await chromium.launch({ executablePath: chrome, headless: true, args: ['--enable-unsafe-swiftshader'] });
}
async function setFailure(fail) { await fetch(storage + '/control', { method: 'POST', body: JSON.stringify({ fail }) }); }
async function englishOnly(page, note) {
  const text = await page.locator('.bl-site').innerText();
  assert.ok(!slavic.test(text), note + ': untranslated visible text: ' + text.split('\n').filter(line => slavic.test(line)).join(' | '));
  assert.doesNotMatch(text, /chatbot/i, note);
}
async function screenshot(page, name) {
  for (const img of await page.locator('.bl-site img:visible').all()) {
    await img.scrollIntoViewIfNeeded();
    await img.evaluate(image => image.decode().catch(() => {}));
  }
  const file = path.join(output, name + '.png');
  await page.screenshot({ path: file, fullPage: true, caret: 'initial' });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: path.join(output, name + '-viewport.png'), caret: 'initial' });
  findings.screenshots.push(file);
}
async function visible(page, text) { await page.getByText(text, { exact: false }).first().waitFor({ state: 'visible', timeout: 30000 }); }
async function contact(page, width) {
  await page.goto(base + '/en/labs#kontakt');
  const form = page.locator('.bl-project-form');
  await form.getByRole('button', { name: 'Send your brief' }).click();
  assert.equal(await form.locator('[name=name]').evaluate(e => e.validationMessage), 'Enter your name.');
  await form.getByLabel('Name', { exact: true }).fill('English Browser Test');
  await form.getByLabel('E-mail', { exact: true }).fill('english-browser@example.com');
  await form.getByLabel('Project or company website').fill('example.com');
  await form.getByLabel('What would you like to solve?').fill('We need help choosing an AI layer for our existing website.');
  await setFailure(true);
  await form.getByRole('button', { name: 'Send your brief' }).click();
  await visible(page, 'Your message could not be sent. Your entries have been kept.');
  assert.equal(await form.getByLabel('Name', { exact: true }).inputValue(), 'English Browser Test');
  await setFailure(false);
  await form.getByRole('button', { name: 'Send your brief' }).click();
  await page.waitForURL('**/en/thank-you?back=*');
  assert.equal(await page.locator('html').getAttribute('lang'), 'en');
  await visible(page, 'Thank you. Your brief has arrived.');
  await page.getByRole('link', { name: 'Back to the website' }).click();
  await page.waitForURL('**/en/labs#kontakt');
  findings.flows.push(width + ': contact validation, save failure with retained input, retry, successful persistence and return to form');
}
async function proposal(page, width) {
  await page.goto(base + '/en/custom-ai-proposal');
  await page.getByRole('button', { name: 'Next step', exact: true }).click();
  await visible(page, 'Enter a valid website address.');
  await page.getByLabel('Company website', { exact: true }).fill('example.com');
  await page.getByRole('button', { name: 'Next step', exact: true }).click();
  await page.getByRole('button', { name: 'B2B services or consulting', exact: true }).click();
  await page.getByRole('button', { name: 'Next step', exact: true }).click();
  await page.getByRole('button', { name: 'Get better-prepared enquiries', exact: true }).click();
  await page.getByRole('button', { name: 'Next step', exact: true }).click();
  await page.getByRole('button', { name: 'Send an enquiry', exact: true }).click();
  await page.getByRole('button', { name: 'Next step', exact: true }).click();
  await page.getByLabel('Opportunity for improvement').fill('Our enquiries need clearer project requirements.');
  await page.getByRole('button', { name: 'Next step', exact: true }).click();
  await page.getByRole('button', { name: "Visitors' most common questions", exact: true }).click();
  await page.getByRole('button', { name: 'Quality of leads and enquiries', exact: true }).click();
  await page.getByRole('button', { name: 'Next step', exact: true }).click();
  await page.getByLabel('Success after 30 days', { exact: true }).fill('More enquiries with a clear budget and project scope.');
  await page.getByRole('button', { name: 'Next step', exact: true }).click();
  await page.getByRole('button', { name: 'Show my custom AI proposal' }).click();
  await visible(page, 'Enter your name.');
  await page.getByLabel('Name', { exact: true }).fill('Proposal Browser Test');
  await page.getByLabel('Email', { exact: true }).fill('proposal-browser@example.com');
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  assert.match(await page.getByLabel('Success after 30 days', { exact: true }).inputValue(), /clear budget/);
  await page.getByRole('button', { name: 'Next step', exact: true }).click();
  await setFailure(true);
  await page.getByRole('button', { name: 'Show my custom AI proposal' }).click();
  await visible(page, 'Your proposal is ready, but your contact details could not be saved.');
  await englishOnly(page, 'proposal result');
  await page.getByRole('button', { name: 'Edit your answers' }).click();
  await setFailure(false);
  await page.getByRole('button', { name: 'Show my custom AI proposal' }).click();
  await visible(page, 'Your contact details have been sent.');
  await visible(page, 'An AI layer for better-prepared enquiries');
  await screenshot(page, 'proposal-result-' + width);
  findings.flows.push(width + ': all eight proposal steps, validation, back navigation, retained answers, save failure, edit/retry, success and English recommendation');
}
async function audit(page, width) {
  await page.goto(base + '/en/ai-website-audit');
  const input = page.getByPlaceholder('e.g. yourcompany.com');
  await input.fill('not a valid address');
  await page.getByRole('button', { name: 'Run a free audit' }).click();
  await visible(page, 'Enter a valid website address.');
  await input.fill('bendalabs.sk');
  await page.getByRole('button', { name: 'Run a free audit' }).click();
  await visible(page, 'Suitability for an AI layer');
  await visible(page, 'Simulated data');
  await englishOnly(page, 'audit results');
  await screenshot(page, 'audit-result-' + width);
  await page.getByRole('button', { name: 'Send details / request a proposal', exact: true }).click();
  let form = page.locator('form').filter({ has: page.locator('input[name="source"][value="audit_result"]') });
  await form.getByRole('button', { name: 'Send enquiry' }).click();
  await visible(page, 'Enter your name.');
  await form.getByLabel('Name', { exact: true }).fill('Audit Browser Test');
  await form.getByLabel('Email', { exact: true }).fill('audit-browser@example.com');
  await form.getByLabel('What would you like to improve?').fill('Please help visitors choose services and prepare clear enquiries.');
  await form.getByRole('button', { name: 'Send enquiry' }).click();
  await visible(page, 'Thank you. Your enquiry has been sent.');
  await page.getByRole('button', { name: 'Request a short call', exact: true }).click();
  form = page.locator('form').filter({ has: page.locator('input[name="requestType"][value="call_request"]') });
  await form.getByLabel('Name', { exact: true }).fill('Call Browser Test');
  await form.getByLabel('Phone', { exact: true }).fill('+44 7700 900123');
  await form.getByLabel('Preferred time', { exact: true }).fill('Tuesday 10:00–12:00 Europe/London');
  await form.getByRole('button', { name: 'Request a call', exact: true }).click();
  await visible(page, 'Thank you. Your call request has been sent.');
  await page.getByRole('link', { name: 'Get a custom AI proposal', exact: true }).click();
  await page.waitForURL('**/en/custom-ai-proposal');
  findings.flows.push(width + ': audit validation, real local API result, simulated dashboard, enquiry form, call request and custom-proposal link');
}
async function main() {
  await start();
  if (!process.env.TEST_BASE_URL) {
    const sitemap = await (await fetch(base + '/sitemap.xml')).text();
    for (const route of enRoutes.slice(0, 7)) assert.ok(sitemap.includes('<loc>https://bendalabs.sk' + route + '</loc>'));
    assert.ok(sitemap.includes('hreflang="en"') && sitemap.includes('hreflang="sk"') && sitemap.includes('hreflang="cs"'));
    assert.ok(!sitemap.includes('/en/thank-you') && !sitemap.includes('/admin'));
    const robots = await (await fetch(base + '/robots.txt')).text();
    assert.ok(robots.includes('https://bendalabs.sk/sitemap.xml'));
    const share = await fetch(base + '/share-image');
    assert.equal(share.status, 200); assert.match(share.headers.get('content-type'), /image\/png/);
  }
  for (const width of [1440, 390]) {
    const context = await browser.newContext({ viewport: { width, height: width === 390 ? 844 : 1000 }, locale: 'en-GB', reducedMotion: 'reduce', isMobile: width === 390, hasTouch: width === 390 });
    await context.route(/googletagmanager\.com|google-analytics\.com|googleadservices\.com/, route => route.fulfill({ status: 200, contentType: 'text/javascript', body: '' }));
    const page = await context.newPage();
    page.setDefaultTimeout(15000);
    page.setDefaultNavigationTimeout(45000);
    page.on('pageerror', error => findings.pageErrors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') findings.consoleErrors.push({ text: message.text(), url: message.location().url }); });
    page.on('response', response => { if (response.status() >= 400) findings.failedResources.push({ url: response.url(), status: response.status() }); });
    for (const [index, route] of enRoutes.entries()) {
      const response = await page.goto(base + route);
      assert.equal(response.status(), 200, route);
      await page.locator('.bl-site h1').first().waitFor();
      await englishOnly(page, route);
      assert.equal(await page.locator('html').getAttribute('lang'), 'en');
      assert.equal(await page.getByRole('link', { name: 'Slovenčina', exact: true }).getAttribute('href'), expectedPairs[index][0]);
      assert.equal(await page.getByRole('link', { name: 'Čeština', exact: true }).getAttribute('href'), expectedPairs[index][1]);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      assert.ok(overflow <= 1, route + ' horizontal overflow at ' + width + ': ' + overflow);
      const description = await page.locator('meta[name="description"]').getAttribute('content');
      assert.ok(description); assert.ok(!slavic.test(description), route + ' metadata must be English');
      assert.ok(!slavic.test(await page.title()), route + ' title must be English');
      const structured = await page.locator('script[type="application/ld+json"]').textContent();
      assert.ok(!slavic.test(structured), route + ' structured data must be English');
      if (index < 7) {
        assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'), 'https://bendalabs.sk' + route);
        assert.equal(await page.locator('link[rel="alternate"][hreflang="en"]').getAttribute('href'), 'https://bendalabs.sk' + route);
      } else assert.match(await page.locator('meta[name="robots"]').getAttribute('content'), /noindex/);
      findings.routes.push(width + ' ' + route);
      if (index < 4) await screenshot(page, route.replaceAll('/', '-').slice(1) + '-' + width);
    }
    await page.goto(base + '/en/labs');
    for (const summary of await page.locator('details > summary').all()) await summary.click();
    await englishOnly(page, 'expanded Labs portfolio');
    await visible(page, 'The project also includes an Opportunities section.');
    assert.equal(await page.getByRole('heading', { name: 'Zmluvomat', exact: true }).count(), 1);
    await screenshot(page, 'labs-expanded-' + width);
    await page.goto(base + '/en/labs#kontakt');
    await page.getByRole('link', { name: 'Slovenčina', exact: true }).click();
    await page.waitForURL('**/labs#kontakt');
    await page.getByRole('link', { name: 'English', exact: true }).click();
    await page.waitForURL('**/en/labs#kontakt');
    await page.goto(base + '/en/robotics');
    await page.getByRole('link', { name: 'Slovenčina', exact: true }).click();
    await page.waitForURL('**/robotics'); assert.equal(await page.locator('html').getAttribute('lang'), 'sk');
    await page.getByRole('link', { name: 'English', exact: true }).click();
    await page.waitForURL('**/en/robotics'); assert.equal(await page.locator('html').getAttribute('lang'), 'en');
    await page.getByRole('link', { name: 'Čeština', exact: true }).click();
    await page.waitForURL('**/cs/robotics'); assert.equal(await page.locator('html').getAttribute('lang'), 'cs');
    await page.getByRole('link', { name: 'English', exact: true }).click();
    await page.waitForURL('**/en/robotics');
    if (width === 390) { await page.getByRole('button', { name: 'Open menu' }).click(); const navigation = page.getByRole('navigation', { name: 'Mobile navigation' }); await navigation.waitFor(); await navigation.getByRole('link').first().focus(); await page.keyboard.press('Escape'); assert.equal(await page.getByRole('button', { name: 'Open menu' }).getAttribute('aria-expanded'), 'false'); }
    for (const summary of await page.locator('details > summary').all()) await summary.click();
    await page.getByRole('button', { name: /Explore the base in 3D/ }).click();
    await visible(page, 'The platform from every angle');
    await page.getByRole('button', { name: /Try the three-button ticker/ }).click();
    await visible(page, 'Three buttons. The full picture.');
    await page.getByRole('button', { name: 'Show an example', exact: true }).click();
    await page.getByRole('button', { name: 'Next demo step', exact: true }).click();
    await englishOnly(page, 'expanded robotics');
    await screenshot(page, 'robotics-expanded-' + width);
    await contact(page, width);
    await proposal(page, width);
    await audit(page, width);
    await context.close();
  }
  const stored = await (await fetch(storage + '/records')).json();
  assert.ok(stored.some(row => row.source === 'ai_navrh_na_mieru' && row.message.includes('An AI layer for better-prepared enquiries')));
  assert.ok(stored.some(row => row.source === 'contact_section' && row.email === 'english-browser@example.com'));
  assert.ok(stored.some(row => row.source === 'audit_result' && row.linked_audit_domain === 'bendalabs.sk'));
  assert.ok(stored.some(row => row.message?.includes('request_type: call_request')));
  assert.equal(findings.pageErrors.length, 0, findings.pageErrors.join('\n'));
  assert.equal(findings.consoleErrors.filter(error => !error.text.startsWith('Failed to load resource:')).length, 0, JSON.stringify(findings.consoleErrors));
  assert.equal(findings.failedResources.filter(resource => resource.url.startsWith(base) && resource.status === 404).length, 0, JSON.stringify(findings.failedResources));
  findings.persistence = `${stored.length} records accepted by the local storage fixture; no production writes`;
  findings.status = 'passed';
}
main().catch(error => { findings.status = 'failed'; findings.error = error.stack; console.error(error); process.exitCode = 1; }).finally(async () => {
  fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify(findings, null, 2));
  console.log(JSON.stringify({ status: findings.status, routes: findings.routes.length, flows: findings.flows, error: findings.error }, null, 2));
  if (browser) await browser.close();
  if (app) app.kill();
  if (server) await new Promise(resolve => server.close(resolve));
});
