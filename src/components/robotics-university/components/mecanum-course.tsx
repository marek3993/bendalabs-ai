'use client';
import {useEffect,useMemo,useRef,useState,type ReactNode} from 'react';
import {BookOpen,Check,CheckCircle2,Play,RotateCcw,Octagon,ExternalLink,ArrowRight} from 'lucide-react';
import type {Lang} from '@/components/robotics-university/lib/atlas-data';
import lessons from '@/components/robotics-university/lib/course-lessons.json';
import introductions from '@/components/robotics-university/lib/course-introductions.json';
import CourseIntro from './course-intro';
import {courseIds,courseTrial,assessCourse,compareTrials,startingPolicy,type CourseId,type Policy} from '@/components/robotics-university/lib/course-experiments';
import {degrees,angleDifference,parked,type Program} from '@/components/robotics-university/lib/mecanum';
import type {CourseDraft} from '@/components/robotics-university/lib/course-progress';
import {useCourseProgress} from './course-progress';
import {useMecanumRun} from './use-mecanum-run';
import MecanumScene from './mecanum-scene';
import MecanumProgram from './mecanum-program';
import {ManualControl} from './mecanum-controls';
import {CourseParts} from './course-parts';
import CourseSensor from './course-sensor';
import {ProgressTransfer} from './journey-context';

type Props={lang:Lang;id?:string;onNavigate:(view:string,id?:string)=>void;onImported?:()=>void;feedback?:(id:string,lang:Lang)=>ReactNode};
export default function MecanumCourse({lang,id,onNavigate,onImported,feedback}:Props){
 const {progress,ready,update}=useCourseProgress(),t=(sk:string,en:string)=>lang==='sk'?sk:en;
 const active=courseIds.includes(id as CourseId)?id as CourseId:progress.last;
 if(!ready)return <p role="status">{t('Načítavam kurz…','Loading the course…')}</p>;
 if(id==='overview')return <div className="course-overview"><span className="free-access">{t('Zadarmo · Bez registrácie · SK / EN','Free · No sign-up · SK / EN')}</span><h1>{t('Prvé kroky s Mecanum roverom','First steps with a Mecanum rover')}</h1><p>{t('Desať nadväzujúcich lekcií: ovládanie, program a prvé meranie. Všetky pokusy fungujú v prehliadači.','Ten connected lessons: control, programming, and your first measurement. Every experiment runs in the browser.')}</p><div className="course-overview-progress"><strong>{progress.solved.length} / 10</strong><span>{t('samostatne vyriešených v simulácii','independently solved in simulation')}</span><button className="button primary" onClick={()=>onNavigate('course',progress.last)}>{t('Pokračovať v kurze','Resume the course')}</button></div><div className="course-lesson-list">{lessons.map((l,i)=><button key={l.id} onClick={()=>onNavigate('course',l.id)}><span className="course-number">{String(i+1).padStart(2,'0')}</span><div><span className="eyebrow">{i<4?t('OVLÁDANIE A ORIENTÁCIA','CONTROL AND ORIENTATION'):t('ZÁKLADY PROGRAMOVANIA','PROGRAMMING FOUNDATIONS')}</span><h2>{l.title[lang]}</h2><p>{l.goal[lang]}</p></div><span className={'course-state '+(progress.solved.includes(l.id as CourseId)?'solved':'')}>{progress.solved.includes(l.id as CourseId)?<><CheckCircle2 size={18}/>{t('Vyriešené','Solved')}</>:progress.seen.includes(l.id as CourseId)?t('Vyskúšané','Tried'):t('Otvoriť','Open')}</span></button>)}</div><div className="course-reference-links"><button className="button" onClick={()=>onNavigate('encyclopedia')}><BookOpen size={17}/>{t('Technická encyklopédia','Technical encyclopedia')}</button><button className="button" onClick={()=>onNavigate('labs','kinematics')}>{t('Robotické rameno','Robot arm')}</button><button className="button" onClick={()=>onNavigate('labs','drone')}>{t('Let dronu','Drone flight')}</button></div><ProgressTransfer lang={lang} onImported={onImported??(()=>{})}/></div>;
 return <CourseLesson key={active} id={active} lang={lang} draft={progress.drafts[active]} onSave={draft=>update(p=>({...p,last:active,drafts:{...p.drafts,[active]:draft}}))} onSeen={()=>update(p=>({...p,last:active,seen:[...new Set([...p.seen,active])]}))} onSolved={()=>update(p=>({...p,last:active,seen:[...new Set([...p.seen,active])],solved:[...new Set([...p.solved,active])]}))} solved={progress.solved.includes(active)} onNavigate={onNavigate} feedback={feedback?.(active,lang)}/>;
}

