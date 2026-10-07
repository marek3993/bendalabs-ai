import { COLORS, Geometry, makeBody, makeWheel, type V3, type Color } from "@/components/robotics-university/lib/bendalabs-rover-geometry";
export type DriveInput = { forward: number; strafe: number; turn: number };
export type DriveHold = { elapsed: number; released: boolean };
export type DrivePose = { x: number; y: number; yaw: number; wheels: [number, number, number, number] };
export type DriveView = "arena" | "close";
export type DriveScene = { pose: DrivePose; path: [number, number][]; checkpoint: number; complete: boolean; view: DriveView };
export const DRIVE_ARENA = { x: 4.6, y: 3.35 };
export const DRIVE_ENVELOPE = { x: 0.82, y: 1.08 };
export const DRIVE_CHECKPOINTS: [number, number][] = [[-2.75, 1.65], [2.65, 1.65]];
export const DRIVE_PARK = { x: 2.65, y: -1.65, yaw: 0, radius: 0.38, angle: Math.PI / 10 };
export const DRIVE_TAP_SECONDS = 0.11;
export function releaseDriveHold<T extends DriveHold>(hold: T, completeTap = true): T | null {
  return completeTap && hold.elapsed < DRIVE_TAP_SECONDS ? { ...hold, released: true } : null;
}
export function advanceDriveHold<T extends DriveHold>(hold: T, elapsed: number): T | null {
  const next = { ...hold, elapsed: hold.elapsed + Math.min(0.05, Math.max(0, elapsed)) };
  return next.released && next.elapsed >= DRIVE_TAP_SECONDS ? null : next;
}
export function driveCanvasSize(cssWidth: number, cssHeight: number, deviceRatio: number) {
  if (!Number.isFinite(cssWidth) || !Number.isFinite(cssHeight) || cssWidth < 1 || cssHeight < 1) return { width: 0, height: 0 };
  const ratio = Math.min(Number.isFinite(deviceRatio) && deviceRatio > 0 ? deviceRatio : 1, 2, 4096 / cssWidth, 4096 / cssHeight, Math.sqrt(6_000_000 / (cssWidth * cssHeight)));
  return { width: Math.max(1, Math.floor(cssWidth * ratio)), height: Math.max(1, Math.floor(cssHeight * ratio)) };
}
export function initialDrivePose(): DrivePose { return { x: -2.75, y: -1.65, yaw: 0, wheels: [0, 0, 0, 0] }; }
export function headingDifference(a: number, b: number) { return Math.atan2(Math.sin(a - b), Math.cos(a - b)); }
export function wheelSpeeds(forward: number, strafe: number, turn: number): [number, number, number, number] {
  const spin = 1.3 * turn;
  return [forward + strafe - spin, forward - strafe + spin, forward - strafe - spin, forward + strafe + spin];
}
export function advanceDrive(pose: DrivePose, input: DriveInput, elapsed: number, speed: number): DrivePose {
  const dt = Math.min(0.05, Math.max(0, elapsed));
  const divisor = Math.max(1, Math.hypot(input.strafe, input.forward));
  const forward = input.forward / divisor * speed, strafe = input.strafe / divisor * speed;
  const turn = input.turn * 1.35;
  const yaw = headingDifference(pose.yaw + turn * dt, 0), middle = pose.yaw + turn * dt / 2;
  const ex = DRIVE_ENVELOPE.x * Math.abs(Math.cos(yaw)) + DRIVE_ENVELOPE.y * Math.abs(Math.sin(yaw));
  const ey = DRIVE_ENVELOPE.x * Math.abs(Math.sin(yaw)) + DRIVE_ENVELOPE.y * Math.abs(Math.cos(yaw));
  const clamp = (v: number, limit: number) => Math.max(-limit, Math.min(limit, v));
  const x = clamp(pose.x + (strafe * Math.cos(middle) - forward * Math.sin(middle)) * dt, DRIVE_ARENA.x - ex);
  const y = clamp(pose.y + (strafe * Math.sin(middle) + forward * Math.cos(middle)) * dt, DRIVE_ARENA.y - ey);
  // Use actual displacement at the boundary so stationary wheels do not keep spinning into a wall.
  const vx = dt ? (x - pose.x) / dt : 0, vy = dt ? (y - pose.y) / dt : 0;
  const actualForward = -vx * Math.sin(middle) + vy * Math.cos(middle);
  const actualStrafe = vx * Math.cos(middle) + vy * Math.sin(middle);
  const speeds = wheelSpeeds(actualForward, actualStrafe, turn);
  return { x, y, yaw, wheels: pose.wheels.map((angle, i) => (angle - speeds[i] * dt / 0.285) % (Math.PI * 2)) as DrivePose["wheels"] };
}
export function crossesCheckpoint(before: DrivePose, after: DrivePose, point: [number, number], radius = 0.53) {
  const dx = after.x - before.x, dy = after.y - before.y, length = dx * dx + dy * dy;
  const t = length ? Math.max(0, Math.min(1, ((point[0] - before.x) * dx + (point[1] - before.y) * dy) / length)) : 0;
  return Math.hypot(before.x + t * dx - point[0], before.y + t * dy - point[1]) <= radius;
}
export function isParked(pose: DrivePose, checkpoint: number) {
  return checkpoint === DRIVE_CHECKPOINTS.length && Math.hypot(pose.x - DRIVE_PARK.x, pose.y - DRIVE_PARK.y) < DRIVE_PARK.radius && Math.abs(headingDifference(pose.yaw, DRIVE_PARK.yaw)) < DRIVE_PARK.angle;
}

