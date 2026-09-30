import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
await mkdir('reports/revision-screenshots',{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const errors=[];
for(const theme of ['light','dark']){
 for(const [name,width,height,url] of [['home-desktop',1440,1080,'/'],['home-mobile',390,844,'/'],['quote-desktop',1440,1080,'/quote/'],['quote-mobile',390,844,'/quote/?category=industrial'],['aog-desktop',1440,1080,'/aog/']]){
  const page=await browser.newPage({viewport:{width,height},reducedMotion:'reduce',colorScheme:theme});
  page.on('pageerror',error=>errors.push(error.message));await page.goto('http://127.0.0.1:4321'+url);await page.evaluate(()=>document.fonts.ready);
  await page.screenshot({path:'reports/revision-screenshots/'+name+'-'+theme+'.png',fullPage:true});
  if(name==='home-desktop')await page.screenshot({path:'reports/revision-screenshots/home-hero-'+theme+'.png'});
  await page.close();
 }
}
await writeFile('reports/revision-browser-errors.json',JSON.stringify(errors,null,2));await browser.close();console.log('Saved both themes and responsive layouts; browser errors:',errors.length);
