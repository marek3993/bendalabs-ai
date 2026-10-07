export type V3 = [number, number, number];
export type Color = V3;
export const COLORS = {
  black: [0.075, 0.095, 0.085], tire: [0.12, 0.14, 0.13], hub: [0.19, 0.22, 0.20], pcb: [0.39, 0.43, 0.24],
  copper: [0.72, 0.40, 0.18], gold: [0.75, 0.55, 0.24], silver: [0.69, 0.74, 0.71], red: [0.70, 0.09, 0.065],
  purple: [0.35, 0.19, 0.42], green: [0.16, 0.51, 0.31], mint: [0.52, 0.88, 0.69], white: [0.82, 0.83, 0.77],
} satisfies Record<string, Color>;
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const scale = (a: V3, n: number): V3 => [a[0] * n, a[1] * n, a[2] * n];
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const unit = (a: V3): V3 => scale(a, 1 / (Math.hypot(...a) || 1));

export class Geometry {
  data: number[] = [];
  triangle(a: V3, b: V3, c: V3, color: Color) {
    const n = unit(cross(sub(b, a), sub(c, a)));
    for (const p of [a, b, c]) this.data.push(...p, ...n, ...color);
  }
  quad(a: V3, b: V3, c: V3, d: V3, color: Color) { this.triangle(a, b, c, color); this.triangle(a, c, d, color); }
  box(center: V3, size: V3, color: Color) {
    const p = [-1, 1].flatMap(z => [-1, 1].flatMap(y => [-1, 1].map(x => add(center, [x * size[0] / 2, y * size[1] / 2, z * size[2] / 2]) as V3)));
    for (const q of [[0, 2, 3, 1], [4, 5, 7, 6], [0, 1, 5, 4], [2, 6, 7, 3], [0, 4, 6, 2], [1, 3, 7, 5]]) this.quad(p[q[0]], p[q[1]], p[q[2]], p[q[3]], color);
  }
  cylinder(a: V3, b: V3, radius: number, color: Color, segments = 16, endRadius = radius) {
    const axis = unit(sub(b, a)), right = unit(cross(axis, Math.abs(axis[2]) < 0.9 ? [0, 0, 1] : [0, 1, 0])), up = cross(axis, right);
    const radial = (angle: number, r: number) => add(scale(right, Math.cos(angle) * r), scale(up, Math.sin(angle) * r));
    for (let i = 0; i < segments; i++) {
      const t = i * Math.PI * 2 / segments, u = (i + 1) * Math.PI * 2 / segments;
      const p = add(a, radial(t, radius)), q = add(a, radial(u, radius)), r = add(b, radial(u, endRadius)), s = add(b, radial(t, endRadius));
      this.quad(p, q, r, s, color); this.triangle(a, q, p, color); this.triangle(b, s, r, color);
    }
  }
  roller(center: V3, axis: V3, color: Color) {
    const right = unit(cross(axis, [0, 0, 1])), up = cross(axis, right);
    const p = (a: number, b: number): V3 => add(center, add(scale(axis, Math.cos(a) * 0.169), add(scale(right, Math.sin(a) * Math.cos(b) * 0.061), scale(up, Math.sin(a) * Math.sin(b) * 0.061))));
    for (let i = 0; i < 8; i++) for (let j = 0; j < 12; j++) {
      const a = i / 8 * Math.PI, b = (i + 1) / 8 * Math.PI, t = j / 12 * Math.PI * 2, u = (j + 1) / 12 * Math.PI * 2;
      this.quad(p(a, t), p(b, t), p(b, u), p(a, u), color);
    }
  }
  ribbon(points: V3[], width: number, color: Color) {
    for (let i = 1; i < points.length; i++) {
      const a = points[i - 1], b = points[i], d = sub(b, a), length = Math.hypot(d[0], d[1]);
      if (!length) continue;
      const n: V3 = [-d[1] / length * width / 2, d[0] / length * width / 2, 0];
      this.quad(sub(a, n), sub(b, n), add(b, n), add(a, n), color);
    }
  }
  ring(center: V3, inner: number, outer: number, color: Color) {
    const p = (a: number, r: number): V3 => add(center, [Math.cos(a) * r, Math.sin(a) * r, 0]);
    for (let i = 0; i < 64; i++) { const a = i / 64 * Math.PI * 2, b = (i + 1) / 64 * Math.PI * 2; this.quad(p(a, inner), p(a, outer), p(b, outer), p(b, inner), color); }
  }
  packed() { return new Float32Array(this.data); }
}

