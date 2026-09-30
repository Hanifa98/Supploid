const themePreference=matchMedia('(prefers-color-scheme: light)');
const themeButton=document.querySelector<HTMLButtonElement>('.theme-toggle');
let explicitTheme:string|null=null;
try {const saved=localStorage.getItem('supploid-theme');if(saved==='dark'||saved==='light')explicitTheme=saved;} catch {}
function applyTheme(theme:string){
 document.documentElement.dataset.theme=theme;
 document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')!.content=theme==='light'?'#f7f8f3':'#0a0c0f';
 themeButton?.setAttribute('aria-pressed',String(theme==='dark'));
 document.dispatchEvent(new Event('supploid:themechange'));
}
if(themeButton){themeButton.setAttribute('aria-pressed',String(document.documentElement.dataset.theme==='dark'));themeButton.addEventListener('click',()=>{explicitTheme=document.documentElement.dataset.theme==='dark'?'light':'dark';try{localStorage.setItem('supploid-theme',explicitTheme);}catch{}applyTheme(explicitTheme);});}
themePreference.addEventListener('change',event=>{if(!explicitTheme)applyTheme(event.matches?'light':'dark');});
window.addEventListener('storage',event=>{if(event.key!=='supploid-theme')return;explicitTheme=event.newValue==='light'||event.newValue==='dark'?event.newValue:null;applyTheme(explicitTheme||(themePreference.matches?'light':'dark'));});
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const revealTargets = document.querySelectorAll<HTMLElement>('[data-reveal], [data-count], [data-step]');
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      const el = entry.target as HTMLElement;
      if (el.hasAttribute('data-step')) { el.classList.toggle('is-active', entry.intersectionRatio >= .5); continue; }
      if (el.dataset.count && entry.intersectionRatio >= .5) {
        const target = Number(el.dataset.count), start = performance.now();
        if (!reduced.matches) { const frame = (now:number) => { const t = Math.min((now-start)/1200,1); el.textContent=String(Math.round(target*(1-(1-t)**3))); if(t<1&&!reduced.matches) requestAnimationFrame(frame); else el.textContent=String(target); }; requestAnimationFrame(frame); }
        observer.unobserve(el);
      } else if (el.hasAttribute('data-reveal') && entry.intersectionRatio >= .15) { el.classList.add('is-visible'); observer.unobserve(el); }
    }
  }, { threshold:[.15,.5] });
  revealTargets.forEach(el=>{if(el.hasAttribute('data-reveal')&&!reduced.matches) el.classList.add('reveal-ready'); observer.observe(el);});
  reduced.addEventListener('change',()=>{ if(reduced.matches) revealTargets.forEach(el=>el.classList.add('is-visible')); });
}
if(matchMedia('(hover: hover) and (pointer: fine)').matches) {
  document.querySelectorAll<HTMLElement>('[data-magnetic="true"]').forEach(el=>{
    el.addEventListener('pointermove',e=>{if(reduced.matches)return;const r=el.getBoundingClientRect();el.style.setProperty('--mx',`${Math.max(-8,Math.min(8,(e.clientX-r.left-r.width/2)*.1))}px`);el.style.setProperty('--my',`${Math.max(-8,Math.min(8,(e.clientY-r.top-r.height/2)*.1))}px`);});
    el.addEventListener('pointerleave',()=>{el.style.setProperty('--mx','0px');el.style.setProperty('--my','0px');});
  });
}
document.addEventListener('keydown',e=>{if(e.key==='Escape') document.querySelector<HTMLDetailsElement>('.mobile-menu')?.removeAttribute('open');});
