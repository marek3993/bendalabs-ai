'use client';
import {useCallback,useEffect,useId,useRef,useState} from 'react';
import {Pause,Play,RotateCcw,Package,CheckCircle2} from 'lucide-react';
import type {Lang} from '@/components/robotics-university/lib/atlas-data';
import {advanceFlight,balanceThrottle,createFlight,landingLimit,type Flight} from '@/components/robotics-university/lib/drone-landing';
import {useJourney} from './journey-context';

export default function DroneLanding({lang,onNext}:{lang:Lang;onNext?:(id:string)=>void}){
  const t=(sk:string,en:string)=>lang==='sk'?sk:en;
  const {mark}=useJourney();
  const [mission,setMission]=useState(0),mass=mission===0?1:1.4,hover=balanceThrottle(mass);
  const [flight,setFlight]=useState<Flight>(()=>createFlight(1));
  const [throttle,setThrottle]=useState(()=>balanceThrottle(1));
  const flightRef=useRef(flight),throttleRef=useRef(throttle),resultRef=useRef<HTMLDivElement>(null);
  const fieldId=useId(),patternId=useId().replaceAll(':','');
  const commit=useCallback((next:Flight)=>{flightRef.current=next;setFlight(next);},[]);
  const command=useCallback((value:number)=>{const next=Math.max(0,Math.min(100,value));throttleRef.current=next;setThrottle(next);},[]);
  const reset=(nextMission=mission)=>{const nextMass=nextMission===0?1:1.4;setMission(nextMission);command(balanceThrottle(nextMass));commit(createFlight(nextMass));};
  const terminal=['landed','hard','ceiling','timeout'].includes(flight.phase),running=flight.phase==='flying';

  useEffect(()=>{
    if(flight.phase!=='flying')return;
    let frame=0,previous=performance.now();
    const tick=(now:number)=>{
      const state=flightRef.current;
      if(state.phase!=='flying')return;
      const next=advanceFlight(state,throttleRef.current,mass,Math.min(.1,(now-previous)/1000)*.5);
      previous=now;commit(next);
      if(next.phase==='flying')frame=requestAnimationFrame(tick);
    };
    const pauseHidden=()=>{if(document.hidden&&flightRef.current.phase==='flying')commit({...flightRef.current,phase:'paused'});};
    frame=requestAnimationFrame(tick);document.addEventListener('visibilitychange',pauseHidden);
    return()=>{cancelAnimationFrame(frame);document.removeEventListener('visibilitychange',pauseHidden);};
  },[flight.phase,mass,commit]);
  useEffect(()=>{if(flight.phase==='landed')mark('challenges','drone');if(['landed','hard','ceiling','timeout'].includes(flight.phase))resultRef.current?.focus({preventScroll:true});},[flight.phase,mark]);

  const start=()=>{if(flight.phase==='ready'){command(hover-5);commit({...flightRef.current,phase:'flying'});}else if(flight.phase==='paused')commit({...flightRef.current,phase:'flying'});};
  const brakeAcceleration=20*((hover+8)/100)**2/mass-9.81;
  const brakeHeight=Math.max(0,flight.velocity<0?flight.velocity**2/(2*brakeAcceleration)+Math.abs(flight.velocity)*.5+1.0:0);
  const guidance=flight.phase==='ready'?t('Spusť klesanie. Pred plochou zvýš výkon a zníž rýchlosť dopadu.','Start descending. Increase power before reaching the pad to reduce touchdown speed.'):
    flight.phase==='paused'?t('Let je pozastavený. Môžeš upraviť výkon a pokračovať.','Flight is paused. Adjust power, then resume.'):
    flight.velocity < -landingLimit ? flight.height<=brakeHeight?t('Začni brzdiť. Pri dotyku musí byť rýchlosť najviac 0,8 m/s.','Start braking. Touchdown speed must be no more than 0.8 m/s.'):t('Dron klesá k ploche. Pred dotykom bude potrebné pridať výkon a spomaliť.','The drone is descending towards the pad. Increase power before touchdown to slow down.'):
    flight.velocity > .15?t('Dron stúpa. Zníž výkon, ak chceš znova klesať.','The drone is climbing. Reduce power to descend again.'):
    flight.velocity < -.05?t('Rýchlosť je v limite pristátia. Sleduj ju až po dotyk s plochou.','Speed is within the landing limit. Keep monitoring it until touchdown.'):
    t('Dron takmer stojí. Menší výkon začne klesanie.','The drone is nearly stationary. Lower power to start descending.');
  const speedText=flight.impact!==null?t('Rýchlosť pri dotyku','Touchdown speed'):flight.velocity<-.05?t('Klesanie','Descent'):flight.velocity>.05?t('Stúpanie','Climb'):t('Zvislá rýchlosť','Vertical speed');
  const speed=flight.impact??Math.abs(flight.velocity),droneY=288-flight.height*21;

  return <section className="drone-lesson" aria-label={t('Pristátie s dronom','Drone landing')}>
    <header className="drone-heading"><div><span className="eyebrow">{t('RIADENIE LETU','FLIGHT CONTROL')} · {mission+1}/2</span><h2>{mission===0?t('Pristaň s dronom','Land the drone'):t('Pristaň s nákladom','Land with a payload')}</h2><p>{t('Cieľ: dotkni sa pristávacej plochy rýchlosťou najviac 0,8 m/s.','Goal: touch down on the landing pad at no more than 0.8 m/s.')}</p></div><span className="drone-mass"><Package size={18}/>{mass.toFixed(1)} kg{mission===1&&<small>{t('vrátane nákladu 0,4 kg','including a 0.4 kg payload')}</small>}</span></header>
    <div className="drone-workspace">
      <div className="drone-flight-view">
        <div className="drone-telemetry"><div><span>{t('Výška nad plochou','Height above pad')}</span><strong>{flight.height.toFixed(1)} <small>m</small></strong></div><div data-alert={speed>landingLimit}><span>{speedText}</span><strong>{speed.toFixed(2)} <small>m/s</small></strong></div></div>
        <svg viewBox="0 0 580 350" className="drone-flight-diagram" role="img" aria-label={t('Bočný pohľad na let dronu a pristávaciu plochu','Side view of drone flight and landing pad')}>
          <defs><pattern id={patternId} width="32" height="32" patternUnits="userSpaceOnUse"><path d="M32 0H0V32" fill="none" stroke="#b2e2bc" strokeOpacity=".055"/></pattern></defs>
          <rect width="580" height="350" fill={`url(#${patternId})`}/>
          {[0,2,4,6,8,10,12].map(h=><g key={h}><line x1="45" x2="535" y1={306-h*21} y2={306-h*21} stroke="#7d9f89" strokeOpacity=".16" strokeDasharray={h===0?'0':'3 7'}/><text x="20" y={310-h*21}>{h}</text></g>)}
          <text x="18" y="33">m</text>
          <rect x="220" y="306" width="170" height="13" rx="3" fill={flight.phase==='hard'?'#d9907c':'#b2e2bc'}/><path d="M250 319l-15 12m45-12l-15 12m45-12l-15 12m45-12l-15 12m45-12l-15 12" stroke="#47634e" strokeWidth="7"/>
          <text x="305" y="347" textAnchor="middle">{t('PRISTÁVACIA PLOCHA','LANDING PAD')}</text>
          <line x1="305" x2="305" y1={droneY+18} y2="306" stroke="#b2e2bc" strokeOpacity=".28" strokeDasharray="3 5"/>
          <g transform={`translate(305 ${droneY-12})`} className={running?'drone-airframe flying':'drone-airframe'}>
            <path d="M-78 -5H78" stroke="#75a68a" strokeWidth="7"/><path d="M-33 4l-13 26h-12m91-26l13 26h12" stroke="#d4e5d7" strokeWidth="3" fill="none"/>
            <rect x="-27" y="-16" width="54" height="29" rx="9" fill="#c2e4cb" stroke="#6b9a7d" strokeWidth="2"/><rect x="-15" y="-21" width="30" height="10" rx="3" fill="#436650"/><circle cy="6" r="5" fill="#163022"/>
            {[-78,78].map(x=><g key={x} transform={`translate(${x} -10)`}><rect x="-7" y="0" width="14" height="13" rx="3" fill="#c2e4cb"/><ellipse className="drone-rotor" cy="-3" rx="39" ry="3" fill="#b2e2bc"/><ellipse cy="-3" rx="39" ry="6" fill="none" stroke="#b2e2bc" strokeOpacity=".25"/></g>)}
            {mission===1&&<g><path d="M-12 13v7m24-7v7" stroke="#deb96f" strokeWidth="2"/><rect x="-17" y="20" width="34" height="10" rx="2" fill="#deb96f"/></g>}
          </g>
          <rect x="404" y={Math.max(18,droneY-22)} width="109" height="25" rx="5" fill="#0b1c13" stroke="#385a43"/><text x="459" y={Math.max(18,droneY-22)+17} textAnchor="middle">{flight.height.toFixed(1)} m</text>
        </svg>
        <p className="drone-flight-caption">{t('Bočný pohľad · pohyb spomalený na polovicu','Side view · motion shown at half speed')}</p>
      </div>
      <div className="drone-controls">
        <div className="drone-control-label"><label htmlFor={fieldId}>{t('Výkon motorov','Motor power')}</label><output htmlFor={fieldId}>{throttle.toFixed(0)} <small>%</small></output></div>
        <input id={fieldId} type="range" min="0" max="100" step="1" value={throttle} disabled={terminal||flight.phase==='ready'} onChange={e=>command(Number(e.target.value))}/>
        <p className="drone-balance">{t('Ťah vyrovná tiaž približne pri','Thrust balances weight at about')} <strong>{hover.toFixed(0)} %</strong></p>
        <div className="drone-actions"><button className="button" disabled={!running&&flight.phase!=='paused'} onClick={()=>command(hover-5)}>{t('Klesať','Descend')}<small>{(hover-5).toFixed(0)} %</small></button><button className="button" disabled={!running&&flight.phase!=='paused'} onClick={()=>command(Math.min(100,hover+8))}>{t('Brzdiť klesanie','Brake descent')}<small>{(hover+8).toFixed(0)} %</small></button></div>
        {!terminal&&<p className="drone-guidance" role="status">{guidance}</p>}
        <div className="drone-run-actions">{!terminal&&<button className="button primary" onClick={()=>running?commit({...flightRef.current,phase:'paused'}):start()}>{running?<Pause size={18}/>:<Play size={18}/>} {running?t('Pozastaviť','Pause'):flight.phase==='paused'?t('Pokračovať v lete','Resume flight'):t('Začať klesanie','Start descending')}</button>}<button className="button drone-reset" aria-label={t('Vrátiť dron na štart','Return drone to start')} onClick={()=>reset()}><RotateCcw size={18}/></button></div>
        {terminal&&<div className="drone-result" ref={resultRef} tabIndex={-1} role="status" data-success={flight.phase==='landed'}><h3>{flight.phase==='landed'?<><CheckCircle2 size={19}/>{t('Pristátie úspešné','Landing successful')}</>:flight.phase==='hard'?t('Tvrdé pristátie','Hard landing'):flight.phase==='ceiling'?t('Dron vystúpal nad 12 m','The drone climbed above 12 m'):t('Čas pokusu vypršal','Attempt timed out')}</h3><p>{flight.impact!==null?`${t('Rýchlosť pri dotyku','Touchdown speed')}: ${flight.impact.toFixed(2)} m/s. ${t('Limit','Limit')}: 0.8 m/s.`:t('Vráť dron na štart a pri ďalšom pokuse zníž výkon.','Return to the start and use less power on the next attempt.')}</p>{flight.phase==='hard'&&<p>{t('V ďalšom pokuse začni brzdiť vyššie nad plochou.','On the next attempt, start braking farther above the pad.')}</p>}
          {flight.phase==='landed'?mission===0?<button className="button primary" onClick={()=>reset(1)}>{t('Pokračovať na ďalšiu úlohu: náklad 0,4 kg','Next task: add a 0.4 kg payload')}</button>:onNext?<button className="button primary" onClick={()=>onNext('flight')}>{t('Pokračovať k vysvetleniu letu','Continue to the flight lesson')}</button>:null:<button className="button primary" onClick={()=>reset()}>{t('Zopakovať pristátie','Retry landing')}</button>}
        </div>}
      </div>
    </div>
    <details className="drone-explanation"><summary>{t('Ako riadiť klesanie a čo mení náklad','How to control descent and what payload changes')}</summary><div><p>{t('Na začiatku tlačidlo nastaví výkon pod rovnovážnu hodnotu, takže dron začne klesať. Tlačidlo Brzdiť klesanie nastaví vyšší výkon. Motorom chvíľu trvá, kým zmenia ťah, preto brzdi pred dotykom s plochou. Posuvníkom môžeš výkon doladiť.','The start button sets power below the balance point, so the drone begins to descend. Brake descent sets a higher power. Motors take time to change thrust, so brake before reaching the pad. Use the slider for finer adjustment.')}</p><p>{t('Rovnovážny ťah nezastaví už rozbehnuté klesanie: iba prestane meniť rýchlosť. Na spomalenie musí ťah dočasne prevýšiť tiaž. S nákladom sa rovnovážny výkon zvýši z približne 70 % na 83 %.','Balanced thrust does not stop an existing descent: it only stops changing the speed. To slow down, thrust must temporarily exceed weight. The payload raises the balance point from about 70% to 83%.')}</p><p className="formula">T = 20 (u / 100)² · a = T / m − 9.81</p><p className="drone-model-note">{t('Výučbový model zvislého letu: štyri motory po 5 N, odozva motorov 0,16 s, bez vetra a náklonu. Percentá výkonu ani limit pristátia nepredstavujú nastavenie skutočného dronu.','Educational vertical-flight model: four 5 N motors, 0.16 s motor response, no wind or tilt. The power percentages and landing threshold are not settings for a real drone.')}</p></div></details>
  </section>;
}
