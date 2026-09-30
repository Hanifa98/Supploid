import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';
import {chromium} from 'playwright';
import {mkdir,writeFile,readdir} from 'node:fs/promises';
import path from 'node:path';
const args=process.argv.slice(2),themeFlag=args.indexOf('--theme');
const themes=themeFlag>=0?[args[themeFlag+1]]:['light','dark'];
if(themes.some(t=>!['light','dark'].includes(t)))throw new Error('Use --theme light or --theme dark.');
if(themeFlag>=0)args.splice(themeFlag,2);
const routes=args;
if(routes.includes('--all')){
 routes.length=0;
 async function walk(dir){return(await Promise.all((await readdir(dir,{withFileTypes:true})).map(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]))).flat();}
 for(const file of await walk('dist')){if(!file.endsWith('index.html'))continue;const route='/'+path.relative('dist',file).replace(/index\.html$/,'');if(!['/privacy/','/terms/'].includes(route))routes.push(route);}
 routes.sort();
}
if(!routes.length)routes.push('/','/quote/','/aog/');
await mkdir('reports/revision-lighthouse',{recursive:true});
const chrome=await chromeLauncher.launch({chromePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',chromeFlags:['--headless','--disable-gpu','--no-first-run']});
const browser=await chromium.connectOverCDP('http://127.0.0.1:'+chrome.port);
const summaries=[];
try{
 for(const theme of themes){
  const seed=await browser.contexts()[0].newPage();await seed.goto('http://127.0.0.1:4321/quote/');await seed.evaluate(t=>localStorage.setItem('supploid-theme',t),theme);await seed.close();
  for(const route of routes){
   // Lighthouse's default storage reset preserves localStorage and clears browser caches.
   const result=await lighthouse('http://127.0.0.1:4321'+route,{port:chrome.port,output:'json',logLevel:'error',onlyCategories:['performance','accessibility','best-practices','seo'],formFactor:'mobile'});
   const lhr=result.lhr,scores=Object.fromEntries(Object.entries(lhr.categories).map(([key,value])=>[key,Math.round(value.score*100)]));
   const summary={theme,route,...scores,lcpMs:lhr.audits['largest-contentful-paint'].numericValue,cls:lhr.audits['cumulative-layout-shift'].numericValue,tbtMs:lhr.audits['total-blocking-time'].numericValue,totalBytes:lhr.audits['total-byte-weight'].numericValue,failed:Object.entries(lhr.audits).filter(([,a])=>a.score!==null&&a.score<1).map(([id,a])=>({id,score:a.score,title:a.title,displayValue:a.displayValue}))};
   summaries.push(summary);await writeFile('reports/revision-lighthouse/'+theme+route.replaceAll('/','-')+'.json',result.report);await writeFile('reports/revision-lighthouse-summary.json',JSON.stringify(summaries,null,2));console.log(JSON.stringify(summary));
  }
 }
}finally{await browser.close().catch(()=>{});await chrome.kill();}
