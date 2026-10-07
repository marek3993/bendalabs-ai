import {courseIds,type CourseId} from './course-experiments';
import {cleanProgram,type Program} from './mecanum';
import type {Policy} from './course-experiments';
export type CourseDraft={program:Program;independent:boolean;policy:Policy;note:string;guidedProgram?:Program;independentProgram?:Program;guidedPolicy?:Policy;independentPolicy?:Policy};
export type CourseProgress={version:1;seen:CourseId[];solved:CourseId[];last:CourseId;drafts:Partial<Record<CourseId,CourseDraft>>};
export const emptyCourse=():CourseProgress=>({version:1,seen:[],solved:[],last:'sideways-parking',drafts:{}});
export const courseStorageKey='bendalabs-mecanum-course-v1';
export function parseCourse(value:unknown):CourseProgress {
 const result=emptyCourse();if(!value||typeof value!=='object')return result;const v=value as Record<string,unknown>;
 for(const key of ['seen','solved'] as const)if(Array.isArray(v[key]))result[key]=[...new Set(v[key].filter((id):id is CourseId=>courseIds.includes(id as CourseId)))];
 if(courseIds.includes(v.last as CourseId))result.last=v.last as CourseId;
 if(v.drafts&&typeof v.drafts==='object')for(const id of courseIds){const d=(v.drafts as Record<string,CourseDraft>)[id];if(!d||typeof d!=='object')continue;const program=cleanProgram(d.program);if(!program)continue;const p=d.policy;result.drafts[id]={program,independent:d.independent===true,note:typeof d.note==='string'?d.note.slice(0,2000):'',policy:{threshold:typeof p?.threshold==='number'&&Number.isFinite(p.threshold)?Math.min(100,Math.max(5,p.threshold)):20,comparison:p?.comparison==='below'?'below':'above',invalid:p?.invalid==='stop'?'stop':'drive',sample:p?.sample==='repeat'?'repeat':'once'}};}
 for(const id of courseIds){const draft=result.drafts[id],raw=(v.drafts as Record<string,CourseDraft>|undefined)?.[id];if(!draft||!raw)continue;for(const key of ['guidedProgram','independentProgram'] as const){const program=cleanProgram(raw[key]);if(program)draft[key]=program;}for(const key of ['guidedPolicy','independentPolicy'] as const){const p=raw[key];if(p&&typeof p==='object')draft[key]={threshold:typeof p.threshold==='number'&&Number.isFinite(p.threshold)?Math.min(100,Math.max(5,p.threshold)):20,comparison:p.comparison==='below'?'below':'above',invalid:p.invalid==='stop'?'stop':'drive',sample:p.sample==='repeat'?'repeat':'once'};}}
 return result;
}
export function mergeCourse(a:CourseProgress,b:CourseProgress):CourseProgress{return {...a,seen:[...new Set([...a.seen,...b.seen])],solved:[...new Set([...a.solved,...b.solved])],drafts:{...b.drafts,...a.drafts}};}
