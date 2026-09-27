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

// Upper linkage follows the supplied pre-platform arm reference. The raised
// bearing carrier follows the current photographs/STL envelope, not the old base.
// Joint offsets are illustrative assembly estimates, not calibrated hardware CAD.
export function armFrames(pose: ArmPose) {
  const base = turn(move(identity, [0, 88, 0]), pose[0], "y");
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
export function gripperFrames(pose: ArmPose) {
  const tool = armFrames(pose).tool;
  const spread = CLOSED_FINGER_ANGLE + (40 - CLOSED_FINGER_ANGLE) * pose[5] / 100;
  return ([-1, 1] as const).map(side => {
    const drive = turn(move(tool, [side * 12, 15, 0]), -side * spread, "z");
    const follower = turn(move(tool, [side * 22, 15, 0]), -side * spread, "z");
    const jaw = turn(move(drive, [0, 48, 0]), side * spread, "z");
    return { side, drive, follower, jaw };
  });
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
  const black = ["#101317", "#252b31", "#434a51", "#181d23", "#0c1014", "#333a42"];
  const silver = ["#77818c", "#d9dee4", "#f3f5f7", "#a5afb9", "#65717d", "#b9c2ca"];
  function face(frame: Basis, points: Vec3[], fill: string, edge = "#41494f") {
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
      face(frame, [lower[i], lower[next], upper[next], upper[i]], shade, shade);
    }
  }
  function disc(frame: Basis, center: Vec3, radius: number, length: number, colors = silver) {
    const shifted = move(frame, center);
    cylinder({ ...shifted, y: frame.z, z: mul(frame.y, -1) }, radius, length, colors, 12);
  }
  function plate(frame: Basis, outline: [number, number][], z: number, thickness = 3) {
    face(frame, outline.map(([x,y]) => [x,y,z-thickness/2]), black[0]);
    face(frame, outline.map(([x,y]) => [x,y,z+thickness/2]), black[1]);
    outline.forEach(([x,y],i) => {
      const [nx,ny] = outline[(i+1)%outline.length];
      face(frame, [[x,y,z-thickness/2],[nx,ny,z-thickness/2],[nx,ny,z+thickness/2],[x,y,z+thickness/2]], black[i%2?2:3]);
    });
  }
  function screw(frame: Basis, x: number, y: number, z: number, side = 1, radius = 2.7) {
    disc(frame, [x,y,z], radius+1, side*.7, silver);
    disc(frame, [x,y,z+side*.8], radius, side*1.3, silver);
    const front=z+side*2.2;
    face(frame, [[x-.55,y-radius*.7,front],[x+.55,y-radius*.7,front],[x+.55,y+radius*.7,front],[x-.55,y+radius*.7,front]], '#33383e', '#33383e');
    face(frame, [[x-radius*.7,y-.55,front],[x+radius*.7,y-.55,front],[x+radius*.7,y+.55,front],[x-radius*.7,y+.55,front]], '#33383e', '#33383e');
  }
  function rail(frame: Basis, z: number, width: number, length: number, holes: number[]) {
    const radius=3, thickness=3;
    for(const side of [-1,1]) box(frame,[side*(width/2+radius)/2,length/2,z],[(width/2-radius),length,thickness]);
    let previous=0;
    for(const y of [...holes,length+radius]) {
      const bottom=y-radius;
      if(bottom>previous) box(frame,[0,(previous+bottom)/2,z],[radius*2,bottom-previous,thickness]);
      if(y<=length) for(let i=0;i<12;i++) {
        const a=i*Math.PI/6,b=(i+1)*Math.PI/6;
        const inner=(angle:number):[number,number]=>[Math.cos(angle)*radius,y+Math.sin(angle)*radius];
        const outer=(angle:number):[number,number]=>{const r=radius/Math.max(Math.abs(Math.cos(angle)),Math.abs(Math.sin(angle)));return [Math.cos(angle)*r,y+Math.sin(angle)*r];};
        const ia=inner(a),ib=inner(b),oa=outer(a),ob=outer(b);
        for(const side of [-1,1]) face(frame,[[...oa,z+side*thickness/2],[...ob,z+side*thickness/2],[...ib,z+side*thickness/2],[...ia,z+side*thickness/2]],side>0?black[1]:black[0],side>0?black[1]:black[0]);
        face(frame,[[...ia,z-thickness/2],[...ib,z-thickness/2],[...ib,z+thickness/2],[...ia,z+thickness/2]],black[4],black[4]);
      }
      previous=y+radius;
    }
  }
  function cable(frame: Basis, points: Vec3[], color: string) {
    for(let i=1;i<points.length;i++) {
      const a=points[i-1],b=points[i],dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy)||1;
      const ox=-dy/length*.85,oy=dx/length*.85;
      face(frame,[[a[0]+ox,a[1]+oy,a[2]],[b[0]+ox,b[1]+oy,b[2]],[b[0]-ox,b[1]-oy,b[2]],[a[0]-ox,a[1]-oy,a[2]]],color,color);
    }
  }
  function axle(frame: Basis, width = 48) {
    box(frame, [0, -10, 0], [40, 35, 20]);
    box(frame, [0, 6, 0], [42, 5, 22]);
    box(frame, [0, -25, 0], [40, 3, 20]);
    for (const side of [-1, 1]) {
      box(frame,[side*22,-8,0],[5,25,24]);
      for(const y of [-17,0]) screw(frame,side*22,y,13,1,2);
      disc(frame, [0, 0, side * width / 2], 13, side * 2, black);
      screw(frame,0,0,side*(width/2+2),side,3.1);
      for (const [x, y] of [[-7,0],[7,0],[0,7],[0,-7]]) {
        screw(frame,x,y,side*(width/2+2),side,1.8);
      }
    }
  }
  function bolt(frame: Basis, p: Vec3) { cylinder(move(frame, p), 2.5, 3, silver, 8); }
  function gear(frame: Basis) {
    const near: Vec3[] = [], far: Vec3[] = [];
    for (let i = 0; i < 64; i++) {
      const angle = i / 64 * Math.PI * 2, radius = i % 4 < 2 ? 12.5 : 10.8;
      near.push([Math.cos(angle) * radius, Math.sin(angle) * radius, 5]);
      far.push([Math.cos(angle) * radius, Math.sin(angle) * radius, 8]);
    }
    face(frame, near, black[0]); face(frame, far, black[1]);
    for (let i = 0; i < 64; i++) {
      const j = (i + 1) % 64;
      face(frame, [near[i], near[j], far[j], far[i]], black[3]);
    }
  }
  const { base, shoulder, elbow, wrist, tool } = armFrames(pose);

  box(identity, [0, 3, 0], [145, 6, 132]);
  box(identity, [0, 9, 0], [106, 8, 106]);
  box(identity, [0, 34, 0], [40, 40.5, 20]);
  cylinder(move(identity,[0,54,0]),5,23,silver,12);
  for (const x of [-43, 43]) for (const z of [-40, 40]) {
    cylinder(move(identity, [x, 13, z]), 5, 52, black, 10);
    bolt(identity, [x * 1.45, 6, z * 1.4]);
  }
  cylinder(move(identity, [0, 65, 0]), 63.5, 8, black, 40);
  cylinder(move(identity, [0, 73, 0]), 60, 8.5, silver, 40);
  cylinder(move(base, [0, -6.5, 0]), 47, 6.5, black, 40);
  for (let i = 0; i < 4; i++) {
    const a = i * Math.PI / 2 + .4;
    bolt(identity, [55 * Math.cos(a), 81.5, 55 * Math.sin(a)]);
  }
  box(base, [0, 3, 0], [46, 6, 60]);
  for (const z of [-25, 25]) box(base, [0, 21, z], [38, 40, 4]);
  axle(shoulder);
  for (const z of [-23, 23]) {
    rail(shoulder,z,28,153,[31,61,91,121]);
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
  for (const z of [-23, 23]) rail(wrist,z,31,60,[24,43]);
  box(wrist, [0, 59, 0], [36, 5, 47]);
  box(wrist, [0, 36, 0], [26, 30, 31]);
  cylinder(move(wrist, [0, 62, 0]), 12, 4);
  cylinder(move(tool,[0,0,0]),10,6,silver,20);
  box(tool, [0, 8, -2], [54, 6, 30]);
  box(tool, [0, 11, -16], [40, 24, 20]);
  for(const side of [-1,1]) {
    plate(tool,[[side*15,0],[side*28,2],[side*28,24],[side*17,28],[side*13,16]],3,3);
    for(const y of [5,21]) screw(tool,side*23,y,5,1,2.1);
  }
  for (const {side,drive,follower,jaw} of gripperFrames(pose)) {
    gear(drive);
    // The two 48 mm links have separate fixed pivots. Their distal pivots
    // remain 10 mm apart in tool space, forming the photographed parallelogram.
    plate(drive,[[-7,-6],[0,-10],[7,-6],[9,6],[5,22],[4,46],[0,52],[-4,46],[-5,22],[-9,6]],10,3);
    plate(follower,[[-3,-3],[0,-5],[3,-3],[3,48],[0,51],[-3,48]],-2,3);
    for(const [frame,z] of [[drive,12],[follower,0]] as const) {
      screw(frame,0,0,z,1,2.5);
      screw(frame,0,48,z,1,2.5);
    }
    const outline:[number,number][]=[[-5,-5],[14,-5],[14,7],[5,18],[5,39],[3,45],[-3,45],[-5,39]].map(([x,y])=>[side*x,y]);
    for(const z of [-6,6]) plate(jaw,outline,z,2.5);
    disc(jaw,[side*10,0,-7],2.2,14,silver);
    screw(jaw,side*10,0,8,1,2.3);
    for(const y of [0,17,39]) {
      disc(jaw,[0,y,-7],2.2,14,silver);
      screw(jaw,0,y,8,1,2.3);
    }
    box(jaw,[0,30,0],[10,24,10]);
  }
  const wireColors=['#b94a3b','#d4b965','#292c31'];
  wireColors.forEach((color,i)=>{
    const shift=i*2.1;
    cable(shoulder,[[-18+shift,-18,15],[-23+shift,8,18],[-19+shift,44,18],[-18+shift,108,18],[-22+shift,144,18]],color);
    cable(elbow,[[-18+shift,-9,16],[-22+shift,15,17],[-12+shift,32,12],[-12+shift,80,12],[-22+shift,103,17]],color);
    cable(wrist,[[18+shift,-13,13],[25+shift,0,15],[24+shift,34,15],[18+shift,61,13]],color);
    cable(tool,[[18+shift,-2,-8],[31+shift,5,0],[33+shift,25,0],[25+shift,34,-4],[18+shift,18,-9]],color);
  });
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
