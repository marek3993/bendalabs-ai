'use client';
import {useEffect,useState,useCallback} from 'react';
import {parseCourse,emptyCourse,courseStorageKey,type CourseProgress} from '@/components/robotics-university/lib/course-progress';
export function useCourseProgress(){
 const [progress,setProgress]=useState(emptyCourse),[ready,setReady]=useState(false);
 useEffect(()=>{const read=()=>{try{setProgress(parseCourse(JSON.parse(localStorage.getItem(courseStorageKey)??'{}')));}catch{setProgress(emptyCourse());}};read();setReady(true);window.addEventListener('bendalabs-course-progress',read);window.addEventListener('storage',read);return()=>{window.removeEventListener('bendalabs-course-progress',read);window.removeEventListener('storage',read);};},[]);
 const update=useCallback((change:(p:CourseProgress)=>CourseProgress)=>{let current=emptyCourse();try{current=parseCourse(JSON.parse(localStorage.getItem(courseStorageKey)??'{}'));}catch{}const next=change(current);setProgress(next);try{localStorage.setItem(courseStorageKey,JSON.stringify(next));window.dispatchEvent(new Event('bendalabs-course-progress'));}catch{}},[]);
 return {progress,ready,update};
}
