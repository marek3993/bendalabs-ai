const radians = (degrees: number) => degrees * Math.PI / 180;
const degrees = (rad: number) => rad * 180 / Math.PI;
export const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
export const exceedsLimit = (value: number, limit: number) => value - limit > 1e-9 * Math.max(1, Math.abs(limit));

export function transformPoint(x: number, y: number, tx: number, ty: number, yaw: number) {
  const a = radians(yaw);
  return {x: tx + x * Math.cos(a) - y * Math.sin(a), y: ty + x * Math.sin(a) + y * Math.cos(a)};
}
export function stoppingDistance(speed: number, delay: number, deceleration: number) {
  return {reaction: speed * delay, braking: speed ** 2 / (2 * deceleration), total: speed * delay + speed ** 2 / (2 * deceleration)};
}
export const scoredDetections = [{truth: true, score: .95}, {truth: true, score: .8}, {truth: false, score: .6}, {truth: true, score: .4}, {truth: false, score: .2}];
export function detectionMetrics(threshold: number) {
  const counts = {tp: 0, fp: 0, fn: 0, tn: 0};
  for (const sample of scoredDetections) counts[sample.score >= threshold ? (sample.truth ? 'tp' : 'fp') : (sample.truth ? 'fn' : 'tn')]++;
  return {...counts, precision: counts.tp + counts.fp ? counts.tp / (counts.tp + counts.fp) : null, recall: counts.tp + counts.fn ? counts.tp / (counts.tp + counts.fn) : null};
}
export function projectPoint(x: number, y: number, z: number, focal: number, cameraX = 0) {
  return z > 0 ? {u: focal * (x - cameraX) / z + 320, v: focal * y / z + 240} : null;
}
export function kalmanStep(previous: number, movement: number, priorVariance: number, processVariance: number, measurement: number, measurementVariance: number) {
  const predicted = previous + movement, variance = priorVariance + processVariance;
  const gain = variance / (variance + measurementVariance);
  return {predicted, variance, gain, innovation: measurement - predicted, corrected: predicted + gain * (measurement - predicted), correctedVariance: (1 - gain) * variance};
}
export function inverseArm(x: number, y: number, branch: number, l1 = .3, l2 = .3) {
  const radius = Math.hypot(x, y);
  if (radius > l1 + l2 + 1e-9 || radius < Math.abs(l1 - l2) - 1e-9) return {status: 'unreachable' as const};
  if (radius < 1e-9 && Math.abs(l1 - l2) < 1e-9) return {status: 'infinite' as const};
  const q2 = (branch < 0 ? -1 : 1) * Math.acos(clamp((radius ** 2 - l1 ** 2 - l2 ** 2) / (2 * l1 * l2), -1, 1));
  const q1 = Math.atan2(y, x) - Math.atan2(l2 * Math.sin(q2), l1 + l2 * Math.cos(q2));
  return {status: 'solved' as const, q1: degrees(q1), q2: degrees(q2), elbow: {x: l1 * Math.cos(q1), y: l1 * Math.sin(q1)}, singular: Math.abs(Math.sin(q2)) < 1e-6};
}
export function odometry(left: number, right: number, radius: number, track: number, time: number) {
  const speed = radius * (left + right) / 2, angular = radius * (right - left) / track, heading = angular * time;
  return {speed, angular, heading, x: Math.abs(angular) < 1e-9 ? speed * time : speed * Math.sin(heading) / angular, y: Math.abs(angular) < 1e-9 ? 0 : speed * (1 - Math.cos(heading)) / angular};
}
export function trajectory(distance: number, duration: number, fraction: number) {
  const s = clamp(fraction, 0, 1);
  return {position: distance * (3 * s ** 2 - 2 * s ** 3), velocity: distance * (6 * s - 6 * s ** 2) / duration, acceleration: distance * (6 - 12 * s) / duration ** 2, peakVelocity: 1.5 * Math.abs(distance) / duration, peakAcceleration: 6 * Math.abs(distance) / duration ** 2};
}
export function cascade(target: number, position: number, velocity: number, tilt: number, rate: number) {
  const velocityTarget = clamp(target - position, -3, 3), accelerationTarget = clamp(velocityTarget - velocity, -9.81 * Math.tan(radians(30)), 9.81 * Math.tan(radians(30)));
  const tiltTarget = degrees(Math.atan(accelerationTarget / 9.81)), rateTarget = clamp(4 * (tiltTarget - tilt), -90, 90);
  return {velocityTarget, accelerationTarget, tiltTarget, rateTarget, effort: clamp(.02 * (rateTarget - rate), -1, 1)};
}
export const safetyActions = ['none', 'warn', 'hold', 'return', 'land'] as const;
export function faultResponse(linkLost: boolean, batteryCritical: boolean, linkAction: number, batteryAction: number, positionValid: boolean) {
  const selected = Math.max(linkLost ? linkAction : 0, batteryCritical ? batteryAction : 0);
  return {selected, available: positionValid || (selected !== 2 && selected !== 3)};
}
export function batteryProtection(cells: number[], current: number, temperature: number, measured: boolean) {
  if (!measured) return null;
  const low = cells.map((v, i) => v < 3 ? i + 1 : 0).filter(Boolean), high = cells.map((v, i) => v > 4.2 ? i + 1 : 0).filter(Boolean);
  const overcurrent = current > 10, hot = temperature > 45;
  return {voltage: cells.reduce((a, b) => a + b, 0), spread: Math.max(...cells) - Math.min(...cells), low, high, overcurrent, hot, dischargeBlocked: !!low.length || overcurrent || hot, chargeBlocked: !!high.length || hot};
}
export function powerDistribution(inputVoltage: number, outputVoltage: number, current: number, efficiency: number, cableResistance: number) {
  const outputPower = outputVoltage * current, inputPower = outputPower / (efficiency / 100), drop = current * cableResistance;
  return {outputPower, inputPower, inputCurrent: inputPower / inputVoltage, converterLoss: inputPower - outputPower, drop, cableLoss: current ** 2 * cableResistance, loadVoltage: outputVoltage - drop};
}
export type Machine = {state: 'idle' | 'moving' | 'waiting' | 'fault'; sensor: boolean; age: number};
export type MachineEvent = 'start' | 'wait' | 'stop' | 'fault' | 'restore' | 'reset' | 'tick' | 'heartbeat';
export const initialMachine: Machine = {state: 'idle', sensor: true, age: 0};
export function machineStep(previous: Machine, event: MachineEvent): Machine {
  const next = {...previous};
  if (event === 'fault') next.sensor = false;
  if (event === 'restore') next.sensor = true;
  if (event === 'tick' && (next.state === 'moving' || next.state === 'waiting')) next.age += 100;
  if (event === 'heartbeat') next.age = 0;
  if (!next.sensor || ((next.state === 'moving' || next.state === 'waiting') && next.age >= 500)) return {...next, state: 'fault'};
  if (next.state === 'fault') return event === 'reset' ? {...initialMachine} : next;
  if (event === 'start') return {...next, state: 'moving', age: 0};
  if (event === 'wait' && next.state === 'moving') next.state = 'waiting';
  if (event === 'stop' || event === 'reset') return {...initialMachine};
  return next;
}
export type ActionState = {status: 'idle' | 'active' | 'cancelled' | 'succeeded'; progress: number};
export function actionStep(previous: ActionState, event: 'start' | 'step' | 'cancel'): ActionState {
  if (event === 'start') return {status: 'active', progress: 0};
  if (previous.status !== 'active') return previous;
  if (event === 'cancel') return {...previous, status: 'cancelled'};
  const progress = Math.min(100, previous.progress + 25);
  return {progress, status: progress === 100 ? 'succeeded' : 'active'};
}
export function qosQueue(publisher: string, subscriber: string, depth: number, maxAge: number) {
  const compatible = publisher === 'reliable' || subscriber === 'best-effort';
  const retained = [0, 50, 100, 150].slice(-depth), age = 200 - retained[0];
  return {compatible, retained, age, fresh: compatible && age < maxAge};
}
export function imitationRun(initialError: number, recovery: boolean) {
  const examples = (recovery ? [-1, -.5, -.1, 0, .1, .5, 1] : [-.1, 0, .1]).map(error => ({error, action: -.5 * error}));
  let error = initialError;
  const path = [error], actions: number[] = [];
  for (let i = 0; i < 10; i++) {
    const nearest = examples.reduce((a, b) => Math.abs(b.error - error) < Math.abs(a.error - error) ? b : a);
    actions.push(nearest.action); error += nearest.action; path.push(error);
  }
  return {examples, path, actions, finalError: error};
}
export type Trial = {success: number; total: number};
export function validTrial(row: Trial) {
  return Number.isSafeInteger(row.success) && Number.isSafeInteger(row.total) && row.success >= 0 && row.total >= row.success && row.total <= 10000;
}
export function evaluateTrials(rows: Trial[]) {
  if (rows.some(r => !validTrial(r))) return null;
  const tested = rows.filter(r => r.total > 0), total = rows.reduce((s, r) => s + r.total, 0);
  return {tested: tested.length, total, rate: total ? rows.reduce((s, r) => s + r.success, 0) / total : null, worst: tested.length ? Math.min(...tested.map(r => r.success / r.total)) : null};
}
export function checkMeasurements(limit: number, values: string[], direction: 'min' | 'max') {
  if (!Number.isFinite(limit) || limit < 0 || values.some(v => v.trim() === '' || !Number.isFinite(Number(v)) || Number(v) < 0)) return 'unverified';
  return values.every(v => direction === 'max' ? Number(v) <= limit : Number(v) >= limit) ? 'pass' : 'fail';
}
