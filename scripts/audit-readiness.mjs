import {readFile,writeFile,stat} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{chromium}=require('../.media-tools/node_modules/playwright');
const data=JSON.parse(await readFile('public/data/portfolio.json','utf8'));
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const result={localOnly:true,errors:[],missing:data.previewSlots.filter(slot=>!data.projects.some(project=>project.slotId===slot.id)).map(slot=>slot.id),editorialPending:[...data.projects,...data.serviceExamples].filter(project=>project.metadataPending).map(project=>project.id),mediaBytes:[],slowConnection:{}};
try{
 for(const record of [...data.projects,...data.serviceExamples])result.mediaBytes.push({id:record.id,bytes:(await stat('public/'+record.media.src)).size});
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const page=await context.newPage(),cdp=await context.newCDPSession(page),requests=[];page.on('pageerror',error=>result.errors.push(error.message));page.on('request',request=>requests.push(request.url()));
 await cdp.send('Network.enable');await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:150,downloadThroughput:1600000/8,uploadThroughput:750000/8});
 const began=Date.now();await page.goto('http://127.0.0.1:4173/',{waitUntil:'domcontentloaded'});await page.waitForSelector('.service-example');result.slowConnection.contentReadyMs=Date.now()-began;
 await page.waitForFunction(()=>{const video=document.querySelector('.hero-video');return video?.readyState>=2&&!video.paused;},{},{timeout:30000});result.slowConnection.heroStartedMs=Date.now()-began;
 result.slowConnection.network={downloadMbps:1.6,latencyMs:150};assert(!requests.some(url=>/assets\/videos\//.test(url)&&!/showreel-mobile/.test(url)),'Exemplo carregado sem interação');result.slowConnection.projectsDeferred=true;
 result.slowConnection.heroPlayback=await page.evaluate(async()=>{const video=document.querySelector('.hero-video');let waits=0;video.addEventListener('waiting',()=>waits++);const initial=video.currentTime;await new Promise(resolve=>setTimeout(resolve,10000));return{advancedSeconds:video.currentTime-initial,waitingEvents:waits,paused:video.paused};});
 await page.locator('.showreel-control').click();await page.locator('[data-project="evento-horizontal"]:not(.carousel-clone button)').click();await page.waitForFunction(()=>{const video=document.querySelector('#dialog-media video');return video?.readyState>=2&&!video.paused;},{},{timeout:30000});
 result.slowConnection.horizontalPlayback=await page.evaluate(async()=>{const video=document.querySelector('#dialog-media video');let waits=0;video.addEventListener('waiting',()=>waits++);const initial=video.currentTime;await new Promise(resolve=>setTimeout(resolve,10000));return{advancedSeconds:video.currentTime-initial,waitingEvents:waits,paused:video.paused};});
 await page.locator('.close-dialog').click();await page.locator('#dialog-media video').waitFor({state:'detached'});await context.close();
 assert.equal(result.errors.length,0);await writeFile('.test-output/readiness-audit.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result.slowConnection));
}finally{await browser.close();}
