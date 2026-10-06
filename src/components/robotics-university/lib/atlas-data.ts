import {Box,BrainCircuit,ScanLine,Cog,Plane,BatteryCharging,Code2,CircuitBoard} from 'lucide-react';
export type Lang='sk'|'en';export type Bilingual={sk:string;en:string};
export const categories=[
 {id:'basics',sk:'Základy robotiky',en:'Robotics foundations',subSk:'Spätná väzba, súradnice a časovanie',subEn:'Feedback, coordinates and timing',icon:Box,color:'#a9debd'},
 {id:'ai',sk:'AI a autonómia',en:'AI & autonomy',subSk:'Videnie, učenie z ukážok a VLA',subEn:'Vision, imitation learning and VLA',icon:BrainCircuit,color:'#b8a5ec'},
 {id:'sensors',sk:'Senzory a vnímanie',en:'Sensing & perception',subSk:'Meranie vzdialenosti, kalibrácia a fúzia',subEn:'Range sensing, calibration and fusion',icon:ScanLine,color:'#8dc9e6'},
 {id:'motion',sk:'Pohyb a mechanika',en:'Motion & mechanics',subSk:'Motory, regulácia a kinematika',subEn:'Motors, control and kinematics',icon:Cog,color:'#dec290'},
 {id:'drones',sk:'Drony a lietanie',en:'Drones & flight',subSk:'Ťah, riadenie letu a poruchové stavy',subEn:'Thrust, flight control and fault responses',icon:Plane,color:'#a7c9d8'},
 {id:'power',sk:'Batérie a energia',en:'Batteries & power',subSk:'Výdrž, ochrany článkov a rozvod napájania',subEn:'Runtime, cell protection and power distribution',icon:BatteryCharging,color:'#dad68a'},
 {id:'code',sk:'Kód a riadenie',en:'Code & control',subSk:'Od algoritmu k správaniu',subEn:'From algorithms to behaviour',icon:Code2,color:'#b8b5e7'},
 {id:'building',sk:'Elektronika a stavba',en:'Electronics & building',subSk:'Z komponentov celok',subEn:'Turn components into a system',icon:CircuitBoard,color:'#dcab92'},
];
export const labNames={code:{sk:'Naprogramuj rover',en:'Program a rover'},pid:{sk:'Vylaď PID regulátor',en:'Tune a PID controller'},lidar:{sk:'Preskúmaj meranie LiDARom',en:'Explore LiDAR measurements'},power:{sk:'Navrhni napájanie',en:'Design the power system'},kinematics:{sk:'Nastav polohu ramena',en:'Position the robotic arm'},drone:{sk:'Pristaň s dronom',en:'Land a drone'},motors:{sk:'Preskúmaj moment a prevod',en:'Explore torque and gearing'}};
export type LabId=keyof typeof labNames;
