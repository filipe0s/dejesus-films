
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
const {chromium}=require('../.media-tools/node_modules/playwright');
const data=JSON.parse(await readFile((process.env.TEST_ROOT||'public')+'/data/portfolio.json','utf8'));
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,ignoreDefaultArgs:['--mute-audio']});
const report={date:'2026-10-07',viewports:[],audio:[],failures:[]};await mkdir('.test-output',{recursive:true});
const base=process.env.PREVIEW_URL||'http://127.0.0.1:4173/';
const reportPath='.test-output/'+(process.env.TEST_ROOT==='dist'?'production-browser-results.json':'browser-results.json');
const netlify=process.env.TEST_ROOT==='dist'?require('../.media-tools/node_modules/@iarna/toml').parse(await readFile('netlify.toml','utf8')):null;
async function preparePage(page){
 if(!netlify)return;
 // Políticas aplicadas ao documento local para exercitar CSP/Permissions-Policy no Chrome.
 // Isto não substitui a verificação dos cabeçalhos na infraestrutura do Netlify após publicar.
 await page.route('**/*',async route=>{
  if(!route.request().isNavigationRequest()||new URL(route.request().url()).origin!==new URL(base).origin)return route.continue();
  const response=await route.fetch(),pathname=new URL(route.request().url()).pathname,headers={...response.headers()};
  for(const rule of netlify.headers){const pattern='^'+rule.for.split('*').map(part=>part.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('.*')+'$';if(new RegExp(pattern).test(pathname))Object.assign(headers,Object.fromEntries(Object.entries(rule.values).map(([key,value])=>[key.toLowerCase(),value])));}
  await route.fulfill({response,headers});
 });
}
try{
 for(const width of (process.env.TEST_WIDTHS||"360,390,768,1440").split(",").map(Number)){
  const mobile=width<768;
  const context=await browser.newContext({viewport:{width,height:mobile?844:1000},isMobile:mobile,hasTouch:mobile,reducedMotion:'no-preference'});
  const page=await context.newPage();await preparePage(page);const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto(base,{waitUntil:'networkidle'});await page.waitForSelector('#services-list .service-example');
  assert.equal(await page.locator('.service-row').count(),5);assert.equal(await page.locator('.about-portrait').count(),1);
  assert.equal(await page.locator('#carousel-eventos .project-card:not(.carousel-clone)').count(),4);
  assert.equal(await page.locator('#services-list').getByText('Design para redes sociais',{exact:true}).count(),0);
  if(!data.site.preview){assert.equal(await page.locator('.project-card:not(.carousel-clone)').count(),data.projects.length);assert.equal(await page.locator('#preview-banner,.footer-preview,.temporary-note,.temporary-badge').count(),0);assert(!/PRÉVIA|identificação provisória/i.test(await page.locator('body').innerText()));assert.equal(await page.locator('meta[name="robots"]').getAttribute('content'),'index, follow');assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'),data.site.domain+'/');}
  for(const id of ['portfolio','servicos','sobre','contato','inicio']){if(width<=800)await page.locator('.menu-toggle').click();await page.locator('#navigation a[href="#'+id+'"]').click();assert.equal(new URL(page.url()).hash,'#'+id);if(width<=800)assert.equal(await page.locator('.menu-toggle').getAttribute('aria-expanded'),'false');}
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);assert(!overflow,'Rolagem horizontal da página em '+width);
  const order=await page.locator('.service-content').evaluateAll(blocks=>blocks.every(block=>{
   const nodes=[block.querySelector('.service-title-line'),block.querySelector('.service-audience'),block.querySelector('.service-description'),block.querySelector('.service-example'),block.querySelector('.service-cta')];
   return nodes.every(Boolean)&&nodes.every((node,i)=>!i||!!(nodes[i-1].compareDocumentPosition(node)&Node.DOCUMENT_POSITION_FOLLOWING));
  }));assert(order,'Ordem de serviços incorreta em '+width);
  const layout=await page.locator('.service-content').evaluateAll(blocks=>blocks.every(block=>{
   const media=block.querySelector('.service-example').getBoundingClientRect(), title=block.querySelector('.service-title-line').getBoundingClientRect(), audience=block.querySelector('.service-audience').getBoundingClientRect(), desc=block.querySelector('.service-description').getBoundingClientRect(), cta=block.querySelector('.service-cta').getBoundingClientRect();
   return innerWidth>800?media.top>title.bottom&&audience.left>media.right+20&&desc.left>media.right+20&&cta.left>media.right+20:audience.top>=title.bottom&&desc.top>=audience.bottom&&media.top>=desc.bottom&&cta.top>=media.bottom;
  }));assert(layout,'Composição dos serviços incorreta em '+width);
  const horizontal=await page.locator('#carousel-eventos .landscape-card:not(.carousel-clone) .project-visual').evaluate(visual=>{const box=visual.getBoundingClientRect(),track=visual.closest('.carousel').getBoundingClientRect(),img=visual.querySelector('img');return box.height>=track.height-210&&getComputedStyle(img).objectFit==='contain'&&getComputedStyle(img).objectPosition==='50% 50%';});assert(horizontal,'Horizontal não centralizado na área reservada em '+width);
  assert.equal(await page.locator('#contato .phone-link').count(),0);assert.equal(await page.locator('#contato a[href^="https://wa.me/"]').count(),1);
  await page.locator('#carousel-eventos').scrollIntoViewIfNeeded();await page.mouse.move(0,0);await page.locator('#carousel-eventos').focus();await page.keyboard.press('Home');await page.waitForTimeout(750);
  // Permanecemos com foco no carrossel: não deve impedir a retomada automática.
  const sequence=await page.evaluate(async()=>{
   const track=document.querySelector('#carousel-eventos');const current=()=>{const left=track.getBoundingClientRect().left;const cards=[...track.querySelectorAll('.project-card')];cards.sort((a,b)=>Math.abs(a.getBoundingClientRect().left-left)-Math.abs(b.getBoundingClientRect().left-left));return cards[0].querySelector('button').dataset.project;};
   const results=[{id:current(),at:0}],began=performance.now();while(performance.now()-began<15000&&results.length<5){await new Promise(resolve=>setTimeout(resolve,50));const id=current();if(id!==results.at(-1).id)results.push({id,at:performance.now()-began});}return results;
  });assert.equal(sequence.length,5,'Menos de quatro trocas automáticas reais em '+width);assert.equal(new Set(sequence.slice(0,4).map(item=>item.id)).size,4);assert.equal(sequence[4].id,sequence[0].id,'Repetição automática falhou em '+width);for(let i=2;i<sequence.length;i++)assert(Math.abs(sequence[i].at-sequence[i-1].at-3000)<350,'Intervalo automático divergente de 3 s em '+width);
  console.log('Quatro trocas automáticas consecutivas ('+width+' px): '+sequence.map(item=>item.id).join(' → '));
  // A pausa explícita estabiliza o movimento para inspeção e navegação manual.
  await page.getByRole('button',{name:'Pausar carrossel',exact:true}).click();const paused=await page.locator('#carousel-eventos').evaluate(track=>track.scrollLeft);await page.waitForTimeout(900);assert(Math.abs(await page.locator('#carousel-eventos').evaluate(track=>track.scrollLeft)-paused)<2);
  await page.locator('#carousel-eventos').focus();await page.keyboard.press('Home');await page.waitForTimeout(800);const home=await page.locator('#carousel-eventos').evaluate(track=>track.scrollLeft);
  await page.getByRole('button',{name:'Próximo — Cobertura realtime + filmes de eventos',exact:true}).click();await page.waitForTimeout(800);assert(await page.locator('#carousel-eventos').evaluate(track=>track.scrollLeft)>home+100);
  await page.getByRole('button',{name:'Anterior — Cobertura realtime + filmes de eventos',exact:true}).click();await page.waitForTimeout(800);
  const visibleProjects=[];
  for(let i=0;i<4;i++){
    const visibleId=await page.locator('#carousel-eventos').evaluate(track=>{
     const left=track.getBoundingClientRect().left;const cards=[...track.querySelectorAll('.project-card')];cards.sort((a,b)=>Math.abs(a.getBoundingClientRect().left-left)-Math.abs(b.getBoundingClientRect().left-left));return cards[0].querySelector('button').dataset.project;
    });visibleProjects.push(visibleId);
    await page.getByRole('button',{name:'Próximo — Cobertura realtime + filmes de eventos',exact:true}).click();await page.waitForTimeout(800);
  }
  assert.equal(new Set(visibleProjects).size,4,'Nem todos os projetos ficam acessíveis em '+width);
  // Arraste de mouse real no contexto desktop.
  if(!mobile){
    const track=page.locator('#carousel-eventos');const box=await track.boundingBox();const initial=await track.evaluate(element=>element.scrollLeft);
    await page.mouse.move(box.x+box.width*.7,box.y+120);await page.mouse.down();await page.mouse.move(box.x+box.width*.4,box.y+120,{steps:12});await page.mouse.up();assert(Math.abs(await track.evaluate(element=>element.scrollLeft)-initial)>40,'Arraste de mouse não funcionou');
  }else{
    // Eventos de toque nativos do navegador isolado; não há mouse simulando swipe.
    const track=page.locator('#carousel-eventos');const box=await track.boundingBox();const initial=await track.evaluate(element=>element.scrollLeft);const cdp=await context.newCDPSession(page);
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:box.x+box.width*.8,y:box.y+130}]});
    for(let i=1;i<=12;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:box.x+box.width*(.8-.55*i/12),y:box.y+130}]});await page.waitForTimeout(20);}
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(500);assert(Math.abs(await track.evaluate(element=>element.scrollLeft)-initial)>40,'Swipe não funcionou em '+width);
    const card=await track.locator('.project-card:not(.carousel-clone)').first().boundingBox();assert(card.width<=box.width+1,'Cartão cortado no celular');
  }
  await page.getByRole('button',{name:'Reproduzir carrossel',exact:true}).click();await page.locator('#carousel-eventos').focus();await page.keyboard.press('Home');await page.waitForTimeout(750);const restart=await page.locator('#carousel-eventos').evaluate(track=>track.scrollLeft);await page.waitForTimeout(2300);assert(Math.abs(await page.locator('#carousel-eventos').evaluate(track=>track.scrollLeft)-restart)<2,'Contagem após interação começou cedo demais');await page.waitForTimeout(1400);assert(Math.abs(await page.locator('#carousel-eventos').evaluate(track=>track.scrollLeft)-restart)>100,'Avanço não retomou após interação manual');
  // Redução de movimento é testada com a reprodução automática habilitada.
  await page.emulateMedia({reducedMotion:'reduce'});await page.mouse.move(0,0);await page.waitForTimeout(3600);const reduced=await page.locator('#carousel-eventos').evaluate(track=>track.scrollLeft);await page.waitForTimeout(1000);assert(Math.abs(await page.locator('#carousel-eventos').evaluate(track=>track.scrollLeft)-reduced)<2,'Movimento em modo reduzido');
  await page.locator('#carousel-eventos').focus();await page.keyboard.press('ArrowRight');const manualReduced=await page.locator('#carousel-eventos').evaluate(track=>track.scrollLeft);assert(Math.abs(manualReduced-reduced)>20,'Seta em modo reduzido não funcionou');
  for(const href of await page.locator('a[href^="https://wa.me/"]').evaluateAll(links=>links.map(link=>link.href))){const url=new URL(href);assert.equal(url.pathname,'/5575988796387');assert(url.searchParams.get('text'));}
  await page.screenshot({path:'.test-output/events-'+width+'.png',fullPage:false});await page.locator('.service-row').first().scrollIntoViewIfNeeded();await page.waitForFunction(()=>[...document.querySelectorAll('.service-example img')].slice(0,1).every(img=>img.complete&&img.naturalWidth>0));await page.locator('.service-row').first().screenshot({path:'.test-output/services-'+width+'.png',style:'.header,.skip{visibility:hidden!important}'});
  await page.locator('#inicio').scrollIntoViewIfNeeded();await page.screenshot({path:'.test-output/hero-'+width+'.png',fullPage:false});await page.locator('.about-portrait').scrollIntoViewIfNeeded();await page.waitForFunction(()=>document.querySelector('.about-portrait').naturalWidth>0);const aboutLayout=await page.locator('#sobre').evaluate(section=>{const photo=section.querySelector('.about-photo').getBoundingClientRect(),text=section.querySelector('.about-text').getBoundingClientRect(),copy=section.querySelector('.about-copy').getBoundingClientRect();return innerWidth>800?photo.right<text.left&&Math.abs((photo.top+photo.bottom)/2-(text.top+text.bottom)/2)<3:photo.bottom<=copy.top;});assert(aboutLayout,'Composição Sobre incorreta em '+width);assert(await page.locator('.about-portrait').evaluate(img=>Math.abs(img.getBoundingClientRect().width/img.getBoundingClientRect().height-img.naturalWidth/img.naturalHeight)<.01));await page.locator('#sobre').screenshot({path:'.test-output/about-'+width+'.png',style:'.header,.skip{visibility:hidden!important}'});
  assert.equal(errors.length,0,errors.join('\n'));report.viewports.push({width,mobile,autoplay:true,arrows:true,allProjects:true,drag:true,continuousLoop:true,automaticSequence:sequence,reducedMotion:true,serviceOrder:true,overflow:false});console.log('Desktop/celular: '+width+' px passou.');await context.close();
 }
 for(const audioWidth of [1440,390]){
 const context=await browser.newContext({viewport:{width:audioWidth,height:audioWidth<768?844:1000},isMobile:audioWidth<768,hasTouch:audioWidth<768});const page=await context.newPage();await preparePage(page);const errors=[];page.on('pageerror',error=>errors.push(error.message));await page.goto(base,{waitUntil:'networkidle'});
 const initialVideoRequests=[];page.on('request',request=>{if(/\/assets\/videos\//.test(request.url()))initialVideoRequests.push(request.url());});
 assert.equal(await page.locator('#dialog-media video').count(),0);
 const hero=page.locator('.hero-video');await page.waitForFunction(()=>{const video=document.querySelector('.hero-video');return video?.readyState>=2&&!video.paused;});
 await hero.evaluate(video=>{window.heroWraps=0;let last=video.currentTime;video.addEventListener('timeupdate',()=>{if(last>video.duration-1&&video.currentTime<1)window.heroWraps++;last=video.currentTime;});});
 if(audioWidth===1440){await page.waitForFunction(()=>window.heroWraps>=1,{},{timeout:40000});console.log('Hero: primeiro ciclo completo passou naturalmente.');}
 for(let cycle=0;cycle<2;cycle++){const count=await page.evaluate(()=>window.heroWraps);await hero.evaluate(video=>video.currentTime=video.duration-.45);await page.waitForFunction(count=>window.heroWraps>count,count,{timeout:5000});assert(await hero.evaluate(video=>!video.paused&&video.loop&&video.muted));}
 await page.locator('.showreel-control').click();const heroPaused=await hero.evaluate(video=>({paused:video.paused,time:video.currentTime}));assert(heroPaused.paused);await page.waitForTimeout(1000);assert(Math.abs(await hero.evaluate(video=>video.currentTime)-heroPaused.time)<.05);await page.locator('.showreel-control').click();await page.waitForFunction(()=>!document.querySelector('.hero-video').paused);
 console.log('Hero: loop, silêncio, pausa e retomada ('+audioWidth+' px) passaram.');
 assert(await hero.evaluate(video=>video.muted&&video.defaultMuted&&video.volume===0));await hero.evaluate(video=>{video.muted=false;video.volume=.8;});await page.waitForTimeout(100);assert(await hero.evaluate(video=>video.muted&&video.volume===0));
 for(const record of [...data.projects,...data.serviceExamples]){
  // Forçar a seleção original para que também seja conferido retorno de foco, sem duplicatas do loop.
  const button=page.locator('[data-project="'+record.id+'"]:not(.carousel-clone button)').first();
  await button.click();const video=page.locator('#dialog-media video');await video.waitFor();await page.waitForFunction(()=>{const video=document.querySelector('#dialog-media video');return video&&video.readyState>=2&&!video.paused;},{},{timeout:20000});
  assert(await video.evaluate(video=>!video.muted&&!video.defaultMuted&&video.volume===1&&video.controls&&video.playsInline));assert(await hero.evaluate(video=>!video.paused));
  await video.evaluate(video=>{video.currentTime=Math.min(3,video.duration/3);});await page.waitForTimeout(400);
  const audio=await video.evaluate(async video=>{
   const ctx=new AudioContext();const source=ctx.createMediaElementSource(video);const analyser=ctx.createAnalyser();source.connect(analyser);analyser.connect(ctx.destination);await ctx.resume();const values=new Float32Array(analyser.fftSize);let peak=0;const deadline=performance.now()+3000;
   while(performance.now()<deadline){analyser.getFloatTimeDomainData(values);peak=Math.max(peak,...values.map(value=>Math.abs(value)));if(peak>.001)break;await new Promise(resolve=>setTimeout(resolve,60));}
   const decoded=video.webkitAudioDecodedByteCount||0;await ctx.close();return {peak,decoded,muted:video.muted,paused:video.paused};
  });assert(audio.peak>.001,'Áudio não detectado: '+record.id);assert(!audio.muted&&!audio.paused);
  await video.evaluate(element=>element.pause());assert(await video.evaluate(element=>element.paused));await video.evaluate(async element=>{element.volume=.5;await element.play();});assert(await video.evaluate(element=>element.volume===.5&&!element.paused));
  if(record.id==='marcas'){await video.evaluate(async element=>{await element.requestFullscreen();});assert(await page.evaluate(()=>document.fullscreenElement?.tagName==='VIDEO'));await page.evaluate(()=>document.exitFullscreen());}
  const handle=await video.elementHandle();if(record.id==='servico-edicao')await page.keyboard.press('Escape');else if(record.id==='servico-social')await page.mouse.click(2,2);else await page.getByRole('button',{name:'Fechar player',exact:true}).click();assert(await handle.evaluate(video=>video.paused));await page.locator('#dialog-media video').waitFor({state:'detached'});assert.equal(await page.locator('#dialog-media video').count(),0);assert.equal(await page.evaluate(()=>[...document.querySelectorAll('#dialog-media video')].filter(video=>!video.paused).length),0);
  report.audio.push({id:record.id,width:audioWidth,originalAudio:true,volumeControl:true,pauseControl:true,peak:audio.peak,closedAndPaused:true});console.log('Áudio e fechamento ('+audioWidth+' px): '+record.id+' passaram.');
 }
 // Fallback de fundo quando ambas as fontes de vídeo estão indisponíveis.
 await page.route('**/assets/videos/showreel-*.mp4',route=>route.abort());await page.reload({waitUntil:'networkidle'});await page.waitForFunction(()=>document.querySelector('.hero-video')?.hidden);assert(await page.locator('.hero-poster').isVisible());
 assert.equal(errors.length,0,errors.join('\n'));await context.close();report.hero={autoplay:true,naturalLoop:true,manualPauseResume:true,permanentlySilent:true,posterFallback:true};
 }
 await writeFile(reportPath,JSON.stringify(report,null,2));console.log('Verificação de navegador completa.');
}catch(error){report.failures.push(error.stack);await writeFile(reportPath,JSON.stringify(report,null,2));throw error;}
finally{await browser.close();}
