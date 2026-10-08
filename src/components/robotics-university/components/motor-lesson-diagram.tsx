'use client';
import {useEffect,useRef} from 'react';
import type {Lang} from '@/components/robotics-university/lib/atlas-data';
import {motorElectrical,type MotorWiring} from '@/components/robotics-university/lib/motor-lesson';

export default function MotorLessonDiagram({command,wiring,lang,compact=false}:{command:number;wiring:MotorWiring;lang:Lang;compact?:boolean}){
 const t=(sk:string,en:string)=>lang==='sk'?sk:en,e=motorElectrical(command,wiring),shaft=useRef<SVGGElement>(null),velocity=useRef(0),angle=useRef(0);
 useEffect(()=>{let frame=0,last=performance.now();const target=e.state==='forward'?Math.abs(command)*2:e.state==='reverse'?-Math.abs(command)*2:0;const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const tick=(now:number)=>{const dt=Math.min(.05,(now-last)/1000);last=now;velocity.current+=(target-velocity.current)*(1-Math.exp(-dt*(target?5:1.8)));angle.current+=velocity.current*dt;if(shaft.current&&!reduced)shaft.current.setAttribute('transform',`rotate(${angle.current} 380 182)`);if(!reduced&&(Math.abs(velocity.current)>.2||target))frame=requestAnimationFrame(tick);};frame=requestAnimationFrame(tick);return()=>cancelAnimationFrame(frame);
 },[e.state,command]);
 const energized=e.state==='forward'||e.state==='reverse',forward=e.state==='forward';
 const label=(x:number,y:number,text:string,size=16,color='#d8e8dc')=><text x={x} y={y} textAnchor="middle" fontSize={size} fill={color}>{text}</text>;
 const line=(d:string,color='#627969',width=3,dash=false)=><path d={d} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={dash?'7 6':undefined}/>;
 const contact=(x:number,y:number,closed:boolean)=><g>{line(`M${x} ${y-24}v10M${x} ${y+13}v11`,closed?'#e6bd76':'#64776c')}{line(closed?`M${x} ${y-14}v27`:`M${x} ${y-14}l17 23`,closed?'#e6bd76':'#64776c',4)}<circle cx={x} cy={y+13} r="3" fill="#bed6c6"/></g>;
 return <div className={'ml-circuit-wrap '+(compact?'compact':'')}><div className="ml-circuit-labels"><span><i className="signal"/>{t('3,3 V · riadenie','3.3 V · control')}</span><span><i className="energy"/>{t('6 V · energia motora','6 V · motor energy')}</span></div>
 <svg viewBox="0 0 760 366" className="ml-circuit" role="img" aria-label={t('H-mostík: dva horné a dva dolné spínače menia polaritu na svorkách motora.','H-bridge: two upper and two lower switches change motor terminal polarity.')}>
  <rect x="2" y="2" width="756" height="362" rx="15" fill="#102319"/>
  <rect x="18" y="62" width="174" height="113" rx="10" fill="#1d3b2b" stroke="#688c73"/>{label(105,92,t('Riadiaca doska','Controller'),19)}{label(105,117,'GPIO · 3,3 V',14,'#b2e2bc')}{label(105,148,t('Vlastné napájanie','Separate supply'),13)}
  <rect x="236" y="37" width="316" height="276" rx="12" fill="#122c1e" stroke="#50775c"/>{label(390,61,'DRV8833 · H-bridge',17)}
  <rect x="595" y="42" width="143" height="83" rx="10" fill="#342f20" stroke="#b2915a"/>{label(666,70,t('Zdroj motora','Motor supply'),17)}{label(666,102,wiring.supply?'6 V':'OFF',24,'#e6bd76')}
  {line('M192 132H230','#b2e2bc')}{line('M192 156H230','#b2e2bc')}{label(272,131,'AIN1',13,'#b2e2bc')}{label(272,157,'AIN2',13,'#b2e2bc')}
  {line('M595 81H576V94H470M544 94H320',wiring.supply?'#e6bd76':'#627969',3,!wiring.vm)}{label(567,73,'VM',13,'#e6bd76')}
  {!wiring.vm&&<g>{line('M560 89l11 11M571 89l-11 11','#e6bd76',2)}{label(664,151,t('Konektor VM','VM connector'),13,'#e6bd76')}</g>}
  {line('M320 94v22M470 94v22M320 164v40M470 164v40M320 252v29H470v-29')}
  {contact(320,140,energized&&forward)}{contact(470,140,energized&&!forward)}{contact(320,228,energized&&!forward)}{contact(470,228,energized&&forward)}
  {line('M320 182h25M415 182h55',energized?'#e6bd76':'#627969',4)}
  <circle cx="380" cy="182" r="35" fill="#252d26" stroke="#b4cabb" strokeWidth="3"/><circle cx="380" cy="182" r="24" fill="#ac8950" stroke="#f1d49d"/><g ref={shaft}><path d="M359 182h42M380 161v42" stroke="#303a30" strokeWidth="5"/><circle cx="380" cy="182" r="7" fill="#e5c68a"/></g>
  {label(334,179,e.pulse===6?'+':e.pulse===-6?'−':'',19,'#e6bd76')}{label(427,179,e.pulse===6?'−':e.pulse===-6?'+':'',19,'#e6bd76')}{label(390,260,t('DC motor · 6 V','DC motor · 6 V'),14)}
  {energized&&line(forward?'M320 94V164M470 204V281':'M470 94V164M320 204V281','#e6bd76',4)}
  {line('M666 125V331H470V281','#7e9888')}{line('M470 331H105V175','#7e9888',3,!wiring.ground)}{label(618,320,'GND',14)}{line('M470 331v9m-14 0h28m-22 7h16m-11 7h6','#7e9888',2)}
  {label(105,224,command>0?'AIN1: PWM':command<0?'AIN1: LOW':'AIN1: LOW',14,'#b2e2bc')}{label(105,250,command<0?'AIN2: PWM':'AIN2: LOW',14,'#b2e2bc')}
  {label(656,208,e.state==='unknown'?t('Neurčené','Unknown'):energized?t('Pulz zapnutia','ON pulse'):t('Bez pohonu','Not driven'),15)}{label(656,241,e.state==='unknown'?'?':e.pulse===null?'Hi-Z':`${e.pulse>0?'+':''}${e.pulse} V`,27,'#e6bd76')}{label(656,272,t('AOUT1 − AOUT2','AOUT1 − AOUT2'),12)}
 </svg>
 <svg className="ml-mobile-circuit" viewBox="0 0 360 410" role="img" aria-label={t('Doska riadi H-mostík, 6 V zdroj napája motor. Zvýraznená je aktívna diagonála spínačov.','The controller commands the H-bridge; the 6 V source powers the motor. The active switch diagonal is highlighted.')}>
  <rect width="360" height="410" rx="10" fill="#102319"/><rect x="15" y="18" width="140" height="70" rx="8" fill="#1d3b2b" stroke="#688c73"/>{label(85,45,t('Doska','Controller'),17)}{label(85,70,'GPIO · 3,3 V',14,'#b2e2bc')}
  <rect x="206" y="18" width="140" height="70" rx="8" fill="#342f20" stroke="#b2915a"/>{label(276,45,t('Zdroj motora','Motor supply'),16)}{label(276,72,wiring.supply?'6 V':'OFF',21,'#e6bd76')}
  <rect x="79" y="142" width="226" height="214" rx="10" fill="#142e20" stroke="#54795f"/>{label(192,165,'DRV8833 · H-bridge',16)}
  {line('M70 88v34H92v78','#b2e2bc')}{label(32,173,'AIN1',12,'#b2e2bc')}{label(32,192,'AIN2',12,'#b2e2bc')}{line('M276 88v95H125v5',wiring.supply?'#e6bd76':'#627969',3,!wiring.vm)}{label(305,120,'VM',13,'#e6bd76')}
  {line('M125 183v13M259 183v13M125 244v13M259 244v13M125 305v27H259v-27')}{contact(125,220,energized&&forward)}{contact(259,220,energized&&!forward)}{contact(125,281,energized&&!forward)}{contact(259,281,energized&&forward)}
  {line('M125 251h35M224 251h35',energized?'#e6bd76':'#627969',3)}<circle cx="192" cy="251" r="31" fill="#ac8950" stroke="#e5cf9e" strokeWidth="2"/>{label(192,259,'M',25,'#243126')}{label(146,235,e.pulse===6?'+':e.pulse===-6?'−':'',18,'#e6bd76')}{label(240,235,e.pulse===6?'−':e.pulse===-6?'+':'',18,'#e6bd76')}
  {line('M333 88v291H305M259 332v52H333V291','#7e9888')}{line('M35 88v296H79M35 296v88H259','#7e9888',3,!wiring.ground)}{label(77,377,'GND',12)}{label(191,316,e.state==='unknown'?'?':e.pulse===null?'Hi-Z':`${e.pulse>0?'+':''}${e.pulse} V`,17,'#e6bd76')}
 </svg><div className="ml-diagram-caption">{e.state==='unknown'?t('Bez spoločnej GND sa riadiace úrovne nedajú spoľahlivo určiť.','Without common GND the control levels cannot be reliably determined.'):energized?t('Zvýraznená je cesta prúdu počas zapnutého pulzu PWM.','The highlighted path carries current during a PWM ON pulse.'):t('Vysoká impedancia (Hi-Z): výstupy nepoháňajú motor. Hriadeľ môže dobiehať.','High impedance (Hi-Z): outputs do not drive the motor. The shaft may coast.')}</div>
 </div>;
}

