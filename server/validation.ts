import type { RequestData } from '../src/lib/rfq';
export class InputError extends Error { status=400; }
function object(value:unknown):Record<string,unknown>{if(!value||typeof value!=='object'||Array.isArray(value))throw new InputError('The request format is invalid.');return value as Record<string,unknown>;}
function text(value:unknown,label:string,max=240,required=false,multiline=false):string {if(value===undefined||value===null)value='';if(typeof value!=='string')throw new InputError(label+' must be text.');const v=value.trim();if(v.length>max||(!multiline&&/[\r\n]/.test(v))||/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(v))throw new InputError(label+' contains invalid content or is too long.');if(required&&!v)throw new InputError(label+' is required.');return v;}
function email(value:unknown){const v=text(value,'Email',254,true);if(!/^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(v))throw new InputError('Enter a valid email address.');return v;}
export function validateRequest(raw:unknown,kind:'quote'|'aog'):RequestData {
 const d=object(raw);if(d.kind!==kind)throw new InputError('Request type does not match this form.');
 const submissionId=text(d.submissionId,'Submission ID',36,true);if(!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(submissionId))throw new InputError('Reload the form and try again.');
 if(d.consent!==true)throw new InputError('Please acknowledge the privacy notice.');
 const contactEmail=email(d.email), phone=text(d.phone,'Phone number',50,kind==='aog');
 if(phone&&(!/^[+()\d\s.\-extEXT#]{6,50}$/.test(phone)||phone.replace(/\D/g,'').length<6))throw new InputError('Enter a valid phone number.');
 const common={email:contactEmail,phone,consent:true,submissionId};
 if(kind==='aog')return {kind,...common,partNumber:text(d.partNumber,'Part number',120,true),aircraft:text(d.aircraft,'Aircraft type',240,true)};
 if(d.category!=='aviation'&&d.category!=='industrial')throw new InputError('Choose a valid category.');
 if(typeof d.quantity!=='number'||!Number.isFinite(d.quantity)||d.quantity<.001||d.quantity>1000000)throw new InputError('Quantity must be between 0.001 and 1,000,000.');
 return {kind,...common,category:d.category,description:d.category==='industrial'?text(d.description,'Description',500,true):'',partNumber:text(d.partNumber,'Part number',120,d.category==='aviation'),quantity:d.quantity,firstName:text(d.firstName,'First name',240,true),lastName:text(d.lastName,'Last name',240,true),company:text(d.company,'Company name'),message:text(d.message,'Message',5000,true,true)};
}
