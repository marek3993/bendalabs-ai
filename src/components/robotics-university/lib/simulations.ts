export function batteryEstimate(volts:number,ah:number,load:number,efficiency:number,reserve:number){
 if(![volts,ah,load,efficiency,reserve].every(Number.isFinite)||volts<=0||ah<=0||load<=0||efficiency<=0||efficiency>100||reserve<0||reserve>=100)return null;
 const wh=volts*ah,usableWh=wh*(1-reserve/100)*(efficiency/100);return {wh,usableWh,hours:usableWh/load,current:load/(volts*efficiency/100)};
}
export function armPosition(a:number,b:number,l1=1.5,l2=1.2){const r=Math.PI/180;return {x:l1*Math.cos(a*r)+l2*Math.cos((a+b)*r),y:l1*Math.sin(a*r)+l2*Math.sin((a+b)*r)};}
export function motorSizing(payloadKg:number,armKg:number,lengthM:number,reduction:number,efficiencyPercent:number,motorRpm:number){
 if(![payloadKg,armKg,lengthM,reduction,efficiencyPercent,motorRpm].every(Number.isFinite)||payloadKg<0||armKg<0||lengthM<0||reduction<1||efficiencyPercent<=0||efficiencyPercent>100||motorRpm<0)return null;
 const payloadTorque=payloadKg*9.81*lengthM,armTorque=armKg*9.81*lengthM/2;
 const loadTorque=payloadTorque+armTorque;
 return {payloadTorque,armTorque,loadTorque,motorTorque:loadTorque/(reduction*efficiencyPercent/100),outputRpm:motorRpm/reduction};
}
export function simulatePID(kp:number,ki:number,kd:number){let y=0,v=0,integral=0;const samples=[{t:0,value:0,target:1,control:Math.max(-10,Math.min(10,kp))}];for(let i=1;i<=800;i++){const error=1-y;integral=Math.max(-5,Math.min(5,integral+error*.01));const u=Math.max(-10,Math.min(10,kp*error+ki*integral-kd*v));v+=(u-1.2*v)*.01;y+=v*.01;if(i%5===0)samples.push({t:Number((i*.01).toFixed(2)),value:y,target:1,control:u});}return samples;}
export function droneEstimate(mass:number,maxN:number,throttle:number){const thrust=4*maxN*(throttle/100)**2;return {thrust,acceleration:thrust/mass-9.81,hover:Math.sqrt(mass*9.81/(4*maxN))*100,ratio:4*maxN/(mass*9.81)};}
export const obstacles=[{x:245,y:150,w:105,h:100},{x:390,y:220,w:80,h:100}];
export type RobotCommand={type:'forward'|'turn'|'wait';value:number};
export function validateCommands(value:unknown):value is RobotCommand[]{
 if(!Array.isArray(value)||value.length>1000)return false;
 let budget=0;
 for(const item of value){if(!item||typeof item!=='object'||Array.isArray(item)||!['forward','turn','wait'].includes(item.type)||typeof item.value!=='number'||!Number.isFinite(item.value)||Math.abs(item.value)>1000||(item.type==='wait'&&item.value<0))return false;budget+=item.type==='forward'?Math.ceil(Math.abs(item.value)/3):item.type==='wait'?Math.min(100,item.value*20):1;if(budget>6000)return false;}
 return true;
}
export type Point={x:number;y:number;angle:number};
export function robotRoute(commands:RobotCommand[]){let x=70,y=280,angle=0,collision=false;const points:Point[]=[{x,y,angle}];for(const c of commands){if(collision)break;if(c.type==='turn'){angle+=c.value;points.push({x,y,angle});}else if(c.type==='wait'){for(let i=0;i<Math.min(100,c.value*20);i++)points.push({x,y,angle});}else{const steps=Math.max(1,Math.ceil(Math.abs(c.value)/3));for(let s=0;s<steps;s++){const nx=x+Math.cos(angle*Math.PI/180)*c.value/steps,ny=y+Math.sin(angle*Math.PI/180)*c.value/steps;collision=nx<22||nx>578||ny<22||ny>358||obstacles.some(o=>nx>o.x-22&&nx<o.x+o.w+22&&ny>o.y-22&&ny<o.y+o.h+22);if(collision)break;x=nx;y=ny;points.push({x,y,angle});}}}return {points,collision,reached:Math.hypot(x-500,y-100)<25};}
export function lidarScan(px:number,py:number,range:number,noise:number,count=100){const walls=[{x:20,y:20,w:560,h:8},{x:20,y:352,w:560,h:8},{x:20,y:20,w:8,h:340},{x:572,y:20,w:8,h:340},...obstacles];return Array.from({length:count},(_,i)=>{const a=i/count*Math.PI*2,dx=Math.cos(a),dy=Math.sin(a);let hit=false,d=range;for(const o of walls){let near=0,far=Infinity;for(const [origin,direction,lo,hi] of [[px,dx,o.x,o.x+o.w],[py,dy,o.y,o.y+o.h]]){if(Math.abs(direction)<1e-10){if(origin<lo||origin>hi){far=-1;break;}}else{const a=(lo-origin)/direction,b=(hi-origin)/direction;near=Math.max(near,Math.min(a,b));far=Math.min(far,Math.max(a,b));}}if(far>=near&&far>=0&&near<=d){d=near;hit=true;}}if(hit)d=Math.max(0,Math.min(range,d+Math.sin(i*127.1+3.17)*noise));return {x:px+dx*d,y:py+dy*d,hit,d};});}
