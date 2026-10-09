'use client';

import {useEffect, useMemo, useRef, useState, type ReactNode} from 'react';
import {Dialog} from 'radix-ui';
import {ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Check, Download, Octagon, Plus, RotateCcw, RotateCw, Trash2} from 'lucide-react';
import type {Lang} from '@/components/robotics-university/lib/atlas-data';
import {directionVelocity, wheelIds, wheelSpeeds, type Velocity} from '@/components/robotics-university/lib/mecanum';
import {challengeWorld, cleanLessonCommands, demoWorld, dockReadout, isTurn, lessonMotions, lessonProgram, lessonTrial, pilotWorld, roverLessonStorage, type LessonCommand, type LessonMotion} from '@/components/robotics-university/lib/rover-lesson';
import {roverPlanImage} from '@/components/robotics-university/lib/rover-plan';
import {useMecanumRun} from './use-mecanum-run';
import MecanumScene from './mecanum-scene';

const names: Record<LessonMotion, [string,string]> = {
  forward: ['Dopredu','Forward'], backward: ['Dozadu','Backward'],
  left: ['Bokom doľava','Slide left'], right: ['Bokom doprava','Slide right'],
  'turn-left': ['Otočiť doľava','Turn left'], 'turn-right': ['Otočiť doprava','Turn right'],
};
const starter: LessonCommand[] = [{motion:'forward', amount:50}];
type Saved = {stage:number; reached:number; pilotSolved:boolean; done:boolean; commands:LessonCommand[]; notes:string};
const defaults: Saved = {stage:0, reached:0, pilotSolved:false, done:false, commands:starter, notes:''};

