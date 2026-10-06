/** Independent, read-only regression checks. Run with Node; no build or source writes. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {pathToFileURL,fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../src/components/robotics-university');
const requireSite = createRequire(pathToFileURL(path.join(root, 'package.json')));
const ts = requireSite('typescript');
const cache = new Map();
function loadSource(file) {
  const absolute = path.resolve(file);
  if (cache.has(absolute)) return cache.get(absolute).exports;
  const module = {exports: {}};
  cache.set(absolute, module);
  const text = fs.readFileSync(absolute, 'utf8');
  const js = ts.transpileModule(text, {compilerOptions: {
    target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS,
  }, fileName: absolute}).outputText;
  const localRequire = name => name.startsWith('.')
    ? loadSource(path.resolve(path.dirname(absolute), name + (path.extname(name) ? '' : '.ts')))
    : requireSite(name);
  new Function('require', 'module', 'exports', js)(localRequire, module, module.exports);
  return module.exports;
}
const sim = loadSource(path.join(root, 'lib/simulations.ts'));
const {roverMissions, assessMission} = loadSource(path.join(root, 'lib/rover-missions.ts'));
const {challenges, evaluateChallenge} = loadSource(path.join(root, 'lib/challenges.ts'));
const {parseJourney, mergeJourney} = loadSource(path.join(root, 'lib/journey.ts'));
let passed = 0;
const failures = [];
function test(name, work) {
  try {work(); passed++; console.log('PASS ' + name);}
  catch (error) {failures.push({name, message: error.message}); console.error('FAIL ' + name + ': ' + error.message);}
}
const close = (actual, expected, epsilon = 1e-9) => assert.ok(Math.abs(actual - expected) <= epsilon, `${actual} != ${expected}`);
const commands = pairs => pairs.map(([type, value]) => ({type, value}));
// Only trusted fixture/source starters are executed, never user-submitted code.
const collect = code => {
  const list = [];
  const robot = Object.fromEntries(['forward', 'turn', 'wait'].map(type => [type, value => list.push({type, value})]));
  new Function('robot', code)(robot);
  return list;
};
const base = commands([['forward',130],['turn',-90],['forward',180],['turn',90],['forward',300]]);
const slalom = commands([['turn',90],['forward',190],['turn',-90],['forward',240],['turn',-90],['forward',170],['turn',90],['forward',190],['turn',90],['forward',160]]);

// Independent continuous swept-segment/AABB oracle (not the source's 3 cm samples).
function intersectsSegment(a, b, rectangle) {
  let lo = 0, hi = 1;
  for (const axis of ['x', 'y']) {
    const delta = b[axis] - a[axis];
    const start = rectangle[axis] - 22;
    const end = rectangle[axis] + rectangle[axis === 'x' ? 'w' : 'h'] + 22;
    if (Math.abs(delta) < 1e-10) {if (a[axis] <= start || a[axis] >= end) return false;}
    else {const p = (start - a[axis]) / delta, q = (end - a[axis]) / delta;
      lo = Math.max(lo, Math.min(p, q)); hi = Math.min(hi, Math.max(p, q));}
  }
  return lo < hi;
}
function oracleRoute(list, arena) {
  let p = {...arena.start};
  for (const c of list) {
    if (c.type === 'turn') p.angle += c.value;
    if (c.type !== 'forward') continue;
    const next = {...p, x:p.x + c.value * Math.cos(p.angle * Math.PI/180), y:p.y + c.value * Math.sin(p.angle * Math.PI/180)};
    assert.ok(next.x >= 22 && next.x <= 578 && next.y >= 22 && next.y <= 358, 'continuous route left map bounds');
    assert.ok(!arena.obstacles.some(o => intersectsSegment(p, next, o)), 'continuous route intersects obstacle clearance');
    p = next;
  }
  return p;
}

test('five distinct missions; demo followed by four assessed tasks', () => {
  assert.deepEqual(roverMissions.map(m => m.id), ['demo','turn','repair','slalom','efficient']);
});
test('demo starter succeeds, but is not an assessed mission ID', () => {
  assert.equal(assessMission(0, collect(roverMissions[0].starter)).passed, true);
  assert.deepEqual(parseJourney({missions:['demo'],demo:true}).missions, []);
});
for (let i = 1; i < roverMissions.length; i++) {
  const m = roverMissions[i];
  test(`mission ${m.id}: starter fails assessment`, () => {
    const starter = collect(m.starter);
    assert.equal(sim.validateCommands(starter), true);
    assert.equal(assessMission(i, starter).passed, false);
  });
  test(`mission ${m.id}: independent solution is clear and succeeds`, () => {
    const fixture = i < 3 ? base : slalom;
    const endpoint = oracleRoute(fixture, m.arena);
    close(endpoint.x, m.arena.goal.x); close(endpoint.y, m.arena.goal.y);
    const r = assessMission(i, fixture), last = r.points.at(-1);
    assert.equal(r.passed, true); assert.equal(r.collision, false);
    close(last.x, endpoint.x); close(last.y, endpoint.y);
    assert.equal(r.count, fixture.length);
  });
  test(`mission ${m.id}: empty route cannot pass`, () => assert.equal(assessMission(i, []).passed, false));
}
test('efficient starter reaches target but fails command budget', () => {
  const r = assessMission(4, collect(roverMissions[4].starter));
  assert.equal(r.reached, true); assert.equal(r.collision, false); assert.equal(r.count, 16); assert.equal(r.passed, false);
});
test('a loop does not hide executed actions from the 10-command budget', () => {
  const list = collect('for(let i=0;i<7;i++) robot.wait(0);\n' + slalom.map(c => `robot.${c.type}(${c.value});`).join('\n'));
  assert.equal(list.length, 17); assert.equal(sim.validateCommands(list), true);
  const r = assessMission(4, list);
  assert.equal(r.reached, true); assert.equal(r.collision, false); assert.equal(r.passed, false);
});
test('one extra zero-duration wait still exceeds an exact 10-action solution', () => {
  const r = assessMission(4, [...slalom,{type:'wait',value:0}]);
  assert.equal(r.reached, true); assert.equal(r.count, 11); assert.equal(r.passed, false);
});
test('long movement cannot tunnel through an obstacle', () => {
  const r = sim.robotRoute([{type:'forward',value:1000}]);
  assert.equal(r.collision, true); assert.equal(r.reached, false);
  assert.ok(r.points.at(-1).x <= 368); assert.ok(r.points.at(-1).x > 365);
});
test('reverse movement stops inside the map border', () => {
  const r = sim.robotRoute([{type:'forward',value:-100}]);
  assert.equal(r.collision, true); assert.ok(r.points.at(-1).x >= 22);
});
test('first slalom obstacle blocks the direct initial route', () => {
  assert.throws(() => oracleRoute([{type:'forward',value:100}], roverMissions[3].arena));
  assert.equal(assessMission(3,[{type:'forward',value:100}]).collision, true);
});
test('goal reached earlier then abandoned is not a success', () => {
  const r = assessMission(1,[...base,{type:'forward',value:50}]);
  assert.equal(r.collision, false); assert.equal(r.reached, false); assert.equal(r.passed, false);
});
test('collision after reaching the goal invalidates the run', () => {
  const r = assessMission(1,[...base,{type:'forward',value:100}]);
  assert.equal(r.collision, true); assert.equal(r.passed, false);
});
test('command validator rejects invalid, nonfinite and excessive streams', () => {
  for (const input of [null, {}, [{type:'teleport',value:2}], [{type:'forward',value:'2'}], [{type:'wait',value:-1}], [{type:'turn',value:NaN}], [{type:'forward',value:Infinity}], [{type:'forward',value:1001}], Array.from({length:1001},()=>({type:'turn',value:0})), Array.from({length:18},()=>({type:'forward',value:1000}))]) assert.equal(sim.validateCommands(input), false);
  assert.equal(sim.validateCommands(base), true);
});

const solutions = {
  pid:{p:4,i:0,d:3}, lidar:{x:120,y:325}, power:{ah:3.4,computer:6},
  motors:{ratio:15},
};
test('four parameter challenges have independent fixtures', () => assert.deepEqual(Object.keys(challenges).sort(), Object.keys(solutions).sort()));
for (const [id, def] of Object.entries(challenges)) {
  test(`${id}: initial values do not pass`, () => assert.equal(evaluateChallenge(id,Object.fromEntries(def.controls.map(c=>[c.id,c.initial]))).passed,false));
  test(`${id}: independently calculated valid solution passes`, () => assert.equal(evaluateChallenge(id,solutions[id]).passed,true));
  test(`${id}: missing required controls fail without throwing`, () => {
    assert.equal(evaluateChallenge(id,{}).passed,false);
    for (const c of def.controls) {const v={...solutions[id]}; delete v[c.id]; assert.equal(evaluateChallenge(id,v).passed,false);}
  });
  test(`${id}: nonfinite controls fail`, () => {
    for (const c of def.controls) for (const value of [NaN,Infinity,-Infinity]) assert.equal(evaluateChallenge(id,{...solutions[id],[c.id]:value}).passed,false);
  });
  test(`${id}: controls outside declared bounds fail without throwing`, () => {
    for (const c of def.controls) for (const value of [c.min-c.step,c.max+c.step]) assert.equal(evaluateChallenge(id,{...solutions[id],[c.id]:value}).passed,false,`${c.id}=${value}`);
  });
}
test('PID zero gains cannot exploit zero overshoot', () => {
  assert.equal(evaluateChallenge('pid',{p:0,i:0,d:0}).passed,false);
  const data=sim.simulatePID(0,0,0,1); assert.ok(data.every(p=>p.value===0));
});
test('PID low-gain slow response fails settled-error requirement', () => assert.equal(evaluateChallenge('pid',{p:.1,i:0,d:12}).passed,false));
test('PID valid gains satisfy full-resolution criteria and actuator limits', () => {
  const data=sim.simulatePID(4,0,3,1);
  assert.equal(data.length,801); close(data.at(-1).t,8);
  assert.ok(Math.max(...data.map(p=>p.value)) < 1.05);
  assert.ok(data.filter(p=>p.t>=6).every(p=>Math.abs(p.value-1)<=.02));
  assert.ok(data.every(p=>Math.abs(p.control)<=10));
});
test('LiDAR range alone cannot see through occluder; new viewpoint gives nine B rays', () => {
  assert.equal(sim.lidarScan(120,185,1000,0,180).filter(p=>p.object===5).length,0);
  assert.equal(sim.lidarScan(120,325,400,0,180).filter(p=>p.object===5).length,9);
});
test('LiDAR cannot pass by placing the sensor inside obstacle B', () => assert.equal(evaluateChallenge('lidar',{x:400,y:270}).passed,false));
test('power solution has 60.384 minutes, not nominal-energy runtime', () => {
  const r=sim.batteryEstimate(11.1,3.4,27,90,20);
  close(r.hours*60,60.384); close(r.current,27/(11.1*.9));
  assert.equal(evaluateChallenge('power',{ah:4,computer:6}).passed,false);
  assert.equal(evaluateChallenge('power',{ah:3.4,computer:0}).passed,false);
});
test('tilted drone solution balances vertical thrust but retains lateral acceleration', () => {
  const throttle=Math.sqrt((1.4*9.81)/(20*Math.cos(Math.PI/6)))*100;
  close(throttle,89.04677757813766);
  const r=sim.droneEstimate(1.4,5,throttle,30);
  close(r.acceleration,0); close(r.horizontalAcceleration,9.81*Math.tan(Math.PI/6));
});
test('motor design must satisfy both torque and output-speed requirements', () => {
  const r=sim.motorSizing(.5,.2,.2,15,80,3000);
  close(r.motorTorque,.0981); close(r.outputRpm,200);
  assert.equal(evaluateChallenge('motors',{ratio:14}).passed,false);
  assert.equal(evaluateChallenge('motors',{ratio:20}).passed,true);
  assert.equal(evaluateChallenge('motors',{ratio:21}).passed,false);
  assert.equal(evaluateChallenge('motors',{ratio:0}).passed,false);
});
test('progress separates demo, deduplicates mastery, and rejects unknown entries', () => {
  assert.deepEqual(parseJourney({missions:['demo','turn','turn','unknown',null],challenges:['pid','pid','unknown'],demo:1}),{missions:['turn'],challenges:['pid'],demo:false});
  assert.deepEqual(mergeJourney(parseJourney({missions:['turn'],demo:true}),parseJourney({missions:['turn','slalom'],challenges:['lidar']})),{missions:['turn','slalom'],challenges:['lidar'],demo:true});
});

const flight = loadSource(path.join(root, 'lib/drone-landing.ts'));
test('landing: hover remains airborne for both masses and does not earn a landing',()=>{
  for(const mass of [1,1.4]){
    let s={...flight.createFlight(mass),phase:'flying'};
    for(let i=0;i<600;i++)s=flight.advanceFlight(s,flight.balanceThrottle(mass),mass,1/60);
    close(s.height,6,1e-8);close(s.velocity,0,1e-8);assert.equal(s.phase,'flying');
  }
});
test('landing: zero thrust follows analytical free fall',()=>{
  let s={...flight.createFlight(1),phase:'flying',thrust:0};
  for(let i=0;i<120;i++)s=flight.advanceFlight(s,0,1,1/120);
  close(s.height,6-9.81/2,1e-8);close(s.velocity,-9.81,1e-8);
});
test('landing: braking reduces descent speed without teleporting or reversing immediately',()=>{
  const s={...flight.createFlight(1),phase:'flying',velocity:-2};
  const r=flight.advanceFlight(s,90,1,.1);
  assert.ok(r.velocity>-2&&r.velocity<0);assert.ok(r.height<s.height);assert.ok(r.thrust>s.thrust&&r.thrust<16.2);
});
test('landing: first-contact speed determines success including the threshold',()=>{
  for(const [velocity,phase] of [[-.4,'landed'],[-.8,'landed'],[-.801,'hard'],[-3,'hard']]){
    const s={...flight.createFlight(1),phase:'flying',height:.001,velocity};
    const r=flight.advanceFlight(s,flight.balanceThrottle(1),1,.02);
    assert.equal(r.phase,phase);close(r.impact,Math.abs(velocity),1e-8);assert.equal(r.height,0);assert.equal(r.velocity,0);
    assert.strictEqual(flight.advanceFlight(r,100,1,.1),r);
  }
});
test('landing: independently calculated feedback controller lands both payloads',()=>{
  for(const mass of [1,1.4]){
    let s={...flight.createFlight(mass),phase:'flying'};
    for(let i=0;i<3600&&s.phase==='flying';i++){
      const target=-Math.min(1.5,.45+s.height*.5);
      const acceleration=2*(target-s.velocity);
      const u=100*Math.sqrt(Math.max(0,mass*(9.81+acceleration)/20));
      s=flight.advanceFlight(s,u,mass,1/60);
    }
    assert.equal(s.phase,'landed');assert.ok(s.impact<=flight.landingLimit&&s.impact>0);
  }
});
test('landing: render step size does not change the trajectory',()=>{
  const run=dt=>{let s={...flight.createFlight(1.4),phase:'flying'};for(let i=0;i<Math.round(2/dt);i++)s=flight.advanceFlight(s,80,1.4,dt);return s;};
  const a=run(1/60),b=run(1/30);close(a.height,b.height,1e-8);close(a.velocity,b.velocity,1e-8);
});
test('landing: ready, paused and invalid frames cannot advance flight',()=>{
  const initial=flight.createFlight(1);
  assert.strictEqual(flight.advanceFlight(initial,0,1,.1),initial);
  const paused={...initial,phase:'paused'};
  assert.strictEqual(flight.advanceFlight(paused,0,1,.1),paused);
  for(const args of [[NaN,1,.1],[70,0,.1],[70,1,NaN],[70,1,-1]]){const s={...initial,phase:'flying'};assert.strictEqual(flight.advanceFlight(s,...args),s);}
  assert.deepEqual(flight.createFlight(1),initial);
});
test('landing: ceiling and time limits produce failure, never success',()=>{
  const initial={...flight.createFlight(1),phase:'flying'};
  assert.equal(flight.advanceFlight({...initial,height:11.999,velocity:1},flight.balanceThrottle(1),1,.02).phase,'ceiling');
  assert.equal(flight.advanceFlight({...initial,elapsed:59.99},flight.balanceThrottle(1),1,.02).phase,'timeout');
});

const arm=loadSource(path.join(root,'lib/arm-transfer.ts'));
const THREE=requireSite('three');
test('arm transfer: tool calculation matches nested 3D transformations, including yaw and wrist',()=>{
 for(const pose of [{yaw:-35,shoulder:65,elbow:-100},{yaw:35,shoulder:42,elbow:-60},{yaw:0,shoulder:90,elbow:-80},{yaw:65,shoulder:115,elbow:-35}]){
  const base=new THREE.Group(),shoulder=new THREE.Group(),elbow=new THREE.Group(),wrist=new THREE.Group();base.rotation.y=pose.yaw*Math.PI/180;shoulder.position.y=.95;shoulder.rotation.z=(pose.shoulder-90)*Math.PI/180;elbow.position.y=1.54;elbow.rotation.z=pose.elbow*Math.PI/180;wrist.position.y=1.28;wrist.rotation.z=-Math.PI-shoulder.rotation.z-elbow.rotation.z;base.add(shoulder);shoulder.add(elbow);elbow.add(wrist);base.updateMatrixWorld(true);
  const actual=wrist.localToWorld(new THREE.Vector3(0,.92,0)),calculated=arm.armTool(pose);for(const key of ['x','y','z'])close(actual[key],calculated[key]);
  const down=new THREE.Vector3(0,1,0).transformDirection(wrist.matrixWorld);close(down.x,0);close(down.y,-1);close(down.z,0);
 }
});
test('arm transfer: initial pose cannot grip or place remotely',()=>{assert.equal(arm.armStepReady(0,arm.initialArmPose),false);assert.equal(arm.armStepReady(2,arm.initialArmPose),false);});
test('arm transfer: pickup and placement are different reachable poses',()=>{
 const a={yaw:-35,shoulder:65,elbow:-100},b={yaw:35,shoulder:42,elbow:-60};
 assert.ok(arm.validArmPose(a)&&arm.validArmPose(b));assert.equal(arm.armStepReady(0,a),true);assert.equal(arm.armStepReady(2,b),true);assert.equal(arm.armStepReady(2,a),false);assert.equal(arm.armStepReady(0,b),false);
});
test('arm transfer: lift requires actual 15 cm rise before transfer',()=>{
 const pickup={yaw:-35,shoulder:65,elbow:-100};assert.equal(arm.armStepReady(1,pickup),false);assert.equal(arm.armStepReady(1,{yaw:-35,shoulder:90,elbow:-80}),true);close((arm.liftHeight-arm.pickupPoint.y)*arm.armScale,15);
});
test('arm transfer: out-of-range and invalid numeric inputs never pass',()=>{
 for(const pose of [{yaw:Infinity,shoulder:65,elbow:-100},{yaw:NaN,shoulder:65,elbow:-100},{yaw:360,shoulder:65,elbow:-100},{yaw:0,shoulder:0,elbow:-100},{yaw:0,shoulder:65,elbow:0},{yaw:0,shoulder:20,elbow:-130}])for(const stage of [0,1,2])assert.equal(arm.armStepReady(stage,pose),false);
});
test('arm transfer: tolerance is 2 cm in 3D and includes yaw error',()=>{
 close(arm.armTolerance*arm.armScale,2);assert.equal(arm.armStepReady(0,{yaw:-33,shoulder:65,elbow:-100}),true);assert.equal(arm.armStepReady(0,{yaw:-25,shoulder:65,elbow:-100}),false);assert.equal(arm.armStepReady(3,{yaw:35,shoulder:42,elbow:-60}),false);
});
console.log(`\n${passed} passed; ${failures.length} failed. Source was read from ${root}.`);
if(failures.length){console.error(JSON.stringify(failures,null,2));process.exitCode=1;}
