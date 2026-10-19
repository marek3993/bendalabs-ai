import {angleDifference, bodyVelocity, chassis, compileProgram, degrees, newPlan, parked, stepPlan, wheelIds, wheelSpeeds, type Pose, type Program, type Velocity, type Wheels, type World} from './mecanum';
import type {Trial} from './course-experiments';

export const roverLessonStorage = 'bendalabs-rover-first-lesson-v2';
export type LessonMotion = 'forward' | 'backward' | 'left' | 'right' | 'turn-left' | 'turn-right';
export type LessonCommand = {motion: LessonMotion; amount: number};
export type WheelId = typeof wheelIds[number];
export type WheelSetting = -1 | 0 | 1;
export type WheelMix = Record<WheelId, WheelSetting>;
export const lessonMotions: LessonMotion[] = ['forward','backward','left','right','turn-left','turn-right'];

/** Lesson speed: every wheel at full setting drives the chassis at 0.6 m/s. */
export const lessonSpeed = .6;

/** Narrow aisle: wide enough for the chassis (56 cm), too narrow for its turning circle (79 cm). */
export const aisleWidth = .66;
export const turningCircle = Math.hypot(chassis.length, chassis.width);
export const aisleY = 2.6, shelvesX = 1.4;
/**
 * Warehouse: the rover leaves its station along the bottom corridor facing left, has room to turn only
 * in the open column on the left, and must slide into the aisle with its front toward the upper shelf.
 * Every leg is a whole number of 25 cm manual steps.
 */
export const pilotWorld: World = {
  width: 6, height: 4,
  start: {x: 2.6, y: .6, yaw: Math.PI},
  bay: {x: 3.35, y: aisleY, yaw: Math.PI / 2, length: .64, width: .8},
  walls: [
    {x: shelvesX, y: 1, width: 6 - shelvesX, height: aisleY - aisleWidth / 2 - 1},
    {x: shelvesX, y: aisleY + aisleWidth / 2, width: 6 - shelvesX, height: 3.6 - (aisleY + aisleWidth / 2)},
  ],
};
/** True when the chassis centre is inside the narrow aisle, where it cannot turn. */
export const inAisle = (pose: Pose) => pose.x > shelvesX && Math.abs(pose.y - aisleY) < aisleWidth / 2;
/** Open workspace for wheel experiments and the wiring diagnosis; the bay is 100 cm to the robot's left. */
export const demoWorld: World = {width: 6, height: 4, start: {x: 3, y: 2, yaw: Math.PI / 2}, bay: {x: 2, y: 2, yaw: Math.PI / 2, length: .8, width: .8}, walls: []};
export const diagnosisWorld: World = demoWorld;

/** Kept for the previous program editor and its regression checks. */
export const challengeWorld: World = {
  width: 6, height: 4,
  start: {x: 1, y: 1, yaw: 0},
  bay: {x: 4, y: 2.5, yaw: Math.PI / 2, length: .9, width: .9},
  walls: [{x: 2, y: .4, width: .6, height: 1.4}, {x: 3.4, y: 3.2, width: 1.2, height: .35}],
};
export function lessonTrial(world: World): Trial {return {world, waypoints: [], program: {distance: 100, steps: [], maneuver: []}};}
export const isTurn = (motion: LessonMotion) => motion.startsWith('turn-');

/* ---------- Wheel mixing (part 2) ---------- */

/** Ideal chassis response to four wheel settings, in "full-wheel" units. */
export function mixResponse(mix: WheelMix) {
  const {fl, fr, rl, rr} = mix;
  const forward = (fl + fr + rl + rr) / 4, left = (-fl + fr + rl - rr) / 4, turn = (-fl + fr - rl + rr) / 4, fight = (fl + fr - rl - rr) / 4;
  return {forward, left, turn, fight};
}
export function mixVelocity(mix: WheelMix): Velocity {
  const w = lessonSpeed / chassis.radius;
  return bodyVelocity({fl: mix.fl * w, fr: mix.fr * w, rl: mix.rl * w, rr: mix.rr * w});
}
export function mixWheels(mix: WheelMix): Wheels {
  const w = lessonSpeed / chassis.radius;
  return {fl: mix.fl * w, fr: mix.fr * w, rl: mix.rl * w, rr: mix.rr * w};
}
export type MixResult = 'stop' | 'fight' | 'forward' | 'backward' | 'left' | 'right' | 'turn-left' | 'turn-right' | 'diagonal' | 'arc';
const small = (v: number) => Math.abs(v) < 1e-9;
export function classifyMix(mix: WheelMix): MixResult {
  const r = mixResponse(mix);
  const moving = [r.forward, r.left, r.turn].filter(v => !small(v)).length;
  if (!moving) return small(r.fight) ? 'stop' : 'fight';
  if (moving === 1 && !small(r.forward)) return r.forward > 0 ? 'forward' : 'backward';
  if (moving === 1 && !small(r.left)) return r.left > 0 ? 'left' : 'right';
  if (moving === 1) return r.turn > 0 ? 'turn-left' : 'turn-right';
  return small(r.turn) ? 'diagonal' : 'arc';
}
export const mixGoals = ['right', 'turn-right'] as const;
export type MixGoal = typeof mixGoals[number];
export function mixMeetsGoal(mix: WheelMix, goal: MixGoal) {
  return classifyMix(mix) === goal && small(mixResponse(mix).fight);
}
export const forwardMix: WheelMix = {fl: 1, fr: 1, rl: 1, rr: 1};

