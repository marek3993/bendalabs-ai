const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const originalResolve = Module._resolveFilename;
Module._resolveFilename = function (request, ...args) {
  return originalResolve.call(this, request.startsWith('@/') ? path.resolve(__dirname, '../src', request.slice(2)) : request, ...args);
};
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText, filename);
const { routeGroups, equivalentPath, localeFromPath, siteLocales } = require('../src/lib/bendalabs/localization.ts');
const { languageAlternates, publicPaths } = require('../src/lib/bendalabs/seo.ts');
const { contactReturnPath } = require('../src/lib/bendalabs/contact-return.ts');
const proposal = require('../src/lib/bendalabs/ai-custom-proposal.ts');
const { getLeadFormCopy } = require('../src/lib/bendalabs/lead-form-content.ts');
const { parseContactRequestSubmission } = require('../src/lib/leads/contact-request.ts');
const { getDomainAuditOverride } = require('../src/lib/site-audit/overrides.ts');
const { getDashboardPreviewCopy } = require('../src/lib/bendalabs/dashboard-preview.ts');
const { getCrawlerBlockedMessage, getInvalidUrlMessage } = require('../src/lib/site-audit/error.ts');
const noSlavicCopy = value => assert.doesNotMatch(JSON.stringify(value), /[áäčďéíľĺňóôŕšťúýžěůř]/i);
for (const [key, group] of Object.entries(routeGroups)) {
  for (const [language, route] of Object.entries(group)) {
    assert.equal(localeFromPath(route), language);
    assert.ok(fs.existsSync(path.join(__dirname, '../src/app', route, 'page.tsx')));
    for (const target of siteLocales) assert.equal(equivalentPath(route, target), group[target] ?? routeGroups.home[target]);
    if (!['success', 'failure'].includes(key)) {
      assert.ok(publicPaths.includes(route));
      const alternates = languageAlternates(route);
      for (const [lang, translated] of Object.entries(group)) assert.equal(alternates[lang], 'https://bendalabs.sk' + translated);
    } else assert.ok(!publicPaths.includes(route));
  }
}
assert.equal(contactReturnPath('/en/robotics#kontakt', 'en'), '/en/robotics#kontakt');
for (const bad of ['/robotics#kontakt', '/cs/labs#kontakt', '//evil.example/#kontakt', '/en/../api#kontakt', '/en/custom-ai-proposal#kontakt']) assert.equal(contactReturnPath(bad, 'en'), '/en#kontakt');
const input = { locale: 'en', website: 'example.com', businessType: 'b2b_services', mainGoal: 'better_leads', visitorNextStep: 'send_inquiry', dashboardData: ['top_questions'], opportunityText: 'Our enquiries need more context.', successMetric: 'Keep my text: úspech, data and https://example.com.', name: 'Sample Customer', email: 'SAMPLE@example.com', phone: '', company: '' };
const parsed = proposal.parseAiCustomProposalSubmission(input);
assert.equal(parsed.success, true);
assert.equal(parsed.data.locale, 'en');
assert.equal(parsed.data.email, 'sample@example.com');
const result = proposal.generateAiCustomProposalRecommendation(parsed.data);
assert.equal(result.recommendedLayerTitle, 'An AI layer for better-prepared enquiries');
assert.ok(result.nextStep.endsWith(input.successMetric), 'User-authored text must never be translated');
noSlavicCopy({ ...result, nextStep: '' });
for (const business of proposal.businessTypeOptions) for (const goal of proposal.mainGoalOptions) for (const next of proposal.visitorNextStepOptions) {
  const recommendation = proposal.generateAiCustomProposalRecommendation({ ...parsed.data, businessType: business.value, mainGoal: goal.value, visitorNextStep: next.value, dashboardData: proposal.dashboardDataOptions.map(x => x.value), successMetric: 'More useful enquiries.' });
  noSlavicCopy(recommendation);
  assert.doesNotMatch(JSON.stringify(recommendation), /chatbot/i);
  assert.equal(recommendation.phaseOne.length, 3);
}
assert.equal(proposal.parseAiCustomProposalSubmission({ ...input, businessType: 'B2B services' }).success, false);
assert.equal(parseContactRequestSubmission({ locale: 'en', name: input.name, email: input.email, website: input.website, message: input.opportunityText, source: 'contact_section' }).data.locale, 'en');
noSlavicCopy(getLeadFormCopy('en'));
assert.match(getInvalidUrlMessage('en'), /valid website/);
assert.match(getCrawlerBlockedMessage('en'), /automated access/);
for (const domain of ['bendalabs.sk', 'bazos.sk', 'bosen.sk', 'herrys.sk', 'haloreality.sk', 'directreal.sk', 'lexxus.sk', 'winnersreality.sk', 'rivers.sk', 'arec.sk', 'remax-slovakia.sk']) {
  const en = getDomainAuditOverride("https://" + domain, 'en');
  assert.ok(en, domain);
  assert.equal(en.score, getDomainAuditOverride("https://" + domain, 'sk').score);
  noSlavicCopy(en);
  noSlavicCopy(getDashboardPreviewCopy(en, 'https://' + domain, 'en'));
}
console.log('PASS: all locale route pairs, SEO alternates, safe returns, English validation, 392 proposal combinations, unchanged user input and all 11 audit presets with dashboard output.');
