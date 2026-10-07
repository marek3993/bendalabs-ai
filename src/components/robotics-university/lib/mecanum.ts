/** Ideal planar Mecanum model. SI units; body x forward, y left, positive yaw CCW. */
export type Pose = {x:number;y:number;yaw:number};
export type Velocity = {vx:number;vy:number;omega:number};
export type Wall = {x:number;y:number;width:number;height:number};
export type Bay = Pose & {width:number;length:number};
export type World = {start:Pose;bay:Bay;walls:Wall[];width:number;height:number};
export type Wheels = {fl:number;fr:number;rl:number;rr:number};
// Full collision footprint includes rollers and the front sensor, not just the deck.
export const chassis = {length:.56,width:.56,radius:.065,a:.18,b:.24};
export const zeroVelocity:Velocity={vx:0,vy:0,omega:0};
export const wheelIds=['fl','fr','rl','rr'] as const;
export const radians=(degrees:number)=>degrees*Math.PI/180;
export const degrees=(radians:number)=>radians*180/Math.PI;
export const angleDifference=(a:number,b:number)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));
export function wheelSpeeds({vx,vy,omega}:Velocity):Wheels {
 const turn=(chassis.a+chassis.b)*omega,r=chassis.radius;
 return {fl:(vx-vy-turn)/r,fr:(vx+vy+turn)/r,rl:(vx+vy-turn)/r,rr:(vx-vy+turn)/r};
}
export function bodyVelocity(w:Wheels):Velocity {
 const r=chassis.radius,k=chassis.a+chassis.b;
 return {vx:r*(w.fl+w.fr+w.rl+w.rr)/4,vy:r*(-w.fl+w.fr+w.rl-w.rr)/4,omega:r*(-w.fl+w.fr-w.rl+w.rr)/(4*k)};
}
export function limitWheels(w:Wheels,limit=12):Wheels {
 const scale=Math.max(1,...wheelIds.map(id=>Math.abs(w[id])/limit));
 return {fl:w.fl/scale,fr:w.fr/scale,rl:w.rl/scale,rr:w.rr/scale};
}
export function corners(p:Pose,length=chassis.length,width=chassis.width){
 return [[-1,-1],[-1,1],[1,1],[1,-1]].map(([sx,sy])=>({x:p.x+sx*length/2*Math.cos(p.yaw)-sy*width/2*Math.sin(p.yaw),y:p.y+sx*length/2*Math.sin(p.yaw)+sy*width/2*Math.cos(p.yaw)}));
}
function overlaps(p:Pose,wall:Wall){
 const a=corners(p),b=[{x:wall.x,y:wall.y},{x:wall.x+wall.width,y:wall.y},{x:wall.x+wall.width,y:wall.y+wall.height},{x:wall.x,y:wall.y+wall.height}];
 return [[1,0],[0,1],[Math.cos(p.yaw),Math.sin(p.yaw)],[-Math.sin(p.yaw),Math.cos(p.yaw)]].every(([x,y])=>{
  const av=a.map(q=>q.x*x+q.y*y),bv=b.map(q=>q.x*x+q.y*y);
  return Math.max(...av)>Math.min(...bv)+1e-8&&Math.max(...bv)>Math.min(...av)+1e-8;
 });
}
export function collides(p:Pose,world:World){return corners(p).some(q=>q.x<0||q.y<0||q.x>world.width||q.y>world.height)||world.walls.some(w=>overlaps(p,w));}
export function integrate(p:Pose,v:Velocity,dt:number):Pose {
 const half=p.yaw+v.omega*dt/2;
 return {x:p.x+(v.vx*Math.cos(half)-v.vy*Math.sin(half))*dt,y:p.y+(v.vx*Math.sin(half)+v.vy*Math.cos(half))*dt,yaw:angleDifference(p.yaw+v.omega*dt,0)};
}
export function moveSafely(p:Pose,v:Velocity,dt:number,world:World){
 let pose=p;const n=Math.max(1,Math.ceil(dt/.01));
 for(let i=0;i<n;i++){const next=integrate(pose,v,dt/n);if(collides(next,world))return {pose,collision:true};pose=next;}
 return {pose,collision:false};
}
export function parked(p:Pose,bay:Bay){
 const inBay=corners(p).every(q=>{const dx=q.x-bay.x,dy=q.y-bay.y;return Math.abs(dx*Math.cos(bay.yaw)+dy*Math.sin(bay.yaw))<=bay.length/2&&Math.abs(-dx*Math.sin(bay.yaw)+dy*Math.cos(bay.yaw))<=bay.width/2;});
 return inBay&&Math.abs(angleDifference(p.yaw,bay.yaw))<=radians(6);
}
export type Reading={state:'valid';metres:number}|{state:'clear'}|{state:'invalid'};
export function frontRange(p:Pose,world:World,invalid=false):Reading {
 if(invalid)return {state:'invalid'};
 const dx=Math.cos(p.yaw),dy=Math.sin(p.yaw),x=p.x+dx*chassis.length/2,y=p.y+dy*chassis.length/2;
 const walls=[...world.walls,{x:-.01,y:-.01,width:world.width+.02,height:.01},{x:-.01,y:world.height,width:world.width+.02,height:.01},{x:-.01,y:0,width:.01,height:world.height},{x:world.width,y:0,width:.01,height:world.height}];
 let distance=Infinity;
 for(const w of walls){let near=0,far=Infinity;for(const [origin,direction,lo,hi] of [[x,dx,w.x,w.x+w.width],[y,dy,w.y,w.y+w.height]]){if(Math.abs(direction)<1e-9){if(origin<lo||origin>hi){far=-1;break;}}else{const a=(lo-origin)/direction,b=(hi-origin)/direction;near=Math.max(near,Math.min(a,b));far=Math.min(far,Math.max(a,b));}}if(far>=near&&far>=0)distance=Math.min(distance,near);}
 return distance<=2.5?{state:'valid',metres:distance}:{state:'clear'};
}
export type Direction='forward'|'backward'|'left'|'right';
export type Op={type:'move';direction:Direction;value:number|'d';timed?:boolean}|{type:'turn';value:number}|{type:'wait';value:number}|{type:'stop'}|{type:'repeat';count:number;body:Op[]}|{type:'call'};
export type Program={distance:number;steps:Op[];maneuver:Op[]};
export type Action={velocity:Velocity;seconds:number;path:string};
export type Plan={actions:Action[];index:number;remaining:number};
export function directionVelocity(direction:Direction,speed:number):Velocity {return {vx:direction==='forward'?speed:direction==='backward'?-speed:0,vy:direction==='left'?speed:direction==='right'?-speed:0,omega:0};}
export function compileProgram(program:Program,speed=.4):Action[]{
 if(!Number.isFinite(program.distance)||program.distance<1||program.distance>300||!Number.isFinite(speed)||speed<.1||speed>.6)throw Error('value');
 const actions:Action[]=[];let duration=0,nodes=0,terminated=false;
 function walk(ops:Op[],depth=0,prefix='',inFunction=false){
  if(!Array.isArray(ops)||depth>4||ops.length>30)throw Error('limit');
  for(let i=0;i<ops.length;i++){
   if(terminated)return;
   const op=ops[i],path=prefix+i;if(++nodes>250)throw Error('limit');
   if(op.type==='repeat'){if(!Number.isInteger(op.count)||op.count<1||op.count>8)throw Error('repeat');for(let k=0;k<op.count;k++)walk(op.body,depth+1,path+'.',inFunction);continue;}
   if(op.type==='call'){if(inFunction||!program.maneuver.length)throw Error('function');walk(program.maneuver,depth+1,'f.',true);continue;}
   let velocity=zeroVelocity,seconds=.05;
   if(op.type==='move'){
    if(!['forward','backward','left','right'].includes(op.direction))throw Error('direction');
    const value=op.value==='d'?program.distance:op.value;if(!Number.isFinite(value)||value<=0||value>(op.timed?10:300))throw Error('value');
    seconds=op.timed?value:value/100/speed;velocity=directionVelocity(op.direction,speed);
   }else if(op.type==='turn'){
    if(!Number.isFinite(op.value)||Math.abs(op.value)>360||op.value===0)throw Error('value');
    velocity={vx:0,vy:0,omega:Math.sign(op.value)*Math.PI/3};seconds=Math.abs(op.value)/60;
   }else if(op.type==='wait'){if(!Number.isFinite(op.value)||op.value<.1||op.value>10)throw Error('value');seconds=op.value;}else if(op.type!=='stop')throw Error('command');
   duration+=seconds;if(duration>90||actions.length>=250)throw Error('limit');actions.push({velocity,seconds,path});if(op.type==='stop')terminated=true;
  }
 }
 walk(program.steps);if(!actions.length)throw Error('empty');return actions;
}
export function newPlan(actions:Action[]):Plan{return {actions,index:0,remaining:actions[0]?.seconds??0};}
export function stepPlan(pose:Pose,plan:Plan,dt:number,world:World){
 let left=dt,current=pose,index=plan.index,remaining=plan.remaining,collision=false,velocity=zeroVelocity,path='';
 while(left>1e-8&&index<plan.actions.length){
  const action=plan.actions[index],step=Math.min(left,remaining);velocity=action.velocity;path=action.path;
  const moved=moveSafely(current,velocity,step,world);current=moved.pose;collision=moved.collision;if(collision)break;
  left-=step;remaining-=step;if(remaining<1e-8){index++;remaining=plan.actions[index]?.seconds??0;}
 }
 const done=collision||index>=plan.actions.length;
 return {pose:current,plan:{...plan,index,remaining},collision,done,velocity:done?zeroVelocity:velocity,path};
}
export function countOps(ops:Op[],kind:Op['type']):number{return ops.reduce((n,op)=>n+(op.type===kind?1:0)+(op.type==='repeat'?countOps(op.body,kind):0),0);}
export function hasVariable(ops:Op[]):boolean{return ops.some(op=>op.type==='move'&&op.value==='d'||op.type==='repeat'&&hasVariable(op.body));}
export function cleanProgram(value:unknown):Program|null {
 try{
  if(!value||typeof value!=='object'||Array.isArray(value)||JSON.stringify(value).length>18000)return null;
  const p=value as Record<string,unknown>,distance=p.distance;
  if(typeof distance!=='number'||!Number.isFinite(distance)||distance<1||distance>300)return null;
  let nodes=0,hasCall=false;
  // Validate stored syntax independently of execution: STOP must not hide invalid editor rows.
  const cleanOps=(value:unknown,depth=0,inFunction=false):Op[]=>{
   if(!Array.isArray(value)||value.length>30||depth>4)throw Error('limit');
   return value.map(entry=>{
    if(!entry||typeof entry!=='object'||Array.isArray(entry)||++nodes>250)throw Error('command');
    const op=entry as Record<string,unknown>;
    if(op.type==='move'){
     if(typeof op.direction!=='string'||!['forward','backward','left','right'].includes(op.direction)||(op.timed!==undefined&&typeof op.timed!=='boolean'))throw Error('direction');
     const amount=op.value==='d'?distance:op.value;
     if(typeof amount!=='number'||!Number.isFinite(amount)||amount<=0||amount>(op.timed?10:300))throw Error('value');
     return {type:'move',direction:op.direction as Direction,value:op.value==='d'?'d':amount,...(op.timed===undefined?{}:{timed:op.timed as boolean})};
    }
    if(op.type==='turn'||op.type==='wait'){
     if(typeof op.value!=='number'||!Number.isFinite(op.value))throw Error('value');
     if(op.type==='turn'?(op.value===0||Math.abs(op.value)>360):(op.value<.1||op.value>10))throw Error('value');
     return {type:op.type,value:op.value};
    }
    if(op.type==='repeat'){
     if(typeof op.count!=='number'||!Number.isInteger(op.count)||op.count<1||op.count>8)throw Error('repeat');
     return {type:'repeat',count:op.count,body:cleanOps(op.body,depth+1,inFunction)};
    }
    if(op.type==='call'){if(inFunction)throw Error('function');hasCall=true;return {type:'call'};}
    if(op.type==='stop')return {type:'stop'};
    throw Error('command');
   });
  };
  const program:Program={distance,steps:cleanOps(p.steps),maneuver:cleanOps(p.maneuver,0,true)};
  if(hasCall&&!program.maneuver.length)return null;
  compileProgram({...program,steps:program.steps.length?program.steps:[{type:'stop'}]});
  return program;
 }catch{return null;}
}