function makeArena() {
  const g = new Geometry(), x=DRIVE_ARENA.x, y=DRIVE_ARENA.y;
  g.box([0,0,-0.055],[x*2+0.12,y*2+0.12,0.1],[0.095,0.14,0.12]);
  for (let i=-8;i<=8;i++) g.ribbon([[i/2,-y,0],[i/2,y,0]],0.008,[0.16,0.22,0.18]);
  for (let i=-6;i<=6;i++) g.ribbon([[-x,i/2,0],[x,i/2,0]],0.008,[0.16,0.22,0.18]);
  g.ribbon([[-x,-y,0.01],[x,-y,0.01],[x,y,0.01],[-x,y,0.01],[-x,-y,0.01]],0.045,[0.32,0.47,0.38]);
  for (const side of [-1,1]) for (let j=-7;j<=7;j++) g.ribbon([[j*0.57,side*y,0.02],[j*0.57+0.17,side*(y-0.12),0.02]],0.035,[0.42,0.51,0.38]);
  return g.packed();
}

function makeMarkers(checkpoint: number, complete: boolean) {
  const g = new Geometry();
  DRIVE_CHECKPOINTS.forEach(([x,y],i)=> {
    const color: Color = i<checkpoint?COLORS.mint:i===checkpoint?[0.94,0.72,0.36]:[0.32,0.43,0.36];
    g.ring([x,y,0.018],0.48,0.53,color);
    // Strokes remain legible from either camera without a texture or font request.
    const strokes = i===0 ? [[[0,-0.19],[0,0.19]],[[-0.07,0.12],[0,0.19]]] : [[[-0.12,0.13],[-0.06,0.2],[0.09,0.2],[0.13,0.1],[-0.12,-0.17],[0.14,-0.17]]];
    for (const stroke of strokes) g.ribbon(stroke.map(([dx,dy])=>[x+dx,y+dy,0.022]),0.036,color);
  });
  const {x,y}=DRIVE_PARK, color:Color=complete?COLORS.mint:checkpoint===2?[0.94,0.72,0.36]:[0.35,0.47,0.4];
  g.ribbon([[x-0.91,y+1.12,0.016],[x-0.91,y-1.12,0.016],[x+0.91,y-1.12,0.016],[x+0.91,y+1.12,0.016]],0.04,color);
  g.ribbon([[x,y-0.4,0.02],[x,y+0.45,0.02]],0.04,color);
  g.ribbon([[x-0.18,y+0.23,0.02],[x,y+0.45,0.02],[x+0.18,y+0.23,0.02]],0.04,color);
  return g.packed();
}

