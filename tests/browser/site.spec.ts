import {test,expect,type Page} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
async function fillQuote(page:Page,industrial=false,url='/quote/'){
 await page.goto(url);
 if(industrial){await page.getByLabel('Industrial / General',{exact:true}).check();await page.locator('#description').fill('Pump seal, model X');}
 else await page.locator('#partNumber').fill('BROWSER-100');
 await page.locator('#quantity').fill('2');await page.locator('#firstName').fill('Alex');await page.locator('#lastName').fill('Buyer');
 await page.locator('#email').fill('buyer@example.com');await page.locator('#message').fill('Please confirm availability and documentation.');await page.locator('#consent').check();
}
async function settled(page:Page){await page.evaluate(()=>document.fonts.ready);await page.locator('.hero .word').evaluateAll(els=>Promise.all(els.flatMap(el=>el.getAnimations()).map(a=>a.finished)));}
test('homepage removes the three sections and retains three correctly numbered process steps',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/');await settled(page);
 await expect(page.locator('#capabilities,.documentation,.insight-grid')).toHaveCount(0);
 await expect(page.locator('header').getByRole('link',{name:'Capabilities'})).toHaveCount(0);
 await expect(page.locator('.process-step>.index')).toHaveText(['01','02','03']);
 await expect(page.locator('.process-step h3')).toHaveText(['Submit your inquiry','Confirm the documents','Arrange the shipment']);
 await expect(page.locator('.hero-foot')).toContainText('SUPPLOID → WORLDWIDE');
 await expect(page.locator('body')).not.toContainText(/Poland|four.business.hour|4 business hours/i);
 await expect(page.locator('#get-a-quote .inquiry-form')).toHaveCount(1);
 await expect(page.locator('footer').getByRole('link',{name:'Capabilities'})).toHaveAttribute('href','/services/');
 await expect(page.locator('header').getByRole('link',{name:'Insights',exact:true,includeHidden:true}).first()).toHaveAttribute('href','/insights/');
 expect(errors).toEqual([]);
});
test('each category exposes exactly the requested fields in order',async({page})=>{
 await page.goto('/quote/');
 const fields=()=>page.locator('.inquiry-fields input:visible,.inquiry-fields textarea:visible').evaluateAll(els=>els.map(el=>({id:el.id,required:(el as HTMLInputElement).required})));
 expect(await fields()).toEqual([{id:'partNumber',required:true},{id:'quantity',required:true},{id:'firstName',required:true},{id:'lastName',required:true},{id:'email',required:true},{id:'phone',required:false},{id:'company',required:false},{id:'message',required:true}]);
 await page.getByLabel('Industrial / General',{exact:true}).check();
 expect(await fields()).toEqual([{id:'description',required:true},{id:'partNumber',required:false},{id:'quantity',required:true},{id:'firstName',required:true},{id:'lastName',required:true},{id:'email',required:true},{id:'phone',required:false},{id:'company',required:false},{id:'message',required:true}]);
 await expect(page.locator('input[type=file],#add-part,.part-row,select,input[type=date]')).toHaveCount(0);
});
test('switching categories preserves every entered shared field and industrial description',async({page})=>{
 await fillQuote(page);await page.getByLabel('Industrial / General',{exact:true}).check();await page.locator('#description').fill('Saved description');
 await expect(page.locator('#partNumber')).toHaveValue('BROWSER-100');await expect(page.locator('#partNumber')).not.toHaveAttribute('required');
 await page.getByLabel('Aviation / Aerospace',{exact:true}).check();await expect(page.locator('#description')).toBeDisabled();await expect(page.locator('#partNumber')).toHaveAttribute('required');
 await page.getByLabel('Industrial / General',{exact:true}).check();await expect(page.locator('#description')).toHaveValue('Saved description');
 for(const [id,value] of [['quantity','2'],['firstName','Alex'],['lastName','Buyer'],['email','buyer@example.com'],['message','Please confirm availability and documentation.']])await expect(page.locator('#'+id)).toHaveValue(value);
});
test('quote prefill remains compatible and strips personal query parameters',async({page})=>{
 await page.goto('/quote/?part=ABC-200&quantity=3&email=buyer%40example.com&category=industrial');
 await expect(page.locator('#partNumber')).toHaveValue('ABC-200');await expect(page.locator('#quantity')).toHaveValue('3');await expect(page.locator('#email')).toHaveValue('buyer@example.com');
 await expect(page.getByLabel('Industrial / General',{exact:true})).toBeChecked();await expect(page).toHaveURL('/quote/');
});
test('industrial inquiry without optional fields prepares the complete email draft',async({page})=>{
 await fillQuote(page,true);await page.locator('[data-submit]').click();await expect(page.locator('#form-status')).toContainText('Your request is prepared');
 const href=decodeURIComponent(await page.getByRole('link',{name:'Open email draft'}).getAttribute('href')||'');
 for(const value of ['Description: Pump seal','Part number: Not specified','First name: Alex','Last name: Buyer','Message: Please confirm'])expect(href).toContain(value);
 expect(href).not.toMatch(/Incoterm:|Condition:|line item|Target price:/);
 await expect(page.getByRole('link',{name:'Download request details'})).toHaveAttribute('download','supploid-request-details.txt');
});
test('homepage inquiry submits through the same simplified flow',async({page})=>{
 await fillQuote(page,false,'/');await page.locator('[data-submit]').click();await expect(page.locator('#form-status')).toContainText('Your request is prepared');
});
test('required fields show errors and keyboard focus moves to the first invalid field',async({page})=>{
 await fillQuote(page);await page.locator('#firstName').fill('');await page.locator('#message').fill('');await page.locator('[data-submit]').click();
 await expect(page.locator('#firstName')).toBeFocused();await expect(page.locator('#firstName-error')).not.toBeEmpty();await expect(page.locator('#message-error')).not.toBeEmpty();
 await page.locator('#firstName').fill('Alex');await page.locator('#message').fill('A message');await page.locator('[data-submit]').click();await expect(page.locator('#form-status')).toContainText('Your request is prepared');
});
test('AOG keeps its original four required fields and premium email route',async({page})=>{
 await page.goto('/aog/');expect(await page.locator('.field-grid input').evaluateAll(els=>els.map(el=>el.id))).toEqual(['phone','partNumber','aircraft','email']);
 await page.locator('#phone').fill('+48 123 456 789');await page.locator('#partNumber').fill('URGENT-100');await page.locator('#aircraft').fill('A320');await page.locator('#email').fill('buyer@example.com');await page.locator('#consent').check();
 await page.locator('[data-submit]').click();await expect(page.getByRole('link',{name:'Open email draft'})).toHaveAttribute('href',/^mailto:aog@supploid.com/);
});
test('live delivery errors and partial receipt preserve data and retry ID',async({page})=>{
 await fillQuote(page,true);
 await page.evaluate(()=>{const f=document.querySelector<HTMLFormElement>('[data-request-form]')!;f.dataset.live='true';const i=document.createElement('input');i.type='hidden';i.name='cf-turnstile-response';i.value='test-token';f.append(i);});
 let attempt=0;const payloads:string[]=[];
 await page.route('**/api/quote',async route=>{payloads.push(route.request().postData()||'');attempt++;await route.fulfill({status:attempt<3?502:200,contentType:'application/json',body:JSON.stringify(attempt===1?{ok:false,error:'Delivery failed. Email info@supploid.com.'}:attempt===2?{ok:false,received:true,reference:'SUP-2026-TEST1'}:{ok:true,reference:'SUP-2026-TEST1'})});});
 await page.locator('[data-submit]').click();await expect(page.locator('#form-status')).toContainText('Delivery failed');await expect(page.locator('#description')).toHaveValue('Pump seal, model X');
 await page.locator('[data-submit]').click();await expect(page.locator('#form-status')).toContainText('You do not need to submit again');
 await page.locator('[data-submit]').click();await expect(page.locator('#form-status')).toContainText('Fast quoting, documentation supplied');
 const ids=payloads.map(s=>s.match(/"submissionId":"([^"]+)"/)?.[1]);expect(ids[0]).toBeTruthy();expect(new Set(ids).size).toBe(1);
 await expect(page.locator('.form-fallback')).toBeVisible();
});
for(const theme of ['light','dark'] as const)test(theme+' theme passes accessibility and responsive checks across page types',async({page})=>{
 await page.emulateMedia({colorScheme:theme,reducedMotion:'reduce'});
 for(const url of ['/','/quote/','/aog/','/services/','/contact/','/insights/','/insights/reading-faa-8130-3/','/about/']){
  await page.goto(url);await settled(page);await expect(page.locator('html')).toHaveAttribute('data-theme',theme);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),url).toBeTruthy();
  const axe=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();expect(axe.violations,url).toEqual([]);
 }
});
test('theme uses system preference, persists override before paint, and does not shift layout',async({page})=>{
 await page.emulateMedia({colorScheme:'light',reducedMotion:'reduce'});await page.goto('/quote/');await settled(page);
 await expect(page.locator('html')).toHaveAttribute('data-theme','light');
 const before=await page.locator('h1,.inquiry-form,.site-header').evaluateAll(els=>els.map(el=>{const r=el.getBoundingClientRect();return [r.x+scrollX,r.y+scrollY,r.width,r.height];}));
 const toggle=page.getByRole('button',{name:'Toggle light/dark theme'});await toggle.focus();await page.keyboard.press('Enter');
 await expect(page.locator('html')).toHaveAttribute('data-theme','dark');expect(await page.evaluate(()=>localStorage.getItem('supploid-theme'))).toBe('dark');
 const after=await page.locator('h1,.inquiry-form,.site-header').evaluateAll(els=>els.map(el=>{const r=el.getBoundingClientRect();return [r.x+scrollX,r.y+scrollY,r.width,r.height];}));expect(after).toEqual(before);
 await page.addInitScript(()=>{new PerformanceObserver(()=>{document.documentElement.setAttribute('data-paint-theme',document.documentElement.dataset.theme||'missing');}).observe({type:'paint',buffered:true});});
 await page.reload();await expect(page.locator('html')).toHaveAttribute('data-paint-theme','dark');
 await page.goto('/about/');await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
});
test('theme continues to work when local storage is blocked',async({page})=>{
 await page.addInitScript(()=>{Object.defineProperty(window,'localStorage',{get(){throw new DOMException('blocked','SecurityError');}});});
 await page.emulateMedia({colorScheme:'light'});await page.goto('/');await expect(page.locator('html')).toHaveAttribute('data-theme','light');
 await page.getByRole('button',{name:'Toggle light/dark theme'}).click();await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
});
test('system theme changes apply until the visitor chooses an override',async({page})=>{
 await page.emulateMedia({colorScheme:'light'});await page.goto('/quote/');await page.emulateMedia({colorScheme:'dark'});
 await expect(page.locator('html')).toHaveAttribute('data-theme','dark');await page.getByRole('button',{name:'Toggle light/dark theme'}).click();
 await page.emulateMedia({colorScheme:'light'});await page.emulateMedia({colorScheme:'dark'});await expect(page.locator('html')).toHaveAttribute('data-theme','light');
});
test('reduced motion leaves content visible',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/');
 expect(await page.locator('[data-reveal],.hero .word').evaluateAll(els=>els.filter(el=>getComputedStyle(el).opacity==='0'||getComputedStyle(el).animationName!=='none').length)).toBe(0);
});
test('no JavaScript retains email fallback and mobile navigation',async({browser})=>{
 const context=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:844},colorScheme:'light'});const page=await context.newPage();
 await page.goto('http://127.0.0.1:4321/quote/');await expect(page.locator('.form-fallback a')).toHaveAttribute('href','mailto:info@supploid.com');
 await page.locator('.mobile-menu summary').click();await expect(page.getByRole('navigation',{name:'Mobile navigation'})).toBeVisible();await context.close();
});