export default function RoverFirstLesson({lang, feedback, onNavigate}:{lang:Lang; feedback?:ReactNode; onNavigate:(view:string,id?:string)=>void}) {
  const t = (sk:string,en:string) => lang==='sk'?sk:en;
  const [saved,setSaved] = useState<Saved>(defaults), [ready,setReady] = useState(false), [intro,setIntro] = useState(true);
  const [demo,setDemo] = useState<'forward'|'left'|'turn-left'>('left'), [slow,setSlow] = useState(false), [tested,setTested] = useState(false), [activeExample,setActiveExample] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const trial = useMemo(() => lessonTrial(saved.stage===0?pilotWorld:saved.stage===1?demoWorld:challengeWorld), [saved.stage]);
  const {run,start,stop,reset,jog,error} = useMecanumRun(trial,{playback:saved.stage===1?2:slow?2:8});
  const [planImage,setPlanImage] = useState<string>();
  useEffect(()=>setPlanImage(roverPlanImage()),[]);
  useEffect(()=>{
    try {
      const p = JSON.parse(localStorage.getItem(roverLessonStorage)??'null');
      if(p && Number.isInteger(p.stage) && p.stage>=0 && p.stage<=3) {
        const commands=cleanLessonCommands(p.commands);
        setSaved({stage:p.stage, reached:Number.isInteger(p.reached)?Math.max(p.stage,Math.min(3,p.reached)):p.stage, pilotSolved:p.pilotSolved===true, done:p.done===true, commands:commands??starter, notes:typeof p.notes==='string'?p.notes.slice(0,3000):''});
      }
    } catch {}
    setReady(true);
  },[]);
  useEffect(()=>{if(ready){try{localStorage.setItem(roverLessonStorage,JSON.stringify(saved));window.dispatchEvent(new Event('rover-first-lesson-progress'));}catch{}}},[saved,ready]);
  useEffect(()=>{reset(trial);setTested(false);setActiveExample(false);},[trial,reset]);
  const dock=dockReadout(run.pose,trial.world);
  const pilotArrived=saved.stage===0&&!run.running&&!run.evidence.collision&&dock.parked&&run.evidence.travel>.2;
  const challengeArrived=saved.stage===2&&tested&&run.ended>0&&!run.running&&!run.evidence.collision&&dock.parked;
  useEffect(()=>{if(pilotArrived)setSaved(p=>p.pilotSolved?p:{...p,pilotSolved:true});},[pilotArrived]);
  useEffect(()=>{if(challengeArrived)setSaved(p=>p.done?p:{...p,done:true});},[challengeArrived]);
  useEffect(()=>{if(ready&&!intro){const frame=requestAnimationFrame(()=>{heading.current?.scrollIntoView({block:'start',behavior:'instant'});heading.current?.focus({preventScroll:true});});return()=>cancelAnimationFrame(frame);}},[saved.stage,intro,ready]);
  const enter=(stage:number)=>{stop();setSaved(p=>({...p,stage,reached:Math.max(p.reached,stage)}));};
  const runProgram=()=>{setTested(true);start(lessonProgram(saved.commands),.6);};
  const playExample=(motion:typeof demo)=>{
    setDemo(motion);setActiveExample(true);
    start(lessonProgram([{motion,amount:isTurn(motion)?90:100}]),.6);
  };
  const updateCommand=(index:number,patch:Partial<LessonCommand>)=>{
    stop();setTested(false);
    setSaved(p=>({...p,commands:p.commands.map((c,i)=>i===index?{...c,...patch}:c)}));
  };
  const removeCommand=(index:number)=>{stop();setTested(false);setSaved(p=>({...p,commands:p.commands.filter((_,i)=>i!==index)}));};
  const download=()=>{
    const rows=saved.commands.map((c,i)=>`${i+1}. ${names[c.motion][lang==='sk'?0:1]} ${c.amount} ${isTurn(c.motion)?'°':'cm'}`);
    const text=[t('BendaLabs · Mecanum: od pohybu k vlastnému manévru','BendaLabs · Mecanum: from movement to your own manoeuvre'),'',t('Môj program','My program'),...rows,'',t('Moje poznámky','My notes'),saved.notes,'',t('Príkazy sú relatívne k predku robota. Program patrí k ideálnej simulácii, nie k overenému firmvéru fyzického roveru.','Commands are relative to the robot front. This program belongs to the ideal simulation, not verified physical rover firmware.')].join('\n');
    const url=URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='BendaLabs-mecanum-manever.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  };
  const stages=[t('Vyskúšaj pohyb','Try the movement'),t('Pochop kolesá','Understand the wheels'),t('Vyrieš manéver','Solve the manoeuvre')];
  const selectedVelocity=demo==='forward'?{vx:.6,vy:0,omega:0}:demo==='left'?{vx:0,vy:.6,omega:0}:{vx:0,vy:0,omega:Math.PI/3};
  const demoVelocity=run.running?run.velocity:selectedVelocity;
  const wheelValues=wheelSpeeds(demoVelocity);
  return <article className="rover-lesson">
    <header className="rl-heading"><div><span className="eyebrow">{t('01 / POHYB MOBILNÉHO ROBOTA','01 / MOBILE ROBOT MOTION')}</span><h1>{t('Prečo tento robot dokáže jazdiť bokom?','Why can this robot drive sideways?')}</h1></div><span className="rl-free">{t('Zadarmo · bez registrácie','Free · no sign-up')}</span></header>
    <nav className="rl-stages" aria-label={t('Priebeh lekcie','Lesson progression')}>{stages.map((label,i)=><button key={i} disabled={i>saved.reached} aria-current={saved.stage===i?'step':undefined} onClick={()=>enter(i)}><span>{i+1}</span>{label}</button>)}</nav>
    <h2 ref={heading} tabIndex={-1} className="rl-section-heading">{saved.stage===3?t('Čo teraz dokážeš použiť','What you can now apply'):stages[saved.stage]}</h2>

    {saved.stage===0&&<>
      <div className="rl-task"><strong>{t('Pristav náklad k regálu','Bring the load to the shelf')}</strong><p>{t('Dostaň celý rover do zeleného miesta. Jeho predok musí smerovať podľa šípky v cieli. Regál pred tebou obmedzuje jazdu dopredu — vyskúšaj aj pohyb bokom.','Move the whole rover into the green bay. Its front must follow the target arrow. The shelf ahead limits forward driving — also try a sideways move.')}</p></div>
      <div className="rl-workspace"><div className="rl-scene"><MecanumScene lesson initialTop lang={lang} pose={run.pose} velocity={run.velocity} world={trial.world} trail={run.trail}/><DockStatus distance={dock.centimetres} angle={dock.angle} lang={lang}/></div>
        <div className="rl-controls"><h3>{t('Sadni za ovládanie','Take the controls')}</h3><p>{t('Klikni na krok, podrž na opakovanú jazdu. Šípka na podvozku označuje predok robota.','Click for a step; hold to keep driving. The chassis arrow marks the robot front.')}</p><PilotControls lang={lang} onStep={jog} onStop={()=>stop()} disabled={intro}/><p className="rl-keyboard">{t('W A S D · jazda a bočný posun\nQ / E · otáčanie · Esc · STOP','W A S D · driving and sideways movement\nQ / E · turning · Esc · STOP')}</p><button className="rl-secondary" onClick={()=>reset(trial)}><RotateCcw size={16}/>{t('Vrátiť rover na štart','Return rover to start')}</button></div>
      </div>
      <div className={'rl-result '+(pilotArrived?'success':'')} role="status">{run.evidence.collision?<><strong>{t('Rover sa dotkol prekážky.','The rover touched an obstacle.')}</strong><p>{t('Vráť ho na štart a zvoľ voľný smer. Mriežka ukazuje priestor, ktorý zaberá celý podvozok.','Return to the start and choose a clear direction. Allow space for the whole chassis.')}</p></>:pilotArrived?<><strong>{t('Náklad je na mieste.','The load is in position.')}</strong><p>{t('Teraz preskúmaj, ako štyri kolesá vytvoria bočný posun a otočenie na mieste.','Now investigate how four wheels create sideways motion and turning on the spot.')}</p><button className="button primary" onClick={()=>enter(1)}>{t('Pozrieť sa, ako pohyb vzniká','See how the motion works')}<ArrowRight size={18}/></button></>:<p>{t('Zelený obrys je cieľ. Bočný posun mení polohu bez otočenia predku.','The green outline is the target. Sliding sideways changes position without turning the front.')}</p>}</div>
      {saved.pilotSolved&&!pilotArrived&&<button className="rl-secondary rl-resume" onClick={()=>enter(1)}>{t('Pokračovať k vysvetleniu','Continue to the explanation')}<ArrowRight size={16}/></button>}
    </>}

    {saved.stage===1&&<>
      <div className="rl-task"><strong>{t('Rovnaký podvozok, tri rôzne pohyby','One chassis, three different movements')}</strong><p>{t('Vyber pohyb. Ukážka ho vykoná na rovnakom roveri. Pôdorys vedľa neho ukazuje smer každého pohonu voči predku robota.','Choose a movement. The same rover performs it; the plan beside it shows each drive direction relative to the robot front.')}</p></div>
      <div className="rl-motion-tabs" aria-label={t('Porovnanie pohybov','Compare movements')}>{(['forward','left','turn-left'] as const).map(m=><button key={m} aria-pressed={demo===m} onClick={()=>playExample(m)}>{names[m][lang==='sk'?0:1]}</button>)}</div>
      <div className="rl-explanation-grid"><div className="rl-demo"><MecanumScene lesson lang={lang} pose={run.pose} velocity={run.velocity} world={trial.world} trail={run.trail} showTarget={false} playback={2}/><p className="rl-caption">{activeExample&&run.running?t('Ukážka prebieha.','Demonstration running.'):t('Kliknutím na zvolený pohyb ukážku zopakuješ.','Click the selected movement to replay it.')}</p></div><WheelPattern image={planImage} values={wheelValues} lang={lang} motion={demo}/></div>
      <div className="rl-explain-copy"><section><h3>{demo==='forward'?t('Jazda dopredu','Forward driving'):demo==='left'?t('Bočný posun','Sideways translation'):t('Otočenie na mieste','Turning on the spot')}</h3><p>{demo==='forward'?t('Všetky štyri pohony pracujú v smere pre jazdu dopredu. Pri správnom usporiadaní kolies sa bočné zložky účinkov valčekov navzájom vyrušia; podvozok sa pohybuje dopredu.','All four drives run in the forward-driving direction. With correctly arranged wheels, the sideways components from the rollers cancel; the chassis moves forward.'):demo==='left'?t('Predné ľavé a zadné pravé koleso sa otáčajú opačne než pri jazde dopredu. Druhá diagonálna dvojica zostáva v smere dopredu. Pozdĺžne zložky sa vyrušia a bočné sa sčítajú: podvozok sa posunie doľava bez zmeny natočenia.','The front-left and rear-right wheels reverse relative to forward driving. The other diagonal pair keeps its forward direction. Longitudinal components cancel and sideways components add: the chassis slides left without changing its heading.'):t('Ľavá strana pohonu pracuje dozadu, pravá dopredu. Ich účinky vytvoria otáčanie okolo stredu podvozka. Mení sa orientácia robota; jeho stred zostáva na mieste.','The left drives run backward and the right drives forward. Their combined action turns the chassis around its centre. The robot heading changes while its centre stays in place.')}</p></section>
        <section><h3>{t('Čo robia šikmé valčeky','What the angled rollers do')}</h3><p>{t('Valčeky po obvode kolesa sa môžu voľne otáčať. Ich sklon určuje smer účinku kontaktu s podlahou. Štyri samostatne riadené motory a správne usporiadané kolesá umožnia zvoliť jazdu, bočný posun alebo rotáciu. Obyčajné koleso tento priamy bočný pohyb neposkytuje.','The rollers around each wheel rotate freely. Their angle determines how the contact acts against the floor. Four independently controlled motors and correctly arranged wheels allow forward movement, sideways movement or rotation. A conventional wheel cannot provide this direct sideways movement.')}</p></section>
      </div>
      <div className="rl-reference-frame"><h3>{t('Smery patria robotovi','Directions belong to the robot')}</h3><p>{t('„Dopredu“ znamená smer jeho predku, aj keď predok na obrazovke ukazuje doprava. „Bokom doľava“ je ľavá strana podvozka. Otočenie zmení smer nasledujúcej jazdy — bočný posun ho nezmení. V ďalšej úlohe začne rover otočený inak.','“Forward” means toward its front, even when that front points right on screen. “Slide left” means the chassis left side. Turning changes the direction of the next drive; sliding does not. In the next task the rover starts with a different heading.')}</p></div>
      <button className="button primary rl-next" onClick={()=>enter(2)}>{t('Použiť princíp vo vlastnej úlohe','Apply the principle in your own task')}<ArrowRight size={18}/></button>
    </>}

    {saved.stage===2&&<>
      <div className="rl-task"><strong>{t('Naplánuj pristavenie z novej strany','Plan an approach from a new direction')}</strong><p>{t('Rover teraz začína predkom doprava. Naplánuj cestu okolo bloku do zeleného miesta a otoč predok podľa šípky v cieli. Jedno políčko má 50 cm. Zostav svoj program a spusti ho; môžeš ho kedykoľvek upraviť.','The rover now starts facing right. Plan a path around the block into the green bay and align its front with the target arrow. Each grid square is 50 cm. Assemble and run your program; you can edit it at any time.')}</p></div>
      <div className="rl-workspace rl-challenge"><div className="rl-scene"><MecanumScene lesson initialTop lang={lang} pose={run.pose} velocity={run.velocity} world={trial.world} trail={run.trail} playback={slow?2:8}/><DockStatus distance={dock.centimetres} angle={dock.angle} lang={lang}/>{run.running&&saved.commands[Number(run.path)]&&<div className="rl-current"><span>{t('Príkaz','Command')} {Number(run.path)+1}: <strong>{names[saved.commands[Number(run.path)].motion][lang==='sk'?0:1]} {saved.commands[Number(run.path)].amount}{isTurn(saved.commands[Number(run.path)].motion)?'°':' cm'}</strong></span><button aria-label={t('Zastaviť prehrávanie','Stop playback')} onClick={()=>stop()}><Octagon size={14}/>STOP</button></div>}<div className="rl-scene-note">{t('Šípka na roveri = jeho predok. Šípka v cieli = požadované natočenie.','Rover arrow = its front. Target arrow = required heading.')}</div></div>
        <div className="rl-controls rl-program"><h3>{t('Tvoj program','Your program')}</h3><p>{t('Príkazy sa vykonajú zhora nadol. Po otočení sa všetky ďalšie smery riadia novým predkom.','Commands run from top to bottom. After a turn, all following directions use the new front.')}</p>
          <ol className="rl-command-list">{saved.commands.map((c,i)=><li key={i} className={run.running&&run.path===String(i)?'executing':''}><span>{i+1}</span><select aria-label={t(`Pohyb ${i+1}`,`Movement ${i+1}`)} value={c.motion} disabled={run.running} onChange={e=>updateCommand(i,{motion:e.target.value as LessonMotion,amount:isTurn(e.target.value as LessonMotion)?90:100})}>{lessonMotions.map(m=><option key={m} value={m}>{names[m][lang==='sk'?0:1]}</option>)}</select><input type="number" min="1" max={isTurn(c.motion)?360:300} step="1" aria-label={t(`${isTurn(c.motion)?'Uhol':'Vzdialenosť'} ${i+1}`,`${isTurn(c.motion)?'Angle':'Distance'} ${i+1}`)} value={c.amount} disabled={run.running} onChange={e=>updateCommand(i,{amount:Number(e.target.value)})}/><span>{isTurn(c.motion)?'°':'cm'}</span><button aria-label={t(`Odstrániť príkaz ${i+1}`,`Remove command ${i+1}`)} disabled={run.running} onClick={()=>removeCommand(i)}><Trash2 size={16}/></button></li>)}</ol>
          <button className="rl-add" disabled={run.running||saved.commands.length>=8} onClick={()=>{setTested(false);setSaved(p=>({...p,commands:[...p.commands,{motion:'forward',amount:100}]}));}}><Plus size={16}/>{t('Pridať príkaz','Add command')}</button>
          <label className="rl-slow"><input type="checkbox" checked={slow} onChange={e=>setSlow(e.target.checked)}/>{t('Spomaliť ukážku na sledovanie príkazov','Slow playback to follow commands')}</label>
          <div className="rl-program-actions"><button className="button primary" disabled={run.running||!cleanLessonCommands(saved.commands)?.length} onClick={runProgram}><ArrowRight size={17}/>{t('Spustiť môj program','Run my program')}</button><button className="rl-stop" onClick={()=>stop()} disabled={!run.running}><Octagon size={17}/>STOP</button></div>
          <button className="rl-secondary" onClick={()=>{reset(trial);setTested(false);}}><RotateCcw size={16}/>{t('Vrátiť rover na štart','Return rover to start')}</button>
          {!cleanLessonCommands(saved.commands)&&<p className="rl-error" role="alert">{t('Vzdialenosť musí byť celé číslo od 1 do 300 cm, uhol od 1 do 360°.','Distance must be a whole number from 1 to 300 cm; angle from 1 to 360°.')}</p>}
        </div>
      </div>
      <div className={'rl-result '+(challengeArrived?'success':'')} role="status">{run.running?<p>{t('Program beží. Zvýraznený riadok práve riadi rover.','Program running. The highlighted row is controlling the rover.')}</p>:challengeArrived?<><strong>{t('Tvoj manéver funguje.','Your manoeuvre works.')}</strong><p>{t('Rover obišiel prekážku a pristavil sa so správnou polohou aj natočením. Program použil smery vzhľadom na robot, nie na obrazovku.','The rover cleared the obstacle and docked with the right position and heading. Your program used directions relative to the robot, not the screen.')}</p><button className="button primary" onClick={()=>enter(3)}>{t('Dokončiť lekciu a pozrieť výsledok','Finish the lesson and review the result')}<ArrowRight size={18}/></button></>:run.evidence.collision?<><strong>{t(`Kolízia pri príkaze ${Number(run.path)+1}.`,`Collision during command ${Number(run.path)+1}.`)}</strong><p>{t('Uprav smer alebo vzdialenosť v tomto riadku. Podvozok potrebuje priestor celou svojou šírkou. Ďalšie spustenie začne od štartu.','Adjust this row’s direction or distance. The whole chassis needs clearance. The next run starts at the starting position.')}</p></>:tested&&run.ended>0?<><strong>{dock.centimetres<20&&!dock.aligned?t('Poloha je blízko, predok však smeruje inam.','The position is close, but the front points the wrong way.'):t('Program skončil mimo cieľa.','The program ended outside the target.')}</strong><p>{t(`Stred je ${dock.centimetres} cm od stredu cieľa; odchýlka natočenia je ${dock.angle}°. Uprav program podľa trasy a šípky predku.`,`The centre is ${dock.centimetres} cm from the target centre; heading error is ${dock.angle}°. Use the trail and front arrow to adjust your program.`)}</p></>:<p>{t('Prvý riadok je len začiatok programu. Doplň cestu okolo prekážky a požadované otočenie.','The first row is only a starting point. Add the path around the obstacle and the required turn.')}</p>}</div>
      {error&&<p className="rl-error" role="alert">{t('Skontroluj príkazy: vzdialenosť 1–300 cm, uhol 1–360°.','Check commands: distance 1–300 cm, angle 1–360°.')}</p>}
      <details className="rl-help"><summary>{t('Ako čítať vzdialenosť a natočenie','How to read distance and heading')}</summary><p>{t('Tri políčka sú 150 cm. Otočiť doľava o 90° otočí predok o štvrť otáčky proti smeru hodín; doprava po smere hodín. Na úspech musí celý rover vojsť do zeleného obrysu a predok sa musí od cieľovej šípky líšiť najviac o 6°.','Three grid squares are 150 cm. A left turn of 90° rotates the front a quarter turn counterclockwise; right is clockwise. To succeed, the whole rover must fit inside the green outline and its heading must be within 6° of the target arrow.')}</p></details>
    </>}

    {saved.stage===3&&<div className="rl-finish"><span className="rl-complete"><Check size={20}/>{t('Lekcia dokončená praktickým riešením','Lesson completed through a practical solution')}</span><h3>{t('Naplánoval si pohyb mobilného robota.','You planned a mobile robot’s motion.')}</h3><p>{t('Rozlíšil si zmenu polohy od zmeny natočenia, preskúmal kombinácie štyroch pohonov a zostavil program pre zmenené pracovisko. Tieto princípy sa používajú pri pristavení skladových robotov aj pri presnom zarovnaní k pracovnej stanici.','You distinguished position from heading, investigated combinations of four drives, and assembled a program for a changed workspace. These principles are used when warehouse robots dock or align with a workstation.')}</p>
      <div className="rl-transfer"><img src="/university-assets/workshop-mecanum.jpeg" alt={t('Skutočný Mecanum rover BendaLabs','The real BendaLabs Mecanum rover')}/><div><h3>{t('Čo treba overiť na skutočnom roveri','What to verify on a physical rover')}</h3><p>{t('Simulácia predpokladá správne usporiadané kolesá a pohyb bez preklzu. V dielni najprv overíš smer každého motora, orientáciu valčekov a prejdenú vzdialenosť. Povrch, zaťaženie a rozdiely motorov môžu spôsobiť odchýlku — príkaz na 100 cm ešte nie je meranie 100 cm.','The simulation assumes correctly arranged wheels and no slip. In the workshop, first verify every motor’s direction, the roller arrangement and the actual distance travelled. Surface, load and motor differences can create an error — a command for 100 cm is not a measurement of 100 cm.')}</p><p>{t('Ďalším princípom je spätná väzba: robot potrebuje zmerať výsledok pohybu, aby vedel opraviť odchýlku.','The next principle is feedback: a robot must measure the result of its movement to correct an error.')}</p></div></div>
      <label className="rl-notes">{t('Poznámka k vlastnému riešeniu','A note about your solution')}<textarea value={saved.notes} maxLength={3000} placeholder={t('Čo si musel zmeniť po prvom pokuse?','What did you change after your first attempt?')} onChange={e=>setSaved(p=>({...p,notes:e.target.value}))}/></label><p className="rl-caption">{t('Poznámka aj postup sa ukladajú v tomto prehliadači.','Your note and progress are saved in this browser.')}</p><div className="rl-finish-actions"><button className="button primary" onClick={download}><Download size={17}/>{t('Stiahnuť môj program','Download my program')}</button><button className="rl-secondary" onClick={()=>enter(2)}>{t('Vrátiť sa k vlastnému manévru','Return to my manoeuvre')}</button></div>{feedback}
    </div>}
    <footer className="rl-footer"><button onClick={()=>setIntro(true)}>{t('Zobraziť zadanie lekcie','Show lesson brief')}</button><button onClick={()=>onNavigate('support')}>{t('Opýtať sa tímu BendaLabs','Ask the BendaLabs team')}</button><details><summary>{t('Technický zdroj a model','Technical source and model')}</summary><p>{t('Ideálny Mecanum model počíta bočný posun a rotáciu zo štyroch pohonov. Nezahŕňa preklz, zotrvačnosť, meranie ani elektrické limity motorov. Rýchle prehrávanie mení čas zobrazenia, nie zadanú vzdialenosť.','The ideal Mecanum model computes translation and rotation from four drives. It excludes slip, inertia, sensing and electrical motor limits. Faster playback changes presentation time, not the commanded distance.')}</p><a href="https://docs.wpilib.org/en/stable/docs/software/kinematics-and-odometry/mecanum-drive-kinematics.html" target="_blank" rel="noreferrer">WPILib · Mecanum drive kinematics</a></details></footer>
    {intro&&<Dialog.Root open onOpenChange={setIntro}><Dialog.Portal container={typeof document!=='undefined'?document.getElementById('robotics-university'):undefined}><Dialog.Overlay className="course-intro-overlay"/><Dialog.Content className="rl-intro" onInteractOutside={e=>e.preventDefault()}><span className="eyebrow">{t('PRVÁ LEKCIA / MECANUM ROVER','FIRST LESSON / MECANUM ROVER')}</span><Dialog.Title>{t('Začni pohybom. Potom odhaľ jeho princíp.','Start with movement. Then uncover its principle.')}</Dialog.Title><Dialog.Description>{t('Pristavíš náklad k regálu, preskúmaš štyri kolesá a naplánuješ vlastný manéver na zmenenom pracovisku. Nepotrebuješ vybavenie ani predchádzajúce znalosti.','Dock a load by a shelf, investigate four wheels, and plan your own manoeuvre in a changed workspace. No equipment or prior knowledge is needed.')}</Dialog.Description><BriefDiagram image={planImage} lang={lang}/><p>{t('Šípka na podvozku označuje predok. Zelené miesto aj jeho šípka ukazujú požadovanú polohu a natočenie. ','The chassis arrow marks the front. The green bay and its arrow show the required position and heading. ')}</p><Dialog.Close asChild><button className="button primary">{saved.stage>0?t('Pokračovať v lekcii','Continue the lesson'):t('Rozumiem zadaniu — idem jazdiť','I understand — let me drive')}<ArrowRight size={18}/></button></Dialog.Close></Dialog.Content></Dialog.Portal></Dialog.Root>}
  </article>;
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

function WheelPattern({image,values,lang,motion}:{image?:string;values:ReturnType<typeof wheelSpeeds>;lang:Lang;motion:'forward'|'left'|'turn-left'}) {
  const positions=[[90,78],[370,78],[90,260],[370,260]],labels=lang==='sk'?['Predné ľavé','Predné pravé','Zadné ľavé','Zadné pravé']:['Front left','Front right','Rear left','Rear right'];
  const contacts=[[168,116],[292,116],[168,234],[292,234]];
  const effects=lang==='sk'?{
    forward:'Bočné zložky mieria proti sebe a rušia sa. Všetky pozdĺžne zložky mieria dopredu.',
    left:'Pozdĺžne zložky mieria dopredu aj dozadu a rušia sa. Všetky bočné zložky mieria doľava.',
    'turn-left':'Protiľahlé pohony pôsobia opačne. Šikmé príspevky spolu vytvárajú otáčanie okolo stredu.',
  }:{
    forward:'Sideways components oppose and cancel. All longitudinal components point forward.',
    left:'Longitudinal components point forward and backward and cancel. All sideways components point left.',
    'turn-left':'Opposite drives act in opposite directions. Their angled contributions combine into rotation around the centre.',
  };
  return <figure className="rl-wheel-pattern">
    <svg viewBox="0 0 460 340" role="img" aria-label={lang==='sk'?'Štyri pohony a ich šikmé príspevky k pohybu':'Four drives and their angled contributions to motion'}>
      <defs><marker id="rl-wheel-effect" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" fill="#f2c779"/></marker></defs>
      <text x="230" y="24" textAnchor="middle">{lang==='sk'?'PREDOK ROBOTA':'ROBOT FRONT'} ↑</text>
      {image&&<image href={image} x="120" y="64" width="220" height="220" transform="rotate(-90 230 174)"/>}
      {wheelIds.map((id,i)=>{const [x,y]=positions[i],[cx,cy]=contacts[i],forward=values[id]>=0,sign=forward?1:-1,dx=27*[1,-1,-1,1][i]*sign,dy=-27*sign;return <g key={id}>
        <path d={`M${cx} ${cy}H${cx+dx}V${cy+dy}`} fill="none" stroke="#8da696" strokeDasharray="3 2" strokeWidth="1.5"/>
        <path d={`M${cx} ${cy}L${cx+dx} ${cy+dy}`} fill="none" stroke="#f2c779" strokeWidth="2.5" markerEnd="url(#rl-wheel-effect)"/>
        <circle cx={cx} cy={cy} r="3" fill="#f2c779"/>
        <path d={`M${x<230?x+48:x-48} ${y} L${cx} ${cy}`} stroke="#648b70" fill="none"/>
        <text x={x} y={y-20} textAnchor="middle" className="rl-wheel-label">{labels[i]}</text>
        <rect x={x-49} y={y-10} width="98" height="33" rx="7" fill={forward?'#254c34':'#493c28'} stroke={forward?'#88bf98':'#d2a665'}/>
        <text x={x} y={y+12} textAnchor="middle" fill={forward?'#d1f4d8':'#f1d09b'}>{forward?'↑':'↓'} {lang==='sk'?(forward?'Dopredu':'Dozadu'):(forward?'Forward':'Backward')}</text>
      </g>;})}
      <text x="230" y="318" textAnchor="middle" className="rl-wheel-result">{lang==='sk'?'Výsledok: ':'Result: '}{names[motion][lang==='sk'?0:1]}</text>
    </svg>
    <div className="rl-wheel-legend"><span>{lang==='sk'?'Príspevok pohonu':'Drive contribution'}</span><span>{lang==='sk'?'Jeho dve zložky':'Its two components'}</span></div>
    <figcaption>{effects[motion]} {lang==='sk'?'Šípky vysvetľujú ideálny pohyb; nejde o meranie síl.':'The arrows explain ideal motion; they are not force measurements.'}</figcaption>
  </figure>;
}
function BriefDiagram({image,lang}:{image?:string;lang:Lang}) {return <svg className="rl-brief-diagram" viewBox="0 0 560 190" role="img" aria-label={lang==='sk'?'Rover sa presunie bokom k cieľu pred regálom':'Rover slides toward the target beside a shelf'}><rect x="24" y="16" width="512" height="160" rx="8" fill="#10281b" stroke="#42664d"/><rect x="65" y="30" width="355" height="25" rx="3" fill="#3b5845"/><text x="245" y="47" textAnchor="middle" fill="#e1ece2">{lang==='sk'?'REGÁL':'SHELF'}</text>{image&&<image href={image} x="71" y="64" width="90" height="90" transform="rotate(-90 116 109)"/>}<path d="M116 86V66L110 73M116 66L122 73" fill="none" stroke="#c9edce" strokeWidth="3"/><path d="M180 113H310L299 105M310 113L299 121" stroke="#94cba3" strokeWidth="2" fill="none" strokeDasharray="5 4"/><rect x="333" y="73" width="72" height="72" fill="#b2e2bc16" stroke="#b2e2bc" strokeWidth="2"/><path d="M369 124V93L360 103M369 93L378 103" fill="none" stroke="#b2e2bc" strokeWidth="3"/><text x="459" y="113" fill="#c2e9cb">{lang==='sk'?'CIEĽ':'TARGET'}</text></svg>;}
