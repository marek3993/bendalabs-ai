'use client';
import {useEffect,useState} from 'react';
import {universityRevision} from '@/components/robotics-university/lib/university-revision';
import type {Lang} from '@/components/robotics-university/lib/atlas-data';
export default function UniversityUpdate({lang}:{lang:Lang}) {
 const [available,setAvailable]=useState(false);
 useEffect(()=>{
  let last=0,stopped=false;const controller=new AbortController();
  const check=async()=>{if(document.hidden||Date.now()-last<30000)return;last=Date.now();try{const response=await fetch('/university-assets/university-version.json',{cache:'no-store',signal:controller.signal});if(!response.ok)return;const data=await response.json();if(!stopped&&data&&typeof data==='object'&&'revision' in data&&typeof data.revision==='string'&&/^[a-f0-9]{20}$/.test(data.revision)&&data.revision!==universityRevision)setAvailable(true);}catch{}};
  void check();window.addEventListener('focus',check);document.addEventListener('visibilitychange',check);const interval=window.setInterval(check,300000);
  return()=>{stopped=true;controller.abort();window.removeEventListener('focus',check);document.removeEventListener('visibilitychange',check);clearInterval(interval);};
 },[]);
 if(!available)return null;
 return <aside className="university-update" role="status"><div><strong>{lang==='sk'?'Je dostupná nová verzia univerzity.':'A new version of the university is available.'}</strong><span>{lang==='sk'?'Uložený postup zostane zachovaný. Rozpracovaný experiment sa spustí od začiatku.':'Saved progress will be kept. The current experiment will restart.'}</span></div><button className="button" onClick={()=>window.location.reload()}>{lang==='sk'?'Načítať novú verziu':'Load the new version'}</button></aside>;
}
