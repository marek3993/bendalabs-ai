import type {Bilingual} from './atlas-data';

export const chapterExperimentNames = {
  loop: {sk: 'Preskúmaj spätnú väzbu', en: 'Explore feedback'},
  frames: {sk: 'Prepočítaj súradnice bodu', en: 'Transform a point'},
  energy: {sk: 'Navrhni energetický rozpočet', en: 'Plan the energy budget'},
  motors: {sk: 'Preskúmaj moment a prevod', en: 'Explore torque and gearing'},
  range: {sk: 'Preskúmaj lúče LiDARu', en: 'Explore LiDAR rays'},
  states: {sk: 'Ovládaj stavový automat', en: 'Control a state machine'},
  prototype: {sk: 'Over merateľnú požiadavku', en: 'Test a measurable requirement'},
  flight: {sk: 'Rozlož ťah pri náklone', en: 'Resolve thrust while tilted'},
  vision: {sk: 'Nastav prah detekcie', en: 'Set a detection threshold'},
  timing: {sk: 'Vypočítaj vplyv oneskorenia na zastavenie', en: 'Calculate how latency affects stopping'},
  odometry: {sk: 'Vypočítaj dráhu podvozka', en: 'Calculate the drive trajectory'},
  pid: {sk: 'Vylaď PID a sleduj saturáciu', en: 'Tune PID and observe saturation'},
  bms: {sk: 'Preskúmaj ochrany článkov', en: 'Explore cell protection'},
  calibration: {sk: 'Premietni bod do kamery', en: 'Project a point into a camera'},
  ros: {sk: 'Porovnaj rozhrania ROS 2', en: 'Compare ROS 2 interfaces'},
  autopilot: {sk: 'Sleduj regulačnú kaskádu', en: 'Trace a control cascade'},
  imitation: {sk: 'Uč riadenie z ukážok', en: 'Learn control from demonstrations'},
  distribution: {sk: 'Vypočítaj straty napájania', en: 'Calculate power losses'},
  ik: {sk: 'Nájdi uhly pre zvolený cieľ', en: 'Find angles for a target'},
  fusion: {sk: 'Spoj predikciu s meraním', en: 'Combine prediction and measurement'},
  qos: {sk: 'Over doručenie a čerstvosť', en: 'Check delivery and freshness'},
  failsafe: {sk: 'Vyskúšaj reakcie na poruchy', en: 'Explore fault responses'},
  vla: {sk: 'Vyhodnoť zovšeobecnenie', en: 'Evaluate generalisation'},
  validation: {sk: 'Over limity trajektórie', en: 'Check trajectory limits'},
} satisfies Record<string, Bilingual>;
export type ChapterExperimentId = keyof typeof chapterExperimentNames;
export function chapterExperimentName(id: string, lang: 'sk' | 'en') {
  return chapterExperimentNames[id as ChapterExperimentId][lang];
}