const VERTEX = `attribute vec3 aPosition; attribute vec3 aNormal; attribute vec3 aColor;
uniform vec3 uOffset; uniform vec2 uYaw; uniform vec2 uSpin; uniform vec3 uRight; uniform vec3 uUp; uniform mediump vec3 uForward; uniform vec3 uCenter; uniform vec2 uHalf; uniform float uPerspective;
varying vec3 vNormal; varying vec3 vColor;
void main(){
  mat3 rx=mat3(1.,0.,0.,0.,uSpin.x,uSpin.y,0.,-uSpin.y,uSpin.x);
  mat3 rz=mat3(uYaw.x,uYaw.y,0.,-uYaw.y,uYaw.x,0.,0.,0.,1.);
  vec3 p=rz*rx*aPosition+uOffset-uCenter;
  vNormal=rz*rx*aNormal; vColor=aColor;
  if(uPerspective>0.){
    float depth=uPerspective-dot(p,uForward);
    gl_Position=vec4(dot(p,uRight)/uHalf.x,dot(p,uUp)/uHalf.y,(30.15/29.85)*depth-(9./29.85),depth);
  }else{
    gl_Position=vec4(dot(p,uRight)/uHalf.x,dot(p,uUp)/uHalf.y,-dot(p,uForward)/30.,1.);
  }
}`;
const FRAGMENT = `precision mediump float; varying vec3 vNormal; varying vec3 vColor; uniform vec3 uForward;
void main(){ vec3 n=normalize(vNormal); if(!gl_FrontFacing)n=-n;
vec3 lightDirection=normalize(vec3(-.4,-.65,1.));
float diffuse=max(0.,dot(n,lightDirection));
float fill=max(0.,dot(n,normalize(vec3(.8,.35,.35))));
float sheen=pow(max(0.,dot(reflect(-lightDirection,n),uForward)),24.);
float light=.33+.62*diffuse+.16*fill; gl_FragColor=vec4(vColor*light+vec3(.055)*sheen,1.); }`;
type Mesh = { buffer: WebGLBuffer; count: number };

