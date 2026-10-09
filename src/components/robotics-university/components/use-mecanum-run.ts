'use client';
import {useEffect,useRef,useState,useCallback} from 'react';
import {moveSafely,stepPlan,newPlan,compileProgram,zeroVelocity,type Velocity,type Plan,type Pose,type Program} from '@/components/robotics-university/lib/mecanum';
import {emptyEvidence,type Trial,type Evidence} from '@/components/robotics-university/lib/course-experiments';

export type Run={pose:Pose;velocity:Velocity;trail:Pose[];evidence:Evidence;elapsed:number;running:boolean;path:string;ended:number};
type Runtime=Run&{plan:Plan|null;planOrigin:'program'|'jog'|null;functionArrivals:boolean[];manual:Velocity;lastCommand:number;trial:Trial};
function initial(trial:Trial,flags?:Partial<Evidence>):Runtime{return {pose:{...trial.world.start},velocity:zeroVelocity,trail:[{...trial.world.start}],evidence:{...emptyEvidence(),...flags},elapsed:0,running:false,path:'',ended:0,plan:null,planOrigin:null,functionArrivals:[],manual:zeroVelocity,lastCommand:0,trial};}

function advanceRuntime(r:Runtime,dt:number,now:number){
   const before=r.pose;let collision=false,done=false,velocity=r.manual;
   if(r.plan){const action=r.plan.actions[r.plan.index];const step=stepPlan(r.pose,r.plan,dt,r.trial.world);r.pose=step.pose;r.plan=step.plan;collision=step.collision;done=step.done;r.path=step.path;velocity=action?.velocity??zeroVelocity;}
   else if(now-r.lastCommand>350){velocity=zeroVelocity;r.manual=zeroVelocity;done=true;}
   else {const moved=moveSafely(r.pose,r.manual,dt,r.trial.world);r.pose=moved.pose;collision=moved.collision;}
   const travelled=Math.hypot(r.pose.x-before.x,r.pose.y-before.y),fromProgram=r.planOrigin==='program',fromFunction=fromProgram&&r.path.startsWith('f.'),fromLoop=fromProgram&&/^\d+\./.test(r.path);
   r.elapsed+=dt;r.velocity=velocity;r.evidence.travel+=travelled;r.evidence.strafe+=Math.abs(velocity.vy)*dt;r.evidence.forward+=Math.abs(velocity.vx)*dt;r.evidence.turn+=Math.abs(velocity.omega)*dt;r.evidence.collision ||= collision;
   const waypoint=r.trial.waypoints[r.evidence.visited];if(waypoint&&Math.hypot(r.pose.x-waypoint.x,r.pose.y-waypoint.y)<.16)r.evidence.visited++;
   const loopWaypoint=r.trial.waypoints[r.evidence.loopVisited];if(fromLoop&&travelled>1e-8&&loopWaypoint&&Math.hypot(r.pose.x-loopWaypoint.x,r.pose.y-loopWaypoint.y)<.16)r.evidence.loopVisited++;
   r.trial.waypoints.forEach((p,i)=>{
    const distance=Math.hypot(r.pose.x-p.x,r.pose.y-p.y),stationary=Math.abs(velocity.vx)+Math.abs(velocity.vy)+Math.abs(velocity.omega)<.001;
    if(fromFunction&&travelled>1e-8&&distance<.16)r.functionArrivals[i]=true;
    if(distance<.16&&stationary){r.evidence.stationDwell[i]=(r.evidence.stationDwell[i]??0)+dt;if(fromFunction&&r.functionArrivals[i])r.evidence.functionStationDwell[i]=(r.evidence.functionStationDwell[i]??0)+dt;}
    if(fromFunction&&travelled>1e-8&&distance>.3&&r.functionArrivals[i]&&(r.evidence.functionStationDwell[i]??0)>=.9)r.evidence.functionReturns[i]=true;
   });
   if(r.trail.length<4000&&Math.hypot(r.pose.x-r.trail.at(-1)!.x,r.pose.y-r.trail.at(-1)!.y)>.012)r.trail.push({...r.pose});
   if(collision||done){r.running=false;r.plan=null;r.planOrigin=null;r.manual=zeroVelocity;r.velocity=zeroVelocity;}
}
export function useMecanumRun(trial:Trial,options:{playback?:number;stopPractice?:boolean}={}){
 const completion=useRef(0);
 const optionsRef=useRef(options);optionsRef.current=options;
 const runtime=useRef(initial(trial)),[run,setRun]=useState<Run>(runtime.current),[error,setError]=useState('');
 const publish=useCallback(()=>{const r=runtime.current;setRun({...r,evidence:{...r.evidence},trail:[...r.trail]});},[]);
 const stop=useCallback((intentional=false)=>{const r=runtime.current;if(intentional&&r.evidence.travel>.02)r.evidence.stoppedMotor=true;if(intentional&&r.running&&r.planOrigin==='program'&&r.evidence.travel>.02)r.evidence.stoppedProgram=true;r.plan=null;r.planOrigin=null;r.manual=zeroVelocity;r.velocity=zeroVelocity;r.running=false;r.path='';publish();},[publish]);
 const reset=useCallback((next:Trial,keepFlags=false)=>{const e=runtime.current.evidence;runtime.current=initial(next,keepFlags?{stoppedProgram:e.stoppedProgram,stoppedMotor:e.stoppedMotor,reactivePassed:e.reactivePassed,twoSpeeds:e.twoSpeeds,connections:e.connections}:undefined);setError('');publish();},[publish]);
 const start=useCallback((program:Program,speed:number,instant=false)=>{try{const actions=compileProgram(program,speed),old=runtime.current;runtime.current=initial(old.trial,{stoppedProgram:old.evidence.stoppedProgram,stoppedMotor:old.evidence.stoppedMotor,reactivePassed:old.evidence.reactivePassed,twoSpeeds:old.evidence.twoSpeeds,connections:old.evidence.connections});runtime.current.plan=newPlan(actions);runtime.current.planOrigin='program';runtime.current.running=true;
  if(instant&&!(optionsRef.current.stopPractice&&!runtime.current.evidence.stoppedProgram)){
   const r=runtime.current;
   for(let i=0;r.running&&i<20000;i++)advanceRuntime(r,Math.min(.01,r.plan&&r.plan.remaining>1e-8?r.plan.remaining:.01),performance.now());
   if(r.running)throw new Error('value');
   r.ended=++completion.current;
  }
  setError('');publish();return true;}catch(error){setError(error instanceof Error?error.message:'value');return false;}},[publish]);
 const manual=useCallback((velocity:Velocity)=>{const r=runtime.current;if(r.evidence.collision)return;r.plan=null;r.planOrigin=null;r.path='';r.manual=velocity;r.lastCommand=performance.now();r.running=!!(velocity.vx||velocity.vy||velocity.omega);r.velocity=velocity;publish();},[publish]);
 const refresh=useCallback(()=>{runtime.current.lastCommand=performance.now();},[]);
 const jog=useCallback((velocity:Velocity,amount?:number)=>{const r=runtime.current;if(r.running||r.evidence.collision)return;const magnitude=velocity.omega?Math.abs(velocity.omega):Math.hypot(velocity.vx,velocity.vy);if(!magnitude)return;const seconds=(amount??(velocity.omega?Math.PI/12:.1))/magnitude;r.plan=newPlan([{velocity,seconds,path:''}]);r.planOrigin='jog';r.path='';r.running=true;publish();},[publish]);
 const flag=useCallback((value:Partial<Evidence>)=>{Object.assign(runtime.current.evidence,value);publish();},[publish]);
 useEffect(()=>{let frame=0,last=performance.now(),lastPublish=0;const tick=(now:number)=>{
  const r=runtime.current,realDt=Math.min(r.planOrigin==='program'?.25:.1,(now-last)/1000);last=now;
  const playback=r.planOrigin==='program'&&!(optionsRef.current.stopPractice&&!r.evidence.stoppedProgram)?(optionsRef.current.playback??1):1;
  let budget=realDt*playback;
  while(r.running&&!document.hidden&&budget>1e-8){
   const dt=Math.min(.01,budget,r.plan&&r.plan.remaining>1e-8?r.plan.remaining:.01);budget-=dt;
   advanceRuntime(r,dt,now);
   if(!r.running){r.ended=++completion.current;publish();runEnded.current=r.ended;}
  }
  if(now-lastPublish>40){lastPublish=now;if(r.running||r.ended!==runEnded.current){publish();runEnded.current=r.ended;}}
  frame=requestAnimationFrame(tick);
 };const clear=()=>stop();const hide=()=>{if(document.hidden)stop();};window.addEventListener('blur',clear);document.addEventListener('visibilitychange',hide);frame=requestAnimationFrame(tick);return()=>{cancelAnimationFrame(frame);window.removeEventListener('blur',clear);document.removeEventListener('visibilitychange',hide);};},[publish,stop]);
 const runEnded=useRef(0);
 return {run,error,start,stop,manual,refresh,reset,flag,jog};
}

