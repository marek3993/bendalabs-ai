'use client';

import {useEffect, useMemo, useRef, useState, type ReactNode} from 'react';
import {Dialog} from 'radix-ui';
import {ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Check, Circle, Download, Octagon, RotateCcw, RotateCw, Shuffle} from 'lucide-react';
import type {Lang} from '@/components/robotics-university/lib/atlas-data';
import {chassis, directionVelocity, wheelIds, zeroVelocity, type Velocity, type Wheels} from '@/components/robotics-university/lib/mecanum';
import {
  aisleWidth, aisleY, classifyMix, inAisle, shelvesX, combineReversal, demoWorld, diagnosisWorld, dockReadout, forwardMix, isTurn, isWheelId, lessonMotions, lessonTrial,
  mixGoals, mixMeetsGoal, mixResponse, mixVelocity, mixWheels, noReversal, pilotWorld, roverLessonStorage, simulateWired, telemetry, testCommand,
  testCommands, turningCircle, wiredVelocity, wiredWheels, wiringCorrect,
  type LessonMotion, type MixGoal, type MixResult, type Reversed, type TestCommand, type WheelId, type WheelMix, type WheelSetting,
} from '@/components/robotics-university/lib/rover-lesson';
import {roverPlanImage} from '@/components/robotics-university/lib/rover-plan';
import {useMecanumRun} from './use-mecanum-run';
import MecanumScene from './mecanum-scene';

const names: Record<LessonMotion, [string,string]> = {
  forward: ['Dopredu','Forward'], backward: ['Dozadu','Backward'],
  left: ['Bokom doľava','Slide left'], right: ['Bokom doprava','Slide right'],
  'turn-left': ['Otočiť doľava','Turn left'], 'turn-right': ['Otočiť doprava','Turn right'],
};
const wheelNames: Record<WheelId, [string,string]> = {fl: ['Predné ľavé','Front left'], fr: ['Predné pravé','Front right'], rl: ['Zadné ľavé','Rear left'], rr: ['Zadné pravé','Rear right']};
const wheelNamesLower: Record<WheelId, [string,string]> = {fl: ['predné ľavé','front-left'], fr: ['predné pravé','front-right'], rl: ['zadné ľavé','rear-left'], rr: ['zadné pravé','rear-right']};
const testNames: Record<TestCommand, [string,string]> = {forward: ['Dopredu 100 cm','Forward 100 cm'], left: ['Bokom doľava 100 cm','Slide left 100 cm'], 'turn-left': ['Otočiť doľava 90°','Turn left 90°']};
const cm = (n:number) => Math.round(n*100);
const aisleCm = cm(aisleWidth), chassisCm = cm(chassis.width), circleCm = cm(turningCircle);

type Goals = Record<MixGoal, boolean>;
type Saved = {stage:number; reached:number; pilotSolved:boolean; mix:WheelMix; goals:Goals; fault:WheelId|null; flips:Reversed; done:boolean; notes:string};
const defaults: Saved = {stage:0, reached:0, pilotSolved:false, mix:forwardMix, goals:{right:false,'turn-right':false}, fault:null, flips:noReversal, done:false, notes:''};
const settings: WheelSetting[] = [-1,0,1];
const randomWheel = (): WheelId => wheelIds[Math.floor(Math.random()*4)];
function cleanMix(value: unknown): WheelMix | null {
  if (!value || typeof value !== 'object') return null;
  const v = value as Record<string, unknown>;
  return wheelIds.every(id => v[id] === -1 || v[id] === 0 || v[id] === 1) ? {fl: v.fl, fr: v.fr, rl: v.rl, rr: v.rr} as WheelMix : null;
}
function cleanFlags(value: unknown): Reversed | null {
  if (!value || typeof value !== 'object') return null;
  const v = value as Record<string, unknown>;
  return wheelIds.every(id => typeof v[id] === 'boolean') ? {fl: v.fl, fr: v.fr, rl: v.rl, rr: v.rr} as Reversed : null;
}
type Test = {kind:'test'|'check'; command:TestCommand; actual:Velocity; wheels:Wheels; passed:boolean; centimetres:number; angle:number; ended:number};

