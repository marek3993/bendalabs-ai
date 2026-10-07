'use client';
import {useEffect,useRef,useState} from 'react';
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {wheelSpeeds,wheelIds,chassis,type Pose,type Velocity,type World,type Reading} from '@/components/robotics-university/lib/mecanum';
import type {Lang} from '@/components/robotics-university/lib/atlas-data';

type Props={pose:Pose;velocity:Velocity;world:World;trail:Pose[];waypoints?:Pose[];lang:Lang;reading?:Reading;highlight?:string};
export default function MecanumScene(props:Props){
 const mount=useRef<HTMLDivElement>(null),latest=useRef(props);latest.current=props;
 const [flat,setFlat]=useState(false),[retry,setRetry]=useState(0),[failed,setFailed]=useState(false),[top,setTop]=useState(false),[detail,setDetail]=useState(false),topRef=useRef(top),detailRef=useRef(detail);topRef.current=top;detailRef.current=detail;
 useEffect(()=>{
  const el=mount.current;if(!el||flat)return;let renderer:THREE.WebGLRenderer;
  try{renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});}catch{setFailed(true);return;}
  setFailed(false);renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;el.appendChild(renderer.domElement);
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(38,1,.05,60);camera.position.set(5.4,5,2.1);
  const orbit=new OrbitControls(camera,renderer.domElement);orbit.target.set(3,0,-2);orbit.enableDamping=true;orbit.enablePan=false;orbit.minDistance=5;orbit.maxDistance=13;orbit.maxPolarAngle=Math.PI*.47;
  scene.add(new THREE.HemisphereLight(0xd8ffe8,0x16241c,2.4));const light=new THREE.DirectionalLight(0xfff5de,4);light.position.set(1,7,3);light.castShadow=true;light.shadow.mapSize.set(1024,1024);light.shadow.camera.left=-7;light.shadow.camera.right=7;light.shadow.camera.top=7;light.shadow.camera.bottom=-7;scene.add(light);const rim=new THREE.DirectionalLight(0x72bfa1,3);rim.position.set(-4,3,-6);scene.add(rim);
  const materials={shell:new THREE.MeshStandardMaterial({color:0xe0e4db,metalness:.25,roughness:.35}),dark:new THREE.MeshStandardMaterial({color:0x14241d,roughness:.48,metalness:.65}),rubber:new THREE.MeshStandardMaterial({color:0x101613,roughness:.75}),metal:new THREE.MeshStandardMaterial({color:0x929f98,metalness:.88,roughness:.3}),mint:new THREE.MeshStandardMaterial({color:0x95dcb0,metalness:.2,roughness:.4}),amber:new THREE.MeshStandardMaterial({color:0xe6b26b,metalness:.3,roughness:.45}),board:new THREE.MeshStandardMaterial({color:0x267058,roughness:.5}),floor:new THREE.MeshStandardMaterial({color:0x10271d,roughness:.95}),wall:new THREE.MeshStandardMaterial({color:0x42604e,roughness:.8}),glow:new THREE.MeshBasicMaterial({color:0xb2e2bc,transparent:true,opacity:.75})};
  const sharedMaterials=new Set<THREE.Material>(Object.values(materials));
  function makeArrow(direction:THREE.Vector3,origin:THREE.Vector3,length:number,color:number,headLength:number,headWidth:number){
   const helper=new THREE.ArrowHelper(direction,origin,length,color,headLength,headWidth);
   // ArrowHelper normally shares geometry between instances; own copies let each scene dispose safely.
   helper.line.geometry=helper.line.geometry.clone();helper.cone.geometry=helper.cone.geometry.clone();return helper;
  }
  function disposeObject(root:THREE.Object3D){
   const geometries=new Set<THREE.BufferGeometry>(),ownedMaterials=new Set<THREE.Material>(),textures=new Set<THREE.Texture>();
   root.traverse(object=>{if(object instanceof THREE.Mesh||object instanceof THREE.Line||object instanceof THREE.Sprite){geometries.add(object.geometry);for(const material of Array.isArray(object.material)?object.material:[object.material])if(!sharedMaterials.has(material)){ownedMaterials.add(material);if(material instanceof THREE.SpriteMaterial&&material.map)textures.add(material.map);}}});
   geometries.forEach(geometry=>geometry.dispose());textures.forEach(texture=>texture.dispose());ownedMaterials.forEach(material=>material.dispose());
  }
  function makeLabel(text:string,color:string,wide=false){
   const canvas=document.createElement('canvas');canvas.width=wide?256:96;canvas.height=96;const context=canvas.getContext('2d');if(!context)return null;
   context.fillStyle='rgba(10,28,18,.94)';context.fillRect(4,4,canvas.width-8,88);context.strokeStyle=color;context.lineWidth=3;context.strokeRect(4,4,canvas.width-8,88);
   context.fillStyle=color;context.font='600 52px system-ui, sans-serif';context.textAlign='center';context.textBaseline='middle';context.fillText(text,canvas.width/2,49);
   const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;const label=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,transparent:true,depthTest:false,depthWrite:false,toneMapped:false,sizeAttenuation:false}));
   label.geometry=label.geometry.clone();label.scale.set(wide?.15:.055,.055,1);label.renderOrder=10;return label;
  }
  function box(parent:THREE.Object3D,size:number[],pos:number[],material:THREE.Material,r=.018){const m=new THREE.Mesh(new RoundedBoxGeometry(size[0],size[1],size[2],2,Math.min(r,...size.map(x=>x/3))),material);m.position.set(...pos as [number,number,number]);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
  box(scene,[6,.06,4],[3,-.06,-2],materials.floor);
  const gridPoints=[];for(let x=0;x<=6;x+=.5)gridPoints.push(x,-.024,0,x,-.024,-4);for(let y=0;y<=4;y+=.5)gridPoints.push(0,-.024,-y,6,-.024,-y);
  const gridMaterial=new THREE.LineBasicMaterial({color:0x345a44,transparent:true,opacity:.7});scene.add(new THREE.LineSegments(new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute(gridPoints,3)),gridMaterial));
  const walls=new THREE.Group();scene.add(walls);const bay=new THREE.Group();scene.add(bay);const markers=new THREE.Group();scene.add(markers);let worldRef:World|undefined,sceneLang:Lang|undefined;
  const body=new THREE.Group();scene.add(body);const parts:Record<string,THREE.Object3D[]>={battery:[],controller:[],driver:[],motor:[],sensor:[]};
  box(body,[.48,.045,.36],[0,.16,0],materials.dark);for(const x of [-.16,.16])for(const z of [-.13,.13])box(body,[.02,.16,.02],[x,.245,z],materials.metal,.003);
  const topPlate=box(body,[.45,.025,.35],[0,.325,0],materials.shell);topPlate.material=new THREE.MeshStandardMaterial({color:0xdae5dc,roughness:.4,metalness:.25,transparent:true,opacity:.86});
  parts.battery.push(box(body,[.15,.09,.13],[-.095,.23,0],materials.mint));box(body,[.035,.095,.135],[-.095,.23,0],materials.rubber);
  parts.controller.push(box(body,[.11,.012,.1],[.065,.23,-.075],materials.board));box(body,[.045,.018,.048],[.065,.245,-.075],materials.dark);box(body,[.025,.012,.035],[.105,.246,-.075],materials.metal);
  parts.driver.push(box(body,[.09,.014,.09],[.065,.23,.075],materials.board));for(const z of [.055,.095])box(body,[.04,.025,.026],[.065,.247,z],materials.dark);
  const wheelGroups:THREE.Group[]=[];
  for(const [index,id] of wheelIds.entries()){
   const x=index<2?chassis.a:-chassis.a,z=index%2===0?-chassis.b:chassis.b,handed=index===0||index===3?-1:1;
   const axle=box(body,[.075,.055,.12],[x,.1,z*.65],materials.metal);parts.motor.push(axle);
   const wheel=new THREE.Group();wheel.position.set(x,chassis.radius,z);body.add(wheel);wheelGroups.push(wheel);
   const hub=new THREE.Mesh(new THREE.CylinderGeometry(.042,.042,.046,20),materials.metal);hub.rotation.x=Math.PI/2;wheel.add(hub);
   for(let i=0;i<8;i++){const a=i*Math.PI/4,roller=new THREE.Mesh(new THREE.CapsuleGeometry(.013,.044,3,8),materials.rubber);roller.position.set(.052*Math.cos(a),.052*Math.sin(a),0);roller.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),new THREE.Vector3(-Math.sin(a),Math.cos(a),handed).normalize());roller.castShadow=true;wheel.add(roller);}
   for(const side of [-1,1]){const disc=new THREE.Mesh(new THREE.CylinderGeometry(.034,.034,.008,24),materials.amber);disc.rotation.x=Math.PI/2;disc.position.z=side*.03;wheel.add(disc);}
  }
  parts.sensor.push(box(body,[.025,.055,.14],[.252,.26,0],materials.dark));for(const z of [-.044,.044]){const eye=new THREE.Mesh(new THREE.CylinderGeometry(.022,.022,.016,24),materials.metal);eye.rotation.z=Math.PI/2;eye.position.set(.272,.26,z);body.add(eye);}
  const arrow=makeArrow(new THREE.Vector3(1,0,0),new THREE.Vector3(-.06,.348,0),.23,0x1e6247,.065,.065);body.add(arrow);
  const traceMaterial=new THREE.LineBasicMaterial({color:0xb2e2bc,transparent:true,opacity:.55}),traceGeometry=new THREE.BufferGeometry();traceGeometry.setAttribute('position',new THREE.BufferAttribute(new Float32Array(12000),3));const trace=new THREE.Line(traceGeometry,traceMaterial);scene.add(trace);
  const rayMaterial=new THREE.LineBasicMaterial({color:0xe9bd74}),rayGeometry=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(),new THREE.Vector3()]),ray=new THREE.Line(rayGeometry,rayMaterial);scene.add(ray);
  function disposeChildren(group:THREE.Group){for(const child of [...group.children]){disposeObject(child);group.remove(child);}}
  const resize=()=>{renderer.setSize(el.clientWidth,el.clientHeight,false);camera.aspect=el.clientWidth/el.clientHeight;camera.updateProjectionMatrix();};const observer=new ResizeObserver(resize);observer.observe(el);resize();
  const trackedTarget=new THREE.Vector3(),trackingDelta=new THREE.Vector3();
  let frame=0,disposed=false,last=performance.now(),lastView=-1;const lost=(event:Event)=>{event.preventDefault();setFailed(true);cancelAnimationFrame(frame);};renderer.domElement.addEventListener('webglcontextlost',lost);
  const animate=()=>{
   if(disposed)return;const now=performance.now(),dt=Math.min((now-last)/1000,.05);last=now;const p=latest.current;
   if(worldRef!==p.world||sceneLang!==p.lang){worldRef=p.world;sceneLang=p.lang;disposeChildren(walls);disposeChildren(bay);disposeChildren(markers);for(const wall of p.world.walls)box(walls,[wall.width,.42,wall.height],[wall.x+wall.width/2,.19,-wall.y-wall.height/2],materials.wall);
    const b=p.world.bay;bay.position.set(b.x,.001,-b.y);bay.rotation.y=b.yaw;for(const z of [-b.width/2,b.width/2])box(bay,[b.length,.014,.015],[0,0,z],materials.mint,.002);for(const x of [-b.length/2,b.length/2])box(bay,[.015,.014,b.width],[x,0,0],materials.mint,.002);bay.add(makeArrow(new THREE.Vector3(1,0,0),new THREE.Vector3(-.13,.025,0),.28,0xb2e2bc,.065,.07));
    const bayLabel=makeLabel(p.lang==='sk'?'CIEĽ':'TARGET','#b2e2bc',true);if(bayLabel){bayLabel.position.set(0,.18,-b.width/2-.2);bay.add(bayLabel);}
    for(const [index,point] of (p.waypoints??[]).entries()){const ring=new THREE.Mesh(new THREE.TorusGeometry(.14,.013,6,40),materials.amber);ring.rotation.x=Math.PI/2;ring.position.set(point.x,.012,-point.y);markers.add(ring);const label=makeLabel(String(index+1),'#e6b26b');if(label){label.position.set(point.x,.22,-point.y);markers.add(label);}}
   }
   const close=detailRef.current,above=topRef.current,view=(close?2:0)+(above?1:0);
   trackedTarget.set(close?p.pose.x:3,close?.18:0,close?-p.pose.y:-2);
   if(view!==lastView){
    lastView=view;orbit.minDistance=close?.75:5;orbit.maxDistance=close?3.5:13;orbit.enableRotate=!above;orbit.target.copy(trackedTarget);
    if(close)camera.position.copy(trackedTarget).add(above?new THREE.Vector3(0,1.8,.001):new THREE.Vector3(1.05,.78,.92));
    else camera.position.set(above?3:5.4,above?7.6:5,above?-1.999:2.1);
   }else if(close){trackingDelta.subVectors(trackedTarget,orbit.target);camera.position.add(trackingDelta);orbit.target.copy(trackedTarget);}
   body.position.set(p.pose.x,0,-p.pose.y);body.rotation.y=p.pose.yaw;const w=wheelSpeeds(p.velocity);wheelGroups.forEach((g,i)=>g.rotation.z-=w[wheelIds[i]]*dt);
   for(const [id,objects] of Object.entries(parts))for(const object of objects){object.scale.setScalar(p.highlight===id?1.1:1);}
   (topPlate.material as THREE.MeshStandardMaterial).opacity=p.highlight?.length ? .3 : .86;
   const points=p.trail.slice(-4000),position=traceGeometry.getAttribute('position') as THREE.BufferAttribute;points.forEach((q,i)=>position.setXYZ(i,q.x,.004,-q.y));position.needsUpdate=true;traceGeometry.setDrawRange(0,points.length);trace.frustumCulled=false;
   ray.visible=!!p.reading&&p.reading.state!=='invalid';if(ray.visible){const len=p.reading?.state==='valid'?p.reading.metres:2.5,dx=Math.cos(p.pose.yaw),dy=Math.sin(p.pose.yaw),attr=rayGeometry.getAttribute('position') as THREE.BufferAttribute;attr.setXYZ(0,p.pose.x+dx*(chassis.length/2),.25,-p.pose.y-dy*(chassis.length/2));attr.setXYZ(1,p.pose.x+dx*(chassis.length/2+len),.25,-p.pose.y-dy*(chassis.length/2+len));attr.needsUpdate=true;ray.frustumCulled=false;}
   if(!document.hidden){orbit.update();renderer.render(scene,camera);}frame=requestAnimationFrame(animate);
  };animate();
  return()=>{disposed=true;cancelAnimationFrame(frame);observer.disconnect();orbit.dispose();renderer.domElement.removeEventListener('webglcontextlost',lost);disposeObject(scene);sharedMaterials.forEach(material=>material.dispose());light.shadow.dispose();renderer.dispose();renderer.domElement.remove();};
 },[flat,retry]);
 const t=(sk:string,en:string)=>props.lang==='sk'?sk:en,inDiagram=flat||failed;
 return <div className="mecanum-view"><div className="mecanum-canvas" ref={mount} role="img" aria-label={t('Mecanum rover, parkovacie miesto a prekážky. Šípka na podvozku označuje predok.','Mecanum rover, parking bay and obstacles. The chassis arrow marks the front.')}>{inDiagram&&<MecanumMap {...props}/>}</div><div className="mecanum-view-tools" style={{flexWrap:'wrap',right:10}}>{!inDiagram&&<button aria-pressed={detail} onClick={()=>{setDetail(!detail);setTop(false);}}>{detail?t('Celé pracovisko','Full workspace'):t('Detail robota','Robot detail')}</button>}<button onClick={()=>{if(inDiagram){setFlat(false);setDetail(false);setTop(false);setRetry(v=>v+1);}else setTop(!top);}}>{inDiagram?t('Zobraziť 3D','Show 3D'):t(top?'Priestorový pohľad':'Pohľad zhora',top?'Perspective view':'Top view')}</button>{!inDiagram&&<button onClick={()=>{setFlat(true);setDetail(false);setTop(false);}}>{t('Schéma','Diagram')}</button>}</div><div className="mecanum-scale">{t('Mriežka 50 cm · ideálny model','50 cm grid · ideal model')}{inDiagram?' · 2D':''}</div></div>;
}
function MecanumMap({pose,world,trail,waypoints,reading,lang}:Props){
 const x=(v:number)=>v*100,y=(v:number)=>400-v*100;
 return <svg viewBox="-15 -15 630 430" className="mecanum-map" role="img" aria-label={lang==='sk'?'Pôdorys pracoviska':'Workspace plan'}><defs><pattern id="mecanum-grid" width="50" height="50" patternUnits="userSpaceOnUse"><path d="M50 0H0V50" fill="none" stroke="#31553e" strokeWidth=".65"/></pattern></defs><rect width="600" height="400" fill="#10271d" stroke="#53725c"/><rect width="600" height="400" fill="url(#mecanum-grid)"/>{world.walls.map((w,i)=><rect key={i} x={x(w.x)} y={y(w.y+w.height)} width={x(w.width)} height={x(w.height)} fill="#42604e" stroke="#718678"/>)}<g transform={`translate(${x(world.bay.x)},${y(world.bay.y)}) rotate(${-world.bay.yaw*180/Math.PI})`}><rect x={-world.bay.length*50} y={-world.bay.width*50} width={world.bay.length*100} height={world.bay.width*100} fill="#b2e2bc12" stroke="#b2e2bc" strokeWidth="2"/><path d="M-15 0H15L7 -7M15 0L7 7" fill="none" stroke="#b2e2bc" strokeWidth="2"/></g>{waypoints?.map((p,i)=><g key={i}><circle cx={x(p.x)} cy={y(p.y)} r="14" fill="none" stroke="#e6b26b"/><text x={x(p.x)} y={y(p.y)+4} textAnchor="middle" fontSize="12" fill="#e6b26b">{i+1}</text></g>)}<polyline points={trail.map(p=>`${x(p.x)},${y(p.y)}`).join(' ')} fill="none" stroke="#b2e2bc" strokeDasharray="4 3"/>{reading&&reading.state!=='invalid'&&<line x1={x(pose.x+chassis.length/2*Math.cos(pose.yaw))} y1={y(pose.y+chassis.length/2*Math.sin(pose.yaw))} x2={x(pose.x+(chassis.length/2+(reading.state==='valid'?reading.metres:2.5))*Math.cos(pose.yaw))} y2={y(pose.y+(chassis.length/2+(reading.state==='valid'?reading.metres:2.5))*Math.sin(pose.yaw))} stroke="#e6b26b" strokeDasharray="5 2"/>}<g transform={`translate(${x(pose.x)},${y(pose.y)}) rotate(${-pose.yaw*180/Math.PI})`}>{[-1,1].flatMap(a=>[-1,1].map(b=><g key={`${a}${b}`} transform={`translate(${a*18},${b*24})`}><rect x="-8" y="-6" width="16" height="12" rx="3" fill="#121a15" stroke="#9aa69c"/>{[-4,0,4].map(c=><path key={c} d={`M${c+3*a*b} -5L${c-3*a*b} 5`} stroke="#ceae77" strokeWidth="2"/>)}</g>))}<rect x="-25" y="-18" width="50" height="36" rx="5" fill="#dce8dd" stroke="#0d1c13"/><rect x="-19" y="-12" width="15" height="24" rx="2" fill="#244b35"/><rect x="0" y="-11" width="13" height="10" fill="#4c9b76"/><path d="M-1 7H17L11 1M17 7L11 13" stroke="#183a27" fill="none" strokeWidth="3"/></g></svg>;
}



