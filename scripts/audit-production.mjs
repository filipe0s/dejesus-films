import {readFile,readdir,stat,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import path from 'node:path';
import assert from 'node:assert/strict';
import {verifyProduction} from './verify-production.mjs';

const require=createRequire(import.meta.url);
const toml=require('../.media-tools/node_modules/@iarna/toml');
const config=toml.parse(await readFile('netlify.toml','utf8'));
const production=await verifyProduction();
assert.equal(config.build.command,'npm run build');assert.equal(config.build.publish,'dist');assert.equal(config.build.environment.NODE_VERSION,'24');
assert.equal(config.redirects.length,3);
const domain=new URL(production.domain);
for(const rule of config.redirects){assert.equal(rule.to,domain.origin+'/:splat');assert.equal(rule.status,301);assert.equal(rule.force,true);assert(!rule.from.startsWith(domain.origin+'/'),'Redirecionamento em loop no domínio principal');}
assert.deepEqual(config.redirects.map(rule=>rule.from).sort(),['http://fdejesus.com.br/*','https://fdejesus.com.br/*','http://www.fdejesus.com.br/*'].sort());
const policy=config.headers.find(rule=>rule.for==='/*').values;
for(const name of ['Content-Security-Policy','X-Content-Type-Options','X-Frame-Options','Referrer-Policy','Permissions-Policy','Strict-Transport-Security'])assert(policy[name]);
for(const target of ['/','/index.html','/app.js','/styles.css','/data/*','/robots.txt','/sitemap.xml'])assert.equal(config.headers.find(rule=>rule.for===target).values['Cache-Control'],'public, max-age=0, must-revalidate');
assert.equal(config.headers.find(rule=>rule.for==='/assets/*').values['Cache-Control'],'public, max-age=3600, must-revalidate');

const walk=async root=>{const result=[];for(const entry of await readdir(root,{withFileTypes:true})){const file=path.join(root,entry.name);if(entry.isDirectory())result.push(...await walk(file));else {assert(entry.isFile(),'Arquivo especial: '+file);result.push({file:file.replaceAll('\\','/'),bytes:(await stat(file)).size});}}return result;};
const assets=await walk('public/assets'),dist=await walk('dist');
const data=JSON.parse(await readFile('public/data/portfolio.json','utf8'));
const records=[...data.projects,...data.serviceExamples];
const videos=[];
for(const item of assets.filter(item=>/\.(mp4|mov|webm|m4v)$/i.test(item.file))){
  const probe=JSON.parse(execFileSync(path.resolve('.media-tools/node_modules/ffprobe-static/bin/win32/x64/ffprobe.exe'),['-v','error','-show_streams','-show_format','-of','json',item.file],{encoding:'utf8',windowsHide:true}));
  const stream=probe.streams.find(stream=>stream.codec_type==='video');
  const record=records.find(record=>'public/'+record.media.src===item.file);
  const background=/showreel-(desktop|mobile)/.test(item.file);
  if(background)assert(!probe.streams.some(stream=>stream.codec_type==='audio'));
  else assert.equal(probe.streams.find(stream=>stream.codec_type==='audio')?.codec_name,'aac');
  assert.equal(stream.codec_name,'h264');
  videos.push({...item,id:record?.id||path.basename(item.file,'.mp4'),width:stream.width,height:stream.height,seconds:Number(probe.format.duration),megabytes:item.bytes/1e6,mib:item.bytes/1048576,averageMbps:item.bytes*8/Number(probe.format.duration)/1e6,videoCodec:stream.codec_name,audio:probe.streams.some(stream=>stream.codec_type==='audio')});
}
const gitFiles=[...new Set(execFileSync('git',['ls-files','--cached','--others','--exclude-standard','-z'],{encoding:'utf8',windowsHide:true}).split('\0').filter(Boolean))];
const secretFindings=[];
const patterns=[['private-key',/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----\r?\n/],['github-token',/\b(?:gh[pousr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{40,})\b/],['aws-access-key',/\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/],['google-api-key',/\bAIza[0-9A-Za-z_-]{35}\b/],['slack-token',/\bxox[baprs]-[A-Za-z0-9-]{20,}\b/],['credential-value',/(?:api[_-]?key|access[_-]?token|auth[_-]?token|client[_-]?secret|password)\s*[:=]\s*["'][A-Za-z0-9_+\/-]{16,}["']/i]];
for(const file of gitFiles){
  assert(!/^(materiais|dist|\.media-tools|\.test-output|\.netlify|node_modules)\//.test(file),'Pasta privada ou gerada candidata ao Git: '+file);
  assert(!/(^|\/)\.env(?:\.|$)|\.(pem|key|p12|pfx|log|tmp)$/i.test(file),'Arquivo privado ou temporário candidato ao Git: '+file);
  if(!/\.(?:mjs|js|json|html|css|toml|md|txt)$|(?:^|\/)\.gitignore$/.test(file))continue;
  const text=await readFile(file,'utf8');
  for(const [kind,pattern]of patterns)if(pattern.test(text))secretFindings.push({file,kind});
}
assert.equal(secretFindings.length,0,'Possível credencial detectada; revisar os arquivos sem divulgar seu conteúdo');
const ignored=execFileSync('git',['check-ignore','--no-index','materiais/04-sobre/01-filipe/filipe.jpg','materiais/01-inicio/01-showreel/showreel.mp4.mp4','.env','.netlify/state.json','.media-tools/package.json','.test-output/browser-results.json','dist/index.html','preview-out.log'],{encoding:'utf8',windowsHide:true}).trim().split(/\r?\n/);assert.equal(ignored.length,8);
let preserved=null;
try{
  const baseline=JSON.parse(await readFile('.test-output/revision-2-before.json','utf8'));preserved={count:0,changed:[]};
  for(const [file,hash]of Object.entries(baseline))if(file.startsWith('public/assets/')||file.startsWith('materiais/')){preserved.count++;if(createHash('sha256').update(await readFile(file)).digest('hex')!==hash)preserved.changed.push(file);}
  assert.equal(preserved.changed.length,0,'Mídia ou material original alterado');
}catch(error){if(error.code!=='ENOENT')throw error;}
const originals=(await walk('materiais')).filter(item=>/\.(mp4|mov|webm|m4v)$/i.test(item.file));
const result={date:'2026-10-07',localOnly:true,production,assetsBytes:assets.reduce((sum,item)=>sum+item.bytes,0),distBytes:dist.reduce((sum,item)=>sum+item.bytes,0),assetsCount:assets.length,distCount:dist.length,videos,originals,originalVideoBytes:originals.reduce((sum,item)=>sum+item.bytes,0),git:{candidateCount:gitFiles.length,secretFindings,ignoredChecks:ignored.length,remotes:execFileSync('git',['remote','-v'],{encoding:'utf8',windowsHide:true}).trim()},preserved,netlify:{tomlValid:true,redirects:config.redirects,headers:config.headers}};
await mkdir('.test-output',{recursive:true});await writeFile('.test-output/production-audit.json',JSON.stringify(result,null,2));
console.log(JSON.stringify({assetsBytes:result.assetsBytes,distBytes:result.distBytes,videos:result.videos.map(video=>({file:video.file,bytes:video.bytes,seconds:video.seconds,averageMbps:Number(video.averageMbps.toFixed(2))})),git:result.git,preserved:result.preserved},null,2));
