import type { ArmPose } from "./arm-motion";

export type Vec3 = [number, number, number];
export type Basis = { origin: Vec3; x: Vec3; y: Vec3; z: Vec3 };
export type ArmFace = { points: Vec3[]; fill: string; edge: string; floor?: boolean };
const identity: Basis = { origin: [0, 0, 0], x: [1, 0, 0], y: [0, 1, 0], z: [0, 0, 1] };
const rad = (value: number) => value * Math.PI / 180;
const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mul = (a: Vec3, n: number): Vec3 => [a[0] * n, a[1] * n, a[2] * n];
const mix = (a: Vec3, b: Vec3, c: number, s: number) => add(mul(a, c), mul(b, s));
function point(frame: Basis, p: Vec3): Vec3 {
  return add(frame.origin, add(mul(frame.x, p[0]), add(mul(frame.y, p[1]), mul(frame.z, p[2]))));
}
function move(frame: Basis, p: Vec3): Basis { return { ...frame, origin: point(frame, p) }; }
function turn(frame: Basis, angle: number, axis: "y" | "z"): Basis {
  const c = Math.cos(rad(angle)), s = Math.sin(rad(angle));
  return axis === "y"
    ? { ...frame, x: mix(frame.x, frame.z, c, -s), z: mix(frame.z, frame.x, c, s) }
    : { ...frame, x: mix(frame.x, frame.y, c, s), y: mix(frame.y, frame.x, c, -s) };
}

// Reference: 505 mm overall, 430 mm reach, 108 mm gripper. Individual link
// lengths are estimated from the drawing; this is not the servo calibration/CAD.
export function armFrames(pose: ArmPose) {
  const base = turn(move(identity, [0, 40, 0]), pose[0], "y");
  const shoulder = turn(move(base, [0, 35, 0]), -pose[1], "z");
  const elbow = turn(move(shoulder, [0, 153, 0]), -pose[2], "z");
  const wrist = turn(move(elbow, [0, 107, 0]), -pose[3], "z");
  const tool = turn(move(wrist, [0, 62, 0]), pose[4], "y");
  return { base, shoulder, elbow, wrist, tool };
}

export const TASK_CUBE_SIZE = 24;
const CLOSED_FINGER_ANGLE = -Math.asin(7 / 48) * 180 / Math.PI;
export const TASK_GRIP_OPEN = (Math.asin((TASK_CUBE_SIZE - 14) / 96) * 180 / Math.PI - CLOSED_FINGER_ANGLE) / (40 - CLOSED_FINGER_ANGLE) * 100;
export const TASK_APPROACH: ArmPose = [-35, 25, 65, 90, 0, 80];
export const TASK_PICK: ArmPose = [-35, 40, 64, 76, 0, TASK_GRIP_OPEN];
export const TASK_PLACE: ArmPose = [40, 40, 64, 76, 0, TASK_GRIP_OPEN];

