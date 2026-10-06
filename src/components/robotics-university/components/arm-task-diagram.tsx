import {armTool,pickupPoint,dropPoint,liftHeight,type Point3,type ArmTaskScene} from '@/components/robotics-university/lib/arm-transfer';
export default function ArmTaskDiagram({task,joints,lang}:{task:ArmTaskScene;joints:number[];lang:'sk'|'en'}) {
 const [yaw,q1,b]=joints,a=(q1+90)*Math.PI/180,y=yaw*Math.PI/180;
 const project=(p:Point3)=>({x:170+p.x*94+p.z*48,y:355-p.y*90+p.z*20});
 const shoulder=project({x:0,y:.95,z:0}),elbow=project({x:1.54*Math.cos(a)*Math.cos(y),y:.95+1.54*Math.sin(a),z:-1.54*Math.cos(a)*Math.sin(y)});
 const tip=armTool({yaw,shoulder:q1+90,elbow:b}),wrist=project({...tip,y:tip.y+.92}),grip=project(tip),item=project(task.item),target=project(task.target),lift=project({...pickupPoint,y:liftHeight});
 return <div className="arm-task-diagram"><svg viewBox="0 0 600 440" role="img" aria-label={lang==='sk'?'Priestorová schéma ramena a pracovísk A a B':'Projected diagram of the arm and stations A and B'}><path d="M35 370L340 420L580 300L230 252Z" fill="#132c20" stroke="#385c47"/>
  {[['A',pickupPoint],['B',dropPoint]].map(([name,p])=>{const point=p as Point3,top=project({...point,y:point.y-.14}),ground=project({...point,y:0});return <g key={name as string}><path d={`M${ground.x} ${ground.y}L${top.x} ${top.y}`} stroke="#577866" strokeWidth="43"/><ellipse cx={top.x} cy={top.y} rx="27" ry="12" fill="#829b8a" stroke="#b2e2bc"/><text x={ground.x} y={ground.y+27} textAnchor="middle">{name as string}</text></g>;})}
  <ellipse cx="170" cy="355" rx="49" ry="18" fill="#365744" stroke="#93c4a4"/><path d={`M170 355L${shoulder.x} ${shoulder.y}`} stroke="#4b7160" strokeWidth="48"/>
  <path d={`M${shoulder.x} ${shoulder.y}L${elbow.x} ${elbow.y}L${wrist.x} ${wrist.y}`} stroke="#698e7b" strokeWidth="25" fill="none" strokeLinecap="round"/><path d={`M${shoulder.x} ${shoulder.y}L${elbow.x} ${elbow.y}L${wrist.x} ${wrist.y}`} stroke="#d2e8db" strokeWidth="18" fill="none" strokeLinecap="round"/>
  {[shoulder,elbow,wrist].map((p,i)=><g key={i}><circle cx={p.x} cy={p.y} r={i===2?12:18} fill="#163325" stroke="#9dccb1" strokeWidth="3"/><circle cx={p.x} cy={p.y} r="5" fill="#8ab99a"/></g>)}
  <path d={`M${wrist.x} ${wrist.y}V${grip.y-22}M${grip.x-20} ${grip.y-20}H${grip.x+20}`} stroke="#7b9988" strokeWidth="11"/><path d={`M${grip.x-(task.carrying?16:25)} ${grip.y-22}V${grip.y+8}M${grip.x+(task.carrying?16:25)} ${grip.y-22}V${grip.y+8}`} stroke="#a5c2b1" strokeWidth="7"/>
  <rect x={item.x-12} y={item.y-12} width="24" height="24" rx="3" fill="#e8b76a" stroke="#ffe3b1"/>
  {(task.stage===0||task.stage===2)&&<g stroke="#b2e2bc" fill="none"><ellipse cx={target.x} cy={target.y} rx="20" ry="12" strokeDasharray="4 3"/><path d={`M${target.x-27} ${target.y}h54M${target.x} ${target.y-21}v42`}/></g>}
  {task.stage===1&&<g stroke="#b2e2bc"><path d={`M${lift.x-50} ${lift.y}h100`} strokeDasharray="5 4"/><text x={lift.x+55} y={lift.y+4}>+15 cm</text></g>}
  <circle cx={grip.x} cy={grip.y} r="3" fill="#eafff2"/>
 </svg></div>;
}
