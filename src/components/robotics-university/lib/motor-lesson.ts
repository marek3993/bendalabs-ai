export type MotorSegment={line:number;command:number;ms:number};
export type MotorProgram={segments:MotorSegment[];duration:number;finalLine:number};
export class MotorSyntaxError extends Error{constructor(public line:number,public kind:'syntax'|'range'|'duration'|'stop'|'empty'){super(`${line}:${kind}`);}}
export const motorStarter=`motor(60);
wait(1200);
stop();
wait(500);
motor(-60);
wait(800);
stop();`;
export const motorFaultProgram=motorStarter.replace('motor(-60)','motor(60)');
export function parseMotorProgram(code:string):MotorProgram{
 if(code.length>6000)throw new MotorSyntaxError(1,'duration');
 let command=0,duration=0,finalLine=0;const segments:MotorSegment[]=[];
 for(const [i,raw] of code.split('\n').entries()){
  const text=raw.replace(/\/\/.*$/,'').trim();if(!text)continue;
  const match=/^(motor|wait|stop)\(\s*(-?\d+)?\s*\);$/.exec(text);
  if(!match||match[1]==='stop'&&match[2]!==undefined||match[1]!=='stop'&&match[2]===undefined)throw new MotorSyntaxError(i+1,'syntax');
  const value=Number(match[2]);finalLine=i+1;
  if(match[1]==='motor'){if(value===0||Math.abs(value)>100)throw new MotorSyntaxError(i+1,'range');command=value;}
  else if(match[1]==='stop')command=0;
  else{if(value<100||value>10000||duration+value>30000)throw new MotorSyntaxError(i+1,'duration');segments.push({line:i+1,command,ms:value});duration+=value;}
 }
 if(command!==0)throw new MotorSyntaxError(finalLine,'stop');
 if(!segments.some(s=>s.command!==0))throw new MotorSyntaxError(finalLine||1,'empty');
 return {segments,duration,finalLine};
}
export function motorAt(program:MotorProgram,elapsed:number){let end=0;for(const segment of program.segments){end+=segment.ms;if(elapsed<end)return segment;}return {line:program.finalLine,command:0,ms:0};}
export type MotorWiring={supply:boolean;vm:boolean;ground:boolean};
export type MotorElectrical={vm:number;command:number;state:'off'|'unknown'|'coast'|'forward'|'reverse';pulse:number|null;duty:number};
export function motorElectrical(command:number,w:MotorWiring):MotorElectrical{
 const vm=w.supply&&w.vm?6:0,state=vm===0?'off':!w.ground?'unknown':command===0?'coast':command>0?'forward':'reverse';
 return {vm,command,state,pulse:state==='forward'?6:state==='reverse'?-6:null,duty:Math.abs(command)};
}
export function assessMotorRepair(program:MotorProgram,w:MotorWiring){
 const phases:{sign:number;commands:number[]}[]=[];
 for(const segment of program.segments){const sign=Math.sign(segment.command),prior=phases.at(-1);if(prior?.sign===sign)prior.commands.push(segment.command);else phases.push({sign,commands:[segment.command]});}
 const active=phases.filter(p=>p.sign!==0),first=active[0],last=active.at(-1);
 const firstIndex=program.segments.findIndex(s=>s.command!==0),lastIndex=program.segments.findLastIndex(s=>s.command!==0);
 return {
  power:w.supply&&w.vm&&w.ground,
  forward:first?.sign===1,
  reverse:last?.sign===-1&&active.length===2,
  lower:!!first&&!!last&&Math.max(...last.commands.map(Math.abs))<Math.min(...first.commands.map(Math.abs)),
  coast:program.segments.slice(firstIndex+1,lastIndex).filter(s=>s.command===0).reduce((sum,s)=>sum+s.ms,0)>=300,
 };
}
export const motorLessonStorage='bendalabs-motor-lesson-v1';