export default function RoverFirstLesson({lang, feedback, onNavigate}:{lang:Lang; feedback?:ReactNode; onNavigate:(view:string,id?:string)=>void}) {
  const t = (sk:string,en:string) => lang==='sk'?sk:en;
  const pick = (pair:[string,string]) => pair[lang==='sk'?0:1];
  const [saved,setSaved] = useState<Saved>(defaults), [ready,setReady] = useState(false), [intro,setIntro] = useState(true);
  const [hit,setHit] = useState<'turn'|'drive'|null>(null), [hint,setHint] = useState<MixGoal|null>(null), [test,setTest] = useState<Test|null>(null);
  const lastTurn = useRef(false), before = useRef(pilotWorld.start), heading = useRef<HTMLHeadingElement>(null);
  const trial = useMemo(() => lessonTrial(saved.stage===0?pilotWorld:saved.stage===1?demoWorld:diagnosisWorld), [saved.stage]);
  const {run,stop,reset,jog,drive,clearCollision,place} = useMecanumRun(trial,{playback:1});
  const [planImage,setPlanImage] = useState<string>();
  useEffect(()=>setPlanImage(roverPlanImage()),[]);
  useEffect(()=>{
    try {
      const p = JSON.parse(localStorage.getItem(roverLessonStorage)??'null');
      if(p && Number.isInteger(p.stage) && p.stage>=0 && p.stage<=3) {
        const goals = p.goals && typeof p.goals==='object' ? {right:p.goals.right===true,'turn-right':p.goals['turn-right']===true} : defaults.goals;
        setSaved({stage:p.stage, reached:Number.isInteger(p.reached)?Math.max(p.stage,Math.min(3,p.reached)):p.stage, pilotSolved:p.pilotSolved===true, mix:cleanMix(p.mix)??forwardMix, goals, fault:isWheelId(p.fault)?p.fault:null, flips:cleanFlags(p.flips)??noReversal, done:p.done===true, notes:typeof p.notes==='string'?p.notes.slice(0,3000):''});
      }
    } catch {}
    setReady(true);
  },[]);
  useEffect(()=>{if(ready){try{localStorage.setItem(roverLessonStorage,JSON.stringify(saved));window.dispatchEvent(new Event('rover-first-lesson-progress'));}catch{}}},[saved,ready]);
  useEffect(()=>{reset(trial);setHit(null);setTest(null);},[trial,reset]);
  useEffect(()=>{if(ready&&saved.stage>=2&&!saved.fault)setSaved(p=>p.fault?p:{...p,fault:randomWheel()});},[ready,saved.stage,saved.fault]);
  useEffect(()=>{
    if(!run.evidence.collision||saved.stage!==0)return;
    setHit(lastTurn.current?'turn':'drive');
    // A blocked step springs back to the last safe pose, so the rover stays on the 25 cm / 30° grid and never stays skewed.
    const pose=before.current,timer=setTimeout(()=>place(pose),450);return()=>clearTimeout(timer);
  },[run.evidence.collision,saved.stage,place]);
  const dock = dockReadout(run.pose,trial.world);
  const pilotArrived = saved.stage===0&&!run.running&&!run.evidence.collision&&dock.parked&&run.evidence.travel>.2;
  useEffect(()=>{if(pilotArrived){setHit(null);setSaved(p=>p.pilotSolved?p:{...p,pilotSolved:true});}},[pilotArrived]);
  const testFinished = !!test && !run.running && run.ended>test.ended;
  const repaired = !!test && test.kind==='check' && testFinished && test.passed;
  useEffect(()=>{if(repaired)setSaved(p=>p.done?p:{...p,done:true});},[repaired]);
  useEffect(()=>{if(ready&&!intro){const frame=requestAnimationFrame(()=>{heading.current?.scrollIntoView({block:'start',behavior:'instant'});heading.current?.focus({preventScroll:true});});return()=>cancelAnimationFrame(frame);}},[saved.stage,intro,ready]);
  const enter = (stage:number) => {stop();setHint(null);setSaved(p=>({...p,stage,reached:Math.max(p.reached,stage)}));};

  /* Part 1: manual driving in the aisle */
  const step = (velocity:Velocity, amount?:number) => {if(run.running)return; lastTurn.current = velocity.omega!==0; if(run.evidence.collision) clearCollision(); else before.current = {...run.pose}; jog(velocity,amount);};
  const safe = before.current, aisleMiss = hit==='drive'&&safe.x<shelvesX&&Math.abs(safe.y-aisleY)<.6&&Math.abs(safe.y-aisleY)>.01 ? Math.round((safe.y-aisleY)*100) : 0;
  const restartPilot = () => {reset(trial);setHit(null);};

  /* Part 2: wheel mixing */
  const playMix = (mix:WheelMix) => {reset(trial);drive(mixVelocity(mix),1.2);};
  const setWheel = (id:WheelId, value:WheelSetting) => {
    const mix = {...saved.mix,[id]:value};
    setSaved(p=>({...p,mix,goals:{right:p.goals.right||mixMeetsGoal(mix,'right'),'turn-right':p.goals['turn-right']||mixMeetsGoal(mix,'turn-right')}}));
    playMix(mix);
  };
  const loadExample = (mix:WheelMix) => {setSaved(p=>({...p,mix}));playMix(mix);};
  const goalsMet = saved.goals.right&&saved.goals['turn-right'];
  const mixResult = classifyMix(saved.mix), response = mixResponse(saved.mix);

  /* Part 3: wiring diagnosis */
  const fault = saved.fault ?? 'fl';
  const reversed = combineReversal(fault, saved.flips);
  const runTest = (command:TestCommand, kind:'test'|'check') => {
    const {velocity,seconds} = testCommand(command);
    const actual = wiredVelocity(velocity,reversed), wheels = wiredWheels(velocity,reversed);
    const outcome = simulateWired(command,reversed,trial.world), readout = dockReadout(outcome.pose,trial.world);
    reset(trial);
    setTest({kind,command,actual,wheels,passed:kind==='check'&&outcome.parked&&wiringCorrect(reversed),centimetres:readout.centimetres,angle:readout.angle,ended:run.ended});
    drive(actual,seconds);
  };
  const newFault = () => {stop();setTest(null);reset(trial);setSaved(p=>({...p,fault:wheelIds.filter(id=>id!==p.fault)[Math.floor(Math.random()*3)],flips:noReversal}));};
  const toggleFlip = (id:WheelId) => {stop();setTest(null);reset(trial);setSaved(p=>({...p,flips:{...p.flips,[id]:!p.flips[id]}}));};
  const sideOf = (id:WheelId) => id==='fl'||id==='rl' ? t('doľava','to the left') : t('doprava','to the right');
  const driftOf = (id:WheelId) => id==='fl'||id==='rr' ? t('doľava','to the left') : t('doprava','to the right');

  const download = () => {
    const text = [
      t('BendaLabs · Mecanum rover: kontrola zapojenia motorov','BendaLabs · Mecanum rover: motor wiring check'),'',
      t('1. Zdvihni rover tak, aby sa kolesá nedotýkali podložky.','1. Lift the rover so that no wheel touches the surface.'),
      t('2. Spusti každý motor zvlášť krátko dopredu. Zapíš, či sa koleso točí dopredu.','2. Run each motor on its own briefly forward. Note whether the wheel turns forward.'),
      t('3. Koleso, ktoré sa točí opačne: prehoď dva vodiče motora na výstupe drivera, alebo otoč znamienko tohto motora v programe.','3. A wheel turning the wrong way: swap the motor’s two wires at the driver output, or invert that motor’s sign in the program.'),
      t('4. Polož rover na zem. Jazda dopredu: nemá sa stáčať ani sunúť do strany.','4. Put the rover down. Drive forward: it must not turn or drift sideways.'),
      t('5. Jazda bokom doľava a doprava: predok má smerovať stále rovnako.','5. Slide left and right: the front must keep pointing the same way.'),'',
      t('Ako čítať chybu pri jazde dopredu','Reading a fault while driving forward'),
      t('- stáča sa doľava a sunie doľava → predné ľavé','- turns left and drifts left → front left'),
      t('- stáča sa doľava a sunie doprava → zadné ľavé','- turns left and drifts right → rear left'),
      t('- stáča sa doprava a sunie doprava → predné pravé','- turns right and drifts right → front right'),
      t('- stáča sa doprava a sunie doľava → zadné pravé','- turns right and drifts left → rear right'),'',
      t('Moje poznámky','My notes'), saved.notes,'',
      t('Postup vychádza z ideálneho modelu. Na skutočnom roveri spôsobí povrch, záťaž a rozdiely motorov malé odchýlky aj pri správnom zapojení.','Based on the ideal model. On a real rover, surface, load and motor differences cause small deviations even with correct wiring.'),
    ].join('\n');
    const url=URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=t('BendaLabs-kontrola-motorov.txt','BendaLabs-motor-check.txt');a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  };

  const stages=[t('Vyskúšaj pohyb','Try the movement'),t('Pochop kolesá','Understand the wheels'),t('Nájdi poruchu','Find the fault')];
  const shownWheels = run.running ? (saved.stage===2 ? test?.wheels : saved.stage===1 ? mixWheels(saved.mix) : undefined) : undefined;
  return <article className="rover-lesson">
    <header className="rl-heading"><div><span className="eyebrow">{t('01 / POHYB MOBILNÉHO ROBOTA','01 / MOBILE ROBOT MOTION')}</span><h1>{t('Prečo tento robot dokáže jazdiť bokom?','Why can this robot drive sideways?')}</h1></div><span className="rl-free">{t('Zadarmo · bez registrácie','Free · no sign-up')}</span></header>
    <nav className="rl-stages" aria-label={t('Priebeh lekcie','Lesson progression')}>{stages.map((label,i)=><button key={i} disabled={i>saved.reached} aria-current={saved.stage===i?'step':undefined} onClick={()=>enter(i)}><span>{i+1}</span>{label}</button>)}</nav>
    <h2 ref={heading} tabIndex={-1} className="rl-section-heading">{saved.stage===3?t('Čo teraz dokážeš použiť','What you can now apply'):stages[saved.stage]}</h2>

    {saved.stage===0&&<>
      <div className="rl-task"><strong>{t('Zaparkuj v úzkej uličke medzi regálmi','Park in the narrow aisle between the shelves')}</strong><p>{t(`Vyveď rover zo stanice dole a zaparkuj ho v zelenom mieste predkom k hornému regálu. Ulička má ${aisleCm} cm, podvozok ${chassisCm} cm. Naplánuj si, kde sa otočíš: budeš potrebovať jazdu, otočenie aj posun bokom.`,`Drive the rover out of its station at the bottom and park it in the green bay with its front toward the upper shelf. The aisle is ${aisleCm} cm wide, the chassis ${chassisCm} cm. Plan where you will turn: you will need driving, turning and sliding sideways.`)}</p></div>
      <div className="rl-workspace"><div className="rl-scene"><MecanumScene lesson initialTop lang={lang} pose={run.pose} velocity={run.velocity} world={trial.world} trail={run.trail}/><DockStatus distance={dock.centimetres} angle={dock.angle} lang={lang}/></div>
        <div className="rl-controls"><h3>{t('Sadni za ovládanie','Take the controls')}</h3><p>{t('Klikni na krok, podrž na opakovanú jazdu. Šípka na podvozku označuje predok robota.','Click for a step; hold to keep driving. The chassis arrow marks the robot front.')}</p><PilotControls lang={lang} onStep={step} onStop={()=>stop()} disabled={intro}/><p className="rl-keyboard">{t('W A S D · jazda a bočný posun\nQ / E · otáčanie · Esc · STOP','W A S D · driving and sideways movement\nQ / E · turning · Esc · STOP')}</p><button className="rl-secondary" onClick={restartPilot}><RotateCcw size={16}/>{t('Vrátiť rover na štart','Return rover to start')}</button></div>
      </div>
      <div className={'rl-result '+(pilotArrived?'success':'')} role="status">{pilotArrived?<><strong>{t('Zaparkované predkom k regálu.','Parked facing the shelf.')}</strong><p>{t('Otočil si sa tam, kde bolo miesto, a do uličky si vošiel bokom. Robot s dvomi poháňanými kolesami, napríklad robotický vysávač, by musel do uličky vojsť čelom a pri cieli by sa už neotočil. Mecanum podvozok to zvládne, lebo jeho štyri kolesá vedia tlačiť aj do strany.','You turned where there was room and entered the aisle sideways. A robot with two driven wheels, such as a robot vacuum, would have to enter nose first and could not turn at the bay. The Mecanum chassis manages because its four wheels can also push to the side.')}</p><button className="button primary" onClick={()=>enter(1)}>{t('Pozrieť sa, ako to kolesá robia','See how the wheels do it')}<ArrowRight size={18}/></button></>
        :hit==='turn'?<><strong>{t('Na otočenie tu nie je miesto.','There is no room to turn here.')}</strong><p>{t(`Pri otáčaní na mieste opisujú rohy podvozku kruh s priemerom ${circleCm} cm, širší než podvozok. Roh by narazil, preto sa rover vrátil do pôvodného natočenia. Otoč sa tam, kde je okolo aspoň ${circleCm} cm voľna.`,`When turning on the spot, the chassis corners sweep a circle ${circleCm} cm across, wider than the chassis. A corner would hit, so the rover returned to its previous heading. Turn where there is at least ${circleCm} cm of clear space around it.`)}{inAisle(run.pose)?t(' V uličke sa už neotočíš: vyjdi z nej a vojdi späť bokom.',' You cannot turn inside the aisle: leave it and come back in sideways.'):''}</p></>
        :hit==='drive'?<><strong>{t('Rover narazil, preto cúvol na posledné voľné miesto.','The rover hit something, so it moved back to the last free spot.')}</strong><p>{aisleMiss?t(`Do uličky sa nezmestíš: stred roveru je o ${Math.abs(aisleMiss)} cm ${aisleMiss>0?'vyššie':'nižšie'} než stred uličky. Posuň sa ${aisleMiss>0?'nižšie':'vyššie'} a skús to znova. Ulička nechá na každej strane len 5 cm.`,`You do not fit into the aisle: the rover centre is ${Math.abs(aisleMiss)} cm ${aisleMiss>0?'above':'below'} the aisle centre. Move ${aisleMiss>0?'down':'up'} and try again. The aisle leaves only 5 cm on each side.`):t('Podvozok potrebuje voľné miesto celou svojou šírkou. Skús iný smer.','The chassis needs clear space across its whole width. Try another direction.')}</p></>
        :dock.centimetres<=15&&!dock.aligned&&!run.running?<><strong>{t('Si na mieste, ale predok smeruje inam.','You are in place, but the front points elsewhere.')}</strong><p>{t('Cieľ chce predok k regálu. V uličke sa neotočíš, takže vyjdi von, otoč sa a vojdi späť bokom.','The bay needs the front toward the shelf. You cannot turn in the aisle, so drive out, turn, and come back in sideways.')}</p></>
        :<p>{t('Zelený obrys je cieľ. Šípka v ňom ukazuje, kam má smerovať predok.','The green outline is the target. Its arrow shows where the front must point.')}</p>}</div>
      {saved.pilotSolved&&!pilotArrived&&<button className="rl-secondary rl-resume" onClick={()=>enter(1)}>{t('Pokračovať k vysvetleniu','Continue to the explanation')}<ArrowRight size={16}/></button>}
    </>}

    {saved.stage===1&&<>
      <div className="rl-task"><strong>{t('Ovládaj každé koleso zvlášť','Control each wheel separately')}</strong><p>{t('Každé koleso má vlastný motor. Nastav ho na dopredu, stoj alebo dozadu a rover hneď ukáže, kam ho táto kombinácia posunie. Pôdorys ukazuje, kam tlačí každé koleso.','Each wheel has its own motor. Set it to forward, stop or backward and the rover immediately shows where that combination moves it. The plan shows where each wheel pushes.')}</p></div>
      <div className="rl-goals"><span>{t('Tvoja úloha: nájdi nastavenie pre dva pohyby, ktoré si ešte nevidel.','Your task: find the settings for two movements you have not seen yet.')}</span>
        <ul>{mixGoals.map(goal=><li key={goal} className={saved.goals[goal]?'met':''}>{saved.goals[goal]?<Check size={16}/>:<Circle size={16}/>}<strong>{goal==='right'?t('Bokom doprava','Slide right'):t('Otočenie doprava na mieste','Turn right on the spot')}</strong>{!saved.goals[goal]&&<button onClick={()=>setHint(hint===goal?null:goal)} aria-expanded={hint===goal}>{t('Pomôcka','Hint')}</button>}</li>)}</ul>
        {hint&&!saved.goals[hint]&&<p className="rl-hint">{hint==='right'?t('Bokom doľava si môžeš načítať ako ukážku. Pre opačný smer nastav každé koleso opačne než pri posune doľava.','You can load Slide left as an example. For the opposite direction, set every wheel opposite to the slide-left setting.'):t('Pri otáčaní pracuje ľavá strana proti pravej, ako pri pásovom vozidle. Pri otočení doprava ide ľavá strana dopredu a pravá dozadu.','When turning, the left side works against the right, like a tracked vehicle. To turn right, the left side drives forward and the right side backward.')}</p>}
        <div className="rl-examples"><span>{t('Ukážky:','Examples:')}</span><button onClick={()=>loadExample(forwardMix)}>{names.forward[lang==='sk'?0:1]}</button><button onClick={()=>loadExample({fl:-1,fr:1,rl:1,rr:-1})}>{names.left[lang==='sk'?0:1]}</button></div>
      </div>
      <div className="rl-explanation-grid rl-wheel-lab"><div className="rl-demo"><MecanumScene lesson lang={lang} pose={run.pose} velocity={run.velocity} wheels={shownWheels} world={trial.world} trail={run.trail} showTarget={false}/><p className="rl-caption">{run.running?t('Rover vykonáva tvoje nastavenie.','The rover is running your setting.'):t('Každá zmena kolesa spustí rover znova zo stredu.','Every wheel change restarts the rover from the centre.')} <button className="rl-inline" onClick={()=>playMix(saved.mix)}>{t('Prehrať znova','Replay')}</button></p></div>
        <div className="rl-mixer"><WheelPattern image={planImage} mix={saved.mix} lang={lang} result={resultLabel(mixResult,response,lang)}/>
          <div className="rl-wheel-controls" role="group" aria-label={t('Nastavenie štyroch kolies','Settings of the four wheels')}>{wheelIds.map(id=><fieldset key={id}><legend>{pick(wheelNames[id])}</legend><div>{settings.map(value=><button key={value} aria-pressed={saved.mix[id]===value} aria-label={`${pick(wheelNames[id])}: ${value===1?t('dopredu','forward'):value===-1?t('dozadu','backward'):t('stoj','stop')}`} onClick={()=>setWheel(id,value)}>{value===1?<ArrowUp size={14}/>:value===-1?<ArrowDown size={14}/>:<span className="rl-dot"/>}{value===1?t('Dopredu','Forward'):value===-1?t('Dozadu','Backward'):t('Stoj','Stop')}</button>)}</div></fieldset>)}</div>
          <Telemetry lang={lang} actual={mixVelocity(saved.mix)}/>
        </div>
      </div>
      <div className={'rl-result '+(goalsMet?'success':'')} role="status">{goalsMet?<><strong>{t('Obe kombinácie sedia.','Both combinations are right.')}</strong><p>{t('Bočný posun: diagonálne páry kolies idú proti sebe. Otáčanie: ľavá strana proti pravej. Teraz to využiješ na nájdenie skutočnej chyby.','Sideways: the diagonal wheel pairs run against each other. Turning: the left side against the right. Now you will use this to find a real fault.')}</p><button className="button primary" onClick={()=>enter(2)}>{t('Pokračovať k poruche','Continue to the fault')}<ArrowRight size={18}/></button></>
        :Math.abs(response.fight)>1e-9?<><strong>{t('Kolesá sa navzájom pretláčajú.','The wheels are fighting each other.')}</strong><p>{t('Predná a zadná dvojica tlačia proti sebe. Ideálny model ich príspevky vyruší; skutočné kolesá by preklzávali a míňali energiu bez pohybu.','The front and rear pairs push against each other. The ideal model cancels their contributions; real wheels would slip and waste energy without moving.')}</p></>
        :<p>{t('Sleduj žlté šípky: zložky, ktoré mieria proti sebe, sa vyrušia. Tie, ktoré mieria rovnako, sa sčítajú.','Watch the yellow arrows: components pointing against each other cancel. Those pointing the same way add up.')}</p>}</div>
      <div className="rl-explain-copy"><section><h3>{t('Prečo koleso tlačí šikmo','Why a wheel pushes diagonally')}</h3><p>{t('Po obvode Mecanum kolesa sú voľne otočné valčeky naklonené o 45°. Keď sa koleso točí, valček sa po podlahe v jednom smere kotúľa a v druhom tlačí. Preto každé koleso posúva podvozok šikmo: žltá šípka v pôdoryse.','Around a Mecanum wheel sit freely spinning rollers angled at 45°. As the wheel turns, a roller rolls along the floor in one direction and pushes in the other. That is why each wheel moves the chassis diagonally: the yellow arrow in the plan.')}</p></section>
        <section><h3>{t('Štyri motory, tri pohyby','Four motors, three movements')}</h3><p>{t('Každú šikmú šípku rozlož na zložku dopredu a zložku do strany (prerušované čiary). Z ich súčtu vzniká jazda dopredu, posun do strany a otáčanie, aj ich kombinácie. Obyčajné koleso vie tlačiť len dopredu a dozadu.','Split each diagonal arrow into a forward and a sideways component (dashed lines). Their sum gives forward driving, sideways sliding and turning, and any combination of them. An ordinary wheel only pushes forward and backward.')}</p></section>
      </div>
    </>}

    {saved.stage===2&&<>
      <div className="rl-task"><strong>{t('Po zostavení jazdí rover zle','After assembly the rover drives wrong')}</strong><p>{t('Rover je poskladaný a má sa posunúť bokom doľava o 100 cm do zeleného miesta. Jeden zo štyroch motorov je však zapojený naopak: točí sa opačne, než mu program káže. Spusti testy, z merania zisti, ktorý to je, a prehoď mu vodiče.','The rover is assembled and should slide 100 cm to the left into the green bay. But one of its four motors is wired in reverse: it turns opposite to what the program commands. Run tests, use the measurements to find which one, and swap its wires.')}</p></div>
      <div className="rl-workspace rl-diagnosis"><div className="rl-scene"><MecanumScene lesson lang={lang} pose={run.pose} velocity={run.velocity} wheels={shownWheels} world={trial.world} trail={run.trail}/>{test&&<div className="rl-test-label">{test.kind==='check'?t('Kontrolná jazda','Check run'):t('Test','Test')}: <strong>{pick(testNames[test.command])}</strong>{run.running&&<button aria-label={t('Zastaviť jazdu','Stop the run')} onClick={()=>stop()}><Octagon size={14}/>STOP</button>}</div>}<Telemetry lang={lang} actual={test?.actual} expected={test?testCommand(test.command).velocity:undefined}/></div>
        <div className="rl-controls"><h3>{t('Testovacie jazdy','Test runs')}</h3><p>{t('Pri správnom zapojení prejde rover 100 cm alebo sa otočí o 90°. Meranie ukáže, ako sa skutočne hýbe.','With correct wiring the rover travels 100 cm or turns 90°. The measurement shows how it really moves.')}</p>
          <div className="rl-test-buttons">{testCommands.map(command=><button key={command} disabled={run.running} onClick={()=>runTest(command,'test')}>{command==='forward'?<ArrowUp size={16}/>:command==='left'?<ArrowLeft size={16}/>:<RotateCcw size={16}/>}{pick(testNames[command])}</button>)}</div>
          <h3>{t('Zapojenie motorov','Motor wiring')}</h3>
          <div className="rl-wiring">{wheelIds.map(id=><button key={id} aria-pressed={saved.flips[id]} disabled={run.running} onClick={()=>toggleFlip(id)}><Shuffle size={15}/><span>{pick(wheelNames[id])}</span><small>{saved.flips[id]?t('vodiče prehodené','wires swapped'):t('pôvodne','as built')}</small></button>)}</div>
          <button className="button primary rl-check" disabled={run.running} onClick={()=>runTest('left','check')}><ArrowRight size={17}/>{t('Kontrolná jazda do cieľa','Check run into the bay')}</button>
          <button className="rl-secondary" onClick={()=>{stop();reset(trial);setTest(null);}}><RotateCcw size={16}/>{t('Vrátiť rover na štart','Return rover to start')}</button>
        </div>
      </div>
      <div className={'rl-result '+(repaired?'success':'')} role="status">{repaired?<><strong>{t('Porucha opravená.','Fault repaired.')}</strong><p>{t(`Naopak bolo zapojené ${pick(wheelNamesLower[fault])} koleso. Pri jazde dopredu sa preto rover stáčal ${sideOf(fault)} a sunul ${driftOf(fault)}: presne to ukázalo meranie. Na skutočnom roveri to opravíš prehodením dvoch vodičov motora alebo zmenou znamienka tohto motora v programe.`,`The ${pick(wheelNamesLower[fault])} wheel was wired in reverse. That is why, driving forward, the rover turned ${sideOf(fault)} and drifted ${driftOf(fault)}: exactly what the measurement showed. On a real rover you fix this by swapping the motor’s two wires or by inverting that motor’s sign in the program.`)}</p><div className="rl-result-actions"><button className="button primary" onClick={()=>enter(3)}>{t('Dokončiť lekciu','Finish the lesson')}<ArrowRight size={18}/></button><button className="rl-secondary" onClick={newFault}><Shuffle size={16}/>{t('Precvičiť inú poruchu','Practise another fault')}</button></div></>
        :run.running?<p>{t('Rover jazdí. Sleduj stopu a meranie.','The rover is driving. Watch the trail and the measurement.')}</p>
        :test?.kind==='check'&&testFinished?<><strong>{t('Kontrolná jazda neprešla.','The check run failed.')}</strong><p>{t(`Rover skončil ${test.centimetres} cm od stredu cieľa s odchýlkou natočenia ${test.angle}°. Zapojenie ešte nie je správne. Spusti test dopredu a porovnaj meranie s pomôckou nižšie.`,`The rover ended ${test.centimetres} cm from the bay centre with a heading error of ${test.angle}°. The wiring is not right yet. Run the forward test and compare the measurement with the guide below.`)}</p></>
        :test?.kind==='test'&&testFinished?<p>{t('Porovnaj namerané hodnoty s očakávanými. Ktorým smerom sa rover stáča a kam sa sunie?','Compare the measured values with the expected ones. Which way does the rover turn and where does it drift?')}</p>
        :<p>{t('Začni testom dopredu: všetky kolesá sa majú točiť rovnako, takže každé stočenie alebo bočný drift ukazuje na obrátené koleso.','Start with the forward test: all wheels should turn the same way, so any turning or sideways drift points to the reversed wheel.')}</p>}</div>
      <details className="rl-help" open><summary>{t('Ako čítať meranie','How to read the measurement')}</summary>
        <p>{t('Stočenie: ak sa rover pri jazde dopredu otáča doľava, ľavá strana zaostáva, takže obrátené koleso je vľavo. Ak sa otáča doprava, je vpravo.','Turning: if the rover turns left while driving forward, its left side lags, so the reversed wheel is on the left. If it turns right, it is on the right.')}</p>
        <p>{t('Bočný drift: pri jazde dopredu predné ľavé a zadné pravé koleso tlačia šikmo doprava, predné pravé a zadné ľavé šikmo doľava (pôdorys z časti 2). Obrátené koleso tlačí na opačnú stranu, takže rover sa sunie tam, kam ho toto koleso bežne netlačí.','Sideways drift: driving forward, the front-left and rear-right wheels push diagonally right, the front-right and rear-left diagonally left (the plan from part 2). A reversed wheel pushes the opposite way, so the rover drifts where that wheel normally does not push it.')}</p></details>
    </>}

    {saved.stage===3&&<div className="rl-finish"><span className="rl-complete"><Check size={20}/>{t('Lekcia dokončená','Lesson complete')}</span><h3>{t('Vieš, ako Mecanum rover jazdí bokom a ako nájsť zle zapojený motor.','You know how a Mecanum rover slides sideways and how to find a miswired motor.')}</h3>
      <ul className="rl-learned">
        <li>{t(`Bočný posun rieši miesta, kde sa robot nemá kde otočiť. Otáčanie potrebuje kruh väčší než šírka podvozku: v modeli ${circleCm} cm pri šírke ${chassisCm} cm.`,`Sliding sideways solves places where a robot has no room to turn. Turning needs a circle larger than the chassis width: ${circleCm} cm for a ${chassisCm} cm chassis in the model.`)}</li>
        <li>{t('Každé koleso tlačí šikmo. Pohyb robota je súčet štyroch príspevkov: diagonálne páry proti sebe dávajú posun do strany, ľavá strana proti pravej otáčanie.','Each wheel pushes diagonally. The robot’s motion is the sum of four contributions: diagonal pairs against each other give sideways sliding, left side against right gives turning.')}</li>
        <li>{t('Chybu zapojenia prezradí meranie: stočenie ukáže stranu, bočný drift konkrétne koleso.','Measurement reveals a wiring fault: turning shows the side, sideways drift the exact wheel.')}</li>
      </ul>
      <div className="rl-transfer"><img src="/university-assets/workshop-mecanum.jpeg" alt={t('Skutočný Mecanum rover BendaLabs','The real BendaLabs Mecanum rover')}/><div><h3>{t('Pred prvou jazdou skutočného roveru','Before the first drive of a real rover')}</h3><p>{t('Zdvihni rover tak, aby sa kolesá nedotýkali podložky. Spusti každý motor zvlášť krátko dopredu a skontroluj smer kolesa. Až potom skús jazdu dopredu a bokom na zemi.','Lift the rover so the wheels do not touch the surface. Run each motor on its own briefly forward and check the wheel direction. Only then try driving forward and sideways on the floor.')}</p><p>{t('Simulácia predpokladá ideálne kolesá bez preklzu. Povrch, záťaž a rozdiely motorov spôsobia odchýlku aj pri správnom zapojení. Ako doska vôbec povie motoru dopredu alebo dozadu, je téma ďalšej lekcie.','The simulation assumes ideal wheels without slip. Surface, load and motor differences cause deviations even with correct wiring. How a board tells a motor forward or backward at all is the topic of the next lesson.')}</p></div></div>
      <label className="rl-notes">{t('Poznámka k vlastnému riešeniu','A note about your solution')}<textarea value={saved.notes} maxLength={3000} placeholder={t('Podľa čoho si spoznal obrátený motor?','How did you recognise the reversed motor?')} onChange={e=>setSaved(p=>({...p,notes:e.target.value}))}/></label><p className="rl-caption">{t('Poznámka aj postup sa ukladajú v tomto prehliadači.','Your note and progress are saved in this browser.')}</p>
      <div className="rl-finish-actions"><button className="button primary" onClick={()=>onNavigate('lesson','motor-control')}>{t('Ďalšia lekcia: Ako doska riadi motor','Next lesson: How a board drives a motor')}<ArrowRight size={17}/></button><button className="rl-secondary" onClick={download}><Download size={16}/>{t('Stiahnuť kontrolný postup pre skutočný rover','Download the check procedure for a real rover')}</button><button className="rl-secondary" onClick={()=>enter(2)}>{t('Vrátiť sa k diagnostike','Back to the diagnosis')}</button></div>{feedback}
    </div>}
    <footer className="rl-footer"><button onClick={()=>setIntro(true)}>{t('Zobraziť zadanie lekcie','Show lesson brief')}</button><button onClick={()=>onNavigate('support')}>{t('Opýtať sa tímu BendaLabs','Ask the BendaLabs team')}</button><details><summary>{t('Technický zdroj a model','Technical source and model')}</summary><p>{t('Ideálny Mecanum model počíta pohyb podvozku zo štyroch pohonov. Nezahŕňa preklz, zotrvačnosť ani elektrické limity motorov. Rozmery podvozku sú rozmery modelu, nie meranie skutočného roveru.','The ideal Mecanum model computes chassis motion from four drives. It excludes slip, inertia and electrical motor limits. Chassis dimensions belong to the model, not to a measurement of the real rover.')}</p><a href="https://docs.wpilib.org/en/stable/docs/software/kinematics-and-odometry/mecanum-drive-kinematics.html" target="_blank" rel="noreferrer">WPILib · Mecanum drive kinematics</a></details></footer>
    {intro&&<Dialog.Root open onOpenChange={setIntro}><Dialog.Portal container={typeof document!=='undefined'?document.getElementById('robotics-university'):undefined}><Dialog.Overlay className="course-intro-overlay"/><Dialog.Content className="rl-intro" onInteractOutside={e=>e.preventDefault()}><span className="eyebrow">{t('PRVÁ LEKCIA / MECANUM ROVER','FIRST LESSON / MECANUM ROVER')}</span><Dialog.Title>{t('Začni pohybom. Potom odhaľ jeho princíp.','Start with movement. Then uncover its principle.')}</Dialog.Title><Dialog.Description>{t('Vyvezieš rover zo stanice a zaparkuješ ho v úzkej uličke, zistíš, čo robí každé zo štyroch kolies, a nájdeš zle zapojený motor. Nepotrebuješ vybavenie ani predchádzajúce znalosti.','Drive the rover out of its station and park it in a narrow aisle, find out what each of the four wheels does, and track down a miswired motor. No equipment or prior knowledge needed.')}</Dialog.Description><BriefDiagram image={planImage} lang={lang}/><p>{t('Šípka na podvozku označuje predok. Zelené miesto aj jeho šípka ukazujú požadovanú polohu a natočenie.','The chassis arrow marks the front. The green bay and its arrow show the required position and heading.')}</p><Dialog.Close asChild><button className="button primary">{saved.stage>0?t('Pokračovať v lekcii','Continue the lesson'):t('Rozumiem zadaniu, idem jazdiť','Got it, let me drive')}<ArrowRight size={18}/></button></Dialog.Close></Dialog.Content></Dialog.Portal></Dialog.Root>}
  </article>;
}

