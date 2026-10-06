const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function load(file, globals) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText, {exports, process:{env:{NEXT_PUBLIC_OPENAI_ADS_PIXEL_ID:'test-pixel'}}, URL, Response, Set, ...globals});
  return exports;
}
const messages=[]; let receive; let frame;
const window={location:{origin:'https://example.com',href:'https://example.com/automatizacia?oppref=test-reference'},addEventListener(_, fn){receive=fn;}};
const document={createElement(tag){assert.equal(tag,'iframe'); return frame={contentWindow:{postMessage(m){messages.push(m);}}};},body:{appendChild(){}}};
const client=load('src/lib/analytics/openai-ads.ts',{window,document});
client.measureAutomationLead('no-consent'); assert.equal(frame,undefined);
client.setOpenAiAdsConsent(true); assert.equal(new URL(frame.src).searchParams.get('oppref'),'test-reference');
client.measureAutomationLead('saved-id'); client.measureAutomationLead('saved-id');
receive({origin:'https://foreign.test',source:frame.contentWindow,data:{kind:'pixel-ready'}}); assert.equal(messages.length,0);
receive({origin:window.location.origin,source:frame.contentWindow,data:{kind:'pixel-ready'}});
assert.deepEqual(JSON.parse(JSON.stringify(messages)),[{kind:'consent',granted:true},{kind:'lead',eventId:'saved-id'}]);
client.setOpenAiAdsConsent(false); client.measureAutomationLead('revoked'); assert.equal(messages.length,3);
(async()=>{
 const route=load('src/app/api/ads-pixel/route.ts',{}); const html=await route.GET().text();
 const calls=[]; let listener;
 const parent={postMessage(){}};
 const context={parent,location:{origin:window.location.origin},Set,document:{createElement(){return {};},head:{appendChild(){}}}};
 context.window=context; context.addEventListener=(_,fn)=>listener=fn;
 vm.runInNewContext(html.match(/<script>([\s\S]*?)<\/script>/)[1],context);
 const q=context.oaiq.q; assert.equal(q[0][0],'consent'); assert.equal(q[0][1],false);
 context.oaiq=(...args)=>calls.push(args);
 const send=data=>listener({source:parent,origin:window.location.origin,data});
 send({kind:'lead',eventId:'ignored'}); assert.equal(calls.length,0);
 send({kind:'consent',granted:true}); send({kind:'lead',eventId:'saved-id'}); send({kind:'lead',eventId:'saved-id'});
 send({kind:'consent',granted:false}); send({kind:'lead',eventId:'revoked'});
 assert.equal(calls.filter(c=>c[0]==='measure').length,1);
 assert.deepEqual(JSON.parse(JSON.stringify(calls[1])),['measure','lead_created',{type:'customer_action'},{event_id:'saved-id'}]);
 console.log('PASS: consent, queued readiness, duplicate prevention, origin checks, revocation and minimal SDK payload.');
})().catch(e=>{console.error(e);process.exitCode=1;});