export function gripFrame(pose: ArmPose): Basis {
  const spread = rad(CLOSED_FINGER_ANGLE + (40 - CLOSED_FINGER_ANGLE) * pose[5] / 100);
  return move(armFrames(pose).tool, [0, 44 + 48 * Math.cos(spread), 0]);
}
export function jawGap(opening: number) {
  return 14 + 96 * Math.sin(rad(CLOSED_FINGER_ANGLE + (40 - CLOSED_FINGER_ANGLE) * opening / 100));
}
export const TASK_SOURCE = gripFrame(TASK_PICK);
export const TASK_TARGET = gripFrame(TASK_PLACE);
export const TASK_SURFACE_Y = TASK_SOURCE.origin[1] - TASK_CUBE_SIZE / 2;
export type CubeTaskState = {
  cube: Basis; attachment: Basis | null; phase: "ready" | "holding" | "falling" | "placed" | "missed";
  lifted: boolean; previousOpening: number; velocity: number;
};
export function initialCubeTask(): CubeTaskState {
  return { cube: TASK_SOURCE, attachment: null, phase: "ready", lifted: false, previousOpening: 80, velocity: 0 };
}
const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const subtract = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
function localVector(frame: Basis, vector: Vec3): Vec3 { return [dot(vector, frame.x), dot(vector, frame.y), dot(vector, frame.z)]; }
function relativeFrame(parent: Basis, child: Basis): Basis {
  return { origin: localVector(parent, subtract(child.origin, parent.origin)), x: localVector(parent, child.x), y: localVector(parent, child.y), z: localVector(parent, child.z) };
}
function composeFrame(parent: Basis, child: Basis): Basis {
  const rotation = { ...parent, origin: [0, 0, 0] as Vec3 };
  return { origin: point(parent, child.origin), x: point(rotation, child.x), y: point(rotation, child.y), z: point(rotation, child.z) };
}
export function cubeBottom(cube: Basis) {
  return cube.origin[1] - TASK_CUBE_SIZE / 2 * (Math.abs(cube.x[1]) + Math.abs(cube.y[1]) + Math.abs(cube.z[1]));
}
export function cubeGripDistance(pose: ArmPose, task: CubeTaskState) {
  const closed: ArmPose = [...pose]; closed[5] = TASK_GRIP_OPEN;
  return Math.hypot(...subtract(gripFrame(closed).origin, task.cube.origin));
}
export function canGraspCube(pose: ArmPose, task: CubeTaskState) {
  const grip = gripFrame(pose);
  const alignment = Math.max(Math.abs(dot(grip.x, task.cube.x)), Math.abs(dot(grip.x, task.cube.z)));
  return Math.hypot(...subtract(grip.origin, task.cube.origin)) <= 7 && grip.y[1] < -.96 && alignment > .97;
}
export function constrainCubePose(pose: ArmPose, task: CubeTaskState): ArmPose | null {
  const next: ArmPose = [...pose];
  if (task.attachment || (next[5] < TASK_GRIP_OPEN && canGraspCube([...next.slice(0, 5), TASK_GRIP_OPEN] as ArmPose, task))) next[5] = Math.max(TASK_GRIP_OPEN, next[5]);
  if (task.attachment && cubeBottom(composeFrame(armFrames(next).tool, task.attachment)) < TASK_SURFACE_Y - .75) return null;
  return next;
}
export function advanceCubeTask(task: CubeTaskState, pose: ArmPose, elapsedSeconds = 0): CubeTaskState {
  let next: CubeTaskState = { ...task, previousOpening: pose[5] };
  const tool = armFrames(pose).tool;
  if (task.attachment) {
    const cube = composeFrame(tool, task.attachment);
    next = { ...next, cube, lifted: task.lifted || cubeBottom(cube) > TASK_SURFACE_Y + 25 };
    if (pose[5] > TASK_GRIP_OPEN + 5) next = { ...next, attachment: null, phase: "falling", velocity: 0 };
    else return next;
  } else if ((task.phase === "ready" || task.phase === "missed") && task.previousOpening > TASK_GRIP_OPEN + .01 && pose[5] <= TASK_GRIP_OPEN + .01 && canGraspCube(pose, task)) {
    return { ...next, phase: "holding", attachment: relativeFrame(tool, task.cube), velocity: 0 };
  }
  if (next.phase === "falling") {
    const dt = Math.max(0, Math.min(2, elapsedSeconds));
    const distance = next.velocity * dt + 250 * dt * dt;
    let cube = { ...next.cube, origin: add(next.cube.origin, [0, -distance, 0]) };
    const bottom = cubeBottom(cube);
    if (bottom <= TASK_SURFACE_Y + .001) {
      cube = { ...cube, origin: add(cube.origin, [0, TASK_SURFACE_Y - bottom, 0]) };
      const withinTarget = Math.hypot(cube.origin[0] - TASK_TARGET.origin[0], cube.origin[2] - TASK_TARGET.origin[2]) <= 15;
      next = { ...next, cube, phase: next.lifted && withinTarget ? "placed" : "missed", velocity: 0 };
    } else next = { ...next, cube, velocity: next.velocity + 500 * dt };
  }
  return next;
}
export const CUBE_DEMO = [
  { time: 0, pose: TASK_APPROACH },
  { time: 1500, pose: [...TASK_PICK.slice(0, 5), 80] as ArmPose },
  { time: 2400, pose: TASK_PICK },
  { time: 3100, pose: TASK_PICK },
  { time: 4400, pose: [...TASK_APPROACH.slice(0, 5), TASK_GRIP_OPEN] as ArmPose },
  { time: 6600, pose: [40, 25, 65, 90, 0, TASK_GRIP_OPEN] as ArmPose },
  { time: 7900, pose: TASK_PLACE },
  { time: 8800, pose: [...TASK_PLACE.slice(0, 5), 80] as ArmPose },
  { time: 10200, pose: [40, 25, 65, 90, 0, 80] as ArmPose },
];