function CourseLesson({id,lang,draft,onSave,onSeen,onSolved,solved,onNavigate,feedback}:{id:CourseId;lang:Lang;draft?:CourseDraft;onSave:(d:CourseDraft)=>void;onSeen:()=>void;onSolved:()=>void;solved:boolean;onNavigate:Props['onNavigate'];feedback?:ReactNode}){
 const index=courseIds.indexOf(id),lesson=lessons[index],intro=introductions[index],t=(sk:string,en:string)=>lang==='sk'?sk:en;
 const parts=id==='robot-components',manual=index<3&&!parts,sensor=id==='range-input',next=courseIds[index+1];
 const [independent,setIndependent]=useState(draft?.independent??false);
 const [program,setProgram]=useState<Program>(draft?.program??courseTrial(id,false).program);
 const [policy,setPolicy]=useState<Policy>(draft?.policy??startingPolicy);
 const [note,setNote]=useState(draft?.note??''),[hint,setHint]=useState(0),[speed,setSpeed]=useState(manual?.6:.4);
 const [message,setMessage]=useState(''),[passed,setPassed]=useState(false),[guidedDone,setGuidedDone]=useState(false);
 const [introOpen,setIntroOpen]=useState(true);
 const [comparisons,setComparisons]=useState<ReturnType<typeof compareTrials>>([]);
 const lessonRoot=useRef<HTMLElement>(null),primary=useRef<HTMLButtonElement>(null);
 const modeDrafts=useRef({guidedProgram:draft?.guidedProgram,independentProgram:draft?.independentProgram,guidedPolicy:draft?.guidedPolicy,independentPolicy:draft?.independentPolicy});
 modeDrafts.current[independent?'independentProgram':'guidedProgram']=program;
 modeDrafts.current[independent?'independentPolicy':'guidedPolicy']=policy;
 const trial=useMemo(()=>courseTrial(id,independent),[id,independent]);
 const sim=useMecanumRun(trial,{playback:6,stopPractice:id==='manual-sequence'});
 const currentDraft={program,independent,policy,note,...modeDrafts.current},saveRef=useRef({onSave,draft:currentDraft});saveRef.current={onSave,draft:currentDraft};
 useEffect(()=>{const timer=setTimeout(()=>saveRef.current.onSave(saveRef.current.draft),350);return()=>clearTimeout(timer);},[program,independent,policy,note]);
 useEffect(()=>()=>saveRef.current.onSave(saveRef.current.draft),[]);
 const seenRef=useRef(false);
 const markSeen=()=>{if(!seenRef.current){seenRef.current=true;onSeen();}};
 const reset=(restoreProgram=false)=>{sim.reset(trial,true);sim.flag({stoppedMotor:false});if(restoreProgram)setProgram(trial.program);setMessage('');setPassed(false);setGuidedDone(false);setComparisons([]);};
 const changeMode=(value:boolean)=>{
  if(value===independent)return;
  const following=courseTrial(id,value),stopDone=sim.run.evidence.stoppedProgram;
  setIndependent(value);setProgram(modeDrafts.current[value?'independentProgram':'guidedProgram']??following.program);
  setPolicy(modeDrafts.current[value?'independentPolicy':'guidedPolicy']??{...startingPolicy});sim.reset(following);
  if(id==='manual-sequence'&&stopDone)sim.flag({stoppedProgram:true});
  setHint(0);setMessage('');setPassed(false);setGuidedDone(false);setComparisons([]);setIntroOpen(true);
 };
 const changeProgram=(p:Program)=>{setProgram(p);sim.flag({twoSpeeds:false});setPassed(false);setGuidedDone(false);setComparisons([]);setMessage('');};
 const succeed=()=>{setPassed(true);setMessage('');onSolved();};
 const check=()=>{
  if(parts)return;
  if(!independent){
   const e=sim.run.evidence;
   const ready=id==='time-distance'?sim.run.ended>0:parked(sim.run.pose,trial.world.bay)&&e.travel>.2&&(id!=='manual-sequence'||e.stoppedProgram)&&(id!=='robot-frame'||e.turn>1.4);
   if(ready&&!e.collision){setGuidedDone(true);setMessage('');}
   else if(e.collision)setMessage('collision');
   else if(!manual&&sim.run.ended||manual&&Math.hypot(sim.run.pose.x-trial.world.bay.x,sim.run.pose.y-trial.world.bay.y)<.6)setMessage('guided');
   return;
  }
  const evidence={...sim.run.evidence};
  if(id==='time-distance'&&parked(sim.run.pose,trial.world.bay)&&!evidence.collision){
   try{const results=compareTrials('time-distance',program);setComparisons(results);evidence.twoSpeeds=results.every(r=>r.passed);sim.flag({twoSpeeds:evidence.twoSpeeds});}catch{setMessage('program');return;}
  }
  const error=assessCourse(id,sim.run.pose,trial,program,evidence,sim.run.running);
  if(!error)succeed();
  else if(!manual&&sim.run.ended||error==='collision'||manual&&(evidence.stoppedMotor||Math.hypot(sim.run.pose.x-trial.world.bay.x,sim.run.pose.y-trial.world.bay.y)<.6))setMessage(error);
 };
 const finishRef=useRef(check);finishRef.current=check;
 const wasRunning=useRef(false);
 useEffect(()=>{if(!sim.run.running&&(wasRunning.current||sim.run.evidence.stoppedMotor))finishRef.current();wasRunning.current=sim.run.running;},[sim.run.running,sim.run.ended,sim.run.evidence.stoppedMotor,sim.run.evidence.connections]);
 const errors:Record<string,string>={
  collision:t('Rover narazil. Uprav úsek, ktorý je zvýraznený, a spusti program znova. Pri ručnom ovládaní použi návrat na štart.','The rover collided. Adjust the highlighted segment and run again. For manual control, reset to the start.'),
  park:t('Trasa ešte nekončí v parkovacom mieste so správnym natočením. Skontroluj vzdialenosti a šípku cieľa.','The route does not yet end inside the bay with the correct heading. Check the distances and the target arrow.'),
  move:t('Program musí vykonať pohyb.','The program must execute a movement.'),
  strafe:t('V tomto manévri použi aj bočný presun.','Include lateral translation in this maneuver.'),
  frame:t('Prejdi bodom 1, otoč sa na mieste a zarovnaj predok s cieľovou šípkou.','Pass marker 1, turn in place, and match the target heading.'),
  stop:t('Teraz vyskúšaj prerušenie: spusti program a počas pohybu stlač STOP. Potom ho spusti znova do cieľa.','Now test interruption: run the program and press STOP during motion. Then restart and complete the route.'),
  speeds:t('Rover pri jednej rýchlosti zaparkoval, ale pri druhej minul cieľ. Časový príkaz prejde pri vyššej rýchlosti ďalej. Pre presnú koncovú polohu zvoľ centimetre.','The rover parked at one speed but missed the bay at the other. Timed movement travels farther at a higher speed. Use centimetres for a fixed endpoint.'),
  variable:t('Rover zaparkoval, ale program ešte neriadi oba úseky jednou hodnotou. Ponechaj dva pohyby: Dopredu a Doľava bokom. Pri oboch zapni „Použiť vzdialenosť d“ a spoločnú hodnotu nastav na 150 cm. Opravné úseky s pevným číslom odstráň.','The rover parked, but one value does not yet control both legs. Keep two movements: Forward and Slide left. Enable “Use distance d” for both and set the shared value to 150 cm. Remove fixed-number correction segments.'),
  loop:t('Program musí zopakovať dvojkrok cez všetky štyri stanovištia. Skontroluj počet opakovaní a oba pohyby v bloku.','Repeat the two-part maneuver through all four stations. Check the repetition count and both movements in the block.'),
  function:t('Pri oboch stanovištiach vykonaj funkciu obsluha: 120 cm doľava, čakanie 1 s a 120 cm späť doprava.','At both stations, execute the service function: slide left 120 cm, wait 1 s, and slide right 120 cm back.'),
  guided:lesson.problem[lang],
  program:t('Skontroluj hodnoty: vzdialenosť 1–300 cm, čas 0,1–10 s, opakovanie 1–8. Pridaj aspoň jeden príkaz.','Check the values: distance 1–300 cm, time 0.1–10 s, repeats 1–8. Add at least one command.')
 };
 const start=()=>{if(sim.start(program,speed)){markSeen();setMessage('');setPassed(false);setGuidedDone(false);setComparisons([]);}};
 const advance=()=>passed?onNavigate('course',next??'overview'):changeMode(true);
 const playback=id==='manual-sequence'&&!sim.run.evidence.stoppedProgram?1:6;
 const complete=passed||guidedDone;
 const action=<div className="course-run-controls">
  {complete?<button ref={primary} className="button primary" onClick={advance}>{passed?(next?t('Pokračovať na ďalšiu lekciu','Continue to the next lesson'):t('Zobraziť výsledky kurzu','View course results')):t('Pokračovať na vlastné riešenie','Continue to your own solution')}<ArrowRight size={17}/></button>:!manual&&!sensor&&!parts?<button ref={primary} className="button primary" disabled={sim.run.running||introOpen} onClick={start}><Play size={17}/>{sim.run.running?t('Program beží…','Running…'):independent?t('Spustiť riešenie','Run your solution'):t('Spustiť program','Run program')}</button>:null}
  {!sensor&&!parts&&!complete&&<button className="button course-stop" onClick={()=>sim.stop(true)}><Octagon size={17}/>STOP</button>}
  {!sensor&&!parts&&<button className="course-reset" aria-label={t('Vrátiť rover na štart','Return rover to start')} title={t('Vrátiť rover na štart','Return rover to start')} onClick={()=>reset()}><RotateCcw size={17}/></button>}
 </div>;
 const practiceText=id==='manual-sequence'&&sim.run.evidence.stoppedProgram?t('Prerušenie programu máš overené. Teraz spusti dlhšiu trasu a nechaj rover dôjsť do nového cieľa. Ďalšie jazdy sa prehrávajú 6× rýchlejšie.','Program interruption is verified. Now run the longer route and let the rover reach the new bay. Further runs play 6× faster.'):lesson.independent[lang];
 const result=<div className={'course-inline-result '+(complete?'passed':'')} role="status">
  {complete?<><CheckCircle2 size={20}/><div><strong>{passed?t('Úloha splnená','Task complete'):t('Pokus dokončený','Experiment complete')}</strong><p>{passed?lesson.bridge[lang]:lesson.explanation[lang]}</p></div></>:message||sim.error?<p>{errors[sim.error?'program':message]??message}</p>:<p>{manual?t('Zastav v cieli. Výsledok sa vyhodnotí automaticky.','Stop inside the bay. The result is checked automatically.'):t('Po dojazde sa zobrazí výsledok a ďalší krok.','The result and next step appear when the program finishes.')}</p>}
 </div>;
 return <article className="mecanum-course" ref={lessonRoot}>
  {introOpen&&<CourseIntro index={index} lang={lang} practice={independent} practiceText={practiceText} onContinue={()=>{setIntroOpen(false);requestAnimationFrame(()=>{lessonRoot.current?.scrollIntoView({block:'start'});primary.current?.focus({preventScroll:true});});}} onExit={()=>onNavigate('course','overview')}/>}
  <div className="course-top"><button className="text-button" onClick={()=>onNavigate('course','overview')}><BookOpen size={16}/>{t('Prehľad 10 lekcií','All 10 lessons')}</button><span>{t('Zadarmo · Bez registrácie','Free · No sign-up')}</span><button className="text-button" onClick={()=>{sim.stop();setIntroOpen(true);}}>{t('Otvoriť obrázkový návod','Open illustrated instructions')}</button></div>
  <header className="course-title"><div><span className="eyebrow">{t('LEKCIA','LESSON')} {String(index+1).padStart(2,'0')} / 10</span><h1>{lesson.title[lang]}</h1><p>{intro.purpose[lang]}</p></div>{solved&&<span className="course-completed"><Check size={16}/>{t('Vyriešené','Solved')}</span>}</header>
  <ol className="course-stages" aria-label={t('Postup lekciou','Lesson progress')}><li aria-current={!independent?'step':undefined}><span>{independent?<Check size={15}/>:1}</span>{t('Vyskúšaj princíp','Try the principle')}</li><li aria-current={independent&&!passed?'step':undefined}><span>{passed?<Check size={15}/>:2}</span>{t('Vyrieš úlohu','Solve the task')}</li><li aria-current={passed?'step':undefined}><span>3</span>{t('Výsledok','Result')}</li></ol>
  <section className="course-experiment" aria-label={t('Pracovisko lekcie','Lesson workspace')}>
   <div className="course-task"><span>{independent?t('TVOJE ZADANIE','YOUR TASK'):t('POKUS S NÁVODOM','GUIDED EXPERIMENT')}</span><p>{independent?practiceText:lesson.problem[lang]}</p></div>
   {parts?<><CourseParts key={String(independent)} lang={lang} independent={independent} disabled={introOpen} onTried={markSeen} onPassed={independent?succeed:()=>setGuidedDone(true)}/>{complete&&result}{action}</>:sensor?<><CourseSensor key={String(independent)} lang={lang} policy={policy} onChange={p=>{setPolicy(p);setPassed(false);setGuidedDone(false);}} onPassed={independent?succeed:()=>setGuidedDone(true)} onTried={markSeen} independent={independent}/>{result}{action}</>:<div className="course-workspace">
    <div className="course-scene-column"><MecanumScene lang={lang} pose={sim.run.pose} velocity={sim.run.velocity} world={trial.world} trail={sim.run.trail} waypoints={trial.waypoints} playback={manual?1:playback}/>
     <div className="course-telemetry"><span>{t('Dráha','Distance')}<strong>{Math.round(sim.run.evidence.travel*100)} cm</strong></span><span>{t('Simulovaný čas','Simulated time')}<strong>{sim.run.elapsed.toFixed(1)} s</strong></span><span>{t('Odchýlka smeru','Heading error')}<strong>{Math.abs(degrees(angleDifference(sim.run.pose.yaw,trial.world.bay.yaw))).toFixed(0)}°</strong></span></div>
     {id==='manual-sequence'&&!complete&&<div className="course-checkpoint"><Octagon size={16}/>{sim.run.evidence.stoppedProgram?t('STOP overený. Teraz nechaj celý program dôjsť do cieľa.','STOP verified. Now let the full program reach the bay.'):t('Spusti program a počas pohybu stlač STOP.','Run the program and press STOP during motion.')}</div>}
     {result}{action}
    </div>
    <div className="course-control-column">
     {manual?<><h3>{t('Ovládanie roveru','Rover controls')}</h3><ManualControl lang={lang} speed={speed} onMove={v=>{sim.manual(v);markSeen();}} onStop={sim.stop} onRefresh={sim.refresh} stepBusy={sim.run.running} onStep={v=>{sim.jog(v);markSeen();}} disabled={introOpen||complete}/></>:<MecanumProgram program={program} onChange={changeProgram} lang={lang} level={index} running={sim.run.running||introOpen} path={sim.run.path} variableError={message==='variable'}/>}
     {!manual&&<div className="course-playback"><span>{t('Prehrávanie','Playback')} {playback}×</span><small>{playback===1?t('Bežná rýchlosť na vyskúšanie STOP.','Normal playback for practicing STOP.'):t('Rýchle prehrávanie, nezmenené vzdialenosti.','Fast playback, unchanged distances.')}</small></div>}
     {(manual||id==='time-distance')&&<label className="course-slider">{t('Rýchlosť jazdy','Travel speed')}<output>{Math.round(speed*100)} cm/s</output><input aria-label={t('Rýchlosť jazdy','Travel speed')} type="range" min=".15" max=".6" step=".05" value={speed} disabled={sim.run.running} onChange={e=>{setSpeed(Number(e.target.value));setGuidedDone(false);}}/></label>}
     {!manual&&<details className="course-editor-tools"><summary>{t('Možnosti programu','Program options')}</summary><button className="text-button" onClick={()=>reset(true)}>{t('Vrátiť pôvodný program','Restore the original program')}</button></details>}
    </div>
   </div>}
   {comparisons.length>0&&<div className="course-speed-results"><h3>{t('Tá istá trasa pri dvoch rýchlostiach','Same route at two speeds')}</h3><div className="course-comparisons">{comparisons.map(c=><div key={c.value}><span>{c.value} cm/s</span><strong className={c.passed?'mint':'amber'}>{c.passed?t('Zaparkované','Parked'):c.collision?t('Kolízia','Collision'):t('Cieľ minutý','Target missed')}</strong><span>{Math.round(c.travel*100)} cm · {c.seconds.toFixed(1)} s</span></div>)}</div></div>}
  </section>
  <details className="course-reference"><summary>{t('Vysvetlenie, nápoveda a moje poznámky','Explanation, hints and my notes')}</summary><div className="course-learning-notes"><section><h2>{t('Princíp za pokusom','The principle behind the experiment')}</h2><p>{lesson.explanation[lang]}</p>{index>=3&&!sensor&&<p>{t('Otočenie +90° je doľava a −90° doprava. Smer sa vzťahuje na predok roveru.','A +90° turn is left and −90° is right. Directions are relative to the rover’s front.')}</p>}<details><summary>{t('Predpoklady a cieľ lekcie','Prerequisites and lesson goal')}</summary><p>{lesson.prerequisite[lang]}</p><p>{lesson.goal[lang]}</p></details></section><section><h2>{t('Keď sa riešenie nedarí','When the solution does not work')}</h2>{hint>0&&lesson.hints.slice(0,hint).map((h,i)=><p className="course-hint" key={i}>{h[lang]}</p>)}<button className="button" disabled={hint>=lesson.hints.length} onClick={()=>setHint(h=>h+1)}>{hint?t('Ďalšia nápoveda','Next hint'):t('Zobraziť nápovedu','Show a hint')}</button><label className="course-note">{t('Moja poznámka k riešeniu','My solution note')}<textarea maxLength={2000} value={note} onChange={e=>setNote(e.target.value)} placeholder={t('Čo som zmenil a čo sa stalo…','What I changed and what happened…')}/></label><span className="course-muted">{t('Postup, program a poznámka sa ukladajú v tomto prehliadači.','Progress, program and note are saved in this browser.')}</span></section></div>
</details>
  {parts?<details className="course-model-details"><summary>{t('Schéma a jej hranice','Diagram and its limits')}</summary><p>{t('Funkčný model jedného kefového DC motora s H-mostíkom. Napájanie 12 V je príklad; pri stavbe sa riaď napätím motora a drivera. Riadiaca doska má vlastné napájanie. GND je spoločná referencia napätí. VM označuje napájací vstup pohonu, IN riadiace vstupy a M1/M2 výstupy k motoru. PWM riadi spínanie výkonu, DIR smer.','A functional model of one brushed DC motor and an H-bridge. The 12 V supply is an example; use your motor and driver ratings for a build. The control board has its own supply. GND is the common voltage reference. VM is motor power, IN control inputs, and M1/M2 motor outputs. PWM controls power switching; DIR controls direction.')}</p><p>{t('Pri chýbajúcej GND simulácia označí stav ako neurčený. Skutočný motor nemusí zostať stáť. STOP tu vypína pohon; dobeh, brzdenie, prúd a ochrany závisia od konkrétneho drivera. Pred fyzickou zmenou zapojenia odpoj zdroje napájania.','Without common GND the simulation reports an unknown state; a physical motor is not guaranteed to remain stopped. STOP disables drive here; coasting, braking, current and protection depend on the driver. Disconnect power supplies before changing physical wiring.')}</p><a href="https://www.pololu.com/docs/0J49" target="_blank" rel="noopener noreferrer">Pololu · {t('Motorový driver: napájanie a riadenie','Motor driver: power and control')}</a></details>:<details className="course-model-details"><summary>{t('Čo model overuje a kde má hranice','What the model verifies and its limits')}</summary><p>{t('Simulácia overuje geometriu prejazdu, poradie príkazov, polohu a smer. Mecanum kolesá majú usporiadanie X. Osi robota: x dopredu, y doľava, z nahor. Predný senzor je jeden lúč s dosahom 250 cm; nechráni boky robota.','The simulation checks path geometry, command order, position and heading. Mecanum wheels use an X arrangement. Robot axes: x forward, y left, z up. The front sensor is a single ray with a 250 cm range; it does not protect the rover’s sides.')}</p><p>{t('V tomto modeli sa pohyb zastaví okamžite a príkazy na vzdialenosť sú presné. Skutočný robot má sklz, zotrvačnosť, chyby merania a limity pohonov. Výsledok simulácie nepotvrdzuje správne elektrické zapojenie ani presnosť fyzickej jazdy.','Motion stops instantly and distance commands are exact in this model. A physical robot has slip, inertia, measurement error and drive limits. A simulation result does not verify electrical wiring or real driving accuracy.')}</p><div className="course-sources"><a href="https://docs.wpilib.org/en/stable/docs/software/kinematics-and-odometry/mecanum-drive-kinematics.html" target="_blank" rel="noopener noreferrer"><ExternalLink size={15}/>WPILib · Mecanum kinematics</a><a href="https://docs.revrobotics.com/duo-build/mecanum-drivetrain-v2/mecanum-wheel-setup-and-behavior" target="_blank" rel="noopener noreferrer"><ExternalLink size={15}/>REV Robotics · Mecanum wheels</a></div></details>}
  {feedback}
  <nav className="course-bottom-nav" aria-label={t('Navigácia lekciami','Lesson navigation')}><button className="text-button" onClick={()=>onNavigate('course','overview')}>{t('Všetky lekcie','All lessons')}</button>{independent&&<button className="text-button" onClick={()=>changeMode(false)}>{t('Zopakovať vedený pokus','Repeat the guided experiment')}</button>}</nav>
 </article>;
}
