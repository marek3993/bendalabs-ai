import { memo, useEffect, useId, useMemo, useRef, useState } from "react";
import { buildArm, buildCubeScene, CUBE_DEMO, projectPoint, TASK_SOURCE, TASK_TARGET, TASK_SURFACE_Y } from "./arm-geometry";
import type { CubeTaskState, Vec3 } from "./arm-geometry";
import type { ArmPose } from "./arm-motion";

export type ArmView = "perspective" | "side" | "top";

function bounds(points: Iterable<{x: number; y: number}>) {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const {x,y} of points) {
    minX = Math.min(minX,x); maxX = Math.max(maxX,x);
    minY = Math.min(minY,y); maxY = Math.max(maxY,y);
  }
  return [{x:minX,y:minY},{x:maxX,y:maxY}];
}

function ArmModel({ pose, view, cs, task = null }: { pose: ArmPose; view: ArmView; cs: boolean; task?: CubeTaskState | null }) {
  const uid = useId();
  const canvas = useRef<SVGSVGElement>(null);
  const [size, setSize] = useState({width:600,height:470});
  useEffect(() => {
    if (!canvas.current) return;
    const observer = new ResizeObserver(([entry]) => {
      const {width,height} = entry.contentRect;
      if (width > 0 && height > 0) setSize(previous =>
        previous.width === width && previous.height === height ? previous : {width,height});
    });
    observer.observe(canvas.current);
    return () => observer.disconnect();
  }, []);
  const taskActive = task !== null;
  const taskBounds = useMemo(() => taskActive ? bounds((function* () {
    for (const frame of CUBE_DEMO) for (const face of buildArm(frame.pose)) {
      for (const point of face.points) yield projectPoint(point,view);
    }
  })()) : [], [taskActive, view]);
  const mesh = [...buildArm(pose), ...(task ? buildCubeScene(task) : [])].map(face => {
    const points = face.points.map(p => projectPoint(p, view));
    return { ...face, points, depth: points.reduce((sum, p) => sum + p.depth, 0) / points.length };
  }).sort((a, b) => Number(Boolean(b.floor)) - Number(Boolean(a.floor)) || a.depth - b.depth);
  const points = [...mesh.flatMap(face => face.points), ...taskBounds];
  const [{x:minX,y:minY},{x:maxX,y:maxY}] = bounds(points);
  const scale = Math.min((size.width - 48) / (maxX - minX), Math.max(20,size.height - (task ? 100 : 80)) / (maxY - minY));
  const offsetX = size.width / 2 - (minX + maxX) / 2 * scale;
  const offsetY = size.height / 2 + 5 - (minY + maxY) / 2 * scale;
  const screen = (p: { x: number; y: number }) => `${(offsetX + p.x * scale).toFixed(2)},${(offsetY + p.y * scale).toFixed(2)}`;
  const gridPoint = (p: Vec3) => screen(projectPoint(p, view));
  const labelPoint = (p: Vec3) => { const projected = projectPoint(p, view); return { x: offsetX + projected.x * scale, y: offsetY + projected.y * scale }; };
  return <svg ref={canvas} className="bl-study-svg" viewBox={`0 0 ${size.width} ${size.height}`} fontFamily="Arial, sans-serif" role="img" aria-labelledby={`${uid}-title ${uid}-desc`}>
    <title id={`${uid}-title`}>{cs ? "Model robotické ruky se šesti ovládanými osami" : "Model robotickej ruky so šiestimi ovládanými osami"}</title>
    <desc id={`${uid}-desc`}>{cs
      ? "Kruhová základna, černé držáky, kovový spojovací válec a dvouprsté chapadlo podle fotografií Benda Robotics. Posuvníky ovládají základnu, rameno, loket, náklon a rotaci zápěstí a otevření chapadla."
      : "Kruhová základňa, čierne držiaky, kovový spojovací valec a dvojprstové chápadlo podľa fotografií Benda Robotics. Posuvníky ovládajú základňu, rameno, lakeť, náklon a rotáciu zápästia a otvorenie chápadla."}</desc>
    <defs><pattern id={`${uid}-grid`} width="30" height="30" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".7" fill="#789386" opacity=".2" /></pattern></defs>
    <rect width={size.width} height={size.height} fill="#111b18" />
    <rect width={size.width} height={size.height} fill={`url(#${uid}-grid)`} />
    <g stroke="#52685d" strokeWidth=".7" opacity=".25">
      {[-120, -80, -40, 0, 40, 80, 120].map(n => <g key={n}>
        <polyline points={`${gridPoint([n, 0, -120])} ${gridPoint([n, 0, 120])}`} />
        <polyline points={`${gridPoint([-120, 0, n])} ${gridPoint([120, 0, n])}`} />
      </g>)}
    </g>
    <g strokeWidth=".3" strokeLinejoin="round">
      {mesh.map((face, index) => <polygon key={index} points={face.points.map(screen).join(" ")} fill={face.fill} stroke={face.edge} />)}
    </g>
    {task && <g fontSize="11" fontWeight="600" textAnchor="middle" stroke="#111b18" strokeWidth="4" paintOrder="stroke">
      <text {...labelPoint([TASK_SOURCE.origin[0], TASK_SURFACE_Y - 18, TASK_SOURCE.origin[2] + 40])} fill="#efbf7b">{cs ? "Kostka" : "Kocka"}</text>
      <text {...labelPoint([TASK_TARGET.origin[0], TASK_SURFACE_Y - 18, TASK_TARGET.origin[2] - 40])} fill="#a5f1c5">{task.phase === "placed" ? "✓ " : ""}{cs ? "Cíl" : "Cieľ"}</text>
    </g>}
    <text x="24" y="31" fill="#c4d7ca" fontSize="10" letterSpacing="2">BENDA ROBOTICS</text>
    <text x={size.width-24} y="31" textAnchor="end" fill="#93e7bb" fontSize="11" letterSpacing="1.5">6 DOF</text>
    <text x="24" y={size.height-18} fill="#9fb5a8" fontSize={Math.min(10,(size.width-48)/25)}> {task ? (cs ? "Uchopte kostku, zvedněte ji a položte do cíle." : "Uchopte kocku, zdvihnite ju a položte do cieľa.") : (cs ? "Model podle skutečné konstrukce" : "Model podľa skutočnej konštrukcie")}</text>
  </svg>;
}

export default memo(ArmModel);