export function makeBody() {
  const g = new Geometry(), c = COLORS;
  g.box([0, 0, 0.18], [1.08, 1.92, 0.085], c.black);
  g.box([0, 0, 0.24], [0.91, 1.6, 0.035], c.hub);
  for (const x of [-0.4, 0.4]) for (const y of [-0.66, 0.66]) {
    g.cylinder([x * 1.1, y, 0.28], [x * 1.48, y, 0.28], 0.125, [0.43, 0.43, 0.38], 20);
    g.cylinder([x, y, 0.22], [x, y, 0.48], 0.027, c.gold, 12);
    g.cylinder([x, y, 0.486], [x, y, 0.495], 0.038, c.silver, 12);
  }
  g.box([0, -0.045, 0.465], [0.9, 1.5, 0.028], c.pcb);
  const traces: [number, number][][] = [
    [[-0.36,-0.68],[-0.36,-0.47],[-0.29,-0.40],[-0.29,0.48]], [[-0.21,-0.65],[-0.21,-0.46],[-0.36,-0.32],[-0.36,0.48]],
    [[0.36,-0.69],[0.36,0.26],[0.29,0.34],[0.29,0.58]], [[0.29,-0.66],[0.29,-0.36],[0.35,-0.29],[0.35,0.12]],
    [[-0.07,-0.68],[-0.07,-0.43],[-0.22,-0.3],[-0.22,0.62]], [[0.08,-0.68],[0.08,-0.44],[0.22,-0.31],[0.22,0.64]],
    [[-0.4,-0.53],[-0.1,-0.53],[0.02,-0.41]], [[-0.38,0.31],[-0.21,0.31],[-0.11,0.4],[-0.11,0.62]],
    [[0.39,-0.57],[0.18,-0.57],[0.1,-0.47]], [[0.38,0.2],[0.13,0.2],[0.06,0.28],[0.06,0.65]],
    [[-0.4,-0.18],[-0.23,-0.18],[-0.13,-0.1]], [[-0.39,0.66],[0.39,0.66]], [[-0.39,-0.72],[0.38,-0.72]],
  ];
  for (const trace of traces) g.ribbon(trace.map(([x, y]) => [x, y, 0.481]), 0.017, c.copper);
  g.box([0, -0.05, 0.512], [0.325, 0.79, 0.033], c.black);
  g.box([0, 0.16, 0.543], [0.276, 0.31, 0.028], c.silver);
  g.box([0, 0.33, 0.533], [0.25, 0.046, 0.012], c.black);
  for (let i = 0; i < 6; i++) g.ribbon([[-0.105 + i * 0.036,0.322,0.542],[-0.105 + i * 0.036,0.346,0.542]], 0.011, c.gold);
  g.box([0, -0.16, 0.538], [0.1, 0.1, 0.016], c.hub);
  for (const x of [-0.085, 0.085]) {
    g.box([x, -0.445, 0.546], [0.116, 0.097, 0.06], c.silver);
    g.box([x, -0.496, 0.545], [0.073, 0.006, 0.032], c.black);
  }
  for (let i = 0; i < 18; i++) for (const x of [-0.177, 0.177]) g.cylinder([x,-0.36+i*0.038,0.483],[x,-0.36+i*0.038,0.52],0.012,c.silver,6);
  for (const x of [-0.255, 0.255]) {
    g.box([x, 0.50, 0.518], [0.24, 0.225, 0.025], c.red);
    g.box([x, 0.50, 0.539], [0.086, 0.11, 0.016], c.black);
    for (let i = 0; i < 6; i++) for (const dx of [-0.099, 0.099]) g.cylinder([x+dx,0.417+i*0.031,0.511],[x+dx,0.417+i*0.031,0.553],0.011,c.silver,6);
    g.box([x+0.048,0.555,0.54],[0.026,0.035,0.018],c.gold);
  }
  for (const y of [-0.28, 0.04]) {
    g.box([-0.425,y,0.52],[0.2,0.245,0.022],c.purple);
    g.box([-0.47,y,0.56],[0.125,0.16,0.07],c.green);
    g.box([-0.36,y,0.54],[0.055,0.066,0.012],c.black);
    for (const dy of [-0.046,0.046]) g.cylinder([-0.47,y+dy,0.597],[-0.47,y+dy,0.601],0.026,c.silver,10);
  }
  g.box([0,0.86,0.31],[0.88,0.30,0.22],c.black);
  for (const y of [0.79,0.94]) {
    g.cylinder([-0.37,y,0.365],[0.37,y,0.365],0.075,[0.12,0.16,0.18],20);
    g.cylinder([0.365,y,0.365],[0.38,y,0.365],0.056,c.silver,16);
  }
  const wires: { color: Color; points: V3[] }[] = [
    {color:c.red,points:[[0.29,0.72,0.33],[0.44,0.6,0.40],[0.42,0.3,0.58],[0.25,0.2,0.55]]},
    {color:c.white,points:[[-0.43,-0.34,0.60],[-0.55,-0.2,0.72],[-0.5,0.13,0.73],[-0.17,0.26,0.56]]},
    {color:c.black,points:[[0.31,0.72,0.32],[0.5,0.5,0.38],[0.48,-0.1,0.56],[0.18,-0.2,0.54]]},
    {color:[0.68,0.34,0.17],points:[[-0.43,0.1,0.60],[-0.53,0.26,0.66],[-0.38,0.4,0.64],[-0.17,0.3,0.55]]},
  ];
  for (const wire of wires) for (let i=1;i<wire.points.length;i++) g.cylinder(wire.points[i-1],wire.points[i],0.012,wire.color,7);
  g.box([-0.28,-0.6,0.51],[0.035,0.04,0.025],[0.36,1,0.46]);
  g.box([0.09,-0.24,0.55],[0.025,0.02,0.012],[1,0.16,0.06]);
  return g.packed();
}

export function makeWheel(hand: number) {
  const g = new Geometry();
  g.cylinder([-0.115,0,0],[0.115,0,0],0.187,COLORS.black,32);
  for (const side of [-1,1]) {
    g.cylinder([side*0.115,0,0],[side*0.125,0,0],0.14,COLORS.hub,24);
    g.cylinder([side*0.125,0,0],[side*0.14,0,0],0.046,COLORS.black,16);
    for (let i=0;i<5;i++) { const a=i/5*Math.PI*2; g.cylinder([side*0.127,Math.sin(a)*0.1,Math.cos(a)*0.1],[side*0.135,Math.sin(a)*0.1,Math.cos(a)*0.1],0.014,COLORS.silver,8); }
  }
  for (let i=0;i<9;i++) {
    const t=i/9*Math.PI*2;
    g.roller([0,Math.sin(t)*0.229,Math.cos(t)*0.229],unit([1,hand*Math.cos(t),-hand*Math.sin(t)]),COLORS.tire);
  }
  return g.packed();
}

