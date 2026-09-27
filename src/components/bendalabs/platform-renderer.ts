export type PlatformVariant = "top-original" | "top-dual";
export type PlatformView = "front" | "back" | "side" | "right" | "top" | "under";
export type PlatformMode = "load" | "rotation" | "parts";
export type PlatformPart = "all" | "upper" | "bearing" | "frame" | "servo";
export type PlatformScene = { spread: number; yaw: number; variant: PlatformVariant; view: PlatformView; mode?: PlatformMode; selected?: PlatformPart };
type Vec3 = [number, number, number];
type MeshKey = "bottom" | PlatformVariant;
type PackedMesh = { origin: Vec3; scale: number; v: string; i: string; bounds: [Vec3, Vec3] };
export type PlatformMeshes = Record<MeshKey, PackedMesh>;
type Mesh = { buffer: WebGLBuffer; count: number; vertices: Float32Array; lo: Vec3; hi: Vec3 };
type Part = [Mesh, Vec3, number, Vec3, PlatformPart?];

const VIEWS: Record<PlatformView, [number, number]> = {
  front: [-1.1, 0.5], back: [-1.1 + Math.PI, 0.5], side: [-1.1 - Math.PI / 2, 0.12],
  right: [-1.1 + Math.PI / 2, 0.12], top: [-1.1, 1.5], under: [-1.1, -1.3],
};
const COLORS: Record<"frame" | "bearing" | "servo", Vec3> = {
  frame: [0.74, 0.8, 0.76], bearing: [0.56, 0.9, 0.72], servo: [0.93, 0.67, 0.38],
};
const VERTEX = `attribute vec3 aPosition; attribute vec3 aNormal;
  uniform vec3 uOffset; uniform vec2 uRotation; uniform vec3 uRight; uniform vec3 uUp;
  uniform vec3 uForward; uniform vec3 uCenter; uniform vec2 uHalf; varying vec3 vNormal;
  void main() {
    mat3 r = mat3(uRotation.x,uRotation.y,0.0,-uRotation.y,uRotation.x,0.0,0.0,0.0,1.0);
    vec3 p = r*aPosition+uOffset-uCenter; vNormal = r*aNormal;
    gl_Position = vec4(dot(p,uRight)/uHalf.x,dot(p,uUp)/uHalf.y,-dot(p,uForward)/600.0,1.0);
  }`;
const FRAGMENT = `precision mediump float; uniform vec3 uColor; varying vec3 vNormal;
  void main() {
    vec3 n=normalize(vNormal); if(!gl_FrontFacing) n=-n;
    float light=.42+.58*max(0.0,dot(n,normalize(vec3(-.4,-.6,1.0))));
    gl_FragColor=vec4(uColor*light,1.0);
  }`;

function decode(value: string) {
  const raw = atob(value);
  if (raw.length % 2) throw new Error("Invalid mesh data");
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  const view = new DataView(bytes.buffer);
  const result = new Uint16Array(raw.length / 2);
  for (let i = 0; i < result.length; i++) result[i] = view.getUint16(i * 2, true);
  return result;
}

function unpack(key: MeshKey, data: PackedMesh) {
  if (!data || !Number.isFinite(data.scale) || data.scale <= 0) throw new Error("Invalid mesh data");
  const vertices = decode(data.v), indices = decode(data.i);
  if (!vertices.length || vertices.length % 3 || !indices.length || indices.length % 3) throw new Error("Invalid mesh data");
  const triangles = new Float32Array(indices.length * 3);
  const center: Vec3 = key === "bottom"
    ? [(data.bounds[0][0] + data.bounds[1][0]) / 2, (data.bounds[0][1] + data.bounds[1][1]) / 2, data.bounds[0][2]]
    : [0, 0, 0];
  for (let i = 0; i < indices.length; i++) {
    if (indices[i] * 3 + 2 >= vertices.length) throw new Error("Invalid mesh index");
    for (let axis = 0; axis < 3; axis++) {
      const value = vertices[indices[i] * 3 + axis] * data.scale + data.origin[axis] - center[axis];
      if (!Number.isFinite(value)) throw new Error("Invalid mesh coordinate");
      triangles[i * 3 + axis] = value;
    }
  }
  return triangles;
}

