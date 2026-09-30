import { requestText, type RequestData } from '../lib/rfq';
declare global { interface Window { turnstile?: { render:(el:HTMLElement,options:Record<string,unknown>)=>string; reset:(id?:string)=>void; remove:(id:string)=>void }; supploidTurnstileReady?:()=>void; } }
const form=document.querySelector<HTMLFormElement>('[data-request-form]');
if(form) initForm(form);
function initForm(form:HTMLFormElement) {
 const kind=form.dataset.requestForm as 'quote'|'aog';
 const status=document.getElementById('form-status')!;
 const submit=form.querySelector<HTMLButtonElement>('[data-submit]')!;
 const initialLabel=submit.textContent||'Send request';
 let submissionId=crypto.randomUUID(), widgetId:string|undefined, busy=false, downloadUrl='';
 const get=(key:string)=>String(new FormData(form).get(key)||'').trim();
 function category(){return get('category')==='industrial'?'industrial':'aviation';}
 function toggleCategory(){
  const selected=category();
  form.querySelectorAll<HTMLElement>('[data-category]').forEach(group=>{
   const enabled=group.dataset.category===selected;group.hidden=!enabled;
   group.querySelectorAll<HTMLInputElement|HTMLTextAreaElement>('input,textarea').forEach(input=>{input.disabled=!enabled;if(!enabled){input.setCustomValidity('');input.removeAttribute('aria-invalid');const error=document.getElementById(input.id+'-error');if(error)error.textContent='';}});
  });
  const part=form.querySelector<HTMLInputElement>('#partNumber')!;
  part.required=selected==='aviation';part.removeAttribute('aria-invalid');
  document.getElementById('partNumber-error')!.textContent='';
  form.querySelector<HTMLElement>('[data-part-required]')!.hidden=selected!=='aviation';
  form.querySelector<HTMLElement>('[data-part-optional]')!.hidden=selected==='aviation';
 }
 function errorFor(input:HTMLInputElement|HTMLTextAreaElement){
  if(input.name==='phone'){
   const phone=input.value.trim();
   input.setCustomValidity(phone&&(!/^[+()\d\s.\-extEXT#]{6,50}$/.test(phone)||phone.replace(/\D/g,'').length<6)?'Enter a valid phone number.':'');
  }
  const el=document.getElementById(input.id+'-error');
  if(el){el.textContent=input.validity.valid?'':input.validationMessage;input.setAttribute('aria-invalid',String(!input.validity.valid));}
 }
 form.addEventListener('focusout',event=>{const el=event.target;if((el instanceof HTMLInputElement||el instanceof HTMLTextAreaElement)&&!el.disabled&&el.type!=='radio'&&el.type!=='checkbox')errorFor(el);});
 form.addEventListener('change',event=>{submissionId=crypto.randomUUID();if((event.target as HTMLInputElement).name==='category')toggleCategory();});
 form.addEventListener('input',event=>{submissionId=crypto.randomUUID();const el=event.target;if(el instanceof HTMLInputElement&&el.name==='phone')el.setCustomValidity('');});
 if(kind==='quote') {
  const query=new URLSearchParams(location.search);
  const radio=form.querySelector<HTMLInputElement>('input[name="category"][value="'+(query.get('category')==='industrial'?'industrial':'aviation')+'"]');if(radio)radio.checked=true;
  const set=(id:string,value:string|null,max:number)=>{const el=form.querySelector<HTMLInputElement>('#'+id);if(el&&value)el.value=value.slice(0,max);};
  set('partNumber',query.get('part'),120);set('email',query.get('email'),254);
  const quantity=Number(query.get('quantity'));if(quantity>0&&quantity<=1000000)set('quantity',String(quantity),20);
  toggleCategory();
  if(['part','email','quantity','category'].some(key=>query.has(key)))history.replaceState(null,'',location.pathname+location.hash);
 }
 const slot=form.querySelector<HTMLElement>('.turnstile-slot');
 if(slot){
  const render=()=>{widgetId=window.turnstile?.render(slot,{sitekey:slot.dataset.sitekey,action:kind,theme:document.documentElement.dataset.theme||'auto',size:'flexible','error-callback':()=>{status.textContent='Security verification could not load. Please retry or email your request.';status.dataset.state='error';},'expired-callback':()=>window.turnstile?.reset(widgetId)});};
  window.supploidTurnstileReady=render;
  document.addEventListener('supploid:themechange',()=>{if(window.turnstile&&widgetId){window.turnstile.remove(widgetId);render();}});
  const script=document.createElement('script');script.src='https://challenges.cloudflare.com/turnstile/v0/api.js?onload=supploidTurnstileReady&render=explicit';script.async=true;script.defer=true;
  script.onerror=()=>{status.textContent='Security verification is unavailable. Please email your request using the link below.';status.dataset.state='error';};document.head.append(script);
 }
 function payload():RequestData {
  const common={email:get('email'),phone:get('phone'),consent:get('consent')==='on',submissionId};
  if(kind==='aog')return {kind,...common,partNumber:get('partNumber'),aircraft:get('aircraft')};
  const selected=category();
  return {kind,...common,category:selected,description:selected==='industrial'?get('description'):'',partNumber:get('partNumber'),quantity:Number(get('quantity')),firstName:get('firstName'),lastName:get('lastName'),company:get('company'),message:get('message')};
 }
 form.noValidate=true;
 form.addEventListener('submit',async event=>{
  event.preventDefault();if(busy)return;
  const fields=Array.from(form.querySelectorAll<HTMLInputElement|HTMLTextAreaElement>('input,textarea')).filter(el=>!el.disabled);
  fields.forEach(errorFor);
  const invalid=fields.find(el=>!el.validity.valid);
  if(invalid){invalid.reportValidity();invalid.focus();status.textContent='Please complete the highlighted fields.';status.dataset.state='error';return;}
  const data=payload();
  if(form.dataset.live!=='true'){
   const text=requestText(data),isAog=data.kind==='aog',recipient=isAog?'aog@supploid.com':'info@supploid.com';
   const subject=isAog?'[AOG] Premium support request':'RFQ — '+(data.kind==='quote'?(data.company||data.firstName+' '+data.lastName):'');
   const shortBody=text.length>1800?'Please find my inquiry in the attached supploid-request-details.txt file.\n\n'+text.slice(0,500):text;
   status.replaceChildren();status.dataset.state='ready';
   const message=document.createElement('p');message.textContent='Your request is prepared. Open the email draft to send it.'+(text.length>1800?' Download and attach the complete request details below.':'');status.append(message);
   const actions=document.createElement('div');actions.className='actions';
   const mail=document.createElement('a');mail.className='button button-primary';mail.href='mailto:'+recipient+'?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(shortBody);mail.textContent='Open email draft ↗';actions.append(mail);
   if(downloadUrl)URL.revokeObjectURL(downloadUrl);
   downloadUrl=URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'}));
   const download=document.createElement('a');download.className='text-link';download.href=downloadUrl;download.download='supploid-request-details.txt';download.textContent='Download request details';actions.append(download);status.append(actions);mail.focus();return;
  }
  const token=form.querySelector<HTMLInputElement>('[name="cf-turnstile-response"]')?.value||'';
  if(!token){status.textContent='Please complete the security verification, or email your request using the link below.';status.dataset.state='error';return;}
  busy=true;submit.disabled=true;submit.textContent='Sending…';form.setAttribute('aria-busy','true');status.textContent='Sending your request…';status.dataset.state='loading';
  const body=new FormData();body.append('payload',JSON.stringify(data));body.append('cf-turnstile-response',token);body.append('business_extension',get('business_extension'));
  try {
   const response=await fetch('/api/'+kind,{method:'POST',body,signal:AbortSignal.timeout(35000)});const result=await response.json();
   if(!response.ok||!result.ok){
    if(result.received&&result.reference){status.textContent='Your request reached Supploid. Reference '+result.reference+'. The confirmation email could not be sent. You do not need to submit again; contact us with this reference.';status.dataset.state='success';}
    else throw new Error(result.error||'Your request could not be sent. Please email us directly.');
   }else{
    status.textContent='Request received. Your reference is '+result.reference+'. '+(data.kind==='aog'?'Your request is with premium AOG support. Scope and terms will be agreed directly.':'Fast quoting, documentation supplied.');
    status.dataset.state='success';form.reset();if(kind==='quote')toggleCategory();submissionId=crypto.randomUUID();
    fields.forEach(el=>{el.removeAttribute('aria-invalid');const error=document.getElementById(el.id+'-error');if(error)error.textContent='';});
   }
  }catch(error){status.textContent=error instanceof Error&&error.name!=='TimeoutError'?error.message:'Delivery could not be confirmed. Retry with the same details, or email us and mention that a submission may already have been made.';status.dataset.state='error';}
  finally{busy=false;submit.disabled=false;submit.textContent=initialLabel;form.removeAttribute('aria-busy');window.turnstile?.reset(widgetId);}
 });
}
