const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const resolve = Module._resolveFilename;
Module._resolveFilename = function (request, ...args) {
  return resolve.call(this, request.startsWith('@/') ? path.resolve(__dirname, '../src', request.slice(2)) : request, ...args);
};
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText, filename);

const proposal = require('../src/lib/bendalabs/ai-custom-proposal.ts');
const { getLeadFormCopy } = require('../src/lib/bendalabs/lead-form-content.ts');
const { contactReturnPath } = require('../src/lib/bendalabs/contact-return.ts');
assert.deepEqual(proposal.businessTypeOptions.map(x=>x.value), ['real_estate','finance','clinic','marketplace','recruitment','b2b_services','ecommerce','other']);
assert.deepEqual(proposal.mainGoalOptions.map(x=>x.value), ['choose_right_offer','better_leads','simplify_contact','discover_intent','reduce_unclear_questions','increase_existing_traffic_value','other']);
assert.deepEqual(proposal.visitorNextStepOptions.map(x=>x.value), ['send_inquiry','book_appointment','choose_service','find_offer','contact_right_person','fill_form','other']);
assert.deepEqual(proposal.dashboardDataOptions.map(x=>x.value), ['top_questions','interest_types','contact_reasons','unfinished_inquiries','lead_quality','timing_or_urgency','customer_segments','other']);
const input = {website:'example.com',businessType:'b2b_services',mainGoal:'better_leads',visitorNextStep:'send_inquiry',dashboardData:['top_questions'],opportunityText:'Dopyty potrebujú podrobnosti.',successMetric:'Preserve my own wording: ma, data, co, URL https://example.com/navrh.',name:'Lokálny test',email:'LOCAL@example.com',phone:'',company:''};
const parsed = proposal.parseAiCustomProposalSubmission(input);
assert.equal(parsed.success,true);
assert.equal(parsed.data.email,'local@example.com');
assert.equal(parsed.data.website,'https://example.com/');
const rec = proposal.generateAiCustomProposalRecommendation(parsed.data);
assert.equal(rec.recommendedLayerTitle,'AI vrstva pre lepšie pripravené dopyty');
assert.ok(rec.nextStep.endsWith(input.successMetric),'User-authored content must remain unchanged by display copy fixes');
assert.equal(proposal.parseAiCustomProposalSubmission({...input,businessType:'B2B služby / poradenstvo'}).success,false);
assert.equal(getLeadFormCopy('sk').validation.invalid_message,'Správa musí mať aspoň 10 znakov.');
assert.equal(getLeadFormCopy('cs').validation.invalid_message,'Zpráva musí mít alespoň 10 znaků.');
assert.equal(contactReturnPath('/robotics#kontakt','sk'),'/robotics#kontakt');
assert.equal(contactReturnPath('/cs/labs#kontakt','cs'),'/cs/labs#kontakt');
for (const page of ['/ai-audit-webu','/ai-vrstva-pre-financne-a-poistne-weby','/ai-vrstva-pre-marketplace-a-rental-weby','/cs/ai-audit-webu','/cs/ai-vrstva-pro-financni-a-pojistne-weby','/cs/ai-vrstva-pro-marketplace-a-rental-weby']) {
  const locale = page.startsWith('/cs/') ? 'cs' : 'sk';
  assert.equal(contactReturnPath(`${page}#kontakt`,locale),`${page}#kontakt`);
}
for (const unsafe of ['//example.com','/\\example.com','/%2f%2fexample.com','/api/audit#kontakt','/robotics#kontakt#x',undefined,['/labs#kontakt']]) assert.equal(contactReturnPath(unsafe,'sk'),'/#kontakt');
assert.equal(contactReturnPath('/cs/labs#kontakt','sk'),'/#kontakt');
assert.equal(contactReturnPath('/labs#kontakt','cs'),'/cs#kontakt');
console.log('PASS: submitted enum contracts, normalization, untouched user text, SK/CS validation and safe locale-preserving contact returns.');
