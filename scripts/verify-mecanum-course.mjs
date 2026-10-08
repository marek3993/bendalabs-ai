/** Independent course regressions. Usage: node this-file.mjs [absolute Site root]
 * Reads source through TypeScript transpilation; writes no Site files and starts no browser/server.
 * Hook checks use a deterministic animation clock and minimal React hook adapter.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {pathToFileURL,fileURLToPath} from 'node:url';
const root=path.resolve(process.argv[2]??path.join(path.dirname(fileURLToPath(import.meta.url)),'../src/components/robotics-university'));
const requireSite=createRequire(pathToFileURL(path.join(root,'package.json'))),ts=requireSite('typescript'),cache=new Map();
let activeHooks;
const reactAdapter={
 useRef(value){return {current:value};},
 useState(value){const slot={value:typeof value==='function'?value():value};activeHooks.states.push(slot);return [slot.value,next=>{slot.value=typeof next==='function'?next(slot.value):next;}];},
 useCallback(fn){return fn;},
 useEffect(fn){activeHooks.effects.push(fn);},
};
function loadSource(file){
 const absolute=path.resolve(root,file);if(cache.has(absolute))return cache.get(absolute).exports;
 const module={exports:{}};cache.set(absolute,module);
 const source=fs.readFileSync(absolute,'utf8'),js=ts.transpileModule(source,{fileName:absolute,compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
 const localRequire=name=>name==='react'?reactAdapter:name.startsWith('@/')?loadSource(name.replace(/^@\/components\/robotics-university\//,'')+(path.extname(name)?'':'.ts')):name.startsWith('.')?loadSource(path.resolve(path.dirname(absolute),name+(path.extname(name)?'':'.ts'))):requireSite(name);
 new Function('require','module','exports',js)(localRequire,module,module.exports);return module.exports;
}
const m=loadSource('lib/mecanum.ts'),c=loadSource('lib/course-experiments.ts'),p=loadSource('lib/course-progress.ts'),{useMecanumRun}=loadSource('components/use-mecanum-run.ts');
const failures=[];let passed=0;
function test(name,fn){try{fn();passed++;console.log('PASS '+name);}catch(error){failures.push({name,message:error.message});console.error('FAIL '+name+': '+error.message);}}
const close=(actual,expected,epsilon=1e-7)=>assert.ok(Number.isFinite(actual)&&Math.abs(actual-expected)<=epsilon,`${actual} != ${expected} (tolerance ${epsilon})`);
const move=(direction,value,timed=false)=>({type:'move',direction,value,timed});
const program=(steps,distance=100,maneuver=[])=>({steps,distance,maneuver});
const world=(start={x:1,y:1,yaw:0},walls=[])=>({width:6,height:4,start,bay:{x:4,y:2,yaw:0,width:.8,length:.85},walls});
function runPure(prog,w=world(),speed=.4,dt=.01){let pose={...w.start},plan=m.newPlan(m.compileProgram(prog,speed)),elapsed=0;for(let i=0;i<20000;i++){const step=m.stepPlan(pose,plan,dt,w);pose=step.pose;plan=step.plan;elapsed+=dt;if(step.done)return {pose,collision:step.collision,elapsed,velocity:step.velocity};}throw Error('Program did not terminate');}
function withRun(trial,work,options){
 const keys=['window','document','performance','requestAnimationFrame','cancelAnimationFrame'],original=new Map(keys.map(key=>[key,Object.getOwnPropertyDescriptor(globalThis,key)]));
 let now=0,nextFrame=0;const frames=new Map(),window=new EventTarget(),document=new EventTarget();document.hidden=false;
 const values={window,document,performance:{now:()=>now},requestAnimationFrame:fn=>{frames.set(++nextFrame,fn);return nextFrame;},cancelAnimationFrame:id=>frames.delete(id)};
 for(const key of keys)Object.defineProperty(globalThis,key,{configurable:true,writable:true,value:values[key]});
 const hooks={states:[],effects:[]};activeHooks=hooks;let cleanups=[];
 try{const api=useMecanumRun(trial,options);cleanups=hooks.effects.map(fn=>fn()).filter(Boolean);const harness={api,get run(){return hooks.states[0].value;},get error(){return hooks.states[1].value;},advance(seconds){const count=Math.round(seconds/.01);for(let i=0;i<count;i++){now+=10;const callbacks=[...frames.values()];frames.clear();callbacks.forEach(fn=>fn(now));}},blur(){window.dispatchEvent(new Event('blur'));},hide(){document.hidden=true;document.dispatchEvent(new Event('visibilitychange'));}};return work(harness);}
 finally{cleanups.forEach(fn=>fn());for(const key of keys){const descriptor=original.get(key);if(descriptor)Object.defineProperty(globalThis,key,descriptor);else delete globalThis[key];}activeHooks=undefined;}
}
const assess=(id,trial,prog,run)=>c.assessCourse(id,run.pose,trial,prog,run.evidence,run.running);
const solvedPrograms={
 'sideways-parking':program([move('right',250),move('forward',100)]),
 'robot-frame':program([move('forward',220),{type:'turn',value:-90},move('forward',150)]),
 'manual-sequence':program([move('forward',100),move('right',150)]),
 'command-parameters':program([move('forward',150),move('right',150)]),
 'time-distance':program([move('forward',250),move('left',150)]),
 variables:program([move('forward','d'),move('left','d')],150),
 loops:program([{type:'repeat',count:4,body:[move('forward',100),move('left',60)]}]),
 functions:program([{type:'call'},move('forward',300),{type:'call'}],100,[move('left',120),{type:'wait',value:1},move('right',120)]),
};

// Independent physical expectations, not snapshots of implementation output.
test('Wheel logical signs distinguish translation, strafe, yaw and diagonal',()=>{
 for(const [v,expected] of [[{vx:1,vy:0,omega:0},[1,1,1,1]],[{vx:0,vy:1,omega:0},[-1,1,1,-1]],[{vx:0,vy:0,omega:1},[-1,1,-1,1]],[{vx:1,vy:1,omega:0},[0,1,1,0]]]){const w=m.wheelSpeeds(v);assert.deepEqual(['fl','fr','rl','rr'].map(id=>Math.sign(w[id])),expected);}
});
test('Kinematics recover mixed body velocities from all four wheels',()=>{for(const v of [{vx:.2,vy:-.3,omega:.7},{vx:-.4,vy:.1,omega:-.6},{vx:0,vy:0,omega:0}]){const actual=m.bodyVelocity(m.wheelSpeeds(v));for(const key of ['vx','vy','omega'])close(actual[key],v[key]);}});
test('Wheel limit preserves combined travel/turn ratio',()=>{const command={vx:.8,vy:.5,omega:1.3},raw=m.wheelSpeeds(command),limited=m.limitWheels(raw,7),actual=m.bodyVelocity(limited);close(Math.max(...Object.values(limited).map(Math.abs)),7);const ratio=actual.vx/command.vx;assert.ok(ratio>0&&ratio<1);close(actual.vy/command.vy,ratio);close(actual.omega/command.omega,ratio);});
test('At 90 degrees forward is world +Y and body-left is world -X',()=>{const pose={x:3,y:2,yaw:Math.PI/2},forward=m.integrate(pose,{vx:.4,vy:0,omega:0},1),left=m.integrate(pose,{vx:0,vy:.4,omega:0},1);close(forward.x,3);close(forward.y,2.4);close(left.x,2.6);close(left.y,2);});
test('Mixed translation and rotation closes a full ideal circular path',()=>{for(const hz of [30,60,120]){let pose={x:3,y:2,yaw:0};const steps=hz*8,dt=8/steps;for(let i=0;i<steps;i++)pose=m.integrate(pose,{vx:.2,vy:.1,omega:Math.PI/4},dt);close(pose.x,3,2e-5);close(pose.y,2,2e-5);close(pose.yaw,0,2e-5);}});
test('Outer wheel footprint collides before body deck reaches wall',()=>{const w=world(undefined,[{x:1.25,y:.97,width:.02,height:.06}]);assert.equal(m.collides(w.start,w),true);assert.equal(m.collides({x:1,y:1,yaw:0},world(undefined,[{x:1.31,y:.97,width:.02,height:.06}])),false);});
test('Turning corner is checked against an obstacle',()=>{const w=world(undefined,[{x:1.35,y:.95,width:.08,height:.1}]);assert.equal(m.collides(w.start,w),false);const moved=m.moveSafely(w.start,{vx:0,vy:0,omega:Math.PI/2},1,w);assert.equal(moved.collision,true);assert.ok(moved.pose.yaw>0&&moved.pose.yaw<Math.PI/2);});
test('Long movement cannot tunnel through a 1 mm wall',()=>{const w=world(undefined,[{x:2,y:0,width:.001,height:4}]),moved=m.moveSafely(w.start,{vx:.6,vy:0,omega:0},8,w);assert.equal(moved.collision,true);assert.ok(moved.pose.x<=1.72+1e-7&&moved.pose.x>1.6);});
test('Map bounds include the full rover, not only its centre',()=>assert.equal(m.collides({x:.25,y:1,yaw:0},world()),true));
test('Parking rejects body protrusion and wrong heading',()=>{const bay=world().bay;assert.equal(m.parked({x:bay.x,y:bay.y,yaw:bay.yaw},bay),true);assert.equal(m.parked({x:bay.x+.2,y:bay.y,yaw:0},bay),false);assert.equal(m.parked({x:bay.x,y:bay.y,yaw:Math.PI/12},bay),false);});
test('Direct STOP cancels later commands',()=>{const result=runPure(program([move('forward',50),{type:'stop'},move('forward',50)]));close(result.pose.x,1.5);assert.deepEqual(result.velocity,{vx:0,vy:0,omega:0});});
test('STOP inside a repeated body cancels the complete queue',()=>{const result=runPure(program([{type:'repeat',count:3,body:[move('forward',20),{type:'stop'},move('left',20)]},move('forward',50)]));close(result.pose.x,1.2);close(result.pose.y,1);});
test('STOP inside a function cancels callers remaining commands',()=>{const result=runPure(program([{type:'call'},move('forward',50)],100,[move('left',20),{type:'stop'}]));close(result.pose.x,1);close(result.pose.y,1.2);});
test('Positive quarter-turn sends the next forward move left on the map',()=>{const result=runPure(program([{type:'turn',value:90},move('forward',40)]));close(result.pose.x,1);close(result.pose.y,1.4);close(result.pose.yaw,Math.PI/2);});
test('Timed motion doubles distance with doubled speed; distance motion does not',()=>{const timed=program([move('forward',2,true)]),distance=program([move('forward',100)]);close(runPure(timed,world(),.6).pose.x-1,2*(runPure(timed,world(),.3).pose.x-1));close(runPure(distance,world(),.3).pose.x,2);close(runPure(distance,world(),.6).pose.x,2);});
test('Excessive loops, recursive function and nonfinite parameters are rejected',()=>{assert.throws(()=>m.compileProgram(program([{type:'repeat',count:9,body:[move('forward',10)]}])));assert.throws(()=>m.compileProgram(program([{type:'call'}],100,[{type:'call'}])));assert.throws(()=>m.compileProgram(program([move('forward',Infinity)])));});

// Exercise actual run-hook evidence and assessment for all ten lessons.
for(const id of Object.keys(solvedPrograms))test('Independent solution passes: '+id,()=>{const trial=c.courseTrial(id,true),prog=solvedPrograms[id];withRun(trial,h=>{if(id==='manual-sequence'){assert.equal(h.api.start(prog,.4),true);h.advance(1.25);h.api.stop(true);assert.equal(h.run.evidence.stoppedProgram,true);}assert.equal(h.api.start(prog,.4),true);if(id==='time-distance'||id==='variables'){const comparisons=c.compareTrials(id,prog);assert.ok(comparisons.every(item=>item.passed));h.api.flag({twoSpeeds:true});}h.advance(60);assert.equal(h.run.running,false);assert.equal(assess(id,trial,prog,h.run),null);});});
const circuit=loadSource('lib/motor-circuit.ts');
const command=value=>({type:'command',value});
const applyCircuit=(s,actions,independent=true)=>actions.reduce((state,action)=>circuit.circuitStep(state,action,independent),s);
test('Guided motor experiment requires an actual forward command then STOP',()=>{const s=circuit.initialCircuit(false);assert.equal(applyCircuit(s,[command(0)],false).complete,false);assert.equal(applyCircuit(s,[command(1),command(0)],false).complete,true);});
test('Motor command without VM cannot drive or complete the experiment',()=>{const s=applyCircuit(circuit.initialCircuit(true),[{type:'ground'},command(1),command(-1),command(0)]);assert.equal(circuit.motorOutput(s),0);assert.equal(s.forward,false);assert.equal(s.complete,false);});
test('No common GND is an unknown output, not a guaranteed stopped motor',()=>{const s=applyCircuit(circuit.initialCircuit(true),[{type:'power'},command(1)]);assert.equal(circuit.motorOutput(s),null);assert.equal(s.forward,false);});
test('Connected circuit must run both directions and STOP before passing',()=>{let s=applyCircuit(circuit.initialCircuit(true),[{type:'power'},{type:'ground'},command(1),command(0)]);assert.equal(s.complete,false);s=applyCircuit(s,[command(-1),command(0)]);assert.equal(s.complete,true);assert.equal(s.power,true);});
test('A connection change clears evidence; changes during an active command are ignored',()=>{let s=applyCircuit(circuit.initialCircuit(true),[{type:'power'},{type:'ground'},command(1)]);assert.equal(circuit.circuitStep(s,{type:'power'},true),s);s=applyCircuit(s,[command(0),{type:'ground'}]);assert.equal(s.forward,false);assert.equal(s.ground,false);});
test('Range-input completion needs verified sensor cases, not just opening lesson',()=>{const trial=c.courseTrial('range-input',true);assert.notEqual(c.assessCourse('range-input',trial.world.start,trial,trial.program,c.emptyEvidence(),false),null);assert.equal(c.assessCourse('range-input',trial.world.start,trial,trial.program,{...c.emptyEvidence(),reactivePassed:true},false),null);});
test('Every initial scene is unsolved',()=>{for(const id of c.courseIds){const trial=c.courseTrial(id,true);assert.notEqual(c.assessCourse(id,trial.world.start,trial,trial.program,c.emptyEvidence(),false),null,id);}});
test('Reaching a bay during active motion cannot count completion',()=>{const id='sideways-parking',trial=c.courseTrial(id,true),e={...c.emptyEvidence(),travel:3.5,strafe:2.5};assert.equal(c.assessCourse(id,trial.world.bay,trial,solvedPrograms[id],e,true),'running');assert.equal(c.assessCourse(id,trial.world.bay,trial,solvedPrograms[id],e,false),null);});
test('Any collision invalidates an otherwise correct endpoint',()=>{for(const id of Object.keys(solvedPrograms)){const trial=c.courseTrial(id,true),e={...c.emptyEvidence(),collision:true,travel:10,strafe:4,forward:4,visited:9,stationDwell:[1,1],stoppedProgram:true,twoSpeeds:true};assert.equal(c.assessCourse(id,trial.world.bay,trial,solvedPrograms[id],e,false),'collision');}});
test('Sideways lesson cannot pass by ordinary forward/turn travel only',()=>{const trial=c.courseTrial('sideways-parking',true);assert.notEqual(c.assessCourse('sideways-parking',trial.world.bay,trial,solvedPrograms['sideways-parking'],{...c.emptyEvidence(),travel:4,forward:4,strafe:0},false),null);});
test('Docking at the right position but wrong heading is rejected',()=>{const trial=c.courseTrial('robot-frame',true),prog=program([move('forward',220),move('right',150)]);withRun(trial,h=>{h.api.start(prog,.4);h.advance(40);close(h.run.pose.x,trial.world.bay.x);close(h.run.pose.y,trial.world.bay.y);assert.notEqual(assess('robot-frame',trial,prog,h.run),null);});});
test('Completing a sequence without interrupting it does not satisfy STOP lesson',()=>{const id='manual-sequence',trial=c.courseTrial(id,true),prog=solvedPrograms[id];withRun(trial,h=>{h.api.start(prog,.4);h.advance(10);assert.equal(assess(id,trial,prog,h.run),'stop');});});
test('Manual STOP cannot be mistaken for interruption of a saved program',()=>{const trial=c.courseTrial('manual-sequence',true);withRun(trial,h=>{h.api.manual({vx:.4,vy:0,omega:0});for(let i=0;i<6;i++){h.api.refresh();h.advance(.2);}h.api.stop(true);assert.equal(h.run.evidence.stoppedMotor,true);assert.equal(h.run.evidence.stoppedProgram,false);});});
test('A short manual jog is not a saved-program STOP exercise',()=>{const trial=c.courseTrial('manual-sequence',true);withRun(trial,h=>{h.api.manual({vx:.4,vy:0,omega:0});for(let i=0;i<6;i++){h.api.refresh();h.advance(.2);}h.api.stop();h.api.jog({vx:.4,vy:0,omega:0});h.advance(.1);h.api.stop(true);assert.equal(h.run.evidence.stoppedProgram,false);});});
test('Command-parameter starter misses the independent target',()=>{const trial=c.courseTrial('command-parameters',true),result=runPure(trial.program,trial.world);assert.equal(m.parked(result.pose,trial.world.bay),false);});
test('Time-distance wrong-order starter fails instead of gifting success',()=>{const trial=c.courseTrial('time-distance',true);assert.ok(c.compareTrials('time-distance',trial.program).some(result=>!result.passed));});
test('Time-based route tuned for one speed fails the second speed',()=>{const prog=program([move('forward',2.5/.4,true),move('left',1.5/.4,true)]);assert.ok(c.compareTrials('time-distance',prog).some(result=>!result.passed));});
test('Variables require both references, and fixed distances fail changed-d test',()=>{const fixed=program([move('forward',150),move('left',150)],150),oneRef=program([move('forward','d'),move('left',150)],150);for(const prog of [fixed,oneRef])assert.ok(c.compareTrials('variables',prog).some(result=>!result.passed));assert.ok(c.compareTrials('variables',solvedPrograms.variables).every(result=>result.passed));});
test('Too few loop repetitions do not count as a solved route',()=>{const trial=c.courseTrial('loops',true);withRun(trial,h=>{h.api.start(trial.program,.4);h.advance(30);assert.notEqual(assess('loops',trial,trial.program,h.run),null);assert.ok(h.run.evidence.visited<trial.waypoints.length);});});
test('Visiting loop stations in reverse order does not satisfy ordered route',()=>{const trial=c.courseTrial('loops',true),prog=program([move('forward',200),move('forward',200),move('left',240),...Array.from({length:3},()=>[move('backward',100),move('right',60)]).flat(),move('forward',300),move('left',180),{type:'repeat',count:2,body:[{type:'wait',value:.1},{type:'wait',value:.1}]}]);withRun(trial,h=>{h.api.start(prog,.4);h.advance(80);assert.equal(m.parked(h.run.pose,trial.world.bay),true);assert.ok(h.run.evidence.visited<trial.waypoints.length);assert.notEqual(assess('loops',trial,prog,h.run),null);});});
test('Two function calls without station waits cannot count as service',()=>{const trial=c.courseTrial('functions',true),prog=structuredClone(solvedPrograms.functions);prog.maneuver=prog.maneuver.filter(op=>op.type!=='wait');withRun(trial,h=>{h.api.start(prog,.4);h.advance(40);assert.equal(m.parked(h.run.pose,trial.world.bay),true);assert.equal(h.run.evidence.visited,2);assert.notEqual(assess('functions',trial,prog,h.run),null);});});
test('Waiting twice at one station cannot replace servicing the other',()=>{const trial=c.courseTrial('functions',true),prog=program([{type:'call'},{type:'call'},move('forward',300)],100,structuredClone(solvedPrograms.functions.maneuver));withRun(trial,h=>{h.api.start(prog,.4);h.advance(50);assert.equal(m.parked(h.run.pose,trial.world.bay),true);assert.notEqual(assess('functions',trial,prog,h.run),null);});});

test('An unrelated wait loop cannot replace the requested repeated movement pattern',()=>{const trial=c.courseTrial('loops',true),prog=program([...Array.from({length:4},()=>[move('forward',100),move('left',60)]).flat(),{type:'repeat',count:2,body:[{type:'wait',value:.1},{type:'wait',value:.1}]}]);withRun(trial,h=>{h.api.start(prog,.4);h.advance(40);assert.equal(m.parked(h.run.pose,trial.world.bay),true);assert.equal(h.run.evidence.visited,4);assert.notEqual(assess('loops',trial,prog,h.run),null);});});
test('Two unrelated function calls cannot replace a reusable station-service maneuver',()=>{const trial=c.courseTrial('functions',true),service=solvedPrograms.functions.maneuver,prog=program([{type:'call'},...service,move('forward',300),...service,{type:'call'}],100,[{type:'wait',value:.1}]);withRun(trial,h=>{h.api.start(prog,.4);h.advance(50);assert.equal(m.parked(h.run.pose,trial.world.bay),true);assert.equal(h.run.evidence.visited,2);assert.ok(h.run.evidence.stationDwell.filter(n=>n>=.9).length>=2);assert.notEqual(assess('functions',trial,prog,h.run),null);});});

// Runtime cancellation and sensor boundaries.
test('Expired manual command stops and does not resume by itself',()=>withRun(c.courseTrial('sideways-parking',true),h=>{h.api.manual({vx:0,vy:-.3,omega:0});h.advance(.6);assert.equal(h.run.running,false);const stopped={...h.run.pose};h.advance(1);assert.deepEqual(h.run.pose,stopped);}));
test('Window blur cancels a queued program permanently until restart',()=>withRun(c.courseTrial('manual-sequence',true),h=>{h.api.start(solvedPrograms['manual-sequence'],.4);h.advance(.4);h.blur();const stopped={...h.run.pose};h.advance(2);assert.deepEqual(h.run.pose,stopped);assert.equal(h.run.running,false);}));
test('Hiding document cancels motion instead of continuing offscreen',()=>withRun(c.courseTrial('manual-sequence',true),h=>{h.api.start(solvedPrograms['manual-sequence'],.4);h.advance(.4);h.hide();const stopped={...h.run.pose};h.advance(2);assert.deepEqual(h.run.pose,stopped);assert.equal(h.run.running,false);}));
const goodPolicy={threshold:40,comparison:'above',invalid:'stop',sample:'once'};
test('Sensor rule independently handles 90 cm, 25 cm, exact 40 cm and invalid',()=>{for(const [reading,expected] of [[{state:'valid',metres:.9},.3],[{state:'valid',metres:.25},0],[{state:'valid',metres:.4},0],[{state:'invalid'},0]])close(c.policyCommand(reading,goodPolicy).vx,expected);});
test('Reversed comparison and permissive invalid policy fail required cases',()=>{assert.equal(c.policyCases({...goodPolicy,comparison:'below'}).every(test=>test.actual===test.expected),false);assert.equal(c.policyCases({...goodPolicy,invalid:'drive'}).every(test=>test.actual===test.expected),false);assert.equal(c.policyCases(goodPolicy).every(test=>test.actual===test.expected),true);});
test('Sensor distance starts at front face and rotates with heading',()=>{const forwardWorld=world(undefined,[{x:2.18,y:.5,width:.2,height:1}]),a=m.frontRange(forwardWorld.start,forwardWorld);assert.equal(a.state,'valid');close(a.metres,.9);const rotatedWorld=world({x:1,y:1,yaw:Math.PI/2},[{x:.5,y:2.18,width:1,height:.2}]),b=m.frontRange(rotatedWorld.start,rotatedWorld);assert.equal(b.state,'valid');close(b.metres,.9);});
test('Side obstacle is not falsely detected by the front-only beam',()=>{const w={...world(undefined,[{x:.8,y:1.5,width:.4,height:.1}]),width:10,height:10};assert.equal(m.frontRange(w.start,w).state,'clear');assert.equal(m.frontRange(w.start,w,true).state,'invalid');});

// Persistence is data-only; legacy data must not grant new-course mastery.
const draft={program:solvedPrograms.variables,independent:true,policy:goodPolicy,note:'Changed d and checked both routes.'};
test('Course parser preserves solved IDs and editable drafts without runtime execution',()=>{globalThis.__courseRegressionCanary=0;const saved={version:1,seen:['variables'],solved:['sideways-parking','variables'],last:'variables',drafts:{variables:{...draft,running:true,plan:{index:5},execute:'globalThis.__courseRegressionCanary=1'}}};const parsed=p.parseCourse(JSON.parse(JSON.stringify(saved)));assert.deepEqual(parsed.solved,['sideways-parking','variables']);assert.deepEqual(parsed.drafts.variables,draft);assert.equal(parsed.last,'variables');assert.equal(globalThis.__courseRegressionCanary,0);assert.equal('running' in parsed.drafts.variables,false);delete globalThis.__courseRegressionCanary;});
test('Unknown and duplicate lesson IDs are removed from progress',()=>{const parsed=p.parseCourse({seen:['variables','variables','unknown'],solved:['variables','unknown','variables'],last:'unknown',drafts:{unknown:draft}});assert.deepEqual(parsed.seen,['variables']);assert.deepEqual(parsed.solved,['variables']);assert.equal(parsed.last,'sideways-parking');assert.deepEqual(parsed.drafts,{});});
test('Legacy atlas/mission completion does not grant new-course completion',()=>{const parsed=p.parseCourse({completed:['loop','frames'],missions:['turn','repair'],demo:true,version:0});assert.deepEqual(parsed.solved,[]);assert.deepEqual(parsed.seen,[]);});
test('Malformed and executable-looking imported programs are rejected',()=>{for(const candidate of [null,42,'robot.forward(100)',{steps:'globalThis.test=1'},{steps:[{type:'move',direction:'forward',value:Infinity}],distance:100,maneuver:[]}]){const parsed=p.parseCourse({drafts:{variables:{...draft,program:candidate}}});assert.equal(parsed.drafts.variables,undefined);}});
test('Stored policy and note are bounded independently of imported JSON',()=>{const parsed=p.parseCourse({drafts:{variables:{...draft,note:'a'.repeat(2500),policy:{threshold:500,comparison:'unknown',invalid:'unknown',sample:'unknown'}}}});assert.equal(parsed.drafts.variables.note.length,2000);assert.equal(parsed.drafts.variables.policy.threshold,100);assert.equal(parsed.drafts.variables.policy.comparison,'above');});
test('Merging progress preserves solved union and existing local edits',()=>{const a=p.parseCourse({solved:['variables'],drafts:{variables:draft}}),b=p.parseCourse({solved:['loops'],drafts:{variables:{...draft,note:'older'},loops:{...draft,program:solvedPrograms.loops}}}),merged=p.mergeCourse(a,b);assert.deepEqual(new Set(merged.solved),new Set(['variables','loops']));assert.equal(merged.drafts.variables.note,draft.note);assert.ok(merged.drafts.loops);});
test('Empty editor drafts preserve independent stage and notes without being runnable',()=>{const parsed=p.parseCourse({drafts:{variables:{...draft,program:program([])}}});assert.ok(parsed.drafts.variables,'Blank user editor draft should survive reload');assert.deepEqual(parsed.drafts.variables.program.steps,[]);assert.throws(()=>m.compileProgram(parsed.drafts.variables.program));});
test('Imported guided and independent drafts survive alongside the active edited program',()=>{
 const active=program([move('forward','d'),move('left','d')],150),guided=program([move('forward',100),move('left',100)]),independent=program([move('forward','d'),move('left','d')],130);
 const imported=JSON.parse(JSON.stringify({drafts:{variables:{...draft,program:active,guidedProgram:guided,independentProgram:independent,guidedPolicy:{threshold:-10,comparison:'unexpected',invalid:'unexpected',sample:'unexpected'},independentPolicy:{threshold:900,comparison:'below',invalid:'stop',sample:'repeat'}}}}));
 const parsed=p.parseCourse(imported).drafts.variables;
 assert.deepEqual(parsed.program,active);assert.equal(parsed.independent,true);assert.deepEqual(parsed.guidedProgram,guided);assert.deepEqual(parsed.independentProgram,independent);assert.deepEqual(parsed.policy,goodPolicy);
 assert.deepEqual(parsed.guidedPolicy,{threshold:5,comparison:'above',invalid:'drive',sample:'once'});assert.deepEqual(parsed.independentPolicy,{threshold:100,comparison:'below',invalid:'stop',sample:'repeat'});
 parsed.guidedProgram.steps[0].value=75;assert.equal(parsed.program.distance,150);assert.equal(parsed.independentProgram.distance,130);assert.equal(imported.drafts.variables.guidedProgram.steps[0].value,100);
});
test('Invalid optional mode data does not discard a valid active draft or the other mode',()=>{
 const imported={drafts:{variables:{...draft,guidedProgram:'robot.forward(100)',independentProgram:program([]),guidedPolicy:{threshold:null,comparison:null,invalid:null,sample:null},independentPolicy:'execute something'}}};
 const parsed=p.parseCourse(imported).drafts.variables;assert.ok(parsed);assert.deepEqual(parsed.program,draft.program);assert.equal(parsed.guidedProgram,undefined);assert.deepEqual(parsed.independentProgram,program([]));assert.deepEqual(parsed.guidedPolicy,{threshold:20,comparison:'above',invalid:'drive',sample:'once'});assert.equal(parsed.independentPolicy,undefined);
});
test('Invalid instructions hidden after STOP or in an unused function cannot enter mode drafts',()=>{
 const imported={drafts:{functions:{...draft,guidedProgram:program([{type:'stop'},null]),independentProgram:program([move('forward',50)],100,[null])}}};
 const parsed=p.parseCourse(imported).drafts.functions;assert.ok(parsed,'Active draft must remain available');assert.deepEqual(parsed.program,draft.program);assert.equal(parsed.guidedProgram,undefined);assert.equal(parsed.independentProgram,undefined);
});
test('Valid rows after STOP and an unused function remain editable without executing',()=>{
 const source=program([move('forward',50),{type:'stop'},move('left',100)],100,[move('left',30),{type:'wait',value:1},move('right',30)]),cleaned=m.cleanProgram(source);
 assert.deepEqual(cleaned,source);assert.notEqual(cleaned.steps,source.steps);assert.notEqual(cleaned.maneuver,source.maneuver);const result=runPure(cleaned);close(result.pose.x,1.5);close(result.pose.y,1);
});
test('Repeated short accelerated runs always publish completion',()=>withRun(c.courseTrial('variables',true),h=>{const p=program([move('forward',1)]);for(let i=0;i<4;i++){h.api.start(p,.4);h.advance(.1);assert.equal(h.run.running,false);close(h.run.pose.x,1.01);}},{playback:6}));
for(const id of ['variables','loops','functions','robot-frame'])test('6x playback preserves physical result and evidence: '+id,()=>{
 const trial=c.courseTrial(id,true),prog=solvedPrograms[id];let normal,fast;
 withRun(trial,h=>{h.api.start(prog,.4);h.advance(60);normal=h.run;},{playback:1});
 withRun(trial,h=>{h.api.start(prog,.4);h.advance(10);fast=h.run;},{playback:6});
 assert.equal(fast.running,false);close(fast.pose.x,normal.pose.x);close(fast.pose.y,normal.pose.y);close(fast.pose.yaw,normal.pose.yaw);close(fast.elapsed,normal.elapsed,.015);assert.equal(assess(id,trial,prog,fast),null);
});
test('6x playback completes a 7.5s route in under 1.4s',()=>withRun(c.courseTrial('variables',true),h=>{h.api.start(solvedPrograms.variables,.4);h.advance(1.4);assert.equal(h.run.running,false);close(h.run.elapsed,7.5,.015);},{playback:6}));
test('STOP practice starts at 1x and later runs accelerate',()=>withRun(c.courseTrial('manual-sequence',true),h=>{h.api.start(solvedPrograms['manual-sequence'],.4);h.advance(.5);assert.equal(h.run.running,true);close(h.run.evidence.travel,.2,.02);h.api.stop(true);assert.equal(h.run.evidence.stoppedProgram,true);h.api.start(solvedPrograms['manual-sequence'],.4);h.advance(1.2);assert.equal(h.run.running,false);},{playback:6,stopPractice:true}));
test('Photographed variables attempt parks but gets variable-specific feedback',()=>{const trial=c.courseTrial('variables',true),prog=program([move('forward','d'),move('left',150),move('forward',50)],100);withRun(trial,h=>{h.api.start(prog,.4);h.advance(2);assert.equal(m.parked(h.run.pose,trial.world.bay),true);assert.equal(assess('variables',trial,prog,h.run),'variable');},{playback:6});});
test('Visible variable solution passes without hidden trial flags',()=>{const trial=c.courseTrial('variables',true);withRun(trial,h=>{h.api.start(solvedPrograms.variables,.4);h.advance(2);assert.equal(h.run.evidence.twoSpeeds,false);assert.equal(assess('variables',trial,solvedPrograms.variables,h.run),null);},{playback:6});});

for(const id of ['variables','loops','functions','robot-frame'])test('24x and instant preserve motion and completion: '+id,()=>{
 const trial=c.courseTrial(id,true),prog=solvedPrograms[id];let normal;
 withRun(trial,h=>{h.api.start(prog,.4);h.advance(60);normal=h.run;});
 for(const instant of [false,true])withRun(trial,h=>{h.api.start(prog,.4,instant);if(!instant)h.advance(4);assert.equal(h.run.running,false);close(h.run.pose.x,normal.pose.x);close(h.run.pose.y,normal.pose.y);close(h.run.pose.yaw,normal.pose.yaw);close(h.run.elapsed,normal.elapsed,.015);assert.equal(assess(id,trial,prog,h.run),null);assert.equal(h.run.evidence.visited,normal.evidence.visited);assert.ok(h.run.trail.length>1);},{playback:24});
});
test('24x finishes a 7.5s route within 0.33s',()=>withRun(c.courseTrial('variables',true),h=>{h.api.start(solvedPrograms.variables,.4);h.advance(.33);assert.equal(h.run.running,false);close(h.run.elapsed,7.5,.015);},{playback:24}));
test('Instant repeats always produce a new completion event',()=>withRun(c.courseTrial('variables',true),h=>{for(let i=1;i<=4;i++){h.api.start(solvedPrograms.variables,.4,true);assert.equal(h.run.running,false);assert.equal(h.run.ended,i);}}));
test('Instant collision stops at the same point and cannot pass',()=>{const trial=c.courseTrial('variables',true),prog=program([move('forward',300),move('forward',300)]);let normal;withRun(trial,h=>{h.api.start(prog,.4);h.advance(30);normal=h.run;});withRun(trial,h=>{h.api.start(prog,.4,true);assert.equal(h.run.evidence.collision,true);close(h.run.pose.x,normal.pose.x);close(h.run.pose.y,normal.pose.y);assert.equal(assess('variables',trial,prog,h.run),'collision');});});
test('Instant request cannot bypass STOP practice',()=>withRun(c.courseTrial('manual-sequence',true),h=>{h.api.start(solvedPrograms['manual-sequence'],.4,true);assert.equal(h.run.running,true);h.advance(.5);close(h.run.evidence.travel,.2,.02);h.api.stop(true);h.api.start(solvedPrograms['manual-sequence'],.4,true);assert.equal(h.run.running,false);assert.equal(assess('manual-sequence',c.courseTrial('manual-sequence',true),solvedPrograms['manual-sequence'],h.run),null);},{playback:24,stopPractice:true}));
test('Manual default travels 1.8m in one second, release stops',()=>withRun({...c.courseTrial('variables',true),world:world()},h=>{h.api.manual({vx:1.8,vy:0,omega:0});for(let i=0;i<10;i++){h.api.refresh();h.advance(.1);}h.api.stop();close(h.run.pose.x,2.8);const end={...h.run.pose};h.advance(.5);assert.deepEqual(h.run.pose,end);}));
test('Manual yaw completes a quarter turn in half a second',()=>withRun({...c.courseTrial('variables',true),world:world()},h=>{h.api.manual({vx:0,vy:0,omega:Math.PI});for(let i=0;i<5;i++){h.api.refresh();h.advance(.1);}h.api.stop();close(h.run.pose.yaw,Math.PI/2);}));
test('Fast manual movement still detects a thin obstacle',()=>withRun({...c.courseTrial('variables',true),world:world(undefined,[{x:2,y:0,width:.001,height:4}])},h=>{h.api.manual({vx:2.4,vy:0,omega:0});for(let i=0;i<5;i++){h.api.refresh();h.advance(.1);}assert.equal(h.run.evidence.collision,true);assert.ok(h.run.pose.x<1.73);}));
test('Faster jogs still move exactly 10cm and 15 degrees',()=>withRun({...c.courseTrial('variables',true),world:world()},h=>{h.api.jog({vx:1.8,vy:0,omega:0});h.advance(.1);close(h.run.pose.x,1.1);h.api.jog({vx:0,vy:0,omega:Math.PI});h.advance(.1);close(h.run.pose.yaw,Math.PI/12);}));

console.log(`\n${passed} passed, ${failures.length} failed`);
if(failures.length){console.log(JSON.stringify(failures,null,2));process.exitCode=1;}

