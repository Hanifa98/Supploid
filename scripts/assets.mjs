import sharp from 'sharp';
import { readFile, mkdir, copyFile } from 'node:fs/promises';
const fonts=new URL('../public/fonts/',import.meta.url);await mkdir(fonts,{recursive:true});
for(const subset of ['latin','latin-ext'])await copyFile(new URL(`../node_modules/@fontsource-variable/inter/files/inter-${subset}-wght-normal.woff2`,import.meta.url),new URL(`inter-${subset}.woff2`,fonts));
await copyFile(new URL('../node_modules/@fontsource-variable/inter/LICENSE',import.meta.url),new URL('LICENSE.txt',fonts));
const dir=new URL('../public/images/',import.meta.url);await mkdir(dir,{recursive:true});
const assembly=await readFile(new URL('../src/assets/assembly.svg',import.meta.url));
for(const size of [480,960]) { const base=sharp(assembly,{density:220}).resize({width:size}).flatten({background:'#0a0c0f'});await base.clone().avif({quality:65,effort:5}).toFile(new URL(`assembly-${size}.avif`,dir).pathname);await base.clone().webp({quality:84}).toFile(new URL(`assembly-${size}.webp`,dir).pathname); }
const grid='<pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse"><path d="M32 0H0V32" fill="none" stroke="#263038" stroke-width=".8"/></pattern>';
const arts={
 documents:'<path d="M276 82H474L533 141V371H276Z" fill="#131b1e"/><path d="M474 82V141H533"/><path d="M310 186H494M310 210H456M310 234H478M310 284H378M411 284H490M310 311H490"/><path d="M238 126H255M238 148H255M552 315H574M552 339H574"/>',
 conditions:'<ellipse cx="400" cy="220" rx="130" ry="130"/><ellipse cx="400" cy="220" rx="101" ry="101"/><ellipse cx="400" cy="220" rx="52" ry="52"/><path d="M180 220H290M510 220H620M400 35V100M400 340V407" stroke-dasharray="6 6"/><path d="M310 126L331 147M489 126L468 147M310 314L331 293M489 314L468 293"/>',
 aog:'<path d="M145 285H295L381 161H559L643 82"/><path d="M145 315H310L397 191H571L664 99" stroke="#60706c"/><circle cx="145" cy="285" r="10" fill="#12191c"/><circle cx="381" cy="161" r="10" fill="#12191c"/><circle cx="643" cy="82" r="10" fill="#12191c"/><path d="M325 325H583M325 340H483M611 50V115M580 82H650" stroke="#657773"/>',
 materials:'<path d="M218 160L400 76L582 160V300L400 384L218 300ZM218 160L400 244L582 160M400 244V384M252 143L434 228V368M292 124L473 209V349M331 106L512 191V331M370 88L551 173V312"/><path d="M181 332L390 430M610 155V302" stroke-dasharray="5 5"/>'
};
for(const [name,art] of Object.entries(arts)){const svg=Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="800" height="480" viewBox="0 0 800 480"><defs>${grid}</defs><rect width="800" height="480" fill="#12161b"/><rect x="20" y="20" width="760" height="420" fill="url(#grid)"/><g fill="none" stroke="#adcc7a" stroke-width="1.5">${art}</g><g fill="none" stroke="#65726c"><path d="M30 60V30H60M740 30H770V60M30 390V420H60M740 420H770V390"/></g></svg>`);await sharp(svg).avif({quality:60}).toFile(new URL(`insight-${name}.avif`,dir).pathname);await sharp(svg).webp({quality:80}).toFile(new URL(`insight-${name}.webp`,dir).pathname);}
console.log('Generated responsive AVIF/WebP technical illustrations.');
