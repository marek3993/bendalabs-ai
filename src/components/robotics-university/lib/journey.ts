export const missionIds=['turn','repair','slalom','efficient'] as const;
export const challengeIds=['pid','lidar','power','kinematics','drone','motors'] as const;
export type Journey={missions:string[];challenges:string[];demo:boolean};
export const emptyJourney:Journey={missions:[],challenges:[],demo:false};
export function parseJourney(value:unknown):Journey{const v=value&&typeof value==='object'?value as Record<string,unknown>:{};const list=(key:string,allowed:readonly string[])=>Array.isArray(v[key])?[...new Set((v[key] as unknown[]).filter((s):s is string=>typeof s==='string'&&allowed.includes(s)))]:[];return {missions:list('missions',missionIds),challenges:list('challenges',challengeIds),demo:v.demo===true};}
export function mergeJourney(a:Journey,b:Journey):Journey{return {missions:[...new Set([...a.missions,...b.missions])],challenges:[...new Set([...a.challenges,...b.challenges])],demo:a.demo||b.demo};}
