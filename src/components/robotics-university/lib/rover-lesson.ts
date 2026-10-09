import {angleDifference, compileProgram, degrees, newPlan, parked, stepPlan, type Pose, type Program, type World} from './mecanum';
import type {Trial} from './course-experiments';

export const roverLessonStorage = 'bendalabs-rover-first-lesson-v1';
export type LessonMotion = 'forward' | 'backward' | 'left' | 'right' | 'turn-left' | 'turn-right';
export type LessonCommand = {motion: LessonMotion; amount: number};
export const lessonMotions: LessonMotion[] = ['forward','backward','left','right','turn-left','turn-right'];
export const pilotWorld: World = {
  width: 6, height: 4,
  start: {x: 1, y: 1, yaw: Math.PI / 2},
  bay: {x: 3, y: 1, yaw: Math.PI / 2, length: .9, width: .9},
  walls: [{x: .5, y: 1.65, width: 3.3, height: .45}],
};
export const challengeWorld: World = {
  width: 6, height: 4,
  start: {x: 1, y: 1, yaw: 0},
  bay: {x: 4, y: 2.5, yaw: Math.PI / 2, length: .9, width: .9},
  walls: [{x: 2, y: .4, width: .6, height: 1.4}, {x: 3.4, y: 3.2, width: 1.2, height: .35}],
};
export const demoWorld: World = {...pilotWorld, walls: [], start: {x: 3, y: 2, yaw: Math.PI / 2}};
export function lessonTrial(world: World): Trial {return {world, waypoints: [], program: {distance: 100, steps: [], maneuver: []}};}
export const isTurn = (motion: LessonMotion) => motion.startsWith('turn-');
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