function ring(inner: number, outer: number, height: number) {
  const triangles: number[] = [];
  const point = (radius: number, z: number, angle: number): Vec3 => [Math.cos(angle) * radius, Math.sin(angle) * radius, z];
  const quad = (points: Vec3[], reverse: boolean) => {
    if (reverse) points.reverse();
    triangles.push(...points[0], ...points[1], ...points[2], ...points[0], ...points[2], ...points[3]);
  };
  for (let i = 0; i < 96; i++) {
    const a = i * Math.PI * 2 / 96, b = (i + 1) * Math.PI * 2 / 96;
    for (const [radius, reverse] of [[outer, false], [inner, true]] as const) {
      quad([point(radius, 0, a), point(radius, 0, b), point(radius, height, b), point(radius, height, a)], reverse);
    }
    for (const [z, reverse] of [[0, true], [height, false]] as const) {
      quad([point(inner, z, a), point(outer, z, a), point(outer, z, b), point(inner, z, b)], reverse);
    }
  }
  return new Float32Array(triangles);
}

function box(x: number, y: number, z: number) {
  const points: Vec3[] = [
    [-x / 2, -y / 2, 0], [x / 2, -y / 2, 0], [x / 2, y / 2, 0], [-x / 2, y / 2, 0],
    [-x / 2, -y / 2, z], [x / 2, -y / 2, z], [x / 2, y / 2, z], [-x / 2, y / 2, z],
  ];
  const triangles: number[] = [];
  for (const q of [[0, 3, 2, 1], [4, 5, 6, 7], [0, 1, 5, 4], [1, 2, 6, 5], [2, 3, 7, 6], [3, 0, 4, 7]]) {
    triangles.push(...points[q[0]], ...points[q[1]], ...points[q[2]], ...points[q[0]], ...points[q[2]], ...points[q[3]]);
  }
  return new Float32Array(triangles);
}

export function platformArrow(start: Vec3, end: Vec3, radius = 1.4) {
  const delta = end.map((value, i) => value - start[i]) as Vec3;
  const length = Math.hypot(...delta);
  if (length < .001) return new Float32Array();
  const direction = delta.map(value => value / length) as Vec3;
  const reference: Vec3 = Math.abs(direction[2]) > .9 ? [1, 0, 0] : [0, 0, 1];
  const cross = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const side = cross(direction, reference), sideLength = Math.hypot(...side);
  const x = side.map(value => value / sideLength) as Vec3, y = cross(direction, x);
  const point = (distance: number, r: number, angle: number): Vec3 => start.map((value, i) => value + direction[i] * distance + r * (x[i] * Math.cos(angle) + y[i] * Math.sin(angle))) as Vec3;
  const neck = Math.max(0, length - Math.min(8, length * .35)), triangles: number[] = [];
  for (let i = 0; i < 12; i++) {
    const a = i * Math.PI / 6, b = (i + 1) * Math.PI / 6;
    const p = point(0, radius, a), q = point(0, radius, b), r = point(neck, radius, a), s = point(neck, radius, b);
    triangles.push(...p, ...q, ...s, ...p, ...s, ...r);
    triangles.push(...point(neck, radius * 3.4, a), ...point(neck, radius * 3.4, b), ...end);
  }
  return new Float32Array(triangles);
}

function rotationArrow(radius: number) {
  const triangles: number[] = [], start = -.75 * Math.PI, end = .75 * Math.PI;
  const point = (r: number, a: number, z: number): Vec3 => [Math.cos(a) * r, Math.sin(a) * r, z];
  for (let i = 0; i < 48; i++) {
    const a = start + (end - start) * i / 48, b = start + (end - start) * (i + 1) / 48;
    const p = point(radius - 1.6, a, 0), q = point(radius + 1.6, a, 0), r = point(radius + 1.6, b, 0), s = point(radius - 1.6, b, 0);
    triangles.push(...p, ...q, ...r, ...p, ...r, ...s);
  }
  const tip = point(radius, end, 0), tangent: Vec3 = [-Math.sin(end), Math.cos(end), 0];
  const arrowEnd = tip.map((value, i) => value + tangent[i] * 10) as Vec3;
  triangles.push(...platformArrow(tip, arrowEnd, 1.5));
  return new Float32Array(triangles);
}

