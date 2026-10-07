import {makeBody,makeWheel} from './bendalabs-rover-geometry';

let cached:string|undefined;
/** Orthographic plan of the same mesh used by the homepage and course 3D view. */
export function roverPlanImage():string|undefined {
 if(cached)return cached;
 const canvas=document.createElement('canvas');canvas.width=400;canvas.height=400;
 const context=canvas.getContext('2d');if(!context)return;
 const triangles:{points:number[][];height:number;color:string}[]=[];
 const collect=(vertices:Float32Array,right=0,forward=0,up=0)=>{
  for(let i=0;i<vertices.length;i+=27){
   const points=[0,9,18].map(offset=>[vertices[i+offset]+right,vertices[i+offset+1]+forward,vertices[i+offset+2]+up]);
   const color=[6,7,8].map(offset=>Math.round(Math.max(0,Math.min(1,vertices[i+offset]))*255));
   triangles.push({points,height:points.reduce((sum,p)=>sum+p[2],0)/3,color:`rgb(${color.join(',')})`});
  }
 };
 collect(makeBody());
 for(let i=0;i<4;i++)collect(makeWheel(i===0||i===3?1:-1),i%2===0?-.655:.655,i<2?.66:-.66,.287);
 triangles.sort((a,b)=>a.height-b.height);
 for(const triangle of triangles){context.beginPath();triangle.points.forEach((p,i)=>{const x=200+p[1]*150,y=200+p[0]*150;if(i===0)context.moveTo(x,y);else context.lineTo(x,y);});context.closePath();context.fillStyle=triangle.color;context.fill();}
 cached=canvas.toDataURL('image/png');return cached;
}
