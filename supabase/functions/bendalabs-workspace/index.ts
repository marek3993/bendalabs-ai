// Private server bridge. Keys, sessions and access tokens never reach its logs.
declare const Deno:{env:{get(name:string):string|undefined};serve(handler:(request:Request)=>Promise<Response>):unknown};
const EXPECTED_KEY_SHA256="23f9e79238b05f0d1b4d1f04de04c21fa7029cf11f9ec97a1513d7a23973adc2";
const headers={"cache-control":"no-store","x-content-type-options":"nosniff"};
const reply=(error:string,status:number)=>Response.json({error},{status,headers});
async function authorized(value:string|null){if(!value||value.length>256)return false;const expected=Deno.env.get("BENDALABS_WORKSPACE_KEY_SHA256")||EXPECTED_KEY_SHA256;if(!/^[a-f0-9]{64}$/.test(expected))return false;const bytes=new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(value)));const actual=Array.from(bytes,b=>b.toString(16).padStart(2,"0")).join("");let diff=0;for(let i=0;i<64;i++)diff|=actual.charCodeAt(i)^expected.charCodeAt(i);return diff===0;}
async function body(req:Request){const reader=req.body?.getReader();if(!reader)throw Error();let bytes=0,text="";const decoder=new TextDecoder();while(true){const part=await reader.read();if(part.done)break;bytes+=part.value.length;if(bytes>4400000){await reader.cancel();throw Error();}text+=decoder.decode(part.value,{stream:true});}return JSON.parse(text+decoder.decode());}
export async function handler(req:Request):Promise<Response>{
 if(!await authorized(req.headers.get("x-bendalabs-key")))return reply("unauthorized",401);
 if(req.method!=="POST")return reply("invalid_input",405);
 try{
  const input=await body(req), base=Deno.env.get("SUPABASE_URL"), key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if(!base||!key)return reply("unavailable",503);
  if(typeof input.operation!=="string"||!input.payload||typeof input.payload!=="object")return reply("invalid_input",400);
  const call=async(operation:string,payload:unknown)=>{
   const response=await fetch(`${base}/rest/v1/rpc/bendalabs_workspace_rpc`,{method:"POST",headers:{apikey:key,authorization:`Bearer ${key}`,"content-type":"application/json"},body:JSON.stringify({p_operation:operation,p_payload:payload,p_token_hash:input.token_hash,p_credential_version:input.credential_version,p_resource:input.resource}),signal:AbortSignal.timeout(20000)});
   if(!response.ok)throw Error();return await response.json();
  };
  if(input.operation==="upload_attachment"){
   const p=input.payload;
   const permission=await call("list_projects",{});
   const project=permission.items?.find((x:{id:string;slug:string;role:string})=>(x.id===p.project||x.slug===p.project)&&x.role!=="reader");
   const actor=await call("whoami",{});
   if(!project||actor.error||actor.connection_id&& !actor.scope?.includes("workspace:write"))return reply("forbidden",403);
   const binary=Uint8Array.from(atob(p.base64),(v:string)=>v.charCodeAt(0));
   if(binary.length>3000000||!p.name||p.name.length>200)return reply("invalid_input",400);
   const id=crypto.randomUUID(),path=`${project.id}/${id}`;
   const sha=Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",binary)),b=>b.toString(16).padStart(2,"0")).join("");
   const upload=await fetch(`${base}/storage/v1/object/bendalabs-workspace/${path}`,{method:"POST",headers:{authorization:`Bearer ${key}`,apikey:key,"content-type":"application/octet-stream","x-upsert":"false"},body:binary});
   if(!upload.ok)throw Error();
   const saved=await call("add_attachment",{project:project.id,attachment_id:id,document_id:p.document_id||null,path,name:p.name,mime:p.mime||"application/octet-stream",bytes:binary.length,sha256:sha});
   if(saved.error){await fetch(`${base}/storage/v1/object/bendalabs-workspace/${path}`,{method:"DELETE",headers:{authorization:`Bearer ${key}`,apikey:key}});return Response.json(saved,{headers});}
   return Response.json(saved,{headers});
  }
  if(input.operation==="download_attachment"){
   const found=await call("get_attachment",input.payload);const a=found.items?.[0];if(!a)return reply("not_found",404);
   const response=await fetch(`${base}/storage/v1/object/authenticated/bendalabs-workspace/${a.path}`,{headers:{authorization:`Bearer ${key}`,apikey:key}});
   if(!response.ok)throw Error();
   const bytes=new Uint8Array(await response.arrayBuffer());let binary="";for(const b of bytes)binary+=String.fromCharCode(b);
   return Response.json({...a,base64:btoa(binary)},{headers});
  }
  const result=await call(input.operation,input.payload);
  return Response.json(result,{headers});
 }catch{return reply("unavailable",503);}
}
if(typeof Deno!=="undefined")Deno.serve(handler);
