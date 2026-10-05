import curriculum from './curriculum.json';

export const learningOrder = ['loop','frames','energy','motors','range','states','prototype','flight','vision','timing','odometry','pid','bms','calibration','ros','autopilot','imitation','distribution','ik','fusion','qos','failsafe','vla','validation'];
export const learningChapters = learningOrder.map(id => curriculum.find(chapter => chapter.id === id)!);

export function resumeChapter(lastChapter: string | null, completed: string[]) {
  const last = learningChapters.find(chapter => chapter.id === lastChapter);
  if (last && !completed.includes(last.id)) return last;
  const afterLast = last ? learningChapters.slice(learningOrder.indexOf(last.id) + 1) : learningChapters;
  return afterLast.find(chapter => !completed.includes(chapter.id))
    ?? learningChapters.find(chapter => !completed.includes(chapter.id))
    ?? last ?? learningChapters[0];
}

export const learningGoals: Record<string, {sk: string; en: string}> = {
  loop: {sk:'Rozlíšiť meranie, rozhodovanie a akciu v regulačnej slučke.',en:'Distinguish sensing, decision-making and action in a control loop.'},
  frames: {sk:'Určiť súradnicový rámec a prepočítať polohu medzi posunutými rámcami.',en:'Identify a coordinate frame and transform a position between translated frames.'},
  energy: {sk:'Vypočítať energiu batérie vo Wh a odhadnúť výdrž robota.',en:'Calculate battery energy in Wh and estimate robot runtime.'},
  motors: {sk:'Vypočítať potrebný moment a rozlíšiť trvalé a špičkové zaťaženie.',en:'Calculate required torque and distinguish continuous and peak loads.'},
  range: {sk:'Vysvetliť meranie vzdialenosti a rozpoznať obmedzenia LiDARu.',en:'Explain range measurement and recognise LiDAR limitations.'},
  states: {sk:'Navrhnúť stavy robota a prechody pri príkaze, čakaní a poruche.',en:'Design robot states and transitions for commands, waiting and faults.'},
  prototype: {sk:'Premeniť nápad na merateľné požiadavky a postup oživovania.',en:'Turn an idea into measurable requirements and a bring-up sequence.'},
  flight: {sk:'Porovnať ťah s tiažou a vysvetliť účinok náklonu na let.',en:'Compare thrust with weight and explain how tilt affects flight.'},
  vision: {sk:'Rozlíšiť precision a recall a oddeliť detekciu od rozhodnutia.',en:'Distinguish precision and recall and separate detection from decision-making.'},
  timing: {sk:'Vysvetliť vplyv oneskorenia na riadenie a navrhnúť reakciu na výpadok.',en:'Explain how latency affects control and plan a response to missing data.'},
  odometry: {sk:'Vypočítať pohyb diferenciálneho podvozka z otáčok kolies.',en:'Calculate differential-drive motion from wheel speeds.'},
  pid: {sk:'Porovnať účinky P, I a D a vysvetliť saturáciu regulátora.',en:'Compare the effects of P, I and D and explain controller saturation.'},
  bms: {sk:'Rozlíšiť úlohy BMS a nabíjačky a nájsť limity batérie v dokumentácii.',en:'Distinguish BMS and charger roles and find battery limits in documentation.'},
  calibration: {sk:'Rozlíšiť vnútornú a vonkajšiu kalibráciu a navrhnúť jej overenie.',en:'Distinguish intrinsic and extrinsic calibration and plan validation.'},
  ros: {sk:'Vybrať tému, službu alebo akciu podľa komunikačnej úlohy.',en:'Choose a topic, service or action for a communication task.'},
  autopilot: {sk:'Vysvetliť regulačné vrstvy autopilota a ich závislosť od odhadu stavu.',en:'Explain autopilot control layers and their reliance on state estimation.'},
  imitation: {sk:'Vysvetliť distribučný posun a navrhnúť skúšku zotavenia z chyby.',en:'Explain distribution shift and design a recovery test.'},
  distribution: {sk:'Vypočítať straty meniča a určiť, čo overiť pri prúdových špičkách.',en:'Calculate converter losses and identify checks for current transients.'},
  ik: {sk:'Určiť dosiahnuteľnosť cieľa dvojčlánkového ramena a rozpoznať singularitu.',en:'Determine target reachability for a two-link arm and recognise a singularity.'},
  fusion: {sk:'Vysvetliť predikciu, korekciu a význam neistoty v EKF.',en:'Explain prediction, correction and the role of uncertainty in an EKF.'},
  qos: {sk:'Posúdiť kompatibilitu QoS a odlíšiť doručenie dát od ich čerstvosti.',en:'Assess QoS compatibility and distinguish data delivery from freshness.'},
  failsafe: {sk:'Zostaviť plán skúšok porúch autopilota s konkrétnymi kritériami úspechu.',en:'Plan autopilot fault tests with explicit pass criteria.'},
  vla: {sk:'Vysvetliť úlohu VLA modelu a navrhnúť testy zovšeobecnenia.',en:'Explain a VLA model’s role and design generalisation tests.'},
  validation: {sk:'Rozlíšiť cestu a trajektóriu a zostaviť plán overenia celého robota.',en:'Distinguish a path from a trajectory and plan whole-robot validation.'},
};