function resultLabel(result:MixResult, r:ReturnType<typeof mixResponse>, lang:Lang) {
  const sk = lang==='sk';
  if (result==='stop') return sk?'Stojí':'Standing still';
  if (result==='fight') return sk?'Stojí, kolesá sa pretláčajú':'Still, wheels fighting';
  if (result==='diagonal') return (sk?'Šikmo ':'Diagonally ')+(r.forward>0?(sk?'dopredu ':'forward '):(sk?'dozadu ':'backward '))+(r.left>0?(sk?'doľava':'left'):(sk?'doprava':'right'));
  if (result==='arc') return sk?'Jazda v oblúku':'Driving in an arc';
  return names[result][sk?0:1];
}

function Telemetry({lang,actual,expected}:{lang:Lang;actual?:Velocity;expected?:Velocity}) {
  const sk = lang==='sk';
  const a = telemetry(actual??zeroVelocity), e = expected ? telemetry(expected) : null;
  const word = (v:number, pos:[string,string], neg:[string,string]) => v===0 ? '0' : `${Math.abs(v)} ${(v>0?pos:neg)[sk?0:1]}`;
  const rows: [string, (x:ReturnType<typeof telemetry>)=>string][] = [
    [sk?'Pozdĺžne, cm/s':'Along, cm/s', x=>word(x.forward,['dopredu','forward'],['dozadu','backward'])],
    [sk?'Bočne, cm/s':'Sideways, cm/s', x=>word(x.left,['doľava','left'],['doprava','right'])],
    [sk?'Otáčanie, °/s':'Turning, °/s', x=>word(x.turn,['doľava','left'],['doprava','right'])],
  ];
  return <table className="rl-telemetry"><caption>{e?(sk?'Meranie pohybu voči robotu':'Motion measured relative to the robot'):(sk?'Výsledný pohyb voči robotu':'Resulting motion relative to the robot')}</caption>
    <thead><tr><th scope="col"><span className="rl-sr">{sk?'Veličina':'Quantity'}</span></th>{e&&<th scope="col">{sk?'Očakávané':'Expected'}</th>}<th scope="col">{e?(sk?'Namerané':'Measured'):(sk?'Hodnota':'Value')}</th></tr></thead>
    <tbody>{rows.map(([label,f])=>{const differs=!!e&&f(a)!==f(e);return <tr key={label} className={differs?'differs':''}><th scope="row">{label}</th>{e&&<td>{f(e)}</td>}<td>{actual?f(a):'—'}</td></tr>;})}</tbody></table>;
}

