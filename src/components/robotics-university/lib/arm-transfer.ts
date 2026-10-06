export type ArmPose = {yaw:number; shoulder:number; elbow:number};
export type Point3 = {x:number;y:number;z:number};
export type ArmStage = 0|1|2|3;
export const armScale = 20; // centimetres per scene unit
export const toolOffset = .92;
export const armTolerance = .1;
export const initialArmPose:ArmPose = {yaw:0,shoulder:78,elbow:-80};
export function armTool(p:ArmPose):Point3 {
 const a=p.shoulder*Math.PI/180,b=p.elbow*Math.PI/180,yaw=p.yaw*Math.PI/180;
 const radius=1.54*Math.cos(a)+1.28*Math.cos(a+b);
 return {x:radius*Math.cos(yaw),y:.95+1.54*Math.sin(a)+1.28*Math.sin(a+b)-toolOffset,z:-radius*Math.sin(yaw)};
}
export const pickupPoint = armTool({yaw:-35,shoulder:65,elbow:-100});
export const dropPoint = armTool({yaw:35,shoulder:42,elbow:-60});
export const liftHeight = pickupPoint.y+.75;
export const distance3=(a:Point3,b:Point3)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
export function validArmPose(p:ArmPose) {
 if(!Object.values(p).every(Number.isFinite)||p.yaw < -65||p.yaw>65||p.shoulder<20||p.shoulder>115||p.elbow< -130||p.elbow> -10)return false;
 const tip=armTool(p);return tip.y>=.16&&Math.hypot(tip.x,tip.z)>=.8;
}
export function armStepReady(stage:ArmStage,pose:ArmPose) {
 if(!validArmPose(pose))return false;
 const tip=armTool(pose);
 return stage===0?distance3(tip,pickupPoint)<=armTolerance:stage===1?tip.y>=liftHeight:stage===2?distance3(tip,dropPoint)<=armTolerance:false;
}
export type ArmTaskScene = {stage:ArmStage;target:Point3;item:Point3;carrying:boolean};
