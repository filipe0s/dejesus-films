import {readFile,readdir,stat} from 'node:fs/promises';
import assert from 'node:assert/strict';
import path from 'node:path';

export async function verifyProduction(){
  const source=JSON.parse(await readFile('public/data/portfolio.json','utf8'));
  const data=JSON.parse(await readFile('dist/data/portfolio.json','utf8'));
  const html=await readFile('dist/index.html','utf8');
  const domain=source.site.domain;
  assert.equal(data.site.preview,false);
  assert.equal(data.site.contentApproved,true);
  assert.equal(data.previewSlots.length,0);
  assert(!data.pending);
  assert.equal(data.projects.length,source.projects.length);
  assert.equal(data.services.length,source.services.length);
  assert.equal(data.serviceExamples.length,source.serviceExamples.length);
  assert(!/noindex|nofollow|PRÉVIA|SHOWREEL REAL PENDENTE|MATERIAL REAL PENDENTE|preview-banner|footer-preview/i.test(html),'Aviso de prévia no HTML de produção');
  assert(html.includes('<meta name="robots" content="index, follow">'));
  assert.equal((html.match(/rel="canonical"/g)||[]).length,1);
  assert(html.includes('rel="canonical" href="'+domain+'/"'));
  assert(html.includes('property="og:url" content="'+domain+'/"'));
  for(const key of ['og:image','og:image:secure_url'])assert(html.includes('property="'+key+'" content="'+domain+'/assets/covers/social-preview.jpg"'));
  assert(html.includes('name="twitter:image" content="'+domain+'/assets/covers/social-preview.jpg"'));
  const robots=await readFile('dist/robots.txt','utf8'),sitemap=await readFile('dist/sitemap.xml','utf8');
  assert(robots.includes('Allow: /')&&!robots.includes('Disallow: /'));
  assert(robots.includes('Sitemap: '+domain+'/sitemap.xml'));
  assert(sitemap.includes('<loc>'+domain+'/</loc>'));
  for(const p of [...data.projects,...data.serviceExamples]){
    const original=[...source.projects,...source.serviceExamples].find(item=>item.id===p.id);
    for(const key of ['title','description','client','role','media','cover'])assert.deepEqual(p[key],original[key]);
    assert(!p.metadataPending);
  }
  const links=[...html.matchAll(/href="#([^"]+)"/g)].map(match=>match[1]);
  for(const id of links)assert(html.includes('id="'+id+'"'),'Âncora ausente: '+id);
  for(const match of html.matchAll(/https:\/\/wa\.me\/(\d+)/g))assert.equal(match[1],source.site.whatsapp);
  const walk=async root=>{const files=[];for(const entry of await readdir(root,{withFileTypes:true})){const target=path.join(root,entry.name);if(entry.isDirectory())files.push(...await walk(target));else {assert(entry.isFile(),'Arquivo especial no build: '+target);files.push(target);}}return files;};
  const expected=new Set((await walk('public')).map(file=>path.relative('public',file).replaceAll('\\','/')));
  expected.add('robots.txt');expected.add('sitemap.xml');
  let bytes=0;
  for(const file of await walk('dist')){
    const relative=path.relative('dist',file).replaceAll('\\','/');
    assert(expected.has(relative),'Arquivo inesperado no build: '+relative);
    assert(!/(^|\/)(materiais|node_modules|\.git|\.netlify|\.env)(\/|$)|\.(log|tmp|pem|key|p12|pfx)$/i.test(relative),'Arquivo privado/temporário no build');
    expected.delete(relative);bytes+=(await stat(file)).size;
    if(relative.startsWith('assets/'))assert((await readFile(file)).equals(await readFile('public/'+relative)),'Mídia alterada no build: '+relative);
  }
  assert.equal(expected.size,0,'Arquivo ausente no build');
  console.log('Produção: metadados, indexação, conteúdo aprovado, links, arquivos e cópias de mídia válidos ('+bytes+' bytes).');
  return {bytes,projects:data.projects.length,services:data.services.length,examples:data.serviceExamples.length,domain};
}