function DockStatus({distance,angle,lang}:{distance:number;angle:number;lang:Lang}) {return <div className="rl-dock"><span>{lang==='sk'?'Od stredu cieľa':'From target centre'}<strong>{distance} cm</strong></span><span>{lang==='sk'?'Odchýlka natočenia':'Heading error'}<strong>{angle}°</strong></span></div>;}

function PilotControls({lang,onStep,onStop,disabled}:{lang:Lang;onStep:(v:Velocity,amount?:number)=>void;onStop:()=>void;disabled:boolean}) {
  const repeat=useRef<ReturnType<typeof setInterval>|null>(null),refs=useRef({onStep,onStop,disabled});refs.current={onStep,onStop,disabled};
  const release=()=>{if(repeat.current)clearInterval(repeat.current);repeat.current=null;};
  const begin=(motion:LessonMotion)=>{
    if(refs.current.disabled)return;release();
    const velocity=isTurn(motion)?{vx:0,vy:0,omega:motion==='turn-left'?Math.PI:-Math.PI}:directionVelocity(motion as 'forward'|'backward'|'left'|'right',1.8);
    const step=()=>refs.current.onStep(velocity,isTurn(motion)?Math.PI/6:.25);step();repeat.current=setInterval(step,200);
  };
  useEffect(()=>{
    const keys:Record<string,LessonMotion>={w:'forward',s:'backward',a:'left',d:'right',q:'turn-left',e:'turn-right'};
    const down=(event:KeyboardEvent)=>{if(event.target instanceof HTMLInputElement||event.target instanceof HTMLTextAreaElement||event.target instanceof HTMLSelectElement||document.querySelector('[role="dialog"]')||event.ctrlKey||event.metaKey||event.altKey||event.repeat)return;if(event.key==='Escape'){release();refs.current.onStop();return;}const m=keys[event.key.toLowerCase()];if(m){event.preventDefault();begin(m);}};
    const up=(event:KeyboardEvent)=>{if(keys[event.key.toLowerCase()])release();};
    const hide=()=>{if(document.hidden){release();refs.current.onStop();}};
    window.addEventListener('keydown',down);window.addEventListener('keyup',up);window.addEventListener('blur',release);document.addEventListener('visibilitychange',hide);
    return()=>{release();window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);window.removeEventListener('blur',release);document.removeEventListener('visibilitychange',hide);};
  },[]);
  const icons={forward:ArrowUp,backward:ArrowDown,left:ArrowLeft,right:ArrowRight,'turn-left':RotateCcw,'turn-right':RotateCw};
  return <div className="rl-pad">{lessonMotions.map(m=>{const Icon=icons[m];return <button key={m} className={m} disabled={disabled} onPointerDown={e=>{e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);begin(m);}} onPointerUp={release} onPointerCancel={release} onLostPointerCapture={release} onClick={e=>{if(e.detail===0){begin(m);release();}}}><Icon size={23}/><span>{names[m][lang==='sk'?0:1]}</span></button>;})}<button className="stop" onClick={()=>{release();onStop();}}><Octagon size={23}/>STOP</button></div>;
}