export function buildCubeScene(task: CubeTaskState): ArmFace[] {
  const faces: ArmFace[] = [];
  const cuboid = (frame: Basis, width: number, height: number, depth: number, colors: string[], edge: string, floor = false) => {
    const points: Vec3[] = [[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]].map(([x,y,z]) => point(frame, [x * width / 2, y * height / 2, z * depth / 2]));
    [[0,3,2,1],[4,5,6,7],[3,7,6,2],[0,1,5,4],[0,4,7,3],[1,2,6,5]].forEach((indices, index) => faces.push({ points: indices.map(i => points[i]), fill: colors[index % colors.length], edge, floor }));
  };
  for (const [frame, target] of [[TASK_SOURCE, false], [TASK_TARGET, true]] as const) {
    cuboid({ ...frame, origin: [frame.origin[0], TASK_SURFACE_Y - 1, frame.origin[2]] }, 64, 2, 64, [target ? "#294e3c" : "#3d3930"], target ? "#93e7bb" : "#96754d", true);
  }
  cuboid(task.cube, TASK_CUBE_SIZE, TASK_CUBE_SIZE, TASK_CUBE_SIZE, ["#b67c39", "#e3ae61", "#ffd18a", "#ad7033", "#c48b42", "#e4a74e"], "#f6cd86");
  return faces;
}