export function createMecanumScene(canvas: HTMLCanvasElement, onStatus: (available: boolean) => void) {
  const context = canvas.getContext("webgl", { antialias: true, alpha: false });
  if (!context) throw new Error("WebGL unavailable");
  const gl = context;
  let disposed=false, lost=false, scheduled=0, program:WebGLProgram|null=null;
  let scene:DriveScene={pose:initialDrivePose(),path:[],checkpoint:0,complete:false,view:"arena"};
  let markerKey="", pathKey="";
  let attributes:number[]=[];
  const uniforms:Record<string,WebGLUniformLocation|null>={};
  const meshes:Record<string,Mesh>={};
  const body=makeBody(), wheelLeft=makeWheel(1), wheelRight=makeWheel(-1), arena=makeArena();
  const shadow=new Geometry(); shadow.ring([0,0,0.008],0,0.87,[0.06,0.095,0.08]);
  function upload(name:string, data:Float32Array) {
    let mesh=meshes[name];
    if(!mesh){const buffer=gl.createBuffer();if(!buffer)throw new Error("Buffer unavailable");mesh=meshes[name]={buffer,count:0};}
    gl.bindBuffer(gl.ARRAY_BUFFER,mesh.buffer);gl.bufferData(gl.ARRAY_BUFFER,data,gl.STATIC_DRAW);mesh.count=data.length/9;
  }
  function free() { for(const mesh of Object.values(meshes))gl.deleteBuffer(mesh.buffer);for(const key of Object.keys(meshes))delete meshes[key];if(program)gl.deleteProgram(program);program=null; }
  function initialize() {
    free();
    const shaders:WebGLShader[]=[];
    try{
      for(const [type,source] of [[gl.VERTEX_SHADER,VERTEX],[gl.FRAGMENT_SHADER,FRAGMENT]] as const){
        const shader=gl.createShader(type);if(!shader)throw new Error("Shader unavailable");shaders.push(shader);gl.shaderSource(shader,source);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw new Error("Shader compilation failed");
      }
      program=gl.createProgram();if(!program)throw new Error("Program unavailable");for(const shader of shaders)gl.attachShader(program,shader);gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error("Program linking failed");
      gl.useProgram(program);attributes=["aPosition","aNormal","aColor"].map(name=>gl.getAttribLocation(program!,name));
      for(const name of ["uOffset","uYaw","uSpin","uRight","uUp","uForward","uCenter","uHalf","uPerspective"])uniforms[name]=gl.getUniformLocation(program,name);
      upload("body",body);upload("wheelLeft",wheelLeft);upload("wheelRight",wheelRight);upload("arena",arena);upload("shadow",shadow.packed());
      markerKey="";pathKey="";onStatus(true);
    }finally{for(const shader of shaders)gl.deleteShader(shader);}
  }
  function drawMesh(name:string,offset:V3=[0,0,0],yaw=0,spin=0){
    const mesh=meshes[name];if(!mesh?.count)return;
    gl.bindBuffer(gl.ARRAY_BUFFER,mesh.buffer);attributes.forEach((a,i)=>{gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,3,gl.FLOAT,false,36,i*12);});
    gl.uniform3fv(uniforms.uOffset,offset);gl.uniform2f(uniforms.uYaw,Math.cos(yaw),Math.sin(yaw));gl.uniform2f(uniforms.uSpin,Math.cos(spin),Math.sin(spin));gl.drawArrays(gl.TRIANGLES,0,mesh.count);
  }
  function render(){
    scheduled=0;if(disposed||lost||!program)return;
    const container=canvas.parentElement;
    const cssWidth=container?.clientWidth??0,cssHeight=container?.clientHeight??0;
    if(cssWidth<1||cssHeight<1)return;
    // The CSS container owns layout; bitmap dimensions must never become a resize input.
    const {width,height}=driveCanvasSize(cssWidth,cssHeight,window.devicePixelRatio||1);
    if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;}
    gl.viewport(0,0,width,height);gl.clearColor(0.067,0.098,0.08,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.enable(gl.DEPTH_TEST);gl.disable(gl.CULL_FACE);gl.useProgram(program);
    const aspect=width/height,close=scene.view==="close",elevation=close?0.48:1.03,azimuth=close?-1.0:-Math.PI/2;
    const halfY=close?Math.tan(43*Math.PI/360):Math.max(3.35,4.98/aspect);
    gl.uniform3f(uniforms.uRight,-Math.sin(azimuth),Math.cos(azimuth),0);
    gl.uniform3f(uniforms.uUp,-Math.cos(azimuth)*Math.sin(elevation),-Math.sin(azimuth)*Math.sin(elevation),Math.cos(elevation));
    gl.uniform3f(uniforms.uForward,Math.cos(azimuth)*Math.cos(elevation),Math.sin(azimuth)*Math.cos(elevation),Math.sin(elevation));
    gl.uniform3f(uniforms.uCenter,close?scene.pose.x:0,close?scene.pose.y:0,close?0.30:0.15);
    gl.uniform2f(uniforms.uHalf,halfY*aspect,halfY);gl.uniform1f(uniforms.uPerspective,close?Math.max(4.7,3.95/aspect):0);
    const nextMarker=`${scene.checkpoint}/${scene.complete}`;
    if(markerKey!==nextMarker){upload("markers",makeMarkers(scene.checkpoint,scene.complete));markerKey=nextMarker;}
    const last=scene.path[scene.path.length-1],nextPath=`${scene.path.length}/${last?.[0]}/${last?.[1]}`;
    if(pathKey!==nextPath){const g=new Geometry();g.ribbon(scene.path.map(([x,y])=>[x,y,0.011]),0.031,[0.34,0.61,0.46]);upload("path",g.packed());pathKey=nextPath;}
    drawMesh("arena");drawMesh("path");drawMesh("markers");
    const p=scene.pose;drawMesh("shadow",[p.x,p.y,0],p.yaw);drawMesh("body",[p.x,p.y,0],p.yaw);
    const wheels:[number,number,string][]=[[-0.655,0.66,"wheelLeft"],[0.655,0.66,"wheelRight"],[-0.655,-0.66,"wheelRight"],[0.655,-0.66,"wheelLeft"]];
    wheels.forEach(([x,y,name],i)=>drawMesh(name,[p.x+x*Math.cos(p.yaw)-y*Math.sin(p.yaw),p.y+x*Math.sin(p.yaw)+y*Math.cos(p.yaw),0.287],p.yaw,p.wheels[i]));
  }
  function schedule(){if(!scheduled&&!disposed&&!lost)scheduled=requestAnimationFrame(render);}
  function contextLost(event:Event){event.preventDefault();lost=true;cancelAnimationFrame(scheduled);scheduled=0;onStatus(false);}
  function contextRestored(){if(disposed)return;lost=false;try{initialize();schedule();}catch{free();onStatus(false);}}
  const resize=new ResizeObserver(schedule);resize.observe(canvas.parentElement??canvas);
  canvas.addEventListener("webglcontextlost",contextLost);canvas.addEventListener("webglcontextrestored",contextRestored);
  try{initialize();schedule();}catch(error){resize.disconnect();canvas.removeEventListener("webglcontextlost",contextLost);canvas.removeEventListener("webglcontextrestored",contextRestored);free();throw error;}
  return {
    update(next:DriveScene){scene=next;schedule();},
    dispose(){disposed=true;cancelAnimationFrame(scheduled);resize.disconnect();canvas.removeEventListener("webglcontextlost",contextLost);canvas.removeEventListener("webglcontextrestored",contextRestored);free();},
  };
}