export function createPlatformRenderer(
  canvas: HTMLCanvasElement,
  data: PlatformMeshes,
  onStatus: (status: "ready" | "unavailable") => void,
  onInteract: () => void,
) {
  const context = canvas.getContext("webgl", { antialias: true, alpha: true });
  if (!context) throw new Error("WebGL unavailable");
  const gl = context;
  let disposed = false, lost = false, frame = 0;
  let program: WebGLProgram | null = null;
  let position = 0, normal = 0;
  let azimuth = VIEWS.front[0], elevation = VIEWS.front[1];
  let scene: PlatformScene = { spread: 0, yaw: 0, variant: "top-dual", view: "front", mode: "load", selected: "all" };
  let drag: { x: number; y: number; id: number } | null = null;
  const buffers: WebGLBuffer[] = [];
  const uniforms: Record<string, WebGLUniformLocation | null> = {};
  const geometries: Record<string, Float32Array> = {};
  const meshes: Record<string, Mesh> = {};

  function freeResources() {
    for (const buffer of buffers) gl.deleteBuffer(buffer);
    buffers.length = 0;
    if (program) gl.deleteProgram(program);
    program = null;
  }

  function shader(type: number, source: string) {
    const result = gl.createShader(type);
    if (!result) throw new Error("Shader unavailable");
    gl.shaderSource(result, source);
    gl.compileShader(result);
    if (!gl.getShaderParameter(result, gl.COMPILE_STATUS)) {
      gl.deleteShader(result);
      throw new Error("Shader compilation failed");
    }
    return result;
  }

  function createBuffer(vertices: Float32Array): Mesh {
    const interleaved = new Float32Array(vertices.length * 2);
    const lo: Vec3 = [Infinity, Infinity, Infinity], hi: Vec3 = [-Infinity, -Infinity, -Infinity];
    for (let i = 0; i < vertices.length; i += 9) {
      const ax = vertices[i + 3] - vertices[i], ay = vertices[i + 4] - vertices[i + 1], az = vertices[i + 5] - vertices[i + 2];
      const bx = vertices[i + 6] - vertices[i], by = vertices[i + 7] - vertices[i + 1], bz = vertices[i + 8] - vertices[i + 2];
      const nx = ay * bz - az * by, ny = az * bx - ax * bz, nz = ax * by - ay * bx;
      const length = Math.hypot(nx, ny, nz) || 1;
      for (let j = 0; j < 3; j++) {
        interleaved.set([vertices[i + j * 3], vertices[i + j * 3 + 1], vertices[i + j * 3 + 2], nx / length, ny / length, nz / length], i * 2 + j * 6);
      }
    }
    for (let i = 0; i < vertices.length; i++) {
      const axis = i % 3;
      lo[axis] = Math.min(lo[axis], vertices[i]); hi[axis] = Math.max(hi[axis], vertices[i]);
    }
    const buffer = gl.createBuffer();
    if (!buffer) throw new Error("Buffer unavailable");
    buffers.push(buffer);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, interleaved, gl.STATIC_DRAW);
    return { buffer, count: vertices.length / 3, vertices, lo, hi };
  }

  function initialize() {
    freeResources();
    const shaders: WebGLShader[] = [];
    try {
      program = gl.createProgram();
      if (!program) throw new Error("Program unavailable");
      shaders.push(shader(gl.VERTEX_SHADER, VERTEX));
      shaders.push(shader(gl.FRAGMENT_SHADER, FRAGMENT));
      for (const item of shaders) gl.attachShader(program, item);
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error("Program linking failed");
      gl.useProgram(program);
      gl.enable(gl.DEPTH_TEST);
      for (const name of ["Offset", "Rotation", "Right", "Up", "Forward", "Center", "Half", "Color"]) {
        uniforms[name] = gl.getUniformLocation(program, "u" + name);
      }
      position = gl.getAttribLocation(program, "aPosition"); normal = gl.getAttribLocation(program, "aNormal");
      gl.enableVertexAttribArray(position); gl.enableVertexAttribArray(normal);
      for (const [key, vertices] of Object.entries(geometries)) meshes[key] = createBuffer(vertices);
    } finally {
      for (const item of shaders) {
        if (program) gl.detachShader(program, item);
        gl.deleteShader(item);
      }
    }
  }

  const rotate = (x: number, y: number, angle: number): [number, number] => [x * Math.cos(angle) - y * Math.sin(angle), x * Math.sin(angle) + y * Math.cos(angle)];
  const dot = (p: Vec3, axis: Vec3) => p[0] * axis[0] + p[1] * axis[1] + p[2] * axis[2];

  function render() {
    frame = 0;
    if (disposed || lost || document.hidden) return;
    const rect = canvas.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (rect.width <= 0 || rect.height <= 0) return;
    const width = Math.max(1, Math.round(rect.width * dpr)), height = Math.max(1, Math.round(rect.height * dpr));
    if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
    gl.viewport(0, 0, width, height); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    const ca = Math.cos(azimuth), sa = Math.sin(azimuth), ce = Math.cos(elevation), se = Math.sin(elevation);
    const right: Vec3 = [-sa, ca, 0], up: Vec3 = [-ca * se, -sa * se, ce], forward: Vec3 = [ca * ce, sa * ce, se];
    gl.uniform3fv(uniforms.Right, right); gl.uniform3fv(uniforms.Up, up); gl.uniform3fv(uniforms.Forward, forward);
    const spread = scene.spread / 100, yaw = scene.yaw * Math.PI / 180;
    const parts: Part[] = [
      [meshes.bottom, [0, 0, 0], 0, COLORS.frame, "frame"],
      [meshes.bearing, [0, 0, 66.5 + spread * 38], 0, COLORS.bearing, "bearing"],
      [meshes[scene.variant], [0, 0, 75.5 + spread * 84], yaw, COLORS.frame, "upper"],
      [meshes.servo, [-spread * 100, 0, 7], 0, COLORS.servo, "servo"],
      [meshes.horn, [-spread * 100, 0, 47.5], yaw, COLORS.servo, "servo"],
    ];
    for (const y of scene.variant === "top-dual" ? [-8, -49] : [-8]) {
      const [x, ry] = rotate(0, y, yaw);
      parts.push([meshes.servo, [x, ry, (scene.variant === "top-dual" ? 98 : 81) + spread * 112], yaw, COLORS.servo, "servo"]);
    }
    const annotations: Part[] = scene.mode === "load" ? [
      [meshes.loadArrow, [0, 43, 123.5 + spread * 84], 0, [0.72, 1, 0.82]],
      [meshes.loadArrow, [0, -53, 109.5 + spread * 38], 0, [0.72, 1, 0.82]],
      [meshes.loadArrow, [50, -32, 52], 0, [0.72, 1, 0.82]],
    ] : scene.mode === "rotation" ? [
      [meshes.rotationArrow, [0, 0, 84 + spread * 84], yaw, [1, 0.76, 0.38]],
      [meshes.driveArrow, [-spread * 100, 0, 50.5], yaw, [1, 0.76, 0.38]],
    ] : [];
    const lo: Vec3 = [Infinity, Infinity, Infinity], hi: Vec3 = [-Infinity, -Infinity, -Infinity];
    for (const [mesh, offset, angle] of [...parts, ...annotations]) {
      for (let k = 0; k < 8; k++) {
        const p: Vec3 = [k & 1 ? mesh.hi[0] : mesh.lo[0], k & 2 ? mesh.hi[1] : mesh.lo[1], k & 4 ? mesh.hi[2] : mesh.lo[2]];
        const [x, y] = rotate(p[0], p[1], angle), world: Vec3 = [x + offset[0], y + offset[1], p[2] + offset[2]];
        for (const [i, axis] of [right, up, forward].entries()) {
          const value = dot(world, axis); lo[i] = Math.min(lo[i], value); hi[i] = Math.max(hi[i], value);
        }
      }
    }
    const mid = lo.map((value, i) => (value + hi[i]) / 2);
    const center = [0, 1, 2].map(i => right[i] * mid[0] + up[i] * mid[1] + forward[i] * mid[2]);
    const half = Math.max((hi[1] - lo[1]) / 2, (hi[0] - lo[0]) / 2 * height / width) * 1.15;
    gl.uniform3fv(uniforms.Center, center); gl.uniform2f(uniforms.Half, half * width / height, half);
    for (const [mesh, offset, angle, color, part] of [...parts, ...annotations]) {
      if (!part) gl.disable(gl.DEPTH_TEST);
      const selected = scene.selected && scene.selected !== "all" ? part === scene.selected
        : scene.mode === "load" ? part !== "servo" : scene.mode === "rotation" ? part === "upper" || part === "servo" : true;
      const tint = part && !selected ? color.map(value => value * .3 + .09) : color;
      gl.bindBuffer(gl.ARRAY_BUFFER, mesh.buffer);
      gl.vertexAttribPointer(position, 3, gl.FLOAT, false, 24, 0); gl.vertexAttribPointer(normal, 3, gl.FLOAT, false, 24, 12);
      gl.uniform3fv(uniforms.Offset, offset); gl.uniform2f(uniforms.Rotation, Math.cos(angle), Math.sin(angle));
      gl.uniform3fv(uniforms.Color, tint); gl.drawArrays(gl.TRIANGLES, 0, mesh.count);
    }
    gl.enable(gl.DEPTH_TEST);
  }

  function schedule() { if (!disposed && !lost && !frame && !document.hidden) frame = requestAnimationFrame(render); }
  function release() {
    if (drag && canvas.hasPointerCapture(drag.id)) canvas.releasePointerCapture(drag.id);
    drag = null;
  }
  function pointerDown(event: PointerEvent) {
    if (lost || !event.isPrimary || event.button !== 0) return;
    onInteract(); drag = { x: event.clientX, y: event.clientY, id: event.pointerId };
    canvas.setPointerCapture(event.pointerId);
  }
  function pointerMove(event: PointerEvent) {
    if (!drag || event.pointerId !== drag.id) return;
    azimuth -= (event.clientX - drag.x) * 0.008;
    elevation = Math.max(-1.5, Math.min(1.5, elevation + (event.clientY - drag.y) * 0.008));
    drag.x = event.clientX; drag.y = event.clientY; schedule();
  }
  function keyDown(event: KeyboardEvent) {
    if (lost || !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home"].includes(event.key)) return;
    event.preventDefault(); onInteract();
    if (event.key === "Home") [azimuth, elevation] = VIEWS[scene.view];
    else if (event.key === "ArrowLeft") azimuth -= 0.12;
    else if (event.key === "ArrowRight") azimuth += 0.12;
    else elevation = Math.max(-1.5, Math.min(1.5, elevation + (event.key === "ArrowUp" ? 0.12 : -0.12)));
    schedule();
  }
  function contextLost(event: Event) {
    event.preventDefault(); lost = true; release();
    if (frame) cancelAnimationFrame(frame); frame = 0;
    freeResources();
    onInteract(); onStatus("unavailable");
  }
  function contextRestored() {
    if (disposed) return;
    try { initialize(); lost = false; onStatus("ready"); schedule(); }
    catch { freeResources(); onStatus("unavailable"); }
  }
  function visibilityChange() {
    if (document.hidden && frame) { cancelAnimationFrame(frame); frame = 0; }
    else schedule();
  }

  try {
    for (const key of ["bottom", "top-original", "top-dual"] as const) geometries[key] = unpack(key, data[key]);
    geometries.bearing = ring(35, 60, 8.5);
    geometries.servo = box(40, 20, 40.5);
    geometries.horn = ring(2, 9, 3);
    geometries.loadArrow = platformArrow([0, 0, 0], [0, 0, -40]);
    geometries.rotationArrow = rotationArrow(70);
    geometries.driveArrow = rotationArrow(26);
    initialize();
  } catch (error) { freeResources(); throw error; }
  const resize = new ResizeObserver(schedule);
  resize.observe(canvas);
  canvas.addEventListener("pointerdown", pointerDown); canvas.addEventListener("pointermove", pointerMove);
  canvas.addEventListener("pointerup", release); canvas.addEventListener("pointercancel", release); canvas.addEventListener("lostpointercapture", release);
  canvas.addEventListener("keydown", keyDown);
  canvas.addEventListener("webglcontextlost", contextLost); canvas.addEventListener("webglcontextrestored", contextRestored);
  document.addEventListener("visibilitychange", visibilityChange);
  schedule();
  return {
    update(next: PlatformScene) {
      if (next.view !== scene.view) [azimuth, elevation] = VIEWS[next.view];
      scene = next; schedule();
    },
    resetView(view: PlatformView) { [azimuth, elevation] = VIEWS[view]; schedule(); },
    dispose() {
      disposed = true; release(); resize.disconnect();
      if (frame) cancelAnimationFrame(frame);
      canvas.removeEventListener("pointerdown", pointerDown); canvas.removeEventListener("pointermove", pointerMove);
      canvas.removeEventListener("pointerup", release); canvas.removeEventListener("pointercancel", release); canvas.removeEventListener("lostpointercapture", release);
      canvas.removeEventListener("keydown", keyDown);
      canvas.removeEventListener("webglcontextlost", contextLost); canvas.removeEventListener("webglcontextrestored", contextRestored);
      document.removeEventListener("visibilitychange", visibilityChange);
      freeResources();
      for (const key of Object.keys(meshes)) delete meshes[key];
      for (const key of Object.keys(geometries)) delete geometries[key];
    },
  };
}
