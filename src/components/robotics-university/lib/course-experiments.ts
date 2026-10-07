import {radians,parked,countOps,hasVariable,compileProgram,newPlan,stepPlan,type World,type Pose,type Program,type Op,type Reading,type Velocity,zeroVelocity} from './mecanum';
export const courseIds=['sideways-parking','robot-components','robot-frame','manual-sequence','command-parameters','time-distance','variables','loops','functions','range-input'] as const;
export type CourseId=typeof courseIds[number];
export const mainCourseIds=courseIds;
export type Trial={world:World;waypoints:Pose[];program:Program};
const move=(direction:'forward'|'backward'|'left'|'right',value:number|'d',timed=false):Op=>({type:'move',direction,value,timed});
export function courseTrial(id:CourseId,independent:boolean):Trial {
 const world:World={width:6,height:4,start:{x:1,y:1,yaw:Math.PI/2},bay:{x:3,y:1,yaw:Math.PI/2,length:.85,width:.8},walls:[]};
 let steps:Op[]=[move('forward',100),move('right',100)],distance=100,maneuver:Op[]=[];const waypoints:Pose[]=[];
 if(id==='sideways-parking'){
  world.bay={...world.bay,x:independent?3.5:3,y:independent?2:1};world.walls=[{x:.6,y:2,width:.8,height:.5},{x:4.3,y:.4,width:.6,height:2.4}];steps=[move('right',200)];
 }else if(id==='robot-frame'){
  world.start={x:4.7,y:1,yaw:independent?Math.PI:Math.PI/2};world.bay={...world.bay,x:2.5,y:independent?2.5:1,yaw:independent?Math.PI/2:Math.PI};
  if(independent)waypoints.push({x:2.5,y:1,yaw:Math.PI});steps=[];
 }else if(id==='manual-sequence'){
  world.bay={...world.bay,x:independent?2.5:2,y:2};steps=[move('forward',100),move('right',independent?150:100)];
 }else if(id==='command-parameters'){
  world.start={x:1,y:2.8,yaw:0};world.bay={...world.bay,x:2.5,y:independent?1.3:3.5,yaw:0};steps=[move('forward',150),move('left',50)];
 }else if(id==='time-distance'){
  world.start={x:1,y:1,yaw:0};world.bay={...world.bay,x:3.5,y:2.5,yaw:0};
  world.walls=independent?[{x:.65,y:1.5,width:1.95,height:.5}]:[];
  steps=independent?[move('left',150),move('forward',250)]:[move('forward',2,true)];
 }else if(id==='variables'){
  world.start={x:1,y:1,yaw:0};world.bay={...world.bay,x:independent?2.5:2,y:independent?2.5:2,yaw:0};steps=[move('forward',independent?100:'d'),move('left',independent?100:'d')];
 }else if(id==='loops'){
  world.start={x:.7,y:.7,yaw:0};world.bay={...world.bay,x:independent?4.7:3.7,y:independent?3.1:2.5,yaw:0};
  for(let i=1;i<=(independent?4:3);i++)waypoints.push({x:.7+i,y:.7+i*.6,yaw:0});
  steps=[{type:'repeat',count:independent?2:3,body:[move('forward',100),move('left',60)]}];
 }else if(id==='functions'){
  world.start={x:1,y:.8,yaw:0};world.bay={...world.bay,x:4,y:.8,yaw:0};
  waypoints.push({x:1,y:independent?2:1.6,yaw:0},{x:4,y:independent?2:1.6,yaw:0});
  maneuver=[move('left',80),{type:'wait',value:1},move('right',80)];steps=[{type:'call'},move('forward',300),{type:'call'}];
 }else if(id==='range-input'){
  world.start={x:1,y:2,yaw:0};world.bay={...world.bay,x:4.5,y:2,yaw:0};steps=[];
 }
 return {world,waypoints,program:{steps,distance,maneuver}};
}
export type Evidence={collision:boolean;travel:number;strafe:number;forward:number;turn:number;visited:number;loopVisited:number;stationDwell:number[];functionStationDwell:number[];functionReturns:boolean[];stoppedProgram:boolean;stoppedMotor:boolean;twoSpeeds:boolean;reactivePassed:boolean;connections:boolean};
export const emptyEvidence=():Evidence=>({collision:false,travel:0,strafe:0,forward:0,turn:0,visited:0,loopVisited:0,stationDwell:[],functionStationDwell:[],functionReturns:[],stoppedProgram:false,stoppedMotor:false,twoSpeeds:false,reactivePassed:false,connections:false});
export function assessCourse(id:CourseId,pose:Pose,trial:Trial,program:Program,e:Evidence,running:boolean):string|null {
 if(running)return 'running';if(e.collision)return 'collision';
 if(id==='robot-components')return e.connections&&e.stoppedMotor?null:'connections';
 if(id==='range-input')return e.reactivePassed?null:'sensor';
 if(e.travel<.2)return 'move';
 if(!parked(pose,trial.world.bay))return 'park';
 if(id==='sideways-parking'&&e.strafe<.4)return 'strafe';
 if(id==='robot-frame'&&(e.visited<1||e.forward<.3||e.turn<radians(80)))return 'frame';
 if(id==='manual-sequence'&&!e.stoppedProgram)return 'stop';
 if(id==='time-distance'&&!e.twoSpeeds)return 'speeds';
 if(id==='variables'&&(!hasVariable(program.steps)||program.steps.filter(op=>op.type==='move'&&op.value==='d').length<2))return 'variable';
 if(id==='loops'&&(e.loopVisited<trial.waypoints.length||!program.steps.some(op=>op.type==='repeat'&&op.count>=2&&op.body.length>=2)))return 'loop';
 if(id==='functions'&&(countOps(program.steps,'call')<2||e.visited<2||trial.waypoints.some((_,i)=>(e.functionStationDwell[i]??0)<.9||!e.functionReturns[i])))return 'function';
 return null;
}
export type Policy={threshold:number;comparison:'above'|'below';invalid:'stop'|'drive';sample:'repeat'|'once'};
export const startingPolicy:Policy={threshold:20,comparison:'above',invalid:'drive',sample:'once'};
export function policyCommand(reading:Reading,policy:Policy):Velocity {
 const allowed=reading.state==='invalid'?policy.invalid==='drive':reading.state==='clear'?policy.comparison==='above':policy.comparison==='above'?reading.metres*100>policy.threshold:reading.metres*100<policy.threshold;
 return allowed?{vx:.3,vy:0,omega:0}:zeroVelocity;
}
export function policyCases(policy:Policy){return [{name:'far',reading:{state:'valid',metres:.9},expected:true},{name:'near',reading:{state:'valid',metres:.25},expected:false},{name:'boundary',reading:{state:'valid',metres:.4},expected:false},{name:'invalid',reading:{state:'invalid'},expected:false}].map(c=>({...c,actual:policyCommand(c.reading as Reading,policy).vx>0}));}
export function compareTrials(id:'time-distance'|'variables',program:Program){
 return (id==='time-distance'?[30,60]:[100,150]).map(value=>{
  const trial=courseTrial(id,true);if(id==='variables')trial.world.bay={...trial.world.bay,x:1+value/100,y:1+value/100};
  let pose=trial.world.start,plan=newPlan(compileProgram(id==='variables'?{...program,distance:value}:program,id==='time-distance'?value/100:.4)),collision=false,seconds=0,travel=0;
  for(let i=0;i<10000;i++){const step=stepPlan(pose,plan,.01,trial.world);travel+=Math.hypot(step.pose.x-pose.x,step.pose.y-pose.y);pose=step.pose;plan=step.plan;seconds+=.01;collision=step.collision;if(step.done)break;}
  return {value,pose,collision,seconds,travel,passed:!collision&&parked(pose,trial.world.bay)};
 });
}