function WheelPattern({image,mix,lang,result}:{image?:string;mix:WheelMix;lang:Lang;result:string}) {
  const positions=[[90,78],[370,78],[90,260],[370,260]],labels=lang==='sk'?['Predné ľavé','Predné pravé','Zadné ľavé','Zadné pravé']:['Front left','Front right','Rear left','Rear right'];
  const contacts=[[168,116],[292,116],[168,234],[292,234]];
  return <figure className="rl-wheel-pattern">
    <svg viewBox="0 0 460 340" role="img" aria-label={lang==='sk'?`Štyri pohony a ich šikmé príspevky. Výsledok: ${result}`:`Four drives and their angled contributions. Result: ${result}`}>
      <defs><marker id="rl-wheel-effect" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" fill="#f2c779"/></marker></defs>
      <text x="230" y="24" textAnchor="middle">{lang==='sk'?'PREDOK ROBOTA':'ROBOT FRONT'} ↑</text>
      {image&&<image href={image} x="120" y="64" width="220" height="220" transform="rotate(-90 230 174)"/>}
      {wheelIds.map((id,i)=>{const [x,y]=positions[i],[cx,cy]=contacts[i],value=mix[id],sign=value,dx=27*[1,-1,-1,1][i]*sign,dy=-27*sign;
        const fill=value>0?'#254c34':value<0?'#493c28':'#1c2c22',stroke=value>0?'#88bf98':value<0?'#d2a665':'#5d7566',color=value>0?'#d1f4d8':value<0?'#f1d09b':'#a8bcae';
        const label=value>0?(lang==='sk'?'↑ Dopredu':'↑ Forward'):value<0?(lang==='sk'?'↓ Dozadu':'↓ Backward'):(lang==='sk'?'Stojí':'Stopped');
        return <g key={id}>
        {value!==0&&<><path d={`M${cx} ${cy}H${cx+dx}V${cy+dy}`} fill="none" stroke="#8da696" strokeDasharray="3 2" strokeWidth="1.5"/>
        <path d={`M${cx} ${cy}L${cx+dx} ${cy+dy}`} fill="none" stroke="#f2c779" strokeWidth="2.5" markerEnd="url(#rl-wheel-effect)"/></>}
        <circle cx={cx} cy={cy} r="3" fill={value!==0?'#f2c779':'#5d7566'}/>
        <path d={`M${x<230?x+48:x-48} ${y} L${cx} ${cy}`} stroke="#648b70" fill="none"/>
        <text x={x} y={y-20} textAnchor="middle" className="rl-wheel-label">{labels[i]}</text>
        <rect x={x-49} y={y-10} width="98" height="33" rx="7" fill={fill} stroke={stroke}/>
        <text x={x} y={y+12} textAnchor="middle" fill={color}>{label}</text>
      </g>;})}
      <text x="230" y="318" textAnchor="middle" className="rl-wheel-result">{lang==='sk'?'Výsledok: ':'Result: '}{result}</text>
    </svg>
    <div className="rl-wheel-legend"><span>{lang==='sk'?'Kam tlačí koleso':'Where the wheel pushes'}</span><span>{lang==='sk'?'Zložka dopredu a do strany':'Forward and sideways components'}</span></div>
    <figcaption>{lang==='sk'?'Šípky vysvetľujú ideálny pohyb; nejde o meranie síl.':'The arrows explain ideal motion; they are not force measurements.'}</figcaption>
  </figure>;
}

