export interface Entry { id:string; at:number; }
interface Transaction { get:<T>(key:string)=>Promise<T|undefined>; put:(key:string,value:unknown)=>Promise<void>; }
interface State { storage:Transaction & { transaction:<T>(cb:(txn:Transaction)=>Promise<T>)=>Promise<T>; setAlarm:(at:number)=>Promise<void>; deleteAll:()=>Promise<void> }; }
export function evaluate(entries:Entry[],id:string,now:number){const active=entries.filter(e=>e.at>now-3600000);if(active.some(e=>e.id===id))return {ok:true,entries:active,retryAfter:0};if(active.length>=5)return {ok:false,entries:active,retryAfter:Math.max(1,Math.ceil((active[0].at+3600000-now)/1000))};return {ok:true,entries:[...active,{id,at:now}],retryAfter:0};}
export class RfqLimiter {
 constructor(private state:State){}
 async fetch(request:Request){if(request.method!=='POST')return new Response('Method not allowed',{status:405});let id:string;try{id=(await request.json() as {id:string}).id;}catch{return new Response('Invalid request',{status:400});}if(typeof id!=='string'||!/^[a-f0-9]{64}$/.test(id))return new Response('Invalid request',{status:400});const now=Date.now();const result=await this.state.storage.transaction(async txn=>{const state=evaluate(await txn.get<Entry[]>('requests')||[],id,now);await txn.put('requests',state.entries);return state;});await this.state.storage.setAlarm(now+3600000);return new Response(JSON.stringify({ok:result.ok}),{status:result.ok?200:429,headers:{'Content-Type':'application/json','Retry-After':String(result.retryAfter)}});}
 async alarm(){await this.state.storage.deleteAll();}
}
export default { fetch:()=>new Response('Not found',{status:404}) };