export function MotorWaveform({command,lang}:{command:number;lang:Lang}){
 const t=(sk:string,en:string)=>lang==='sk'?sk:en,duty=Math.abs(command)/100;
 return <div className="ml-wave"><div><strong>{t('Logický vstup drivera','Driver logic input')+' · '+(command<0?'AIN2':'AIN1')}</strong><span>1 kHz · {Math.abs(command)} %</span></div><svg viewBox="0 0 520 115" role="img" aria-label={t(`PWM so striedou ${Math.abs(command)} percent a frekvenciou 1000 Hz`,`PWM at ${Math.abs(command)} percent duty and 1000 Hz`)}><text x="0" y="28" fill="#a1bbaa" fontSize="14">3,3 V</text><text x="14" y="83" fill="#a1bbaa" fontSize="14">0 V</text><path d="M62 80H510" stroke="#385440"/><path d={Array.from({length:3},(_,i)=>{const x=65+i*147;return command?`M${x} 80V24h${147*duty}V80h${147*(1-duty)}`:`M${x} 80h147`;}).join(' ')} fill="none" stroke="#b2e2bc" strokeWidth="3"/><text x="140" y="108" textAnchor="middle" fill="#a1bbaa" fontSize="14">1 ms</text></svg><p>{command?t(`Výška pulzu zostáva 3,3 V. Pri ${Math.abs(command)} % je vstup HIGH ${(Math.abs(command)/100).toLocaleString('sk')} ms a LOW ${(1-Math.abs(command)/100).toLocaleString('sk')} ms z každej 1 ms periódy.`,`Pulse height stays at 3.3 V. At ${Math.abs(command)}% the input is HIGH for ${Math.abs(command)/100} ms and LOW for ${Number((1-Math.abs(command)/100).toFixed(2))} ms per 1 ms period.`):t('Oba vstupy sú LOW. Žiadny pulz práve nepovoľuje pohon.','Both inputs are LOW. No pulse is currently enabling drive.')}</p></div>;
}
