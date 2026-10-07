import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {JSDOM}=require('../.media-tools/node_modules/jsdom');
const root=process.env.TEST_ROOT||'public';
const base=process.env.PREVIEW_URL||'http://127.0.0.1:4173/';
const data=JSON.parse(await readFile(root+'/data/portfolio.json','utf8'));
const html=(await readFile(root+'/index.html','utf8')).replace(/<script[^>]*src="app.js"[^>]*><\/script>/,'');
const dom=new JSDOM(html,{url:base,runScripts:'outside-only',pretendToBeVisual:true});
const w=dom.window,d=w.document,failures=[],resizeCallbacks=[];
w.console.error=(...args)=>failures.push(args.map(String).join(' '));
w.matchMedia=()=>({matches:true,addEventListener(){}});
w.IntersectionObserver=class{observe(){}};
w.ResizeObserver=class{constructor(callback){resizeCallbacks.push(callback);}observe(){}};
w.requestAnimationFrame=()=>0;
w.fetch=async()=>({ok:true,json:async()=>structuredClone(data)});
const paused=new WeakMap();Object.defineProperty(w.HTMLMediaElement.prototype,'paused',{get(){return paused.get(this)??true;}});
w.HTMLMediaElement.prototype.pause=function(){paused.set(this,true);};
w.HTMLMediaElement.prototype.play=function(){paused.set(this,false);this.dispatchEvent(new w.Event('play'));return Promise.resolve();};
w.HTMLMediaElement.prototype.load=function(){paused.set(this,true);};
w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};
w.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new w.Event('close'));};
w.eval(await readFile(root+'/app.js','utf8'));await new Promise(resolve=>setTimeout(resolve,30));
assert.equal(failures.length,0,failures.join('\n'));
assert.equal(d.querySelectorAll('.portfolio-group').length,2);
assert.equal(d.querySelectorAll('.project-card:not(.carousel-clone)').length,data.projects.length+(data.site.preview?data.previewSlots.length:0));
assert.equal(d.querySelectorAll('#carousel-eventos .carousel-clone').length,8);
assert.equal(d.querySelectorAll('.service-row').length,5);
assert.equal(d.querySelectorAll('.service-example').length,5);
assert(!d.querySelector('#services-list').textContent.includes('Design para redes sociais'));
assert.equal(d.querySelectorAll('#dialog-media video').length,0);
const hero=d.querySelector('.hero-video');assert(hero.muted&&hero.defaultMuted&&hero.volume===0);assert.equal(d.querySelectorAll('.about-portrait').length,1);
for(const link of d.querySelectorAll('a[href^="https://wa.me/"]')){const url=new URL(link.href);assert.equal(url.pathname,'/5575988796387');assert(url.searchParams.get('text'));}
for(const record of [...data.projects,...data.serviceExamples]){
 const trigger=[...d.querySelectorAll('[data-project="'+record.id+'"]')].find(button=>!button.closest('.carousel-clone'));assert(trigger,'Botão ausente: '+record.id);
 trigger.click();const dialog=d.querySelector('#project-dialog'),video=d.querySelector('#dialog-media video');assert(dialog.open);assert.equal(d.querySelectorAll('#dialog-media video').length,1);assert.equal(video.getAttribute('src'),base+record.media.src);assert(video.controls&&video.playsInline);assert(!video.muted&&!video.defaultMuted&&video.volume===1);assert(!video.paused&&!hero.paused);assert.equal(d.activeElement,d.querySelector('.close-dialog'));
 assert.equal(d.querySelector('#dialog-description').textContent.includes('Identificação provisória'),!!(data.site.preview&&record.metadataPending));
 d.querySelector('.close-dialog').click();assert(!dialog.open&&video.paused);assert.equal(d.querySelectorAll('#dialog-media video').length,0);assert.equal(d.activeElement,trigger);
}
// Abrir outro registro elimina a reprodução e a fonte do vídeo anterior.
d.querySelector('[data-project="evento-horizontal"]').click();const previous=d.querySelector('#dialog-media video');d.querySelector('[data-project="evento-vertical"]').click();assert(previous.paused&&!previous.hasAttribute('src'));assert.equal(d.querySelectorAll('#dialog-media video').length,1);d.querySelector('.close-dialog').click();
const missing=d.querySelector('[data-project="previa-institucional"]');if(data.site.preview){assert(missing);missing.click();assert(d.querySelector('.missing-media').textContent.includes('Material real pendente'));d.querySelector('.close-dialog').click();}else{assert(!missing);assert(!d.querySelector('#preview-banner'));assert(!/PRÉVIA|identificação provisória/i.test(d.body.textContent));}
d.querySelector('[data-project="evento-horizontal"]').click();d.querySelector('#dialog-media video').dispatchEvent(new w.Event('error'));assert(d.querySelector('.missing-media').textContent.includes('Não foi possível carregar'));d.querySelector('.close-dialog').click();
d.querySelector('.menu-toggle').click();assert.equal(d.querySelector('.menu-toggle').getAttribute('aria-expanded'),'true');d.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));assert.equal(d.querySelector('.menu-toggle').getAttribute('aria-expanded'),'false');
// Dimensões distintas e repetição do loop sem depender de layout simulado pelo JSDOM.
const track=d.querySelector('#carousel-eventos'),cards=[...track.querySelectorAll('.project-card')];
track.getBoundingClientRect=()=>({left:0});let cursor=2;cards.forEach((card,i)=>{const position=cursor;cursor+=i%4===2?582:318;card.getBoundingClientRect=()=>({left:position-track.scrollLeft});});resizeCallbacks.forEach(callback=>callback());
const start=track.scrollLeft;track.dispatchEvent(new w.KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}));assert.equal(track.scrollLeft,start+318);track.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Home',bubbles:true}));assert.equal(track.scrollLeft,start);track.dispatchEvent(new w.KeyboardEvent('keydown',{key:'ArrowLeft',bubbles:true}));assert(track.scrollLeft>start);track.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Home',bubbles:true}));
assert.equal(failures.length,0,failures.join('\n'));dom.window.close();
console.log('DOM: 11 players com áudio, fechamento, reprodução exclusiva, foto, serviços, contatos, menu, fallback e loop passaram.');
for(const record of [...data.projects,...data.serviceExamples]){
 const cover=await fetch(base+record.cover);assert.equal(cover.status,200);await cover.arrayBuffer();
 const response=await fetch(base+record.media.src,{headers:{Range:'bytes=0-1023'}});assert.equal(response.status,206);assert.equal(response.headers.get('content-type'),'video/mp4');assert(response.headers.get('content-range').startsWith('bytes 0-1023/'));assert.equal((await response.arrayBuffer()).byteLength,1024);
}
for(const source of [data.site.showreel.src,data.site.showreel.mobileSrc]){const response=await fetch(base+source,{headers:{Range:'bytes=0-1023'}});assert.equal(response.status,206);await response.arrayBuffer();}
console.log('HTTP: capas, 11 vídeos e duas versões do showreel disponíveis, com suporte a busca por Range.');
