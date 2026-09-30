export interface QuoteRequest {
 kind:'quote'; category:'aviation'|'industrial'; description:string; partNumber:string;
 quantity:number; firstName:string; lastName:string; email:string; phone:string;
 company:string; message:string; consent:boolean; submissionId:string;
}
export interface AogRequest { kind:'aog'; phone:string; partNumber:string; aircraft:string; email:string; consent:boolean; submissionId:string; }
export type RequestData = QuoteRequest | AogRequest;
export function requestFields(data:RequestData):Array<[string,string]> {
 if(data.kind==='aog')return [['Part number',data.partNumber],['Aircraft type',data.aircraft],['Callback phone',data.phone],['Email',data.email]];
 return [['Category',data.category==='industrial'?'Industrial / General':'Aviation / Aerospace'],
  ...(data.category==='industrial'?[['Description',data.description] as [string,string]]:[]),
  ['Part number',data.partNumber||'Not specified'],['Quantity',String(data.quantity)],
  ['First name',data.firstName],['Last name',data.lastName],['Email',data.email],
  ['Phone number',data.phone||'Not specified'],['Company name',data.company||'Not specified'],['Message',data.message]];
}
export function requestText(data:RequestData):string {
 return [data.kind==='aog'?'PREMIUM AOG REQUEST':'QUOTE REQUEST',...requestFields(data).map(([label,value])=>`${label}: ${value}`)].join('\n');
}