/* ---------- Wiring diagnosis (part 3) ---------- */

export type Reversed = Record<WheelId, boolean>;
export const noReversal: Reversed = {fl: false, fr: false, rl: false, rr: false};
export type TestCommand = 'forward' | 'left' | 'turn-left';
export const testCommands: TestCommand[] = ['forward', 'left', 'turn-left'];
/** Commanded chassis velocity and duration of each test: 100 cm or 90°. */
export function testCommand(command: TestCommand): {velocity: Velocity; seconds: number} {
  if (command === 'turn-left') return {velocity: {vx: 0, vy: 0, omega: Math.PI / 3}, seconds: 1.5};
  return {velocity: {vx: command === 'forward' ? lessonSpeed : 0, vy: command === 'left' ? lessonSpeed : 0, omega: 0}, seconds: 1 / lessonSpeed};
}
/** Wheels actually turning when a command meets the given wiring. */
export function wiredWheels(velocity: Velocity, reversed: Reversed): Wheels {
  const w = wheelSpeeds(velocity);
  return {fl: reversed.fl ? -w.fl : w.fl, fr: reversed.fr ? -w.fr : w.fr, rl: reversed.rl ? -w.rl : w.rl, rr: reversed.rr ? -w.rr : w.rr};
}
export function wiredVelocity(velocity: Velocity, reversed: Reversed): Velocity {
  return bodyVelocity(wiredWheels(velocity, reversed));
}
/** Robot-frame telemetry: cm/s forward, cm/s to the left, °/s counterclockwise. */
export function telemetry(v: Velocity) {
  const round = (n: number) => Math.round(n) === 0 ? 0 : Math.round(n);
  return {forward: round(v.vx * 100), left: round(v.vy * 100), turn: round(degrees(v.omega))};
}
export function combineReversal(fault: WheelId, flips: Reversed): Reversed {
  return {fl: flips.fl !== (fault === 'fl'), fr: flips.fr !== (fault === 'fr'), rl: flips.rl !== (fault === 'rl'), rr: flips.rr !== (fault === 'rr')};
}
export const wiringCorrect = (reversed: Reversed) => wheelIds.every(id => !reversed[id]);
export function isWheelId(value: unknown): value is WheelId {return typeof value === 'string' && (wheelIds as readonly string[]).includes(value);}
/** Simulate one open-loop run with the given wiring; used by the checks and the lesson. */
export function simulateWired(command: TestCommand, reversed: Reversed, world: World = diagnosisWorld) {
  const {velocity, seconds} = testCommand(command);
  const actual = wiredVelocity(velocity, reversed);
  let pose: Pose = {...world.start}, plan = newPlan([{velocity: actual, seconds, path: ''}]), collision = false;
  for (let i = 0; i < 10000; i++) {
    const next = stepPlan(pose, plan, .01, world);
    pose = next.pose; plan = next.plan; collision = next.collision;
    if (next.done) break;
  }
  return {pose, collision, velocity: actual, parked: !collision && parked(pose, world.bay)};
}

/* ---------- Shared helpers ---------- */

export function cleanLessonCommands(value: unknown): LessonCommand[] | null {
  if (!Array.isArray(value) || value.length > 8) return null;
  const valid = value.every(c => c && typeof c === 'object' && lessonMotions.includes(c.motion) && Number.isFinite(c.amount) && Number.isInteger(c.amount) && c.amount >= 1 && c.amount <= (isTurn(c.motion) ? 360 : 300));
  return valid ? value.map(c => ({motion: c.motion, amount: c.amount})) : null;
}
export function lessonProgram(commands: LessonCommand[]): Program {
  const clean = cleanLessonCommands(commands);
  if (!clean?.length) throw new Error('commands');
  return {distance: 100, maneuver: [], steps: clean.map(c => isTurn(c.motion)
    ? {type: 'turn', value: c.motion === 'turn-left' ? c.amount : -c.amount}
    : {type: 'move', direction: c.motion as 'forward' | 'backward' | 'left' | 'right', value: c.amount})};
}
export function dockReadout(pose: Pose, world: World) {
  return {centimetres: Math.round(Math.hypot(pose.x-world.bay.x, pose.y-world.bay.y)*100), angle: Math.round(Math.abs(degrees(angleDifference(pose.yaw,world.bay.yaw)))), aligned: Math.abs(angleDifference(pose.yaw,world.bay.yaw)) <= Math.PI/30, parked: parked(pose,world.bay)};
}
export function simulateLesson(commands: LessonCommand[], world: World = challengeWorld) {
  let pose = {...world.start}, plan = newPlan(compileProgram(lessonProgram(commands), .6)), collision = false;
  const trail = [pose];
  for (let i=0; i<10000; i++) {
    const next = stepPlan(pose, plan, .01, world);
    pose = next.pose; plan = next.plan; collision = next.collision;
    if(i%20===0) trail.push(pose);
    if(next.done) break;
  }
  return {pose, collision, passed: !collision && parked(pose,world.bay), trail};
}
