import { InputError, validateRequest } from './validation';
import { emails } from './email';
interface DurableNamespace { idFromName:(name:string)=>unknown; get:(id:unknown)=>{fetch:(request:Request)=>Promise<Response>}; }
export interface Env { RESEND_API_KEY:string; TURNSTILE_SECRET_KEY:string; REFERENCE_SECRET:string; NOTIFY_EMAIL?:string; FORMS_ENABLED?:string; ALLOWED_HOSTNAMES:string; RFQ_LIMITER:DurableNamespace; }
export interface Context { request:Request; env:Env; }
const MAX_BODY=64*1024;
const response=(body:Record<string,unknown>,status=200,extra:Record<string,string>={})=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...extra}});
async function boundedForm(request:Request){if(!request.headers.get('content-type')?.startsWith('multipart/form-data'))throw new InputError('Submit this request using the website form.');if(Number(request.headers.get('content-length')||0)>MAX_BODY)throw new InputError('The request is too large.');const reader=request.body?.getReader();if(!reader)throw new InputError('The request is empty.');const chunks:Uint8Array[]=[];let size=0;while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>MAX_BODY){await reader.cancel();throw new InputError('The request is too large.');}chunks.push(value);}const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}try{return await new Response(bytes,{headers:{'Content-Type':request.headers.get('content-type')!}}).formData();}catch{throw new InputError('The uploaded form could not be read.');}}
async function hash(secret:string,value:string){const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);return new Uint8Array(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(value)));}
const hex=(bytes:Uint8Array)=>[...bytes].map(x=>x.toString(16).padStart(2,'0')).join('');
export async function handle(context:Context,kind:'quote'|'aog',send:typeof fetch=fetch):Promise<Response>{
 const {request,env}=context;
 if(request.method!=='POST')return response({ok:false,error:'Use POST to submit a request.'},405,{Allow:'POST'});
 if(env.FORMS_ENABLED!=='true'||!env.RESEND_API_KEY||!env.TURNSTILE_SECRET_KEY||!env.REFERENCE_SECRET||env.REFERENCE_SECRET.length<32||!env.RFQ_LIMITER||!env.ALLOWED_HOSTNAMES)return response({ok:false,error:'Online delivery is unavailable. Please email your request directly.'},503);
 const url=new URL(request.url);const allowed=env.ALLOWED_HOSTNAMES.split(',').map(x=>x.trim()).filter(Boolean);const origin=request.headers.get('origin');if(!allowed.includes(url.hostname)||(origin&&origin!==url.origin))return response({ok:false,error:'This request origin is not allowed.'},403);
 try {
  const form=await boundedForm(request);const token=form.get('cf-turnstile-response');if(typeof token!=='string'||!token||token.length>2048)return response({ok:false,error:'Complete the security verification and try again.'},400);
  const ip=request.headers.get('CF-Connecting-IP');if(!ip)return response({ok:false,error:'Request verification is unavailable. Please email your request.'},503);
  let verification:{success?:boolean;hostname?:string;action?:string};
  try{const res=await send('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({secret:env.TURNSTILE_SECRET_KEY,response:token,remoteip:ip}),signal:AbortSignal.timeout(8000)});if(!res.ok)throw new Error();verification=await res.json();}catch{return response({ok:false,error:'Security verification is unavailable. Please retry or email your request.'},503);}
  if(!verification.success||verification.hostname!==url.hostname||verification.action!==kind)return response({ok:false,error:'Security verification failed or expired. Please try again.'},400);
  if(form.get('business_extension'))return response({ok:true});
  const raw=form.get('payload');if(typeof raw!=='string'||raw.length>20000)throw new InputError('The request details are invalid.');let data:unknown;try{data=JSON.parse(raw);}catch{throw new InputError('The request details could not be read.');}
  const validated=validateRequest(data,kind);if(form.getAll('attachment').length)throw new InputError('Attachments are not accepted by this form. Please email supporting files directly.');
  const digest=await hash(env.REFERENCE_SECRET,JSON.stringify(validated));
  const idempotency=hex(digest);const reference=`SUP-${new Date().getUTCFullYear()}-${[...digest.slice(0,5)].map(x=>'0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'[x%36]).join('')}`;
  const ipKey=hex(await hash(env.REFERENCE_SECRET,'ip:'+ip));
  const limiter=env.RFQ_LIMITER.get(env.RFQ_LIMITER.idFromName(ipKey));const limitResult=await limiter.fetch(new Request('https://limiter.internal/check',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:idempotency})}));if(!limitResult.ok){if(limitResult.status===429)return response({ok:false,error:'You have reached five requests in an hour. Please email your request directly.'},429,{'Retry-After':limitResult.headers.get('Retry-After')||'3600'});return response({ok:false,error:'Request protection is unavailable. Please email your request.'},503);}
  const notify=env.NOTIFY_EMAIL||'info@supploid.com';if(!/^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(notify))return response({ok:false,error:'Online delivery is unavailable. Please email your request.'},503);
  const messages=emails(validated,reference,notify);
  async function deliver(message:unknown,suffix:string){const res=await send('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${env.RESEND_API_KEY}`,'Content-Type':'application/json','Idempotency-Key':`supploid/${idempotency}/${suffix}`},body:JSON.stringify(message),signal:AbortSignal.timeout(10000)});if(!res.ok)throw new Error('Email delivery failed');const result=await res.json() as {id?:string};if(!result.id)throw new Error('Email delivery not acknowledged');}
  try{await deliver(messages.internal,'internal');}catch{return response({ok:false,error:'We could not confirm delivery. Retry with the same details, or email your request directly.'},502);}
  try{await deliver(messages.customer,'customer');}catch{return response({ok:false,received:true,reference,error:'Your request reached Supploid, but its confirmation email could not be sent. Please keep your reference.'},502);}
  return response({ok:true,reference});
 }catch(error){if(error instanceof InputError)return response({ok:false,error:error.message},400);return response({ok:false,error:'Your request could not be processed. Please email us directly.'},503);}
}