function BriefDiagram({image,lang}:{image?:string;lang:Lang}) {
  const sk = lang==='sk';
  return <svg className="rl-brief-diagram" viewBox="0 0 560 220" role="img" aria-label={sk?'Sklad: rover vyjde zo stanice dole, na voľnom mieste vľavo sa otočí a do úzkej uličky medzi regálmi vojde bokom':'Warehouse: the rover leaves its station at the bottom, turns in the open space on the left and slides sideways into the narrow aisle between the shelves'}>
    <rect x="16" y="10" width="528" height="200" rx="8" fill="#10281b" stroke="#42664d"/>
    <rect x="150" y="26" width="378" height="44" rx="3" fill="#3b5845"/><text x="339" y="53" textAnchor="middle" fill="#e1ece2" fontSize="13">{sk?'REGÁL':'SHELF'}</text>
    <rect x="150" y="104" width="378" height="56" rx="3" fill="#3b5845"/><text x="339" y="137" textAnchor="middle" fill="#e1ece2" fontSize="13">{sk?'REGÁL':'SHELF'}</text>
    {image&&<image href={image} x="232" y="168" width="34" height="34" transform="rotate(180 249 185)"/>}
    <path d="M226 185H86V87H300" fill="none" stroke="#94cba3" strokeWidth="2" strokeDasharray="5 4"/>
    <path d="M292 81L300 87L292 93" fill="none" stroke="#94cba3" strokeWidth="2"/>
    <circle cx="86" cy="185" r="16" fill="none" stroke="#f2c779" strokeWidth="1.5" strokeDasharray="3 3"/>
    <rect x="304" y="71" width="34" height="32" fill="#b2e2bc16" stroke="#b2e2bc" strokeWidth="2"/><path d="M321 98V77L316 83M321 77L326 83" fill="none" stroke="#b2e2bc" strokeWidth="2"/>
    <text x="346" y="92" fill="#c2e9cb" fontSize="12">{sk?'CIEĽ':'TARGET'}</text>
    <text x="226" y="202" fill="#a9c7b3" fontSize="11" textAnchor="end">{sk?'ŠTART':'START'}</text>
  </svg>;
}