export function buildArm(pose: ArmPose): ArmFace[] {
  const faces: ArmFace[] = [];
  const black = ["#161d22", "#2c373d", "#465159", "#202a30", "#10171b", "#36424a"];
  const silver = ["#87918f", "#d6dcd2", "#eef0dc", "#abb5ad", "#71817e", "#bec6b8"];
  const mint = ["#3c9676", "#93e7bb", "#c3f5d9", "#72cba1", "#29634f", "#76bca0"];
  function face(frame: Basis, points: Vec3[], fill: string, edge = "#53625f") {
    faces.push({ points: points.map(p => point(frame, p)), fill, edge });
  }
  function box(frame: Basis, center: Vec3, size: Vec3, colors = black) {
    const [x, y, z] = center, [w, h, d] = size.map(n => n / 2);
    const pts: Vec3[] = [[x-w,y-h,z-d],[x+w,y-h,z-d],[x+w,y+h,z-d],[x-w,y+h,z-d],
      [x-w,y-h,z+d],[x+w,y-h,z+d],[x+w,y+h,z+d],[x-w,y+h,z+d]];
    [[0,3,2,1],[4,5,6,7],[3,7,6,2],[0,1,5,4],[0,4,7,3],[1,2,6,5]].forEach((indices, i) => {
      face(frame, indices.map(index => pts[index]), colors[i]);
    });
  }
  function cylinder(frame: Basis, radius: number, length: number, colors = silver, segments = 16) {
    const lower: Vec3[] = [], upper: Vec3[] = [];
    for (let i = 0; i < segments; i++) {
      const a = i / segments * Math.PI * 2;
      lower.push([Math.cos(a) * radius, 0, Math.sin(a) * radius]);
      upper.push([Math.cos(a) * radius, length, Math.sin(a) * radius]);
    }
    face(frame, lower, colors[0]);
    face(frame, upper, colors[1]);
    for (let i = 0; i < segments; i++) {
      const next = (i + 1) % segments;
      const normal = point({ ...frame, origin: [0, 0, 0] }, [Math.cos(i / segments * Math.PI * 2), 0, Math.sin(i / segments * Math.PI * 2)]);
      const light = .64 + .28 * Math.max(0, normal[0] * -.45 + normal[1] * .6 + normal[2] * .7);
      const rgb = colors[1].slice(1).match(/../g)!;
      const shade = "#" + rgb.map(channel => Math.round(parseInt(channel, 16) * light).toString(16).padStart(2, "0")).join("");
      face(frame, [lower[i], lower[next], upper[next], upper[i]], shade);
    }
  }
  function disc(frame: Basis, center: Vec3, radius: number, length: number, colors = silver) {
    const shifted = move(frame, center);
    cylinder({ ...shifted, y: frame.z, z: mul(frame.y, -1) }, radius, length, colors, 12);
  }
  function axle(frame: Basis, width = 48) {
    box(frame, [0, -8, 0], [32, 38, 33]);
    for (const side of [-1, 1]) {
      disc(frame, [0, 0, side * width / 2], 13, side * 3, black);
      disc(frame, [0, 0, side * (width / 2 + 3)], 4, side * 2);
      for (const [x, y] of [[-7,0],[7,0],[0,7],[0,-7]]) {
        disc(frame, [x, y, side * (width / 2 + 3)], 1.6, side * 1.2);
      }
    }
  }
  function bolt(frame: Basis, p: Vec3) { cylinder(move(frame, p), 2.5, 3, silver, 8); }
  function gear(frame: Basis, x: number) {
    const near: Vec3[] = [], far: Vec3[] = [];
    for (let i = 0; i < 64; i++) {
      const angle = i / 64 * Math.PI * 2, radius = i % 4 < 2 ? 12.5 : 10.8;
      near.push([x + Math.cos(angle) * radius, 15 + Math.sin(angle) * radius, 15]);
      far.push([x + Math.cos(angle) * radius, 15 + Math.sin(angle) * radius, 18]);
    }
    face(frame, near, black[0]); face(frame, far, black[1]);
    for (let i = 0; i < 64; i++) {
      const j = (i + 1) % 64;
      face(frame, [near[i], near[j], far[j], far[i]], black[3]);
    }
  }
  const { base, shoulder, elbow, wrist, tool } = armFrames(pose);

  box(identity, [0, 1, 0], [145, 5, 112]);
  box(identity, [0, 8, 0], [94, 10, 81]);
  for (const x of [-37, 37]) for (const z of [-31, 31]) {
    cylinder(move(identity, [x, 12, z]), 3, 14, black, 8);
    bolt(identity, [x * 1.6, 4, z * 1.45]);
  }
  cylinder(move(identity, [0, 26, 0]), 65, 10, silver, 32);
  cylinder(move(identity, [0, 37, 0]), 50, 4, black, 32);
  for (let i = 0; i < 4; i++) {
    const a = i * Math.PI / 2 + .4;
    bolt(identity, [56 * Math.cos(a), 36, 56 * Math.sin(a)]);
  }
  box(base, [0, 3, 0], [46, 6, 60]);
  for (const z of [-25, 25]) box(base, [0, 21, z], [38, 40, 4]);
  axle(shoulder);
  for (const z of [-23, 23]) {
    box(shoulder, [0, 76, z], [26, 152, 4]);
    for (const y of [31, 61, 91, 121]) disc(shoulder, [0, y, z + Math.sign(z) * 2.2], 2.8, .5, black);
  }
  box(shoulder, [0, 140, 0], [29, 8, 43]);
  axle(elbow);
  box(elbow, [0, 15, 0], [35, 5, 47]);
  cylinder(move(elbow, [0, 18, 0]), 18, 4);
  cylinder(move(elbow, [0, 22, 0]), 9, 70);
  cylinder(move(elbow, [0, 92, 0]), 18, 4);
  box(elbow, [0, 100, 0], [35, 7, 47]);
  for (const x of [-12, 12]) for (const z of [-10, 10]) bolt(elbow, [x, 22, z]);
  axle(wrist);
  for (const z of [-23, 23]) box(wrist, [0, 29, z], [31, 60, 4]);
  box(wrist, [0, 59, 0], [36, 5, 47]);
  box(wrist, [0, 36, 0], [26, 30, 31]);
  cylinder(move(wrist, [0, 62, 0]), 12, 4);
  box(tool, [0, 8, 0], [49, 10, 26]);
  box(tool, [0, 11, -13], [26, 31, 24]);
  const closedAngle = -Math.asin(7 / 48) * 180 / Math.PI;
  const spread = closedAngle + (40 - closedAngle) * pose[5] / 100;
  for (const side of [-1, 1]) {
    gear(tool, side * 12);
    disc(tool, [side * 12, 15, 19], 3, 2);
    const finger = turn(move(tool, [side * 12, 15, 0]), -side * spread, "z");
    for (const z of [-10, 10]) {
      box(finger, [0, 24, z], [5, 48, 4]);
      box(finger, [side * 9, 24, z], [4, 48, 3]);
      for (const y of [2, 47]) disc(finger, [0, y, z + 3], 2.6, 1.5);
    }
    // Counter-rotation keeps the gripping faces parallel as the linkage opens.
    const jaw = turn(move(finger, [0, 48, 0]), side * spread, "z");
    box(jaw, [0, 22.5, 0], [7, 45, 25]);
    box(jaw, [-side * 4, 29, 0], [2, 26, 23], mint);
  }
  return faces;
}

export function projectPoint(p: Vec3, view: "perspective" | "side" | "top" = "perspective") {
  const yaw = rad(view === "side" ? 0 : view === "top" ? -25 : -32);
  const elevation = rad(view === "top" ? 78 : view === "side" ? 5 : 17);
  const horizontal = p[0] * Math.cos(yaw) + p[2] * Math.sin(yaw);
  const depth = -p[0] * Math.sin(yaw) + p[2] * Math.cos(yaw);
  return { x: horizontal, y: -p[1] * Math.cos(elevation) + depth * Math.sin(elevation),
    depth: p[1] * Math.sin(elevation) + depth * Math.cos(elevation) };
}
