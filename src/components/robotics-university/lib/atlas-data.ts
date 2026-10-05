import {Box,BrainCircuit,ScanLine,Cog,Plane,BatteryCharging,Code2,CircuitBoard} from 'lucide-react';
export type Lang='sk'|'en';export type Bilingual={sk:string;en:string};
export const categories=[
 {id:'basics',sk:'Základy robotiky',en:'Robotics foundations',subSk:'Od nápadu k prvému pohybu',subEn:'From an idea to the first move',icon:Box,color:'#a9debd'},
 {id:'ai',sk:'AI a autonómia',en:'AI & autonomy',subSk:'Keď stroj začne rozumieť',subEn:'When machines start to understand',icon:BrainCircuit,color:'#b8a5ec'},
 {id:'sensors',sk:'Senzory a vnímanie',en:'Sensing & perception',subSk:'Ako robot vidí svoj svet',subEn:'How a robot sees its world',icon:ScanLine,color:'#8dc9e6'},
 {id:'motion',sk:'Pohyb a mechanika',en:'Motion & mechanics',subSk:'Presnosť v každom pohybe',subEn:'Precision in every movement',icon:Cog,color:'#dec290'},
 {id:'drones',sk:'Drony a lietanie',en:'Drones & flight',subSk:'Robotika v treťom rozmere',subEn:'Robotics in the third dimension',icon:Plane,color:'#a7c9d8'},
 {id:'power',sk:'Batérie a energia',en:'Batteries & power',subSk:'Energia pre tvoje nápady',subEn:'Power for your ideas',icon:BatteryCharging,color:'#dad68a'},
 {id:'code',sk:'Kód a riadenie',en:'Code & control',subSk:'Od algoritmu k správaniu',subEn:'From algorithms to behaviour',icon:Code2,color:'#b8b5e7'},
 {id:'building',sk:'Elektronika a stavba',en:'Electronics & building',subSk:'Z komponentov celok',subEn:'Turn components into a system',icon:CircuitBoard,color:'#dcab92'},
];
export const labNames={code:{sk:'Naprogramuj rover',en:'Program a rover'},pid:{sk:'Vylaď PID regulátor',en:'Tune a PID controller'},lidar:{sk:'Uvidíš ako LiDAR',en:'See through LiDAR'},power:{sk:'Navrhni napájanie',en:'Design the power system'},kinematics:{sk:'Ovládni pohyb ramena',en:'Control the robotic arm'},drone:{sk:'Udrž dron vo vzduchu',en:'Keep a drone airborne'},motors:{sk:'Preskúmaj moment a prevod',en:'Explore torque and gearing'}};
export type LabId=keyof typeof labNames;
